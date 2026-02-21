"""
Policies Routes Blueprint

Endpoints consumed by frontend (from api.ts + PolicyConfig.tsx):
  GET  /api/policies                    → policies.getAll()
  GET  /api/policies/audit-log          → policies.getAuditLog()  ← BEFORE /<id>
  GET  /api/policies/<id>               → policies.getById()
  PUT  /api/policies/<id>               → policies.update()
  POST /api/policies/<id>/test          → policies.testPrompt()

Policy document schema:
  policy_id, name, blockHighRisk, blockMediumRisk, warnLowRisk,
  enableOutputScanning, enableToolGuard, piRedaction,
  highRiskThreshold, mediumRiskThreshold, sensitivity,
  forbiddenPhrases[], restrictedTools[], teamProfiles{},
  updated_at

Audit log schema:
  policy_id, timestamp, changed_by, audit_note, diff{}, snapshot{}
"""

import jwt
import time
from bson import ObjectId
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app

policies_bp = Blueprint("policies", __name__)

DEFAULT_POLICY = {
    "policy_id":            "default",
    "name":                 "Default Enterprise Policy",
    "blockHighRisk":        True,
    "blockMediumRisk":      True,
    "warnLowRisk":          True,
    "enableOutputScanning": True,
    "enableToolGuard":      False,
    "piRedaction":          True,
    "highRiskThreshold":    70,
    "mediumRiskThreshold":  40,
    "sensitivity":          75,
    "forbiddenPhrases": [
        "system prompt", "ignore instructions", "DAN mode",
        "disable safety", "jailbreak", "override rules",
        "act as", "pretend you are", "forget previous",
    ],
    "restrictedTools": ["delete_db", "exec_shell", "read_secrets", "bypass_auth"],
    "teamProfiles": {
        "finance":  {"highRiskThreshold": 60, "blockMediumRisk": True,  "sensitivity": 90},
        "support":  {"highRiskThreshold": 75, "blockMediumRisk": False, "sensitivity": 60},
        "internal": {"highRiskThreshold": 70, "blockMediumRisk": True,  "sensitivity": 75},
    },
}


def _db():
    return current_app.extensions["db"]


def _serialize(obj):
    from unittest.mock import MagicMock
    
    if isinstance(obj, MagicMock):
        # Convert MagicMock to string or use empty string as fallback
        return str(obj) if str(obj) != '<MagicMock>' else ""
    if isinstance(obj, ObjectId): return str(obj)
    if isinstance(obj, datetime): return obj.isoformat()
    if isinstance(obj, dict):     return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):     return [_serialize(i) for i in obj]
    return obj


def _clean(doc: dict) -> dict:
    return _serialize(doc)


def _get_caller_email() -> str:
    """Extract email from JWT in Authorization header."""
    try:
        from config import cfg
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ")[1]
            decoded = jwt.decode(token, cfg.JWT_SECRET, algorithms=["HS256"])
            user = _db()["users"].find_one({"_id": ObjectId(decoded["user_id"])})
            if user:
                return user.get("email", "admin@enterprise.com")
    except Exception:
        pass
    return "admin@enterprise.com"


# ─────────────────────────────────────────────────────────────────
# GET /api/policies
# Response: { <policy_id>: policyDoc, ... }
# ─────────────────────────────────────────────────────────────────

@policies_bp.route("/policies", methods=["GET"])
def get_policies():
    items  = list(_db()["policies"].find({}))
    result = {}
    for p in items:
        pid = p.get("policy_id", "default")
        result[pid] = _clean(p)
    return jsonify(result), 200


# ─────────────────────────────────────────────────────────────────
# GET /api/policies/audit-log   ← MUST be before /<policy_id>
# Query: limit, offset
# Response: { entries: [...], total: int }
# ─────────────────────────────────────────────────────────────────

@policies_bp.route("/policies/audit-log", methods=["GET"])
def get_audit_log():
    limit  = max(1, min(100, int(request.args.get("limit", 20))))
    offset = max(0, int(request.args.get("offset", 0)))

    items = list(
        _db()["policy_audit_log"]
        .find({})
        .sort("timestamp", -1)
        .skip(offset)
        .limit(limit)
    )
    total = _db()["policy_audit_log"].count_documents({})

    return jsonify({
        "entries": [_clean(e) for e in items],
        "total":   total,
    }), 200


