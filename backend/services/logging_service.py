"""
Logging Service – Persists every security evaluation to MongoDB.

Provides:
  • log_analysis()    — persist an analyze-prompt result
  • log_chat()        — persist a chat message analysis
  • log_scan()        — persist a document scan result
  • get_recent()      — query logs with filters + pagination
  • get_by_id()       — single log fetch + on-demand re-scoring
  • export_csv()      — streaming CSV generator

All documents follow a consistent schema so the frontend's
AttackLogs and Dashboard pages get consistent field names.
"""

import csv
import io
import time
import logging
from datetime import datetime
from typing import Optional, Iterator

from bson import ObjectId

logger = logging.getLogger(__name__)


def _serialize(obj):
    """Recursively convert MongoDB types to JSON-safe Python types."""
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_serialize(i) for i in obj]
    return obj


def _clean(doc: dict) -> dict:
    return _serialize(doc)


# ─────────────────────────────────────────────────────────────────
# LOG SCHEMA
#
# Required fields (frontend depends on them):
#   id, timestamp, userInput, attackType, riskScore, riskLevel,
#   severity, action, endpoint, confidence, categories,
#   triggeredRules, explanation, policyApplied,
#   rule_score, local_model_score, llm_score
# ─────────────────────────────────────────────────────────────────

def _build_log_doc(
    user_input: str,
    aggregated: dict,
    endpoint: str = "api/analyze-prompt",
    policy_id: str = "default",
    extra: Optional[dict] = None,
) -> dict:
    doc = {
        "id": f"log_{int(time.time() * 1000)}",
        "timestamp": datetime.now().isoformat(),
        "userInput": user_input[:500],
        # Layer scores
        "rule_score": aggregated.get("rule_score", 0),
        "local_model_score": aggregated.get("local_model_score", 0),
        "llm_score": aggregated.get("llm_score", 0),
        # Final
        "riskScore": aggregated.get("final_risk_score", 0),
        "final_risk_score": aggregated.get("final_risk_score", 0),
        "riskLevel": aggregated.get("riskLevel", "safe"),
        "severity": aggregated.get("riskLevel", "safe"),
        "attackType": aggregated.get("attack_type", "none"),
        "attack_type": aggregated.get("attack_type", "none"),
        "categories": aggregated.get("categories", []),
        "action": aggregated.get("action", "allowed"),
        "confidence": aggregated.get("confidence", 0.0),
        # Explainability
        "triggeredRules": aggregated.get("triggeredRules", []),
        "explanation": aggregated.get("explanation", {}),
        "llmClassification": aggregated.get("llmClassification"),
        "llmReasoning": aggregated.get("llmReasoning"),
        "llmIndicators": aggregated.get("llmIndicators", []),
        "layersUsed": aggregated.get("layersUsed", []),
        # Metadata
        "endpoint": endpoint,
        "policyApplied": policy_id,
    }
    if extra:
        doc.update(extra)
    return doc


def log_analysis(
    logs_col,
    user_input: str,
    aggregated: dict,
    endpoint: str = "api/analyze-prompt",
    policy_id: str = "default",
) -> dict:
    """Persist a prompt analysis result and return the cleaned document."""
    doc = _build_log_doc(user_input, aggregated, endpoint, policy_id)
    try:
        logs_col.insert_one(doc)
        logger.debug("Logged analysis id=%s score=%.1f", doc["id"], doc["riskScore"])
    except Exception as exc:
        logger.error("Failed to persist analysis log: %s", exc)
    return _clean(doc)


def log_chat(
    logs_col,
    message: str,
    aggregated: dict,
    endpoint: str = "api/chat/send",
    policy_id: str = "default",
) -> dict:
    """Persist a chat message analysis."""
    return log_analysis(logs_col, message, aggregated, endpoint, policy_id)


def get_recent(
    logs_col,
    attack_type: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
) -> dict:
    """Paginated, filtered log retrieval."""
    query = {}
    if attack_type and attack_type != "all":
        # Match either camelCase or snake_case field
        query["$or"] = [
            {"attackType": attack_type},
            {"attack_type": attack_type},
        ]
    if severity and severity != "all":
        query["$or"] = query.get("$or", []) + [
            {"severity": severity},
            {"riskLevel": severity},
        ]

    try:
        items = list(
            logs_col.find(query)
            .sort("timestamp", -1)
            .skip(offset)
            .limit(limit)
        )
        total = logs_col.count_documents(query)
    except Exception as exc:
        logger.error("get_recent failed: %s", exc)
        items, total = [], 0

    return {
        "logs": [_clean(l) for l in items],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


def get_by_id(logs_col, log_id: str) -> Optional[dict]:
    """Fetch a single log by id or MongoDB ObjectId."""
    log = logs_col.find_one({"id": log_id})
    if not log:
        try:
            log = logs_col.find_one({"_id": ObjectId(log_id)})
        except Exception:
            pass
    if not log:
        return None
    return _clean(log)


def enrich_with_explainability(logs_col, log: dict) -> dict:
    """Re-score an existing log if it has no triggeredRules."""
    if log.get("triggeredRules"):
        return log

    from services import rule_engine
    from services import local_model_service, llm_security_service, risk_aggregator

    text = log.get("userInput", "")
    if not text:
        return log

    rule_res = rule_engine.run_rules(text)
    local_res = local_model_service.classify(text)
    llm_res = llm_security_service.classify(text)
    agg = risk_aggregator.aggregate(rule_res, local_res, llm_res, {})
    enriched = agg.as_dict()

    update_fields = {
        "triggeredRules": enriched["triggeredRules"],
        "explanation": enriched["explanation"],
        "confidence": enriched["confidence"],
        "rule_score": enriched["rule_score"],
        "local_model_score": enriched["local_model_score"],
        "llm_score": enriched["llm_score"],
    }
    try:
        logs_col.update_one({"_id": log["_id"]}, {"$set": update_fields})
    except Exception as exc:
        logger.error("enrich_with_explainability update failed: %s", exc)

    log.update(update_fields)
    return log


def export_csv(logs_col, attack_type: Optional[str], severity: Optional[str]) -> str:
    """Return a CSV string for bulk export (max 1000 rows)."""
    query = {}
    if attack_type and attack_type != "all":
        query["$or"] = [{"attackType": attack_type}, {"attack_type": attack_type}]
    if severity and severity != "all":
        query["severity"] = severity

    items = list(logs_col.find(query).sort("timestamp", -1).limit(1000))

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow([
        "ID", "Timestamp", "AttackType", "RiskScore",
        "RuleScore", "LocalModelScore", "LLMScore",
        "Severity", "Action", "Confidence", "UserInput",
    ])
    for l in items:
        writer.writerow([
            l.get("id", ""),
            l.get("timestamp", ""),
            l.get("attackType", l.get("attack_type", "")),
            l.get("riskScore", l.get("final_risk_score", "")),
            l.get("rule_score", ""),
            l.get("local_model_score", ""),
            l.get("llm_score", ""),
            l.get("severity", l.get("riskLevel", "")),
            l.get("action", ""),
            l.get("confidence", ""),
            str(l.get("userInput", ""))[:150],
        ])
    return out.getvalue()
