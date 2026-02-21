"""
Rule Engine – Layer 1 of the multi-layer detection pipeline.

Performs deterministic, zero-latency threat detection using:
  • Regex injection patterns (weighted by severity)
  • Forbidden phrase matching (from active policy)
  • PII pattern detection
  • Tool-abuse / command-injection detection
  • Structural anomalies (length, encoding tricks)

Returns:
  RuleEngineResult dataclass with score 0–100,
  triggered rules, and primary attack category.
"""

import re
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class TriggeredRule:
    rule_id: str
    category: str
    description: str
    weight: int
    matched_text: str
    severity: str  # critical | high | medium | low


@dataclass
class RuleEngineResult:
    score: float                          # 0–100
    attack_type: str                      # primary detected category
    categories: List[str]
    triggered_rules: List[TriggeredRule]
    explanation: str

    def as_dict(self) -> dict:
        return {
            "score": self.score,
            "attack_type": self.attack_type,
            "categories": self.categories,
            "triggered_rules": [
                {
                    "rule_id": r.rule_id,
                    "category": r.category,
                    "description": r.description,
                    "weight": r.weight,
                    "matched_text": r.matched_text,
                    "severity": r.severity,
                }
                for r in self.triggered_rules
            ],
            "explanation": self.explanation,
        }


# ─────────────────────────────────────────────────────────────────
# PATTERN DEFINITIONS
# Each tuple: (compiled_regex, base_weight, rule_id, description, category)
# ─────────────────────────────────────────────────────────────────

INJECTION_PATTERNS: List[tuple] = [
    (
        re.compile(r"ignore\s+(all\s+)?previous\s+(instructions?|rules?|directives?|context)", re.I),
        65, "INJ-001", "Direct instruction override command", "prompt_injection",
    ),
    (
        re.compile(r"(DAN|do\s+anything\s+now|developer\s+mode|maintenance\s+mode|unrestricted\s+mode)", re.I),
        70, "JBK-001", "Known jailbreak trigger phrase", "jailbreak",
    ),
    (
        re.compile(r"(act\s+as|pretend\s+(you\s+are|to\s+be)|roleplay\s+as|you\s+are\s+now\s+a)", re.I),
        45, "INJ-002", "Persona manipulation via roleplay injection", "prompt_injection",
    ),
    (
        re.compile(r"(forget|disregard|override|bypass|nullify)\s+(previous|prior|all\s+prior|your)", re.I),
        55, "INJ-003", "Contextual override command detected", "prompt_injection",
    ),
    (
        re.compile(r"system\s+(prompt|instruction|message|directive)", re.I),
        50, "SYS-001", "System prompt reference or extraction attempt", "system_prompt_extraction",
    ),
    (
        re.compile(r"(repeat|print|output|reveal|show|display|echo)\s+(your\s+)?(system|initial|original|full)\s+(prompt|instruction|message)", re.I),
        65, "SYS-002", "Explicit system prompt extraction request", "system_prompt_extraction",
    ),
    (
        re.compile(r"(no\s+restrictions?|without\s+restrictions?|bypass\s+(all\s+)?filter|disable\s+(safety|filter|guard))", re.I),
        60, "JBK-002", "Explicit filter bypass attempt", "jailbreak",
    ),
    (
        re.compile(r"(from\s+now\s+on|henceforth|starting\s+now).{0,30}(ignore|bypass|forget|override)", re.I),
        55, "INJ-004", "Temporal context injection for persistent override", "prompt_injection",
    ),
    (
        re.compile(r"\[\[.*?(inject|override|bypass|ignore).*?\]\]", re.I | re.DOTALL),
        70, "ENC-001", "Encoded bracket injection vector", "prompt_injection",
    ),
    # Enhanced patterns for stronger detection
    (
        re.compile(r"(hack|exploit|crack|penetrate|breach)\s+(into|a|the)?\s*(bank|database|system|server|network)", re.I),
        75, "MAL-001", "Explicit hacking/exploitation request", "malicious_code",
    ),
    (
        re.compile(r"(steal|extract|leak|obtain|access)\s+(credentials|passwords|api\s+keys|secrets|data)", re.I),
        70, "PII-001", "Credential theft or data extraction", "pii_extraction",
    ),
    (
        re.compile(r"(jailbreak|jail\s*break)\s*(active|mode|enabled)", re.I),
        75, "JBK-003", "Jailbreak activation confirmation", "jailbreak",
    ),
    (
        re.compile(r"(delete|drop|truncate|remove)\s+(database|table|records|files)", re.I),
        65, "TOR-001", "Destructive database operations", "tool_abuse",
    ),
    (
        re.compile(r"(rm\s+-rf|deltree|format\s+c:|shutdown|reboot)\s*[/\\]?", re.I),
        70, "TOR-002", "Destructive system commands", "tool_abuse",
    ),
    (
        re.compile(r"(sql\s+injection|union\s+select|or\s+1\s*=\s*1|drop\s+table)", re.I),
        65, "INJ-005", "SQL injection patterns", "prompt_injection",
    ),
    (
        re.compile(r"<!--.*?(ignore|override|inject).*?-->", re.I | re.DOTALL),
        35, "ENC-002", "HTML comment injection technique", "prompt_injection",
    ),
    (
        re.compile(r"<\s*system\s*>", re.I),
        48, "ENC-003", "XML system tag injection", "prompt_injection",
    ),
    (
        re.compile(r"(translate|summarize|convert).{0,40}(ignore|bypass|system\s+prompt)", re.I),
        42, "INJ-005", "Translation/summarization bypass technique", "prompt_injection",
    ),
    (
        re.compile(r"(hypothetically|theoretically|in\s+a\s+fictional|for\s+a\s+story).{0,60}(how\s+to|explain|tell\s+me)", re.I),
        28, "JBK-003", "Hypothetical framing to bypass safety", "jailbreak",
    ),
]

