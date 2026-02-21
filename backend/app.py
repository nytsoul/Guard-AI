"""
Sentinel Shield - Enterprise Security Middleware
Python Flask Backend for LLM security monitoring
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import random
import json
import re

app = Flask(__name__)
CORS(app)

# Mock data storage
security_logs = []
projects = []
policies = {}
scanned_documents = []
scan_history = []
red_team_simulations = []
analytics_data = {}
threat_patterns = [
    "system prompt", "ignore instructions", "DAN mode", 
    "disable safety", "jailbreak", "override rules"
]

# Initialize mock data
def init_mock_data():
    global projects, security_logs, policies
    
    projects = [
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
    ]
    
    policies = {
        "default": {
            "blockHighRisk": True,
            "blockMediumRisk": True,
            "enableOutputScanning": True,
            "sensitivity": 75,
            "forbiddenPhrases": threat_patterns
        }
    }
    
    security_logs = [
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
        for i in range(100)
    ]

# Initialize data
init_mock_data()

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "service": "Sentinel Shield",
        "version": "2.4.0",
        "timestamp": datetime.now().isoformat()
    })

# Authentication endpoints
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '')
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
    
    return jsonify({
        "token": f"token_{random.randint(100000, 999999)}",
        "user": {
            "id": "user_001",
            "email": email,
            "name": "Admin User",
            "role": "admin"
        },
        "expiresIn": 86400
    })

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    return jsonify({"message": "Logged out successfully"})

# Security metrics endpoints
@app.route('/api/metrics/dashboard', methods=['GET'])
def get_dashboard_metrics():
    total_logs = len(security_logs)
    blocked_count = len([l for l in security_logs if l['action'] == 'blocked'])
    avg_risk = sum([l['riskScore'] for l in security_logs]) // total_logs if total_logs > 0 else 0
    
    return jsonify({
        "totalLLMRequests": 1248392,
        "injectionAttempts": 42891,
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

# Security logs endpoints
@app.route('/api/logs', methods=['GET'])
def get_logs():
    """Get security logs with filtering"""
    attack_type = request.args.get('attackType', 'all')
    severity = request.args.get('severity', 'all')
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    
    filtered_logs = security_logs
    
    if attack_type != 'all':
        filtered_logs = [l for l in filtered_logs if l['attackType'] == attack_type]
    
    if severity != 'all':
        filtered_logs = [l for l in filtered_logs if l['severity'] == severity]
    
    paginated = filtered_logs[offset:offset + limit]
    
    return jsonify({
        "logs": paginated,
        "total": len(filtered_logs),
        "limit": limit,
        "offset": offset
    })

@app.route('/api/logs/<log_id>', methods=['GET'])
def get_log(log_id):
    """Get specific log details"""
    log = next((l for l in security_logs if l['id'] == log_id), None)
    if not log:
        return jsonify({"error": "Log not found"}), 404
    return jsonify(log)

# Projects endpoints
@app.route('/api/projects', methods=['GET'])
def get_projects():
    """Get all projects"""
    return jsonify({
        "projects": projects,
        "total": len(projects)
    })

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    """Get project details"""
    project = next((p for p in projects if p['id'] == project_id), None)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    return jsonify(project)

@app.route('/api/projects', methods=['POST'])
def create_project():
    """Create new project"""
    data = request.json
    new_project = {
        "id": f"proj_{len(projects) + 1:03d}",
        "name": data.get('name', 'New Project'),
        "environment": data.get('environment', 'Development'),
        "uptime":99.0,
        "totalRequests": 0,
        "blockedAttempts": 0,
        "securityScore": 95.0,
        "status": "Initializing"
    }
    projects.append(new_project)
    return jsonify(new_project), 201

# Policy endpoints
@app.route('/api/policies', methods=['GET'])
def get_policies():
    """Get security policies"""
    return jsonify(policies)

@app.route('/api/policies/<policy_id>', methods=['GET'])
def get_policy(policy_id):
    """Get specific policy"""
    policy = policies.get(policy_id)
    if not policy:
        return jsonify({"error": "Policy not found"}), 404
    return jsonify(policy)

@app.route('/api/policies/<policy_id>', methods=['PUT'])
def update_policy(policy_id):
    """Update policy"""
    data = request.json
    policies[policy_id] = data
    return jsonify({"message": "Policy updated", "policy": policies[policy_id]})

# Threat analysis endpoints
@app.route('/api/analyze-prompt', methods=['POST'])
def analyze_prompt():
    """Analyze user prompt for threats"""
    data = request.json
    prompt = data.get('prompt', '').lower()
    
    risk_score = 0
    detected_threats = []
    
    # Check for forbidden phrases
    for pattern in threat_patterns:
        if pattern.lower() in prompt:
            risk_score += 35
            detected_threats.append(f"Contains forbidden phrase: '{pattern}'")
    
    # Check for suspicious patterns
    if 'system' in prompt and 'prompt' in prompt:
        risk_score += 25
        detected_threats.append("Possible system prompt extraction attempt")
    
    if len(prompt) > 1000:
        risk_score += 10
        detected_threats.append("Unusually long prompt")
    
    risk_score = min(100, risk_score)
    
    # Determine action based on policy
    action = "allowed"
    if risk_score >= 70:
        action = "blocked"
    elif risk_score >= 40:
        action = "flagged"
    
    return jsonify({
        "riskScore": risk_score,
        "action": action,
        "detectedThreats": detected_threats,
        "recommendation": "block" if action == "blocked" else "flag" if action == "flagged" else "allow",
        "timestamp": datetime.now().isoformat()
    })

# RAG Scanner endpoints
@app.route('/api/scan-document', methods=['POST'])
def scan_document():
    """Scan document for vulnerabilities"""
    data = request.json
    content = data.get('content', '').lower()
    
    risk_score = 0
    issues = []
    suspicious_content = []
    
    # Check for injection patterns
    injection_patterns = ['system prompt', 'ignore', 'override', 'disable']
    for pattern in injection_patterns:
        if pattern in content:
            risk_score += 20
            issues.append(f"Potential injection vector: '{pattern}'")
            suspicious_content.append(f"Found pattern: {pattern}")
    
    # Check for PII
    import re
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
    phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
    
    if re.search(email_pattern, content):
        risk_score += 15
        issues.append("Personally Identifiable Information detected: Email addresses")
        suspicious_content.extend(re.findall(email_pattern, content)[:3])
    
    if re.search(ssn_pattern, content):
        risk_score += 30
        issues.append("Sensitive data detected: Social Security Number pattern")
    
    if re.search(phone_pattern, content):
        risk_score += 15
        issues.append("Personally Identifiable Information detected: Phone numbers")
    
    risk_score = min(100, risk_score)
    
    return jsonify({
        "risk": risk_score,
        "level": "high" if risk_score > 60 else "medium" if risk_score > 30 else "low",
        "issues": issues,
        "suspicious": suspicious_content[:5],
        "recommendation": "reject" if risk_score > 60 else "review" if risk_score > 30 else "approve",
        "scanTime": datetime.now().isoformat()
    })

# Red team simulation endpoints
@app.route('/api/red-team/simulate', methods=['POST'])
def red_team_simulate():
    """Run red team simulation"""
    data = request.json
    intensity = data.get('intensity', 50)
    duration = data.get('duration', 300)
    
    # Simulate attack results
    attacks_run = random.randint(int(intensity * 0.8), int(intensity * 1.2))
    attacks_blocked = random.randint(int(attacks_run * 0.85), attacks_run)
    
    return jsonify({
        "simulationId": f"sim_{random.randint(100000, 999999)}",
        "status": "completed",
        "startTime": (datetime.now() - timedelta(seconds=duration)).isoformat(),
        "endTime": datetime.now().isoformat(),
        "config": {
            "intensity": intensity,
            "duration": duration
        },
        "results": {
            "attacksGenerated": attacks_run,
            "attacksBlocked": attacks_blocked,
            "blockRate": round((attacks_blocked / attacks_run * 100), 1),
            "vulnerableEndpoints": random.randint(0, 3),
            "criticalFindings": random.randint(0, 2)
        },
        "recommendation": "System secured" if attacks_blocked / attacks_run > 0.9 else "Review configurations"
    })

# Chat security endpoints
@app.route('/api/chat/secure', methods=['POST'])
def chat_secure():
    """Secure chat message"""
    data = request.json
    message = data.get('message', '')
    
    # Analyze message for threats
    result = analyze_prompt_for_chat(message)
    
    return jsonify({
        "originalMessage": message,
        "isSecure": result['riskScore'] < 40,
        "riskScore": result['riskScore'],
        "threats": result['threats'],
        "sanitized": sanitize_message(message) if result['riskScore'] > 0 else message,
        "timestamp": datetime.now().isoformat()
    })

def analyze_prompt_for_chat(prompt):
    """Analyze prompt for chat security"""
    risk_score = 0
    threats = []
    
    prompt_lower = prompt.lower()
    
    # Check threat patterns
    if any(threat in prompt_lower for threat in ['system prompt', 'ignore', 'jailbreak']):
        risk_score += 40
        threats.append("Potential jailbreak attempt detected")
    
    if 'password' in prompt_lower or 'api key' in prompt_lower or 'secret' in prompt_lower:
        risk_score += 30
        threats.append("Request for sensitive information detected")
    
    return {"riskScore": min(100, risk_score), "threats": threats}

def sanitize_message(message):
    """Sanitize message content"""
    words_to_remove = ['password', 'api_key', 'secret', 'token']
    sanitized = message
    for word in words_to_remove:
        sanitized = sanitized.replace(word, '[REDACTED]')
    return sanitized

# Analytics endpoints
@app.route('/api/analytics/overview', methods=['GET'])
def get_analytics_overview():
    """Get analytics overview data"""
    time_range = request.args.get('range', '7d')
    
    # Generate time-series data
    days = 7 if time_range == '7d' else 30 if time_range == '30d' else 90
    time_series = []
    
    for i in range(days, 0, -1):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        time_series.append({
            "date": date,
            "requests": random.randint(15000, 35000),
            "blocked": random.randint(400, 1200),
            "flagged": random.randint(200, 600)
        })
    
    return jsonify({
        "timeSeries": time_series,
        "totalRequests": sum(d['requests'] for d in time_series),
        "totalBlocked": sum(d['blocked'] for d in time_series),
        "totalFlagged": sum(d['flagged'] for d in time_series),
        "attackDistribution": {
            "promptInjection": 42,
            "piiLeakage": 28,
            "jailbreak": 18,
            "other": 12
        }
    })

@app.route('/api/analytics/compliance', methods=['GET'])
def get_compliance_status():
    """Get compliance status"""
    return jsonify({
        "frameworks": [
            {"name": "SOC2 Type II", "status": "compliant", "lastAudit": "2025-12-15", "score": 98},
            {"name": "HIPAA", "status": "compliant", "lastAudit": "2025-11-20", "score": 96},
            {"name": "GDPR", "status": "compliant", "lastAudit": "2026-01-10", "score": 99},
            {"name": "ISO 27001", "status": "in-progress", "lastAudit": "2025-10-05", "score": 94}
        ]
    })

@app.route('/api/analytics/reports', methods=['GET'])
def get_reports():
    """Get automated reports"""
    return jsonify({
        "reports": [
            {
                "id": "rpt_001",
                "type": "Security Audit",
                "frequency": "Weekly",
                "nextDelivery": (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d'),
                "recipients": 4,
                "status": "active"
            },
            {
                "id": "rpt_002",
                "type": "Compliance Report",
                "frequency": "Monthly",
                "nextDelivery": (datetime.now() + timedelta(days=15)).strftime('%Y-%m-%d'),
                "recipients": 2,
                "status": "active"
            },
            {
                "id": "rpt_003",
                "type": "Threat Intelligence",
                "frequency": "Daily",
                "nextDelivery": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
                "recipients": 8,
                "status": "active"
            }
        ]
    })

# RAG Scanner endpoints (enhanced)
@app.route('/api/rag/scan-history', methods=['GET'])
def get_scan_history():
    """Get RAG scan history"""
    limit = int(request.args.get('limit', 10))
    
    history = []
    for i in range(limit):
        hours_ago = i * 2
        history.append({
            "id": f"scan_{i:04d}",
            "documentName": f"financial_report_Q{random.randint(1,4)}_2025.pdf",
            "timestamp": (datetime.now() - timedelta(hours=hours_ago)).isoformat(),
            "riskScore": random.randint(5, 85),
            "issuesFound": random.randint(0, 8),
            "status": "completed"
        })
    
    return jsonify({"scans": history, "total": limit})

@app.route('/api/rag/vector-db-health', methods=['GET'])
def get_vector_db_health():
    """Get vector database health metrics"""
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

@app.route('/api/rag/scan', methods=['POST'])
def scan_document_enhanced():
    """Enhanced document scan endpoint"""
    data = request.json
    document_name = data.get('documentName', 'untitled.pdf')
    content = data.get('content', '')
    
    # Perform comprehensive scan
    risk_score = random.randint(15, 75)
    issues = []
    threats = []
    
    if risk_score > 60:
        issues.append("High-risk injection pattern detected")
        threats.append({"type": "prompt_injection", "severity": "high", "line": 42})
    
    if risk_score > 40:
        issues.append("Potential PII exposure")
        threats.append({"type": "pii_leakage", "severity": "medium", "line": 128})
    
    if risk_score > 30:
        issues.append("Suspicious keyword patterns")
        threats.append({"type": "keyword_anomaly", "severity": "low", "line": 89})
    
    scan_result = {
        "scanId": f"scan_{random.randint(10000, 99999)}",
        "documentName": document_name,
        "riskScore": risk_score,
        "riskLevel": "high" if risk_score > 60 else "medium" if risk_score > 30 else "low",
        "issuesFound": len(issues),
        "issues": issues,
        "threats": threats,
        "scanTime": datetime.now().isoformat(),
        "recommendation": "Reject and review" if risk_score > 60 else "Flag for review" if risk_score > 30 else "Approve",
        "processingTime": round(random.uniform(0.8, 2.5), 2)
    }
    
    return jsonify(scan_result)

# Red Team endpoints (enhanced)
@app.route('/api/red-team/simulations', methods=['GET'])
def get_red_team_simulations():
    """Get red team simulation history"""
    return jsonify({
        "simulations": [
            {
                "id": "sim_001",
                "name": "Prompt Injection Test",
                "timestamp": (datetime.now() - timedelta(hours=2)).isoformat(),
                "attacksRun": 247,
                "blocked": 234,
                "success": 13,
                "duration": 180,
                "status": "completed"
            },
            {
                "id": "sim_002",
                "name": "Jailbreak Attempts",
                "timestamp": (datetime.now() - timedelta(days=1)).isoformat(),
                "attacksRun": 892,
                "blocked": 881,
                "success": 11,
                "duration": 420,
                "status": "completed"
            },
            {
                "id": "sim_003",
                "name": "Full Security Audit",
                "timestamp": (datetime.now() - timedelta(days=3)).isoformat(),
                "attacksRun": 1247,
                "blocked": 1228,
                "success": 19,
                "duration": 600,
                "status": "completed"
            }
        ]
    })

@app.route('/api/red-team/attack-vectors', methods=['GET'])
def get_attack_vectors():
    """Get available attack vectors"""
    return jsonify({
        "vectors": [
            {"id": "vec_001", "name": "Prompt Injection", "severity": "critical", "enabled": True, "tests": 247},
            {"id": "vec_002", "name": "Context Overflow", "severity": "high", "enabled": True, "tests": 156},
            {"id": "vec_003", "name": "Role Manipulation", "severity": "high", "enabled": True, "tests": 189},
            {"id": "vec_004", "name": "System Prompt Extraction", "severity": "critical", "enabled": True, "tests": 134},
            {"id": "vec_005", "name": "Token Smuggling", "severity": "medium", "enabled": True, "tests": 98},
            {"id": "vec_006", "name": "Unicode Attacks", "severity": "medium", "enabled": False, "tests": 76}
        ]
    })

@app.route('/api/red-team/execute', methods=['POST'])
def execute_red_team():
    """Execute red team simulation"""
    data = request.json
    config = data.get('config', {})
    
    intensity = config.get('intensity', 50)
    vectors = config.get('vectors', [])
    duration = config.get('duration', 300)
    
    # Simulate execution timeline
    timeline = []
    attacks_run = 0
    blocked = 0
    
    for i in range(5):
        attacks_in_phase = random.randint(20, 80)
        blocked_in_phase = int(attacks_in_phase * random.uniform(0.85, 0.98))
        attacks_run += attacks_in_phase
        blocked += blocked_in_phase
        
        timeline.append({
            "phase": i + 1,
            "timestamp": (datetime.now() + timedelta(seconds=i * 60)).isoformat(),
            "attacks": attacks_in_phase,
            "blocked": blocked_in_phase,
            "success": attacks_in_phase - blocked_in_phase,
            "status": "running" if i < 4 else "completed"
        })
    
    return jsonify({
        "simulationId": f"sim_{random.randint(100000, 999999)}",
        "status": "running",
        "startTime": datetime.now().isoformat(),
        "estimatedDuration": duration,
        "timeline": timeline,
        "config": config,
        "summary": {
            "totalAttacks": attacks_run,
            "blockedAttacks": blocked,
            "successfulAttacks": attacks_run - blocked,
            "blockRate": round((blocked / attacks_run * 100), 1)
        }
    })

@app.route('/api/red-team/insights', methods=['GET'])
def get_red_team_insights():
    """Get adversarial insights"""
    return jsonify({
        "insights": [
            {
                "type": "vulnerability",
                "severity": "medium",
                "title": "Potential role manipulation weakness",
                "description": "System may be vulnerable to role-based prompt injection when handling multi-turn conversations.",
                "recommendation": "Implement stricter role validation in conversation history.",
                "affectedEndpoints": ["/api/chat", "/api/completion"]
            },
            {
                "type": "strength",
                "severity": "low",
                "title": "Strong jailbreak resistance",
                "description": "System shows excellent resistance to common jailbreak patterns with 98.7% block rate.",
                "recommendation": "Continue monitoring emerging jailbreak techniques.",
                "affectedEndpoints": []
            },
            {
                "type": "recommendation",
                "severity": "low",
                "title": "Update detection patterns",
                "description": "New attack vectors detected from latest OWASP Top 10 for LLMs.",
                "recommendation": "Schedule policy update to include new threat patterns.",
                "affectedEndpoints": ["all"]
            }
        ]
    })

# Chat Demo endpoints (enhanced)
@app.route('/api/chat/send', methods=['POST'])
def chat_send():
    """Send chat message with security analysis"""
    data = request.json
    message = data.get('message', '')
    
    # Analyze message
    risk_score = 0
    threats = []
    action = "allowed"
    
    message_lower = message.lower()
    
    # Threat detection
    if any(word in message_lower for word in ['ignore', 'system', 'jailbreak', 'dan']):
        risk_score += 45
        threats.append("Potential jailbreak attempt")
        action = "blocked"
    
    if any(word in message_lower for word in ['password', 'secret', 'api key']):
        risk_score += 30
        threats.append("Request for sensitive information")
        if action != "blocked":
            action = "flagged"
    
    if len(message) > 500:
        risk_score += 10
        threats.append("Unusually long input")
    
    # Generate response based on action
    if action == "blocked":
        response = "[BLOCKED] This message was blocked by Sentinel Shield for security reasons."
        status = "blocked"
    elif action == "flagged":
        response = "I understand your question, but I need to be careful about sharing sensitive information. How can I help you differently?"
        status = "flagged"
    else:
        response = f"This is a demo response to your message. In production, this would be processed by your LLM. Your message was analyzed and deemed safe (Risk: {risk_score}%)."
        status = "secured"
    
    return jsonify({
        "messageId": f"msg_{random.randint(100000, 999999)}",
        "userMessage": message,
        "response": response,
        "status": status,
        "riskScore": min(100, risk_score),
        "threats": threats,
        "timestamp": datetime.now().isoformat(),
        "processingTime": round(random.uniform(0.1, 0.8), 2),
        "layers": {
            "inputFirewall": "passed" if risk_score < 40 else "blocked",
            "contextAnalysis": "passed" if risk_score < 60 else "flagged",
            "outputGuard": "passed" if risk_score < 70 else "sanitized"
        }
    })

@app.route('/api/chat/defense-stream', methods=['GET'])
def get_defense_stream():
    """Get real-time defense stream events"""
    return jsonify({
        "events": [
            {
                "timestamp": (datetime.now() - timedelta(seconds=2)).isoformat(),
                "type": "threat_blocked",
                "severity": "high",
                "message": "Blocked prompt injection attempt in user input",
                "details": "Pattern match: 'ignore previous instructions'"
            },
            {
                "timestamp": (datetime.now() - timedelta(seconds=5)).isoformat(),
                "type": "pii_detected",
                "severity": "medium",
                "message": "PII detected and sanitized in output",
                "details": "Redacted 1 email address"
            },
            {
                "timestamp": (datetime.now() - timedelta(seconds=8)).isoformat(),
                "type": "policy_applied",
                "severity": "low",
                "message": "Security policy 'enterprise-strict' applied",
                "details": "0 violations detected"
            },
            {
                "timestamp": (datetime.now() - timedelta(seconds=12)).isoformat(),
                "type": "request_analyzed",
                "severity": "low",
                "message": "Request analyzed and approved",
                "details": "Risk score: 12/100"
            }
        ]
    })

# Project management endpoints (enhanced)
@app.route('/api/projects/<project_id>/metrics', methods=['GET'])
def get_project_metrics(project_id):
    """Get detailed project metrics"""
    days = int(request.args.get('days', 7))
    
    metrics = []
    for i in range(days, 0, -1):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        metrics.append({
            "date": date,
            "requests": random.randint(5000, 15000),
            "blocked": random.randint(50, 200),
            "avgLatency": round(random.uniform(8.0, 15.0), 1),
            "uptime": round(random.uniform(98.0, 100.0), 2)
        })
    
    return jsonify({"metrics": metrics})

@app.route('/api/projects/<project_id>/api-keys', methods=['GET'])
def get_project_api_keys(project_id):
    """Get project API keys"""
    return jsonify({
        "keys": [
            {
                "id": "key_001",
                "name": "Production Key",
                "key": "sk_live_" + "x" * 32,
                "created": "2025-11-15",
                "lastUsed": (datetime.now() - timedelta(hours=2)).isoformat(),
                "status": "active"
            },
            {
                "id": "key_002",
                "name": "Development Key",
                "key": "sk_test_" + "x" * 32,
                "created": "2025-10-20",
                "lastUsed": (datetime.now() - timedelta(days=1)).isoformat(),
                "status": "active"
            }
        ]
    })

# System status endpoints
@app.route('/api/system/status', methods=['GET'])
def get_system_status():
    """Get system status"""
    return jsonify({
        "status": "operational",
        "services": {
            "api": "operational",
            "database": "operational",
            "mlEngine": "operational",
            "vectorDb": "operational",
            "monitoring": "operational"
        },
        "uptime": 99.97,
        "lastIncident": "2025-12-03",
        "version": "2.4.0"
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("🛡️  Sentinel Shield Server Starting...")
    print("📊 API available at http://localhost:5000")
    print("📚 API Documentation: http://localhost:5000/docs")
    app.run(debug=True, host='0.0.0.0', port=5000)
