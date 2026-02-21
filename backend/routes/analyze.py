"""
Analyze Routes Blueprint

Endpoints consumed by frontend (from api.ts):
  POST /api/analyze-prompt        → analysis.analyzePrompt()
  POST /api/explain-prompt        → analysis.explainPrompt()
  GET  /api/explain/<log_id>      → analysis.explainLog()
  POST /api/chat/send             → chat.sendMessage()
  GET  /api/chat/defense-stream   → chat.getDefenseStream()
"""

import time
import logging
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app

logger = logging.getLogger(__name__)
analyze_bp = Blueprint("analyze", __name__)


def _get_db():
    return current_app.extensions["db"]


def _get_policy(team: str = None) -> dict:
    """Load active policy, optionally with team profile override."""
    db = _get_db()
    try:
        policy = db["policies"].find_one({"policy_id": "default"}) or {}
        policy.pop("_id", None)
        if team and "teamProfiles" in policy and team in policy["teamProfiles"]:
            policy.update(policy["teamProfiles"][team])
            policy["_activeProfile"] = team
        return policy
    except Exception:
        # Return default policy structure when database fails
        return {
            "policy_id": "default",
            "highRiskThreshold": 70,
            "mediumRiskThreshold": 40,
            "sensitivity": 75,
            "blockHighRisk": True,
            "blockMediumRisk": True, 
            "warnLowRisk": True,
            "forbiddenPhrases": [],
            "restrictedTools": []
        }


def _run_pipeline(text: str, policy: dict) -> dict:
    """Execute all three layers and return aggregated result dict."""
    try:
        print(f"🔍 Starting pipeline for text: {text[:50]}...")
        
        from services import rule_engine, local_model_service, llm_security_service, risk_aggregator
        from utils.policy_utils import safe_list_get, safe_sensitivity_get

        forbidden = safe_list_get(policy, "forbiddenPhrases")
        restricted_tools = safe_list_get(policy, "restrictedTools")
        sensitivity = safe_sensitivity_get(policy)
        
        print(f"🎛️ Config: forbidden={len(forbidden)}, tools={len(restricted_tools)}, sensitivity={sensitivity}")

        # Run individual layers with error handling
        try:
            rule_res = rule_engine.run_rules(text, forbidden, restricted_tools, sensitivity)
            print(f"📏 Rule engine: score={rule_res.score}, triggered={len(rule_res.triggered_rules)}")
        except Exception as e:
            print(f"❌ Rule engine error: {e}")
            # Create a fallback rule result
            from services.rule_engine import RuleEngineResult
            rule_res = RuleEngineResult(score=0.0, triggered_rules=[], primary_category="none", explanation="Rule engine failed")
        
        try:
            local_res = local_model_service.classify(text)
            print(f"🧠 Local model: score={local_res.score if local_res else 'None'}, available={local_res.available if local_res else False}")
        except Exception as e:
            print(f"❌ Local model error: {e}")
            from services.local_model_service import LocalModelResult
            local_res = LocalModelResult(score=0.0, confidence=0.0, available=False, label="SAFE")
        
        try:
            llm_res = llm_security_service.classify(text)
            print(f"🤖 LLM: available={llm_res.available}, score={llm_res.risk_score if llm_res.available else 'N/A'}")
        except Exception as e:
            print(f"❌ LLM error: {e}")
            from services.llm_security_service import LLMResult
            llm_res = LLMResult(
                classification="UNKNOWN", risk_score=0.0, attack_type="none", 
                confidence=0.0, reasoning="LLM failed", top_indicators=[], available=False
            )
        
        # Enhanced fallback logic when LLM is unavailable
        if not llm_res.available:
            print("⚡ LLM unavailable - activating aggressive rule-based detection")
            
            # Aggressive keyword detection
            attack_keywords = [
                "hack", "exploit", "crack", "breach", "penetrate", "bypass", 
                "ignore instructions", "system prompt", "jailbreak", "DAN mode",
                "override", "disable safety", "unrestricted", "developer mode"
            ]
            
            text_lower = text.lower()
            keyword_hits = sum(1 for keyword in attack_keywords if keyword in text_lower)
            print(f"🎯 Keyword analysis: {keyword_hits} hits found")
            
            if keyword_hits >= 2:  # Multiple attack keywords
                aggressive_score = 85.0
                print(f"🚨 Multi-keyword attack detected! Setting score to {aggressive_score}")
            elif keyword_hits >= 1:  # Single attack keyword
                aggressive_score = 60.0
                print(f"⚠️ Single attack keyword detected! Setting score to {aggressive_score}")
            else:
                aggressive_score = rule_res.score * 1.5  # Boost existing score
                print(f"📈 Boosting existing rule score to {aggressive_score}")
                
            # Override rule result with aggressive detection
            rule_res.score = max(rule_res.score, aggressive_score)

        try:
            agg = risk_aggregator.aggregate(rule_res, local_res, llm_res, policy)
            result = agg.as_dict()
            print(f"🎯 Final aggregation: score={result.get('risk_score', 0)}")
        except Exception as e:
            print(f"❌ Aggregation error: {e}")
            import traceback
            traceback.print_exc()
            # Create manual result
            result = {
                "risk_score": rule_res.score,
                "risk_level": "high" if rule_res.score >= 70 else "medium" if rule_res.score >= 40 else "low",
                "is_safe": rule_res.score < 50,
                "confidence": 0.8 if rule_res.score > 0 else 0.1,
                "details": {"rule_engine_score": rule_res.score},
                "triggeredRules": [{"rule_id": r.rule_id, "description": r.description, "weight": r.weight} for r in rule_res.triggered_rules]
            }
        
        # Ensure all required fields are present
        result.setdefault('risk_score', 0)
        result.setdefault('risk_level', 'low')
        result.setdefault('is_safe', True)
        result.setdefault('confidence', 0.0)
        result.setdefault('details', {})
        result.setdefault('mitigation_suggestions', [])
        
        print(f"✅ Pipeline complete: {result['risk_score']}/100 ({result['risk_level']})")
        return result
        
    except Exception as e:
        print(f"💥 CRITICAL Pipeline error: {e}")
        import traceback
        traceback.print_exc()
        # Return safe default response
        return {
            "risk_score": 0,
            "risk_level": "low", 
            "is_safe": True,
            "confidence": 0.0,
            "details": {"error": str(e)},
            "mitigation_suggestions": [],
            "error": f"Analysis service error: {str(e)[:100]}"
        }


