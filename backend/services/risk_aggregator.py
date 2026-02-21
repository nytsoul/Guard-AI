"""
Risk Aggregator – Weighted combination of all three detection layers.

Weighted formula (configurable via config.py):
  final_risk_score = (rule_score  × WEIGHT_RULE)
                   + (local_score × WEIGHT_LOCAL)
                   + (llm_score   × WEIGHT_LLM)

Fallback logic:
  • LLM unavailable  → redistribute its weight to rule + local proportionally
  • Local unavailable → redistribute its weight to rule + LLM proportionally
  • Both unavailable  → use rule score only, log anomaly

Returns:
  AggregatedResult — the unified decision object consumed by all route handlers.
"""

import logging
from dataclasses import dataclass, field
from typing import List, Optional

from services.rule_engine import RuleEngineResult, TriggeredRule
from services.local_model_service import LocalModelResult
from services.llm_security_service import LLMResult

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────
# TYPES
# ─────────────────────────────────────────────────────────────────

@dataclass
class LayerScores:
    rule_score: float
    local_model_score: float
    llm_score: float
    rule_available: bool = True
    local_available: bool = False
    llm_available: bool = False


@dataclass
class ExplanationDetail:
    summary: str
    decision_basis: str
    top_factors: List[dict]
    confidence: str
    mitigation: str


@dataclass
class AggregatedResult:
    # Scores per layer
    rule_score: float
    local_model_score: float
    llm_score: float

    # Final weighted score
    final_risk_score: float

    # Classification
    risk_level: str        # critical | high | medium | low | safe
    attack_type: str
    categories: List[str]
    action: str            # blocked | flagged | warned | allowed
    decision: str          # alias for action (frontend expects both)

    # Confidence
    confidence: float

    # Explainability
    explanation: ExplanationDetail
    triggered_rules: List[dict]

    # Layer metadata
    layers_used: List[str]
    llm_classification: Optional[str] = None  # SAFE | MALICIOUS | UNKNOWN
    llm_reasoning: Optional[str] = None
    llm_indicators: Optional[List[str]] = None

    def as_dict(self) -> dict:
        result = {
            # Primary scores
            "rule_score": round(self.rule_score, 2),
            "local_model_score": round(self.local_model_score, 2),
            "llm_score": round(self.llm_score, 2),
            "final_risk_score": round(self.final_risk_score, 2),
            # Keep riskScore alias for frontend
            "riskScore": round(self.final_risk_score, 2),
            "risk_score": round(self.final_risk_score, 2),  # Add this for consistency
            "riskLevel": self.risk_level,
            "risk_level": self.risk_level,  # Add this for consistency
            "is_safe": self.final_risk_score < 50,  # Add is_safe field
            # Classification
            "attack_type": self.attack_type,
            "attackType": self.attack_type,
            "categories": self.categories,
            "action": self.action,
            "decision": self.decision,
            "confidence": round(self.confidence, 3),
            # Explainability
            "explanation": {
                "summary": self.explanation.summary,
                "decision_basis": self.explanation.decision_basis,
                "top_factors": self.explanation.top_factors,
                "confidence": self.explanation.confidence,
                "mitigation": self.explanation.mitigation,
            },
            "triggeredRules": self.triggered_rules,
            # LLM layer metadata
            "llmClassification": self.llm_classification,
            "llmReasoning": self.llm_reasoning,
            "llmIndicators": self.llm_indicators or [],
            "layersUsed": self.layers_used,
            # Layer details for debugging and transparency
            "details": {
                "rule_engine_score": round(self.rule_score, 2),
                "local_model_score": round(self.local_model_score, 2),
                "llm_score": round(self.llm_score, 2),
                "layers_used": self.layers_used
            }
        }
        
        # Add local model details if available
        if hasattr(self, '_local_result') and self._local_result:
            result["local_model"] = {
                "available": self._local_result.available,
                "score": round(self._local_result.score, 2),
                "confidence": round(self._local_result.confidence, 3),
                "label": self._local_result.label
            }
        
        return result


# ─────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────

def _risk_level(score: float) -> str:
    if score >= 80: return "critical"
    if score >= 60: return "high"
    if score >= 40: return "medium"
    if score >= 20: return "low"
    return "safe"


