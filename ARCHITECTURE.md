# Sentinel - Enterprise AI Security Firewall

## Architecture Overview

```
Client Application
      ↓
Sentinel Firewall API (Middleware)
      ↓
LLM Provider (OpenAI / Gemini)
```

## Security Pipeline

```
Incoming Request
      ↓
[1] Prompt Injection Detector
      ↓
[2] RAG Content Validator (if used)
      ↓
→ Call LLM
      ↓
[3] Output Risk Analyzer
      ↓
[4] Tool Guard (if tool call)
      ↓
Response Returned or Blocked
      ↓
Log + Metrics Stored
```

## Risk Levels

- **Low (< 0.4)** → Allow
- **Medium (0.4 - 0.7)** → Warn + Log
- **High (≥ 0.7)** → Block

## Pages

1. **Login** - Authentication and organization setup
2. **Dashboard** - Real-time metrics, charts, and security score
3. **Projects** - Manage AI applications and API keys
4. **Attack Logs** - Comprehensive audit trail with filtering
5. **Policy Configuration** - Customize security rules and sensitivity
6. **RAG Scanner** - Document security scanning before indexing
7. **Red Team** - Automated adversarial testing
8. **Chat Demo** - Live demonstration of firewall in action

## Security Modules

### 1. Prompt Guardian Agent
- Detects prompt injection patterns
- Identifies jailbreak attempts
- Blocks malicious instructions

### 2. RAG Scanner Agent
- Scans documents for threats
- Detects PII and sensitive data
- Prevents data poisoning

### 3. Output Validator Agent
- Analyzes LLM responses
- Prevents data leakage
- Ensures policy compliance

### 4. Red Team Generator Agent
- Generates adversarial test cases
- Validates security posture
- Produces detailed reports

## Attack Vectors Detected

- **Prompt Injection** - System instruction override attempts
- **Jailbreak** - Safety restriction bypasses
- **Data Extraction** - Training data or user data extraction
- **PII Leakage** - Personally identifiable information
- **Malicious Code** - Code injection attempts

## Technology Stack

- **Frontend**: React + TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4 + Radix UI
- **Charts**: Recharts
- **Icons**: Lucide React
- **Theming**: Custom light/dark mode system

## Integration Example

```typescript
import { SentinelClient } from '@sentinel/security-sdk';

const sentinel = new SentinelClient({
  apiKey: 'YOUR_API_KEY'
});

// Analyze prompt before sending to LLM
const analysis = await sentinel.analyzePrompt(userInput);

if (analysis.blocked) {
  return { error: 'Request blocked by security policy' };
}

// Proceed with LLM call
const response = await openai.chat.completions.create({
  messages: [{ role: 'user', content: userInput }]
});

// Scan output (optional)
const outputAnalysis = await sentinel.analyzeOutput(response.content);
```

## Features Implemented

✅ Multi-page enterprise dashboard
✅ Real-time security metrics and charts
✅ Attack log filtering and export
✅ Configurable security policies
✅ Document scanning for RAG
✅ Automated red team testing
✅ Live chat demo with security analysis
✅ Light/Dark mode theming
✅ Responsive design
✅ Mock security detection logic
✅ Risk scoring algorithm
✅ Enterprise-grade UI/UX

## Design Philosophy

- **Minimal & Clean** - No clutter, focused on security insights
- **Dashboard-First** - Key metrics visible immediately
- **Configuration-Driven** - Flexible policy management
- **Audit-Ready** - Comprehensive logging and reporting
- **Enterprise-Grade** - Professional, scalable architecture
