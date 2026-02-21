# Sentinel Shield - Enterprise LLM Security Middleware

**Sentinel Shield** is an enterprise-grade security middleware platform that sits between your applications and LLM providers, providing comprehensive threat detection, blocking, and monitoring capabilities.

## 🛡️ Features

- **Input Firewall** - Intercepts and neutralizes prompt injection attacks, jailbreak attempts, and malicious payloads
- **Output Guard** - Monitors and sanitizes model responses to prevent data leakage and policy violations
- **Red Team Simulation** - Continuously probes defenses with 1,200+ adversarial attack vectors
- **RAG Scanner** - Deep-scans RAG pipelines for data poisoning and unauthorized access patterns
- **Policy Engine** - Customizable security policies with sensitivity controls and compliance enforcement
- **Analytics & Reporting** - Real-time dashboards and automated compliance reports (SOC2, HIPAA, GDPR)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.8+ and pip
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Attack
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

### Running the Application

#### Option 1: Run Frontend and Backend Separately

**Terminal 1 - Start Backend Server:**
```bash
cd backend
python app.py
```
Backend will start on `http://localhost:5000`

**Terminal 2 - Start Frontend Dev Server:**
```bash
npm run dev
```
Frontend will start on `http://localhost:5173`

#### Option 2: Production Build

**Build Frontend:**
```bash
npm run build
```

**Preview Production Build:**
```bash
npm run preview
```

## 🏗️ Project Structure

```
Attack/
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask application with all API endpoints
│   └── requirements.txt    # Python dependencies
├── src/
│   ├── app/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── Layout.tsx  # Main authenticated layout
│   │   │   ├── Footer.tsx  # Footer component
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── contexts/       # React contexts
│   │   │   └── ThemeContext.tsx  # Dark/Light theme provider
│   │   ├── pages/          # Main application pages
│   │   │   ├── LandingPage.tsx   # Public landing page
│   │   │   ├── Login.tsx         # Authentication page
│   │   │   ├── Dashboard.tsx     # Security overview
│   │   │   ├── Projects.tsx      # Project management
│   │   │   ├── AttackLogs.tsx    # Security logs viewer
│   │   │   ├── PolicyConfig.tsx  # Security policy config
│   │   │   ├── RagScanner.tsx    # Document scanner
│   │   │   ├── RedTeam.tsx       # Adversarial testing
│   │   │   ├── ChatDemo.tsx      # Secured chat demo
│   │   │   └── Analytics.tsx     # Analytics & reports
│   │   ├── utils/          # Utility functions
│   │   │   ├── api.ts      # API client for backend
│   │   │   ├── mockData.ts # Mock data (for demo mode)
│   │   │   └── security.ts # Security utilities
│   │   ├── App.tsx         # Root component
│   │   └── routes.tsx      # React Router configuration
│   └── main.tsx            # Application entry point
├── .env                    # Environment configuration
├── package.json            # Frontend dependencies
├── vite.config.ts          # Vite configuration
└── README.md               # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Dashboard & Metrics
- `GET /api/metrics/dashboard` - Get security metrics overview
- `GET /api/health` - Health check

### Security Logs
- `GET /api/logs` - Get security logs (supports filtering)
- `GET /api/logs/:id` - Get specific log details

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `GET /api/projects/:id/metrics` - Get project metrics
- `GET /api/projects/:id/api-keys` - Get project API keys

### Policies
- `GET /api/policies` - Get all policies
- `GET /api/policies/:id` - Get specific policy
- `PUT /api/policies/:id` - Update policy

### Threat Analysis
- `POST /api/analyze-prompt` - Analyze prompt for threats

### RAG Scanner
- `POST /api/rag/scan` - Scan document for vulnerabilities
- `GET /api/rag/scan-history` - Get scan history
- `GET /api/rag/vector-db-health` - Get vector DB health metrics

### Red Team
- `GET /api/red-team/simulations` - Get simulation history
- `GET /api/red-team/attack-vectors` - Get attack vectors
- `POST /api/red-team/execute` - Execute red team simulation
- `POST /api/red-team/simulate` - Run quick simulation
- `GET /api/red-team/insights` - Get adversarial insights

### Chat Security
- `POST /api/chat/send` - Send chat message with security analysis
- `POST /api/chat/secure` - Secure chat message
- `GET /api/chat/defense-stream` - Get real-time defense events

### Analytics
- `GET /api/analytics/overview` - Get analytics overview
- `GET /api/analytics/compliance` - Get compliance status
- `GET /api/analytics/reports` - Get automated reports

### System
- `GET /api/system/status` - Get system status

## 🎨 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library (Radix UI + Tailwind)
- **Recharts** - Charting library
- **Lucide React** - Icon library

### Backend
- **Python Flask** - Web framework
- **Flask-CORS** - Cross-origin resource sharing

## 🌙 Theme Support

The application supports both **Light** and **Dark** modes:
- Toggle theme from the landing page navigation
- Theme persists across sessions via localStorage
- All pages (landing, login, dashboard, etc.) adapt to the selected theme

## 🔐 Security Features

1. **Input Firewall** - Blocks prompt injection, jailbreak attempts, malicious payloads
2. **Output Guard** - Sanitizes responses, prevents PII leakage
3. **Real-time Monitoring** - Live threat detection and blocking
4. **Policy Engine** - Granular security policies with custom rules
5. **Red Team Testing** - Automated adversarial testing
6. **Compliance** - SOC2, HIPAA, GDPR coverage

## 📊 Default Login

```
Email: admin@enterprise.com
Password: (any password)
```

## 🛠️ Development

**Start development server with hot reload:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

**Lint code:**
```bash
npm run lint
```

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_DEV_MODE=true
```

## 🤝 Contributing

This is an enterprise security platform. For security-related issues, please report privately.

## 📄 License

Proprietary - Sentinel Shield Enterprise License

## 🆘 Support

For support, documentation, or enterprise inquiries:
- Email: support@sentinelshield.com
- Documentation: https://docs.sentinelshield.com
- Status: https://status.sentinelshield.com

---

**Sentinel Shield © 2026** • Secured Architecture • SECURE_PROXY_AUTH_V2 / ENCRYPTION_AES_256