def _determine_action(
    score: float,
    high_threshold: int,
    medium_threshold: int,
    block_high: bool,
    block_medium: bool,
    warn_low: bool,
) -> str:
    if score >= high_threshold and block_high:
        return "blocked"
    if score >= medium_threshold and block_medium:
        return "blocked"
    if score >= medium_threshold:
        return "flagged"
    if score > 0 and warn_low:
        return "warned"
    return "allowed"


def _build_explanation(
    aggregated: "AggregatedResult",
    rule_result: RuleEngineResult,
    llm_result: LLMResult,
    local_result: LocalModelResult,
) -> ExplanationDetail:
    action_phrases = {
        "blocked": "Request BLOCKED — did not reach the LLM.",
        "flagged":  "Request FLAGGED for human review.",
        "warned":   "Request passed with a WARNING — session monitored.",
        "allowed":  "Request ALLOWED — no significant risk detected.",
    }

    decision_parts = []
    if rule_result.triggered_rules:
        decision_parts.append(
            f"Rule engine triggered {len(rule_result.triggered_rules)} pattern(s)"
        )
    if local_result.available and local_result.score > 20:
        decision_parts.append(
            f"local model scored {local_result.score:.0f}/100 ({local_result.label})"
        )
    if llm_result.available:
        decision_parts.append(
            f"Gemini classified as {llm_result.classification} "
            f"({int(llm_result.confidence * 100)}% confidence)"
        )

    basis = "; ".join(decision_parts) if decision_parts else "No threats detected across all layers."

    # Top factors — merge rule triggers + LLM indicators
    top_factors = []
    for r in sorted(rule_result.triggered_rules, key=lambda x: x.weight, reverse=True)[:3]:
        top_factors.append({
            "rule": r.rule_id,
            "description": r.description,
            "contribution": f"+{r.weight} risk pts (rule layer)",
            "severity": r.severity,
            "matched": r.matched_text,
            "layer": "rule_engine",
        })
    for indicator in (llm_result.top_indicators or [])[:2]:
        top_factors.append({
            "rule": "LLM-INDICATOR",
            "description": indicator,
            "contribution": f"+{int(llm_result.risk_score * 0.5):.0f} risk pts (LLM layer)",
            "severity": "high" if llm_result.risk_score >= 60 else "medium",
            "matched": indicator,
            "layer": "llm",
        })

    mitigation = {
        "blocked": "Block request; log for SOC review; consider IP-rate-limiting.",
        "flagged":  "Queue for human review within 4 hours; notify security team.",
        "warned":   "Monitor this session; escalate on repeat pattern.",
        "allowed":  "No action required.",
    }.get(aggregated.action, "Review manually.")

    return ExplanationDetail(
        summary=f"Final risk score {aggregated.final_risk_score:.0f}/100 — {action_phrases.get(aggregated.action, aggregated.action)}",
        decision_basis=basis,
        top_factors=top_factors,
        confidence=f"{int(aggregated.confidence * 100)}% overall detection confidence",
        mitigation=mitigation,
    )


# ─────────────────────────────────────────────────────────────────
# MAIN AGGREGATION FUNCTION
# ─────────────────────────────────────────────────────────────────

