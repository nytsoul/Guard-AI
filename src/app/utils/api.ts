/**
 * Sentinel Shield – API Client v3.0
 * Covers: Auth | Logs | Projects | Policies | Analysis | RAG | Red Team | Chat | Analytics
 * New: Policy Test | Audit Log | Adversarial Generation | Explainability
 */


// ensure trailing `/api` segment if omitted
function normalizeBase(url: string) {
  if (!url) return url;
  // strip trailing slash(es)
  let u = url.replace(/\/+$/g, "");
  if (!u.endsWith("/api")) {
    u = u + "/api";
  }
  return u;
}

const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE_URL = normalizeBase(rawBase);

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const config: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };
  if (options.body !== undefined) {
    config.body = JSON.stringify(options.body);
  }
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `Request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ── Auth ──────────────────────────────────────
export const auth = {
  login:  (email: string, password: string) =>
    apiRequest('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  signup: (data: { name: string; email: string; password: string }) =>
    apiRequest('/auth/signup', { method: 'POST', body: data }),
  googleLogin: (accessToken: string) =>
    apiRequest('/auth/google', { method: 'POST', body: { access_token: accessToken } }),
};

// ── Dashboard ─────────────────────────────────
export const dashboard = {
  getMetrics: () => apiRequest('/metrics/dashboard'),
};

// ── Logs ──────────────────────────────────────
export const logs = {
  getAll: (params?: { attackType?: string; severity?: string; limit?: number; offset?: number }) =>
    apiRequest(`/logs?${new URLSearchParams(params as any).toString()}`),
  getById: (logId: string) => apiRequest(`/logs/${logId}`),
  exportUrl: (params?: Record<string, string>) =>
    `${API_BASE_URL}/logs/export?${new URLSearchParams(params).toString()}`,
};

// ── Projects ──────────────────────────────────
export const projects = {
  getAll: () => apiRequest('/projects'),
  getById: (id: string) => apiRequest(`/projects/${id}`),
  create: (data: any) => apiRequest('/projects', { method: 'POST', body: data }),
  update: (id: string, data: any) => apiRequest(`/projects/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiRequest(`/projects/${id}`, { method: 'DELETE' }),
  getMetrics: (id: string, days = 7) => apiRequest(`/projects/${id}/metrics?days=${days}`),
  getApiKeys: (id: string) => apiRequest(`/projects/${id}/api-keys`),
};

// ── Policies ──────────────────────────────────
export const policies = {
  getAll: () => apiRequest('/policies'),
  getById: (policyId: string) => apiRequest(`/policies/${policyId}`),
  update: (policyId: string, data: any) =>
    apiRequest(`/policies/${policyId}`, { method: 'PUT', body: data }),
  /** Test a prompt against a policy without saving a log */
  testPrompt: (policyId: string, prompt: string, team?: string) =>
    apiRequest(`/policies/${policyId}/test`, { method: 'POST', body: { prompt, team } }),
  /** Get policy change audit log */
  getAuditLog: (limit = 20, offset = 0) =>
    apiRequest(`/policies/audit-log?limit=${limit}&offset=${offset}`),
};

// ── Prompt Analysis (policy-aware, logs saved) ─
export const analysis = {
  analyzePrompt: (prompt: string, team?: string) =>
    apiRequest('/analyze-prompt', { method: 'POST', body: { prompt, team } }),
  /** Full explainability for a prompt (no log written) */
  explainPrompt: (prompt: string, team?: string) =>
    apiRequest('/explain-prompt', { method: 'POST', body: { prompt, team } }),
  /** Explain an existing log entry by ID */
  explainLog: (logId: string) => apiRequest(`/explain/${logId}`),
};

// ── RAG Scanner ───────────────────────────────
export const ragScanner = {
  scanDocument: (documentName: string, content: string) =>
    apiRequest('/rag/scan', { method: 'POST', body: { documentName, content } }),
  getScanHistory: (limit = 10) => apiRequest(`/rag/scan-history?limit=${limit}`),
  getVectorDbHealth: () => apiRequest('/rag/vector-db-health'),
};

// ── Red Team ──────────────────────────────────
export const redTeam = {
  getSimulations: () => apiRequest('/red-team/simulations'),
  getAttackVectors: () => apiRequest('/red-team/attack-vectors'),
  execute: (config: any) =>
    apiRequest('/red-team/execute', { method: 'POST', body: { config } }),
  getInsights: () => apiRequest('/red-team/insights'),
  /** Generate adversarial attacks and score them through the firewall */
  generate: (config: { count: number; categories: string[]; team?: string }) =>
    apiRequest('/red-team/generate', { method: 'POST', body: config }),
  /** List past adversarial runs */
  getRuns: (limit = 10) => apiRequest(`/red-team/runs?limit=${limit}`),
  /** Get a specific adversarial run with full attack details */
  getRun: (runId: string) => apiRequest(`/red-team/runs/${runId}`),
};

// ── Chat ──────────────────────────────────────
export const chat = {
  sendMessage: (message: string, team?: string) =>
    apiRequest('/chat/send', { method: 'POST', body: { message, team } }),
  getDefenseStream: () => apiRequest('/chat/defense-stream'),
};

// ── Analytics ─────────────────────────────────
export const analytics = {
  getOverview: (range = '7d') => apiRequest(`/analytics/overview?range=${range}`),
  getCompliance: () => apiRequest('/analytics/compliance'),
  getReports: () => apiRequest('/analytics/reports'),
};

// ── System ────────────────────────────────────
export const system = {
  getStatus: () => apiRequest('/system/status'),
  health: () => apiRequest('/health'),
};

// ── Default export ────────────────────────────
const api = { auth, dashboard, logs, projects, policies, analysis, ragScanner, redTeam, chat, analytics, system };
export default api;
