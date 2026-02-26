"""
Auth Routes Blueprint

Endpoints consumed by frontend (from api.ts):
  POST /api/auth/login    → auth.login(email, password)
  POST /api/auth/logout   → auth.logout()
  POST /api/auth/signup   → auth.signup({name, email, password})
  POST /api/auth/google   → auth.googleLogin(access_token)

Login/signup response:
  { token: str, user: { id, name, email, role, createdAt } }
"""

import jwt
import bcrypt
import requests as http_requests
from bson import ObjectId
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from config import cfg

auth_bp = Blueprint("auth", __name__)


def _db():
    return current_app.extensions["db"]


def _make_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(seconds=cfg.JWT_EXPIRY_SECONDS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, cfg.JWT_SECRET, algorithm="HS256")


def _serialize_user(user: dict) -> dict:
    return {
        "id":        str(user["_id"]),
        "name":      user.get("name", ""),
        "email":     user.get("email", ""),
        "role":      user.get("role", "user"),
        "createdAt": user.get("createdAt", datetime.now().isoformat()),
    }


# ─────────────────────────────────────────────────────────────────
# POST /api/auth/login
# ─────────────────────────────────────────────────────────────────

@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data     = request.get_json(silent=True) or {}
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = _db()["users"].find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    try:
        pw_match = bcrypt.checkpw(password.encode(), user["password"].encode()
                                  if isinstance(user["password"], str)
                                  else user["password"])
    except Exception:
        pw_match = False

    if not pw_match:
        return jsonify({"error": "Invalid credentials"}), 401

    token = _make_token(str(user["_id"]))
    return jsonify({
        "token": token,
        "user":  _serialize_user(user),
    }), 200


# ─────────────────────────────────────────────────────────────────
# POST /api/auth/signup
# ─────────────────────────────────────────────────────────────────

@auth_bp.route("/auth/signup", methods=["POST"])
def signup():
    data  = request.get_json(silent=True) or {}
    name  = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    pw    = data.get("password", "")

    if not name or not email or not pw:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if len(pw) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if _db()["users"].find_one({"email": email}):
        return jsonify({"error": "An account with this email already exists"}), 409

    hashed = bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
    user_doc = {
        "name":      name,
        "email":     email,
        "password":  hashed,
        "role":      "admin",
        "createdAt": datetime.now().isoformat(),
    }
    result = _db()["users"].insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = _make_token(str(result.inserted_id))
    return jsonify({
        "token": token,
        "user":  _serialize_user(user_doc),
    }), 201


# ─────────────────────────────────────────────────────────────────
# POST /api/auth/logout
# ─────────────────────────────────────────────────────────────────

@auth_bp.route("/auth/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out successfully"}), 200


# ─────────────────────────────────────────────────────────────────
# POST /api/auth/google
# ─────────────────────────────────────────────────────────────────

@auth_bp.route("/auth/google", methods=["POST"])
def google_login():
    data         = request.get_json(silent=True) or {}
    access_token = data.get("access_token", "")

    if not access_token:
        return jsonify({"error": "access_token is required"}), 400

    # Verify the access token and fetch user info from Google
    try:
        resp = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10,
        )
        if resp.status_code != 200:
            return jsonify({"error": "Invalid or expired Google access token"}), 401
        google_user = resp.json()
    except Exception as exc:
        return jsonify({"error": f"Failed to contact Google: {exc}"}), 502

    email = google_user.get("email", "").strip().lower()
    name  = google_user.get("name") or google_user.get("given_name") or "Google User"

    if not email:
        return jsonify({"error": "Google account does not expose an email address"}), 400

    # Upsert: find existing user by email or create a new one
    user = _db()["users"].find_one({"email": email})
    if not user:
        doc = {
            "name":      name,
            "email":     email,
            "password":  "",
            "role":      "user",
            "provider":  "google",
            "createdAt": datetime.now().isoformat(),
        }
        result = _db()["users"].insert_one(doc)
        doc["_id"] = result.inserted_id
        user = doc

    token = _make_token(str(user["_id"]))
    return jsonify({
        "token": token,
        "user":  _serialize_user(user),
    }), 200