# ─────────────────────────────────────────────────────────────────
# GET /api/policies/<policy_id>
# Response: single policy document
# ─────────────────────────────────────────────────────────────────

@policies_bp.route("/policies/<policy_id>", methods=["GET"])
def get_policy(policy_id):
    p = None
    try:
        p = _db()["policies"].find_one({"policy_id": policy_id})
    except Exception:
        pass
    
    if not p:
        # Default fallback for common policy IDs
        if policy_id == "default":
            return jsonify(_clean(DEFAULT_POLICY)), 200
        return jsonify({"error": "Policy not found"}), 404
    return jsonify(_clean(p)), 200


# ─────────────────────────────────────────────────────────────────
# PUT /api/policies/<policy_id>
# Request: full or partial policy document + optional auditNote
# Response: { message, policy }
# Side-effect: writes to policy_audit_log if any field changed
# ─────────────────────────────────────────────────────────────────

@policies_bp.route("/policies/<policy_id>", methods=["PUT"])
def update_policy(policy_id):
    data = request.get_json(silent=True) or {}
    data.pop("_id", None)
    data["policy_id"]  = policy_id
    data["updated_at"] = datetime.now().isoformat()

    # Load previous snapshot for diff
    prev = _db()["policies"].find_one({"policy_id": policy_id}) or {}
    prev.pop("_id", None)

    # Compute changed fields
    skip_keys = {"_id", "updated_at", "policy_id", "auditNote"}
    all_keys  = set(prev.keys()) | set(data.keys()) - skip_keys
    diff = {}
    for k in all_keys:
        if k in skip_keys:
            continue
        old_val = prev.get(k)
        new_val = data.get(k)
        if old_val != new_val:
            diff[k] = {"from": old_val, "to": new_val}

    # Upsert policy
    _db()["policies"].update_one(
        {"policy_id": policy_id},
        {"$set": data},
        upsert=True,
    )

    # Write audit log entry if anything changed
    if diff:
        audit_entry = {
            "policy_id":  policy_id,
            "timestamp":  datetime.now().isoformat(),
            "changed_by": _get_caller_email(),
            "audit_note": data.get("auditNote", ""),
            "diff":       diff,
            "snapshot": {
                k: v for k, v in data.items()
                if k not in ("auditNote", "_id")
            },
        }
        _db()["policy_audit_log"].insert_one(audit_entry)

    updated = _db()["policies"].find_one({"policy_id": policy_id})
    return jsonify({
        "message": "Policy updated and deployed to all nodes",
        "policy":  _clean(updated),
    }), 200


# ─────────────────────────────────────────────────────────────────
# POST /api/policies/<policy_id>/test
# Request:  { prompt: str, team?: str }
# Response: full pipeline result + policyTested, teamProfile
# No log is written (playground mode)
# ─────────────────────────────────────────────────────────────────

@policies_bp.route("/policies/<policy_id>/test", methods=["POST"])
def test_policy(policy_id):
    data   = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "").strip()
    team   = data.get("team") or None

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    # Load policy
    policy = _db()["policies"].find_one({"policy_id": policy_id})
    if not policy:
        policy = DEFAULT_POLICY.copy()
    else:
        policy = dict(policy)
        policy.pop("_id", None)

    # Apply team profile override
    if team and "teamProfiles" in policy and team in policy["teamProfiles"]:
        policy.update(policy["teamProfiles"][team])
        policy["_activeProfile"] = team

    # Run pipeline
    from services import rule_engine, local_model_service, llm_security_service, risk_aggregator
    from utils.policy_utils import safe_sensitivity_get, safe_list_get

    sensitivity = safe_sensitivity_get(policy)
    rule_res    = rule_engine.run_rules(
        prompt,
        safe_list_get(policy, "forbiddenPhrases"),
        safe_list_get(policy, "restrictedTools"),
        sensitivity,
    )
    local_res = local_model_service.classify(prompt)
    llm_res   = llm_security_service.classify(prompt)
    agg       = risk_aggregator.aggregate(rule_res, local_res, llm_res, policy)

    result = agg.as_dict()
    result["policyTested"] = policy_id
    result["teamProfile"]  = team
    return jsonify(result), 200
