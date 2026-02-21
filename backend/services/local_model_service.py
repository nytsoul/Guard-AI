"""
Local Model Service - Layer 2 of the multi-layer detection pipeline.

Behaviour:
  - If LOCAL_MODEL_ENABLED=false OR LOCAL_MODEL_PATH is empty → skip entirely,
    return heuristic result immediately (no HuggingFace download, no delay).
  - If path exists on disk → load and run DistilBERT inference.
  - If path doesn't exist → heuristic only (no hub download attempt).
  - On any inference error → fall back to heuristic.

This keeps startup fast when no model is installed.
"""

import math
import logging
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)

_model_available = False
_load_attempted = False
_tokenizer = None
_model = None
_device = None


@dataclass
class LocalModelResult:
    score: float        # 0-100
    confidence: float   # 0.0-1.0
    available: bool
    label: str          # MALICIOUS | SAFE

    def as_dict(self) -> dict:
        return {
            "score": self.score,
            "confidence": self.confidence,
            "available": self.available,
            "label": self.label,
        }


# ─────────────────────────────────────────────
# HEURISTIC FALLBACK (used when no model loaded)
# ─────────────────────────────────────────────

_HEURISTIC_WEIGHTS = {
    "ignore previous": 0.45,
    "system prompt": 0.40,
    "jailbreak": 0.55,
    "dan mode": 0.60,
    "no restrictions": 0.50,
    "act as": 0.35,
    "bypass": 0.30,
    "forget all": 0.38,
    "override": 0.28,
    "disable safety": 0.52,
    "pretend": 0.22,
    "roleplay": 0.15,
    "hypothetically": 0.18,
    "disregard": 0.30,
    "do anything now": 0.60,
    "developer mode": 0.50,
    "maintenance mode": 0.48,
    "ignore instructions": 0.50,
    "forget previous": 0.42,
}


def _heuristic_score(text: str) -> LocalModelResult:
    lower = text.lower()
    total_weight = 0.0
    hits = 0
    for phrase, weight in _HEURISTIC_WEIGHTS.items():
        if phrase in lower:
            total_weight += weight
            hits += 1

    if total_weight == 0:
        score, confidence = 0.0, 0.60
    else:
        sigmoid = 1.0 / (1.0 + math.exp(-4.0 * (total_weight - 0.5)))
        score = round(sigmoid * 100, 2)
        confidence = round(min(0.85, 0.50 + hits * 0.08), 3)

    return LocalModelResult(
        score=score,
        confidence=confidence,
        available=False,
        label="MALICIOUS" if score >= 50 else "SAFE",
    )


# ─────────────────────────────────────────────
# STARTUP INITIALIZATION
# ─────────────────────────────────────────────

def initialize(model_path: str) -> None:
    """
    Called once at app startup.
    Skips silently if disabled or path is empty/missing.
    Never attempts HuggingFace hub download.
    """
    global _model_available, _load_attempted, _tokenizer, _model, _device
    _load_attempted = True

    # Check config flag first
    from config import cfg
    if not cfg.LOCAL_MODEL_ENABLED:
        logger.info("Local model disabled via LOCAL_MODEL_ENABLED=false — using heuristic.")
        return

    if not model_path or not model_path.strip():
        logger.info("LOCAL_MODEL_PATH is empty — skipping local model, using heuristic.")
        return

    # Resolve path relative to backend directory if not absolute
    if not os.path.isabs(model_path):
        # Get the backend directory (parent of services)
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(backend_dir, model_path)
        logger.info("Resolved relative model path to: %s", model_path)

    # Only load if the directory actually exists on disk
    if not os.path.isdir(model_path):
        logger.info(
            "Local model path '%s' not found on disk — skipping, using heuristic. "
            "Place a DistilBERT model there to enable Layer 2.",
            model_path,
        )
        return

    # Check for required model files
    required = ["config.json"]
    for f in required:
        if not os.path.exists(os.path.join(model_path, f)):
            logger.info(
                "Local model path '%s' missing config.json — skipping, using heuristic.",
                model_path,
            )
            return

    # All checks passed — load the model
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForSequenceClassification

        _tokenizer = AutoTokenizer.from_pretrained(model_path)
        _model = AutoModelForSequenceClassification.from_pretrained(model_path)
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        _model.to(_device)
        _model.eval()
        _model_available = True
        logger.info("Local model loaded from '%s' on device: %s", model_path, _device)

    except Exception as exc:
        logger.warning("Local model load failed: %s — using heuristic fallback.", exc)
        _model_available = False


def classify(text: str, max_length: int = 512) -> LocalModelResult:
    """Run classifier. Uses heuristic if model is not loaded."""
    if not _model_available:
        return _heuristic_score(text)

    try:
        import torch

        inputs = _tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=max_length,
            padding=True,
        )
        inputs = {k: v.to(_device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = _model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1).squeeze()

        num_classes = probs.shape[0]
        malicious_prob = float(probs[1].item()) if num_classes == 2 else float(probs[1:].max().item())
        score = round(malicious_prob * 100, 2)
        confidence = round(float(probs.max().item()), 3)

        return LocalModelResult(
            score=score,
            confidence=confidence,
            available=True,
            label="MALICIOUS" if malicious_prob >= 0.50 else "SAFE",
        )

    except Exception as exc:
        logger.error("Local model inference error: %s — using heuristic.", exc)
        return _heuristic_score(text)


def is_available() -> bool:
    return _model_available
