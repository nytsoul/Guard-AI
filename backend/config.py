"""
Sentinel Shield - Centralized Configuration
All settings loaded from environment variables with safe defaults.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly resolve .env relative to this file so it loads regardless of CWD
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path, encoding="utf-8-sig")  # utf-8-sig strips BOM if present


class Config:
    # ── Database ──────────────────────────────
    MONGODB_URI: str = os.getenv(
        "MONGODB_URI", "mongodb://localhost:27017/sentinel_shield"
    )

    # ── Auth ──────────────────────────────────
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET", "sentinel_shield_super_secret_jwt_key_2024"
    )
    JWT_EXPIRY_SECONDS: int = int(os.getenv("JWT_EXPIRY_SECONDS", "86400"))
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # ── LLM (Groq) ────────────────────────────
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_TIMEOUT: int = int(os.getenv("GROQ_TIMEOUT", "15"))

    # ── Local Model ───────────────────────────
    # Set LOCAL_MODEL_ENABLED=false to skip entirely (recommended unless model file exists)
    LOCAL_MODEL_PATH: str = os.getenv("LOCAL_MODEL_PATH", "").strip()
    LOCAL_MODEL_ENABLED: bool = os.getenv("LOCAL_MODEL_ENABLED", "false").lower() == "true"

    # ── Risk Thresholds ───────────────────────
    RISK_HIGH_THRESHOLD: int = int(os.getenv("RISK_HIGH_THRESHOLD", "70"))
    RISK_MEDIUM_THRESHOLD: int = int(os.getenv("RISK_MEDIUM_THRESHOLD", "40"))

    # ── Weighted Aggregation ──────────────────
    # When local model is disabled, aggregator redistributes its weight automatically.
    # These values are the BASE weights; aggregator normalizes if a layer is missing.
    WEIGHT_RULE: float = float(os.getenv("WEIGHT_RULE", "0.30"))
    WEIGHT_LOCAL: float = float(os.getenv("WEIGHT_LOCAL", "0.00"))
    WEIGHT_LLM: float = float(os.getenv("WEIGHT_LLM", "0.70"))

    # ── CORS ──────────────────────────────────
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

    # ── Misc ──────────────────────────────────
    DEBUG: bool = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    PORT: int = int(os.getenv("PORT", "5000"))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sentinel_flask_secret")


cfg = Config()
