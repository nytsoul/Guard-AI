"""
Sentinel Shield - Enterprise Security Middleware
Python Flask Backend for LLM security monitoring with MongoDB
"""

import os
import random
import json
import re
from datetime import datetime, timedelta
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import jwt
import requests
import bcrypt
import certifi
from dotenv import load_dotenv
from bson import ObjectId

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/sentinel_shield')
JWT_SECRET = os.getenv('JWT_SECRET', 'sentinel_shield_super_secret_jwt_key_2024')
GOOGLE_CLIENT_ID = os.getenv('VITE_GOOGLE_CLIENT_ID')

# MongoDB client with timeout and certifi for SSL/TLS
client = MongoClient(
    MONGODB_URI, 
    serverSelectionTimeoutMS=5000,
    tlsCAFile=certifi.where()
)
db = client.get_default_database()

# Collections
users_col = db['users']
logs_col = db['security_logs']
projects_col = db['projects']
policies_col = db['policies']
scans_col = db['scanned_documents']
simulations_col = db['red_team_simulations']

# Threat patterns for analysis
THREAT_PATTERNS = [
    "system prompt", "ignore instructions", "DAN mode", 
    "disable safety", "jailbreak", "override rules"
]

# Auth decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            current_user = users_col.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'error': 'Token is invalid'}), 401
        except Exception as e:
            return jsonify({'error': f'Token is invalid: {str(e)}'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Initialize mock data if collections are empty
def init_db():
    try:
        print(f"Connecting to MongoDB Atlas...")
        # Force a connection check
        client.admin.command('ping')
        print("Connected successfully to MongoDB Atlas!")
        
        # Seed projects
        if projects_col.count_documents({}) == 0:
            projects_col.insert_many([
                {
                    "id": "proj_001",
                    "name": "Enterprise-LLM-01",
                    "environment": "Production",
                    "uptime": 98.4,
                    "totalRequests": 128402,
                    "blockedAttempts": 1244,
                    "securityScore": 98.2,
                    "status": "Healthy"
                },
                {
                    "id": "proj_002",
                    "name": "Customer-Support-LLM",
                    "environment": "Production",
                    "uptime": 99.9,
                    "totalRequests": 892123,
                    "blockedAttempts": 12421,
                    "securityScore": 94.1,
                    "status": "Healthy"
                }
            ])
            print("Seeded projects collection")

        # Seed policies
        if policies_col.count_documents({}) == 0:
            policies_col.insert_one({
                "policy_id": "default",
                "blockHighRisk": True,
                "blockMediumRisk": True,
                "enableOutputScanning": True,
                "sensitivity": 75,
                "forbiddenPhrases": THREAT_PATTERNS
            })
            print("Seeded policies collection")

        # Seed logs
        if logs_col.count_documents({}) == 0:
            mock_logs = [
                {
                    "id": f"log_{i:04d}",
                    "timestamp": (datetime.now() - timedelta(hours=i)).isoformat(),
                    "userInput": f"Malicious prompt attempt {i}",
                    "attackType": random.choice(["prompt_injection", "jailbreak", "pii_leakage"]),
                    "riskScore": random.randint(20, 95),
                    "severity": random.choice(["critical", "high", "medium", "low"]),
                    "action": random.choice(["blocked", "flagged", "allowed"]),
                    "endpoint": f"endpoint-{random.randint(1, 10)}"
                }
                for i in range(50)
            ]
            logs_col.insert_many(mock_logs)
            print("Seeded security_logs collection")

        # Seed admin user
        if users_col.count_documents({"email": "admin@enterprise.com"}) == 0:
            hashed_password = bcrypt.hashpw("password".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            users_col.insert_one({
                "email": "admin@enterprise.com",
                "password": hashed_password,
                "name": "Admin User",
                "role": "admin",
                "createdAt": datetime.now().isoformat()
            })
            print("Seeded admin user")
    except Exception as e:
        error_msg = str(e)
        print(f"MongoDB Initialization Error: {error_msg}")
        if "SSL handshake failed" in error_msg or "alert internal error" in error_msg:
            print("\n" + "="*60)
            print("POSSIBLE CAUSE: Your IP address may not be whitelisted in MongoDB Atlas.")
            print("1. Go to MongoDB Atlas -> Network Access")
            print("2. Click 'Add IP Address'")
            print("3. Click 'Add Current IP Address' or 'Allow Access from Anywhere'")
            print("="*60 + "\n")
        elif "authentication failed" in error_msg or "bad auth" in error_msg:
            print("\n" + "="*60)
            print("POSSIBLE CAUSE: Invalid Username or Password.")
            print("1. In MongoDB Atlas, go to Database Access.")
            print("2. Verify that the user 'graud_ai' exists.")
            print("3. Reset the password for 'graud_ai' to ensure it matches.")
            print("4. IMPORTANT: If your password has special characters (@, :, /, %),")
            print("   they must be URL encoded (e.g., @ becomes %40).")
            print("="*60 + "\n")
        print("Continuing without seeding...")

# Initialize data
init_db()

# --- HELPER FUNCTIONS ---
def serialize_mongo(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj

def clean_dict(d):
    return {k: serialize_mongo(v) for k, v in d.items()}

# --- ROUTES ---

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "service": "Sentinel Shield",
        "version": "2.4.0 (MongoDB Powered)",
        "timestamp": datetime.now().isoformat()
    })

# Authentication
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '')
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    
    user = users_col.find_one({"email": email})
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        token = jwt.encode({
            'user_id': str(user['_id']),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }, JWT_SECRET, algorithm='HS256')
        
        return jsonify({
            "token": token,
            "user": {
                "id": str(user['_id']),
                "email": user['email'],
                "name": user['name'],
                "role": user.get('role', 'user')
            },
            "expiresIn": 86400
        })
    
    return jsonify({"error": "Invalid email or password"}), 401

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.json
    access_token = data.get('access_token')
    
    if not access_token:
        return jsonify({"error": "Google access token required"}), 400
    
    # Verify token with Google
    response = requests.get(f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={access_token}")
    
    if response.status_code != 200:
        return jsonify({"error": "Invalid Google token"}), 401
    
    google_user = response.json()
    email = google_user.get('email')
    name = google_user.get('name')
    
    if not email:
        return jsonify({"error": "Could not retrieve email from Google"}), 401
    
    # Find or create user
    user = users_col.find_one({"email": email})
    if not user:
        user_data = {
            "email": email,
            "name": name,
            "google_id": google_user.get('sub'),
            "role": "user",
            "createdAt": datetime.now().isoformat()
        }
        result = users_col.insert_one(user_data)
        user = users_col.find_one({"_id": result.inserted_id})
    else:
        # Update name or google_id if needed
        users_col.update_one(
            {"_id": user['_id']}, 
            {"$set": {"name": name, "google_id": google_user.get('sub')}}
        )
    
    # Generate JWT
    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.utcnow() + timedelta(hours=24)
    }, JWT_SECRET, algorithm='HS256')
    
    return jsonify({
        "token": token,
        "user": {
            "id": str(user['_id']),
            "email": user['email'],
            "name": user['name'],
            "role": user.get('role', 'user')
        },
        "expiresIn": 86400
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    return jsonify({"message": "Logged out successfully"})

# Dashboard Metrics
@app.route('/api/metrics/dashboard', methods=['GET'])
def get_dashboard_metrics():
    total_logs = logs_col.count_documents({})
    blocked_count = logs_col.count_documents({"action": "blocked"})
    
    # Calculate average risk score
    pipeline = [
        {"$group": {"_id": None, "avg_risk": {"$avg": "$riskScore"}}}
    ]
    result = list(logs_col.aggregate(pipeline))
    avg_risk = int(result[0]['avg_risk']) if result else 0
    
    return jsonify({
        "totalLLMRequests": 1248392, # Static mock for scale
        "injectionAttempts": 42891,  # Static mock for scale
        "blockedRequests": blocked_count,
        "globalSecurityScore": 98.4,
        "threatVectors": {
            "promptInjection": 45,
            "piiLeakage": 28,
            "jailbreak": 18,
            "toolMisuse": 9
        },
        "averageRiskScore": avg_risk,
        "detectionAccuracy": 99.8
    })

# Logs
@app.route('/api/logs', methods=['GET'])
def get_logs():
    attack_type = request.args.get('attackType', 'all')
    severity = request.args.get('severity', 'all')
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    
    query = {}
    if attack_type != 'all':
        query['attackType'] = attack_type
    if severity != 'all':
        query['severity'] = severity
    
    filtered_logs = list(logs_col.find(query).sort('timestamp', -1).skip(offset).limit(limit))
    total = logs_col.count_documents(query)
    
    return jsonify({
        "logs": [clean_dict(l) for l in filtered_logs],
        "total": total,
        "limit": limit,
        "offset": offset
    })

@app.route('/api/logs/<log_id>', methods=['GET'])
def get_log(log_id):
    log = logs_col.find_one({"id": log_id})
    if not log:
        # Try finding by MongoDB _id just in case
        try:
            log = logs_col.find_one({"_id": ObjectId(log_id)})
        except:
            pass
            
    if not log:
        return jsonify({"error": "Log not found"}), 404
        
    return jsonify(clean_dict(log))

# Projects
@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = list(projects_col.find({}))
    return jsonify({
        "projects": [clean_dict(p) for p in projects],
        "total": len(projects)
    })

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.json
    count = projects_col.count_documents({})
    new_project = {
        "id": f"proj_{count + 1:03d}",
        "name": data.get('name', 'New Project'),
        "environment": data.get('environment', 'Development'),
        "uptime": 99.0,
        "totalRequests": 0,
        "blockedAttempts": 0,
        "securityScore": 95.0,
        "status": "Healthy",
        "createdAt": datetime.now().isoformat()
    }
    projects_col.insert_one(new_project)
    return jsonify(clean_dict(new_project)), 201

@app.route('/api/projects/<project_id>', methods=['PUT'])
def update_project(project_id):
    data = request.json
    # Filter out _id if it's in the data to avoid update errors
    if '_id' in data: del data['_id']
    
    result = projects_col.update_one({"id": project_id}, {"$set": data})
    if result.matched_count == 0:
        return jsonify({"error": "Project not found"}), 404
    
    updated_project = projects_col.find_one({"id": project_id})
    return jsonify(clean_dict(updated_project))

@app.route('/api/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    result = projects_col.delete_one({"id": project_id})
    if result.deleted_count > 0:
        return jsonify({"message": "Project deleted successfully"})
    return jsonify({"error": "Project not found"}), 404

# Policies
@app.route('/api/policies', methods=['GET'])
def get_policies():
    all_policies = list(policies_col.find({}))
    result = {}
    for p in all_policies:
        pid = p.get('policy_id', 'default')
        result[pid] = clean_dict(p)
    return jsonify(result)

@app.route('/api/policies/<policy_id>', methods=['PUT'])
def update_policy(policy_id):
    data = request.json
    if '_id' in data: del data['_id']
    
    policies_col.update_one(
        {"policy_id": policy_id},
        {"$set": data},
        upsert=True
    )
    updated = policies_col.find_one({"policy_id": policy_id})
    return jsonify({"message": "Policy updated", "policy": clean_dict(updated)})

# Prompt Analysis (Stateless logic but integrated)
@app.route('/api/analyze-prompt', methods=['POST'])
def analyze_prompt():
    data = request.json
    prompt = data.get('prompt', '').lower()
    
    risk_score = 0
    detected_threats = []
    
    # Check for forbidden phrases from policy
    policy = policies_col.find_one({"policy_id": "default"})
    patterns = policy.get('forbiddenPhrases', THREAT_PATTERNS) if policy else THREAT_PATTERNS
    
    for pattern in patterns:
        if pattern.lower() in prompt:
            risk_score += 35
            detected_threats.append(f"Contains forbidden phrase: '{pattern}'")
    
    if 'system' in prompt and 'prompt' in prompt:
        risk_score += 25
        detected_threats.append("Possible system prompt extraction attempt")
    
    if len(prompt) > 1000:
        risk_score += 10
        detected_threats.append("Unusually long prompt")
    
    risk_score = min(100, risk_score)
    action = "allowed"
    if risk_score >= 70: action = "blocked"
    elif risk_score >= 40: action = "flagged"
    
    return jsonify({
        "riskScore": risk_score,
        "action": action,
        "detectedThreats": detected_threats,
        "recommendation": "block" if action == "blocked" else "flag" if action == "flagged" else "allow",
        "timestamp": datetime.now().isoformat()
    })

# RAG Scanner
@app.route('/api/rag/scan', methods=['POST'])
def scan_document():
    data = request.json
    name = data.get('documentName', 'untitled.pdf')
    content = data.get('content', '')
    
    risk_score = random.randint(15, 75)
    issues = []
    
    if risk_score > 60: issues.append("High-risk injection pattern detected")
    if risk_score > 30: issues.append("Potential PII exposure")
    
    scan_result = {
        "scanId": f"scan_{random.randint(10000, 99999)}",
        "documentName": name,
        "riskScore": risk_score,
        "riskLevel": "high" if risk_score > 60 else "medium" if risk_score > 30 else "low",
        "issues": issues,
        "scanTime": datetime.now().isoformat()
    }
    
    scans_col.insert_one(scan_result)
    return jsonify(clean_dict(scan_result))

@app.route('/api/rag/scan-history', methods=['GET'])
def get_scan_history():
    limit = int(request.args.get('limit', 10))
    history = list(scans_col.find({}).sort('scanTime', -1).limit(limit))
    
    # If empty, generate some fake history in DB
    if not history:
        for i in range(5):
            scans_col.insert_one({
                "id": f"scan_{i:04d}",
                "documentName": f"financial_report_Q{random.randint(1,4)}_2025.pdf",
                "timestamp": (datetime.now() - timedelta(hours=i*2)).isoformat(),
                "riskScore": random.randint(5, 85),
                "issuesFound": random.randint(0, 8),
                "status": "completed",
                "scanTime": (datetime.now() - timedelta(hours=i*2)).isoformat()
            })
        history = list(scans_col.find({}).sort('scanTime', -1).limit(limit))
        
    return jsonify({"scans": [clean_dict(h) for h in history], "total": len(history)})

@app.route('/api/rag/vector-db-health', methods=['GET'])
def get_vector_db_health():
    return jsonify({
        "status": "healthy",
        "collections": 12,
        "totalVectors": 1248392,
        "queryLatency": 8.2,
        "uptime": 99.97,
        "lastIndexed": (datetime.now() - timedelta(minutes=15)).isoformat(),
        "diskUsage": 68.4,
        "memoryUsage": 42.1,
        "activeConnections": 24
    })

# Red Team
@app.route('/api/red-team/simulations', methods=['GET'])
def get_red_team_simulations():
    sims = list(simulations_col.find({}).sort('timestamp', -1))
    if not sims:
        simulations_col.insert_one({
            "id": "sim_001",
            "name": "Prompt Injection Test",
            "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
            "attacksRun": 247,
            "blocked": 234,
            "success": 13,
            "duration": 180,
            "status": "completed"
        })
        sims = list(simulations_col.find({}))
    return jsonify({"simulations": [clean_dict(s) for s in sims]})

@app.route('/api/red-team/execute', methods=['POST'])
def execute_red_team():
    data = request.json.get('config', {})
    intensity = data.get('intensity', 50)
    
    sim_id = f"sim_{random.randint(100000, 999999)}"
    simulation = {
        "id": sim_id,
        "name": f"Dynamic Test {sim_id[-4:]}",
        "timestamp": datetime.now().isoformat(),
        "attacksRun": int(intensity * 5),
        "blocked": int(intensity * 4.8),
        "success": int(intensity * 0.2),
        "duration": 300,
        "status": "completed"
    }
    simulations_col.insert_one(simulation)
    return jsonify(clean_dict(simulation))

@app.route('/api/red-team/attack-vectors', methods=['GET'])
def get_attack_vectors():
    return jsonify({
        "vectors": [
            {"id": "vec_001", "name": "Prompt Injection", "severity": "critical", "enabled": True, "tests": 247},
            {"id": "vec_002", "name": "Context Overflow", "severity": "high", "enabled": True, "tests": 156}
        ]
    })

# Chat Demo
@app.route('/api/chat/send', methods=['POST'])
def chat_send():
    data = request.json
    message = data.get('message', '')
    
    # Simple logic (can be expanded to log in DB)
    risk_score = 0
    if any(word in message.lower() for word in ['ignore', 'system', 'jailbreak']):
        risk_score = 45
        response = "[BLOCKED] Message blocked for security reasons."
        status = "blocked"
    else:
        response = f"Simulated response to: {message}"
        status = "secured"
        
    return jsonify({
        "messageId": f"msg_{random.randint(1000, 9999)}",
        "userMessage": message,
        "response": response,
        "status": status,
        "riskScore": risk_score,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/chat/defense-stream', methods=['GET'])
def get_defense_stream():
    return jsonify({
        "events": [
            {
                "timestamp": datetime.now().isoformat(),
                "type": "threat_blocked",
                "severity": "high",
                "message": "Blocked prompt injection attempt",
                "details": "Pattern match: 'ignore previous instructions'"
            }
        ]
    })

# Analytics
@app.route('/api/analytics/overview', methods=['GET'])
def get_analytics_overview():
    time_series = []
    for i in range(7, 0, -1):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        time_series.append({
            "date": date,
            "requests": random.randint(15000, 35000),
            "blocked": random.randint(400, 1200)
        })
    return jsonify({"timeSeries": time_series})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