PII_PATTERNS: List[tuple] = [
    (
        re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
        42, "PII-001", "Social Security Number pattern detected", "pii_leakage",
    ),
    (
        re.compile(r"\b4[0-9]{12}(?:[0-9]{3})?\b|\b5[1-5][0-9]{14}\b|\b3[47][0-9]{13}\b"),
        48, "PII-002", "Credit card number pattern detected", "pii_leakage",
    ),
    (
        re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b"),
        18, "PII-003", "Email address in prompt", "pii_leakage",
    ),
    (
        re.compile(r"\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b"),
        15, "PII-004", "Phone number detected in prompt", "pii_leakage",
    ),
    (
        re.compile(r"(password|passwd|secret|api[_\s]?key|access[_\s]?token|bearer[_\s]?token)\s*[=:]\s*\S{4,}", re.I),
        55, "PII-005", "Credential or API key in plaintext", "pii_leakage",
    ),
    (
        re.compile(r"(date\s+of\s+birth|dob|social\s+security|passport\s+number|national\s+id)", re.I),
        25, "PII-006", "Sensitive personal identifier keywords", "pii_leakage",
    ),
]

TOOL_ABUSE_PATTERNS: List[tuple] = [
    (
        re.compile(r"(exec|execute|run|call|invoke|spawn)\s+(shell|bash|sh|cmd|powershell|command)", re.I),
        62, "TOOL-001", "Shell command execution attempt", "tool_abuse",
    ),
    (
        re.compile(r"(delete|drop|truncate|destroy|wipe)\s+(table|database|db|collection|schema)", re.I),
        68, "TOOL-002", "Destructive database operation attempt", "tool_abuse",
    ),
    (
        re.compile(r"(cat|read|open|tail|head|less|more)\s+/?(etc|home|root|var|usr|proc|sys)/\S+", re.I),
        58, "TOOL-003", "Sensitive filesystem access attempt", "tool_abuse",
    ),
    (
        re.compile(r"https?://(?!(?:www\.)?(openai|anthropic|google|microsoft)\.com)\S+", re.I),
        28, "TOOL-004", "Suspicious external URL in prompt", "tool_abuse",
    ),
    (
        re.compile(r"(exfil|exfiltrat|data.{0,10}leak|send.{0,15}to|POST.{0,15}to|transmit.{0,15}to)", re.I),
        52, "TOOL-005", "Data exfiltration command detected", "tool_abuse",
    ),
    (
        re.compile(r"(write|create|generate|produce)\s+(malware|ransomware|virus|keylogger|trojan|exploit)", re.I),
        70, "TOOL-006", "Malicious code generation request", "malicious_code",
    ),
    (
        re.compile(r"(sql\s+injection|xss|cross.site|buffer\s+overflow|reverse\s+shell)\s+(payload|exploit|attack)", re.I),
        65, "TOOL-007", "Security exploit construction request", "malicious_code",
    ),
]