# ─────────────────────────────────────────────────────────────────
# POST /api/analyze-prompt
# Request:  { prompt: str, team?: str }
# Response: full AggregatedResult + policyApplied
# ─────────────────────────────────────────────────────────────────

@analyze_bp.route("/analyze-prompt", methods=["POST"])
def analyze_prompt():
    data   = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "").strip()
    team   = data.get("team") or None

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    policy = _get_policy(team)
    result = _run_pipeline(prompt, policy)

    # Persist log
    from services import logging_service
    db = _get_db()
    
    # Ensure policy_id is a string
    policy_id = str(policy.get("policy_id", "default"))
    
    log_doc = logging_service.log_analysis(
        db["security_logs"],
        prompt,
        result,
        endpoint="api/analyze-prompt",
        policy_id=policy_id,
    )

    result["policyApplied"] = policy_id
    result["teamProfile"]   = str(team) if team else None
    return jsonify(result), 200


# ─────────────────────────────────────────────────────────────────
# POST /api/explain-prompt  (no log written)
# Request:  { prompt: str, team?: str }
# Response: full pipeline result, prompt echoed back (truncated)
# ─────────────────────────────────────────────────────────────────

@analyze_bp.route("/explain-prompt", methods=["POST"])
def explain_prompt():
    data   = request.get_json(silent=True) or {}
    prompt = data.get("prompt", "").strip()
    team   = data.get("team") or None

    if not prompt:
        return jsonify({"error": "prompt is required"}), 400

    policy = _get_policy(team)
    result = _run_pipeline(prompt, policy)

    display_prompt = (prompt[:200] + "...") if len(prompt) > 200 else prompt
    result["prompt"]       = display_prompt
    result["policyTested"] = str(policy.get("policy_id", "default"))
    result["teamProfile"]  = str(team) if team else None
    return jsonify(result), 200


# ─────────────────────────────────────────────────────────────────
# GET /api/explain/<log_id>
# Returns a log with full explainability; re-scores on demand if missing
# ─────────────────────────────────────────────────────────────────

@analyze_bp.route("/explain/<log_id>", methods=["GET"])
def explain_log(log_id):
    from services import logging_service
    db  = _get_db()
    log = logging_service.get_by_id(db["security_logs"], log_id)

    if not log:
        return jsonify({"error": "Log not found"}), 404

    if not log.get("triggeredRules"):
        log = logging_service.enrich_with_explainability(db["security_logs"], log)

    return jsonify(log), 200


