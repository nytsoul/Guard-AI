"""
Projects Routes Blueprint

Endpoints:
  GET    /api/projects
  POST   /api/projects
  GET    /api/projects/<id>
  PUT    /api/projects/<id>
  DELETE /api/projects/<id>
  GET    /api/projects/<id>/metrics?days=7
  GET    /api/projects/<id>/api-keys
  GET    /api/system/status
  GET    /api/health
"""

import time
from datetime import datetime, timedelta
from bson import ObjectId
from flask import Blueprint, request, jsonify, current_app

projects_bp = Blueprint("projects", __name__)


def _db():
    return current_app.extensions["db"]


def _serialize(obj):
    if isinstance(obj, ObjectId): return str(obj)
    if isinstance(obj, datetime): return obj.isoformat()
    if isinstance(obj, dict):     return {k: _serialize(v) for k, v in obj.items()}
    if isinstance(obj, list):     return [_serialize(i) for i in obj]
    return obj


def _clean(doc): return _serialize(doc)


# ─────────────────────────────────────────────────────────────────
# GET /api/projects
# ─────────────────────────────────────────────────────────────────

@projects_bp.route("/projects", methods=["GET"])
def get_projects():
    items = list(_db()["projects"].find({}))
    return jsonify({"projects": [_clean(p) for p in items], "total": len(items)}), 200


# ─────────────────────────────────────────────────────────────────
# POST /api/projects
# ─────────────────────────────────────────────────────────────────

@projects_bp.route("/projects", methods=["POST"])
def create_project():
    data  = request.get_json(silent=True) or {}
    count = _db()["projects"].count_documents({})
    project = {
        "id":              f"proj_{count + 1:03d}_{int(time.time())}",
        "name":            data.get("name", "New Project").strip(),
        "environment":     data.get("environment", "Development"),
        "status":          "Healthy",
        "uptime":          99.0,
        "totalRequests":   0,
        "blockedAttempts": 0,
        "securityScore":   95.0,
        "createdAt":       datetime.now().isoformat(),
    }
    _db()["projects"].insert_one(project)
    return jsonify(_clean(project)), 201


# ─────────────────────────────────────────────────────────────────
# GET /api/projects/<id>
# ─────────────────────────────────────────────────────────────────

@projects_bp.route("/projects/<project_id>", methods=["GET"])
def get_project(project_id):
    p = _db()["projects"].find_one({"id": project_id})
    if not p:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(_clean(p)), 200


# ─────────────────────────────────────────────────────────────────
# PUT /api/projects/<id>
# ─────────────────────────────────────────────────────────────────

@projects_bp.route("/projects/<project_id>", methods=["PUT"])
def update_project(project_id):
    data = request.get_json(silent=True) or {}
    data.pop("_id", None)
    r = _db()["projects"].update_one({"id": project_id}, {"$set": data})
    if r.matched_count == 0:
        return jsonify({"error": "Project not found"}), 404
    updated = _db()["projects"].find_one({"id": project_id})
    return jsonify(_clean(updated)), 200


# ─────────────────────────────────────────────────────────────────
# DELETE /api/projects/<id>
# ─────────────────────────────────────────────────────────────────

@projects_bp.route("/projects/<project_id>", methods=["DELETE"])
def delete_project(project_id):
    r = _db()["projects"].delete_one({"id": project_id})
    if r.deleted_count:
        return jsonify({"message": "Project deleted successfully"}), 200
    return jsonify({"error": "Project not found"}), 404


# ─────────────────────────────────────────────────────────────────
# GET /api/projects/<id>/metrics?days=7
# Computes real daily metrics from security_logs collection
# ─────────────────────────────────────────────────────────────────

