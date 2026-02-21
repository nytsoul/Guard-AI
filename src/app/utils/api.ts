/**
 * API Client for Sentinel Shield Backend
 * Handles all HTTP requests to the Flask backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

/**
 * Make API request
 */
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

  if (options.body) {
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
    console.error('API Request Error:', error);
    throw error;
  }
}

// Authentication APIs
export const auth = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  
  logout: () =>
    apiRequest('/auth/logout', { method: 'POST' }),
};

// Dashboard APIs
export const dashboard = {
  getMetrics: () => apiRequest('/metrics/dashboard'),
};

// Logs APIs
export const logs = {
  getAll: (params?: { attackType?: string; severity?: string; limit?: number; offset?: number }) =>
    apiRequest(`/logs?${new URLSearchParams(params as any).toString()}`),
  
  getById: (logId: string) => apiRequest(`/logs/${logId}`),
};

// Projects APIs
export const projects = {
  getAll: () => apiRequest('/projects'),
  
  getById: (projectId: string) => apiRequest(`/projects/${projectId}`),
  
  create: (data: any) =>
    apiRequest('/projects', {
      method: 'POST',
      body: data,
    }),
  
  getMetrics: (projectId: string, days: number = 7) =>
    apiRequest(`/projects/${projectId}/metrics?days=${days}`),
  
  getApiKeys: (projectId: string) =>
    apiRequest(`/projects/${projectId}/api-keys`),
};

// Policies APIs
export const policies = {
  getAll: () => apiRequest('/policies'),
  
  getById: (policyId: string) => apiRequest(`/policies/${policyId}`),
  
  update: (policyId: string, data: any) =>
    apiRequest(`/policies/${policyId}`, {
      method: 'PUT',
      body: data,
    }),
};

// Threat Analysis APIs
export const analysis = {
  analyzePrompt: (prompt: string) =>
    apiRequest('/analyze-prompt', {
      method: 'POST',
      body: { prompt },
    }),
};

// RAG Scanner APIs
export const ragScanner = {
  scanDocument: (documentName: string, content: string) =>
    apiRequest('/rag/scan', {
      method: 'POST',
      body: { documentName, content },
    }),
  
  getScanHistory: (limit: number = 10) =>
    apiRequest(`/rag/scan-history?limit=${limit}`),
  
  getVectorDbHealth: () => apiRequest('/rag/vector-db-health'),
};

// Red Team APIs
export const redTeam = {
  getSimulations: () => apiRequest('/red-team/simulations'),
  
  getAttackVectors: () => apiRequest('/red-team/attack-vectors'),
  
  execute: (config: any) =>
    apiRequest('/red-team/execute', {
      method: 'POST',
      body: { config },
    }),
  
  simulate: (intensity: number, duration: number) =>
    apiRequest('/red-team/simulate', {
      method: 'POST',
      body: { intensity, duration },
    }),
  
  getInsights: () => apiRequest('/red-team/insights'),
};

// Chat APIs
export const chat = {
  sendMessage: (message: string) =>
    apiRequest('/chat/send', {
      method: 'POST',
      body: { message },
    }),
  
  secureMessage: (message: string) =>
    apiRequest('/chat/secure', {
      method: 'POST',
      body: { message },
    }),
  
  getDefenseStream: () => apiRequest('/chat/defense-stream'),
};

// Analytics APIs
export const analytics = {
  getOverview: (range: string = '7d') =>
    apiRequest(`/analytics/overview?range=${range}`),
  
  getCompliance: () => apiRequest('/analytics/compliance'),
  
  getReports: () => apiRequest('/analytics/reports'),
};

// System APIs
export const system = {
  getStatus: () => apiRequest('/system/status'),
  
  health: () => apiRequest('/health'),
};

// Export all APIs
export const api = {
  auth,
  dashboard,
  logs,
  projects,
  policies,
  analysis,
  ragScanner,
  redTeam,
  chat,
  analytics,
  system,
};

export default api;