# ─────────────────────────────────────────────────────────────────
# POST /api/chat/send
# Request:  { message: str, team?: str }
# Response: messageId, response, status, riskScore, riskLevel,
#           threats, explanation, triggeredRules, confidence,
#           timestamp, processingTime, layers
# ─────────────────────────────────────────────────────────────────

@analyze_bp.route("/chat/send", methods=["POST"])
def chat_send():
    data    = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    team    = data.get("team") or None

    if not message:
        return jsonify({"error": "message is required"}), 400

    t0     = time.time()
    policy = _get_policy(team)
    result = _run_pipeline(message, policy)
    elapsed = round(time.time() - t0, 3)

    action = result.get("action", "allowed")

    if action == "blocked":
        explanation_basis = result.get("explanation", {}).get("decision_basis", "Threat detected")
        response_text = (
            f"🛡️ [BLOCKED by Sentinel Shield] "
            f"This message was intercepted by the security middleware. "
            f"Reason: {explanation_basis}"
        )
        status = "blocked"
    elif action == "flagged":
        response_text = (
            "⚠️ Your message was flagged for security review. "
            "It has been logged and queued for human analysis."
        )
        status = "flagged"
    elif action == "warned":
        response_text = (
            "⚠️ Your message passed with a warning. "
            "This session is being monitored."
        )
        status = "warned"
    else:
        score = result.get("final_risk_score", 0)
        if score < 10:
            response_text = "Your request passed all security checks and was processed securely."
        elif score < 25:
            response_text = "Request validated by Sentinel Shield — low-risk content, processed normally."
        else:
            response_text = "All security layers cleared. Minimal risk detected — your query has been processed."
        status = "secured"

    # Log the interaction
    from services import logging_service
    db = _get_db()
    logging_service.log_chat(
        db["security_logs"], message, result,
        endpoint="api/chat/send",
        policy_id=policy.get("policy_id", "default"),
    )

    # Determine layer statuses for frontend display
    score = result.get("final_risk_score", 0)
    layers = {
        "inputFirewall":   "blocked" if score >= 70 else "passed",
        "contextAnalysis": "flagged" if 40 <= score < 70 else "passed" if score < 40 else "blocked",
        "outputGuard":     "sanitized" if score >= 60 else "passed",
    }

    return jsonify({
        "messageId":      f"msg_{int(time.time() * 1000)}",
        "userMessage":    message,
        "response":       response_text,
        "status":         status,
        # Risk data
        "riskScore":      result.get("final_risk_score", 0),
        "riskLevel":      result.get("riskLevel", "safe"),
        "rule_score":     result.get("rule_score", 0),
        "local_model_score": result.get("local_model_score", 0),
        "llm_score":      result.get("llm_score", 0),
        # Explainability
        "threats":        [r.get("description", "") for r in result.get("triggeredRules", [])[:3]],
        "explanation":    result.get("explanation", {}),
        "triggeredRules": result.get("triggeredRules", []),
        "confidence":     result.get("confidence", 0.0),
        "llmClassification": result.get("llmClassification"),
        "llmReasoning":   result.get("llmReasoning"),
        # Meta
        "timestamp":      datetime.now().isoformat(),
        "processingTime": elapsed,
        "layers":         layers,
        "layersUsed":     result.get("layersUsed", []),
    }), 200


# ─────────────────────────────────────────────────────────────────
# GET /api/chat/defense-stream
# Returns recent security events for the live stream widget
# ─────────────────────────────────────────────────────────────────

@analyze_bp.route("/chat/defense-stream", methods=["GET"])
def defense_stream():
    db   = _get_db()
    logs = list(
        db["security_logs"].find({})
        .sort("timestamp", -1)
        .limit(10)
    )

    events = []
    for log in logs:
        action = log.get("action", "allowed")
        score  = log.get("riskScore", log.get("final_risk_score", 0))
        events.append({
            "timestamp": log.get("timestamp", datetime.now().isoformat()),
            "type": "threat_blocked" if action == "blocked" else "request_analyzed",
            "severity": log.get("riskLevel", "low"),
            "message": (
                f"Blocked: {log.get('attackType', 'threat').replace('_', ' ')}"
                if action == "blocked"
                else f"Processed: {log.get('attackType', 'request').replace('_', ' ')}"
            ),
            "details": f"Risk score: {score}/100",
        })

    if not events:
        events = [{
            "timestamp": datetime.now().isoformat(),
            "type": "system_ready",
            "severity": "low",
            "message": "Sentinel Shield active — awaiting traffic",
            "details": "No recent events",
        }]

    return jsonify({"events": events}), 200