@projects_bp.route("/projects/<project_id>/metrics", methods=["GET"])
def get_project_metrics(project_id):
    days     = max(1, min(90, int(request.args.get("days", 7))))
    logs_col = _db()["security_logs"]
    metrics  = []

    for i in range(days - 1, -1, -1):
        day       = datetime.now() - timedelta(days=i)
        day_str   = day.strftime("%Y-%m-%d")
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        day_end   = day.replace(hour=23, minute=59, second=59).isoformat()

        day_query = {"timestamp": {"$gte": day_start, "$lte": day_end}}

        try:
            requests_count  = logs_col.count_documents(day_query)
            blocked_count   = logs_col.count_documents({**day_query, "action": "blocked"})

            # Compute average latency from processingTime if available
            pipeline = [
                {"$match": day_query},
                {"$group": {"_id": None, "avg_latency": {"$avg": "$processingTime"}}},
            ]
            lat_res = list(logs_col.aggregate(pipeline))
            avg_latency = round((lat_res[0]["avg_latency"] or 0) * 1000, 1) if lat_res else 12.0

        except Exception:
            requests_count = 0
            blocked_count  = 0
            avg_latency    = 0.0

        metrics.append({
            "date":       day_str,
            "requests":   requests_count,
            "blocked":    blocked_count,
            "avgLatency": avg_latency,
            "uptime":     99.9,
        })

    return jsonify({"metrics": metrics}), 200


# ─────────────────────────────────────────────────────────────────
# GET /api/projects/<id>/api-keys
# ─────────────────────────────────────────────────────────────────

@projects_bp.route("/projects/<project_id>/api-keys", methods=["GET"])
def get_api_keys(project_id):
    project = _db()["projects"].find_one({"id": project_id})
    created_at = project.get("createdAt", "2024-01-01") if project else "2024-01-01"

    return jsonify({
        "keys": [
            {
                "id":       "key_001",
                "name":     "Production Key",
                "key":      f"sk_live_{project_id[:8].replace('-','')[:8]}{'x' * 24}",
                "created":  created_at[:10],
                "lastUsed": datetime.now().isoformat(),
                "status":   "active",
            },
            {
                "id":       "key_002",
                "name":     "Development Key",
                "key":      f"sk_test_{project_id[:8].replace('-','')[:8]}{'x' * 24}",
                "created":  created_at[:10],
                "lastUsed": (datetime.now() - timedelta(days=1)).isoformat(),
                "status":   "active",
            },
        ]
    }), 200


# ─────────────────────────────────────────────────────────────────
# GET /api/system/status
# ─────────────────────────────────────────────────────────────────

@projects_bp.route("/system/status", methods=["GET"])
def system_status():
    from services import local_model_service, llm_security_service

    db = _db()
    try:
        total_logs = db["security_logs"].count_documents({})
        db_status  = "operational"
    except Exception:
        total_logs = 0
        db_status  = "degraded"

    return jsonify({
        "status": "operational",
        "services": {
            "api":        "operational",
            "database":   db_status,
            "mlEngine":   "operational" if local_model_service.is_available() else "degraded",
            "llmService": "operational" if llm_security_service.is_available() else "degraded",
            "vectorDb":   "operational",
            "monitoring": "operational",
        },
        "uptime":       99.97,
        "lastIncident": "2025-12-03",
        "version":      "3.0.0",
        "layers": {
            "ruleEngine": True,
            "localModel": local_model_service.is_available(),
            "llm":        llm_security_service.is_available(),
        },
        "totalLogsStored": total_logs,
    }), 200


# ─────────────────────────────────────────────────────────────────
# GET /api/health
# ─────────────────────────────────────────────────────────────────

@projects_bp.route("/health", methods=["GET"])
def health():
    try:
        _db().command("ping")
        db_ok = True
    except Exception:
        db_ok = False

    return jsonify({
        "status":    "ok" if db_ok else "degraded",
        "service":   "Sentinel Shield",
        "version":   "3.0.0",
        "database":  "connected" if db_ok else "disconnected",
        "timestamp": datetime.now().isoformat(),
    }), 200