ANOMALY_PATTERNS: List[tuple] = [
    (
        re.compile(r"(\\x[0-9a-fA-F]{2}){4,}"),
        30, "ANO-001", "Hex-encoded content suggesting obfuscation", "anomaly",
    ),
    (
        re.compile(r"[^\x00-\x7F]{15,}"),
        18, "ANO-002", "Dense non-ASCII characters – possible encoding attack", "anomaly",
    ),
    (
        re.compile(r"(.)\1{20,}"),
        15, "ANO-003", "Character repetition anomaly", "anomaly",
    ),
]

# Category priority for selecting primary attack_type
CATEGORY_PRIORITY = [
    "malicious_code",
    "tool_abuse",
    "prompt_injection",
    "system_prompt_extraction",
    "jailbreak",
    "pii_leakage",
    "anomaly",
    "policy_violation",
]

ALL_PATTERN_GROUPS = [
    INJECTION_PATTERNS,
    PII_PATTERNS,
    TOOL_ABUSE_PATTERNS,
    ANOMALY_PATTERNS,
]


def run_rules(
    text: str,
    forbidden_phrases: Optional[List[str]] = None,
    restricted_tools: Optional[List[str]] = None,
    sensitivity: float = 0.75,
) -> RuleEngineResult:
    """
    Execute all rule groups against the input text.

    Args:
        text:             Raw prompt text
        forbidden_phrases: Policy-defined phrases; immediate high-weight block
        restricted_tools:  Policy-defined tool names; presence = critical
        sensitivity:      0.0–1.0 multiplier applied to every rule weight

    Returns:
        RuleEngineResult with score 0–100
    """
    lower = text.lower()
    raw_score: int = 0
    triggered: List[TriggeredRule] = []
    categories: set = set()

    # ── 1. Forbidden phrases from policy ──────────────────────────
    for phrase in (forbidden_phrases or []):
        if phrase.lower() in lower:
            w = int(38 * sensitivity)
            raw_score += w
            triggered.append(TriggeredRule(
                rule_id="POL-001",
                category="policy_violation",
                description=f"Policy-forbidden phrase: '{phrase}'",
                weight=w,
                matched_text=phrase,
                severity="high",
            ))
            categories.add("policy_violation")

    # ── 2. Restricted tools from policy ───────────────────────────
    for tool in (restricted_tools or []):
        if tool.lower() in lower:
            w = int(65 * sensitivity)
            raw_score += w
            triggered.append(TriggeredRule(
                rule_id="POL-002",
                category="tool_abuse",
                description=f"Attempt to invoke restricted tool: '{tool}'",
                weight=w,
                matched_text=tool,
                severity="critical",
            ))
            categories.add("tool_abuse")

    # ── 3. All pattern groups ──────────────────────────────────────
    for group in ALL_PATTERN_GROUPS:
        for (pattern, base_w, rule_id, desc, category) in group:
            match = pattern.search(text)
            if match:
                w = int(base_w * sensitivity)
                raw_score += w
                severity = (
                    "critical" if w >= 55
                    else "high" if w >= 35
                    else "medium" if w >= 20
                    else "low"
                )
                triggered.append(TriggeredRule(
                    rule_id=rule_id,
                    category=category,
                    description=desc,
                    weight=w,
                    matched_text=match.group(0)[:80],
                    severity=severity,
                ))
                categories.add(category)

    # ── 4. Structural anomaly: prompt length ──────────────────────
    if len(text) > 2000:
        w = int(12 * sensitivity)
        raw_score += w
        triggered.append(TriggeredRule(
            rule_id="ANO-004",
            category="anomaly",
            description=f"Prompt length {len(text)} chars exceeds 2000-char safety threshold",
            weight=w,
            matched_text=f"{len(text)} chars",
            severity="low",
        ))
        categories.add("anomaly")

    # ── Clamp score ────────────────────────────────────────────────
    final_score = min(100.0, float(raw_score))

    # ── Primary attack type ────────────────────────────────────────
    primary = "none"
    for cat in CATEGORY_PRIORITY:
        if cat in categories:
            primary = cat
            break

    # ── Human-readable explanation ─────────────────────────────────
    if not triggered:
        explanation = "No threat patterns detected by rule engine."
    else:
        top = sorted(triggered, key=lambda r: r.weight, reverse=True)[:2]
        explanation = (
            f"Rule engine flagged {len(triggered)} pattern(s). "
            f"Primary: {top[0].description}."
        )
        if len(top) > 1:
            explanation += f" Also: {top[1].description}."

    return RuleEngineResult(
        score=final_score,
        attack_type=primary,
        categories=list(categories),
        triggered_rules=triggered,
        explanation=explanation,
    )