def aggregate(
    rule_result: RuleEngineResult,
    local_result: LocalModelResult,
    llm_result: LLMResult,
    policy: dict,
) -> AggregatedResult:
    """
    Combine the three layer scores into a single risk decision.

    Weights (from config/policy):
      rule_weight  = 0.30
      local_weight = 0.00  (disabled)
      llm_weight   = 0.70

    Fallback redistribution:
      If LLM unavailable:  rule=1.00
      If local unavailable: rule=0.30, llm=0.70
      If both unavailable:  rule=1.00  (log anomaly)
    """
    from config import cfg

    base_rule  = cfg.WEIGHT_RULE
    base_local = cfg.WEIGHT_LOCAL
    base_llm   = cfg.WEIGHT_LLM

    r_score = rule_result.score
    l_score = local_result.score if local_result else 0
    g_score = llm_result.risk_score if llm_result else 0

    llm_ok   = llm_result and llm_result.available
    local_ok = local_result and local_result.available

    layers_used = ["rule_engine"]

    # Calculate final weighted score with proper fallback handling
    if llm_ok and local_ok:
        # All layers available
        final = r_score * base_rule + l_score * base_local + g_score * base_llm
        layers_used += ["local_model", "llm_security"]
    elif llm_ok and not local_ok:
        # LLM available, local disabled - redistribute local weight proportionally
        w_rule = (base_rule + base_local * 0.3) 
        w_llm = (base_llm + base_local * 0.7)
        final = r_score * w_rule + g_score * w_llm
        layers_used.append("llm_security")
        logger.debug("Using rule + LLM layers (weights: rule=%.2f, llm=%.2f)", w_rule, w_llm)
    elif not llm_ok and local_ok:
        # Local available, LLM unavailable - redistribute LLM weight
        w_rule = (base_rule + base_llm * 0.4)
        w_local = (base_local + base_llm * 0.6)
        final = r_score * w_rule + l_score * w_local
        layers_used.append("local_model")
        logger.debug("Using rule + local layers (weights: rule=%.2f, local=%.2f)", w_rule, w_local)
    else:
        # Only rule engine available
        final = r_score
        logger.warning("Only rule engine available for scoring - check LLM/local config")

    # Clamp final score to 0-100 range
    final_score = max(0.0, min(100.0, final))
    logger.debug("Final aggregated score: %.1f (layers: %s)", final_score, layers_used)

    # ── Confidence ────────────────────────────────────────────────
    confidence_sources = []
    if llm_ok:     
        confidence_sources.append(llm_result.confidence)
    if local_ok:   
        confidence_sources.append(local_result.confidence)
    
    # Add rule engine confidence
    if rule_result.triggered_rules:
        n = len(rule_result.triggered_rules)
        confidence_sources.append(min(0.85, 0.40 + n * 0.10))
    
    # Calculate average confidence, default to low if no sources
    confidence = round(sum(confidence_sources) / len(confidence_sources), 3) if confidence_sources else 0.3

    # ── Primary attack type ───────────────────────────────────────
    priority = [
        "malicious_code", "tool_abuse", "prompt_injection",
        "system_prompt_extraction", "jailbreak", "pii_leakage",
        "anomaly", "policy_violation",
    ]
    all_categories = list(set(rule_result.categories if hasattr(rule_result, 'categories') else []))
    if llm_ok and llm_result.attack_type != "none":
        all_categories.append(llm_result.attack_type)

    primary_type = "none"
    for cat in priority:
        if cat in all_categories:
            primary_type = cat
            break

    # If rule says "none" but LLM says malicious, use LLM's type
    if primary_type == "none" and llm_ok and llm_result.classification == "MALICIOUS":
        primary_type = llm_result.attack_type

    # ── Action decision ───────────────────────────────────────────
    from utils.policy_utils import safe_int_get, safe_bool_get
    
    high_thr    = safe_int_get(policy, "highRiskThreshold", cfg.RISK_HIGH_THRESHOLD)
    medium_thr  = safe_int_get(policy, "mediumRiskThreshold", cfg.RISK_MEDIUM_THRESHOLD)
    block_high  = safe_bool_get(policy, "blockHighRisk", True)
    block_med   = safe_bool_get(policy, "blockMediumRisk", True)
    warn_low    = safe_bool_get(policy, "warnLowRisk", True)

    action = _determine_action(final_score, high_thr, medium_thr, block_high, block_med, warn_low)
    severity = _risk_level(final_score)

    # ── Build result ──────────────────────────────────────────────
    result = AggregatedResult(
        rule_score=r_score,
        local_model_score=l_score,
        llm_score=g_score,
        final_risk_score=final_score,
        risk_level=severity,
        attack_type=primary_type,
        categories=all_categories,
        action=action,
        decision=action,
        confidence=confidence,
        triggered_rules=[r.__dict__ if hasattr(r, "__dict__") else r
                         for r in rule_result.triggered_rules],
        layers_used=layers_used,
        llm_classification=llm_result.classification if llm_ok else None,
        llm_reasoning=llm_result.reasoning if llm_ok else None,
        llm_indicators=llm_result.top_indicators if llm_ok else [],
        explanation=ExplanationDetail("", "", [], "", ""),  # filled below
    )

    # Store local model result for response details
    result._local_result = local_result

    result.explanation = _build_explanation(result, rule_result, llm_result, local_result)
    return result
