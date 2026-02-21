import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Shield, AlertTriangle, CheckCircle2, Activity, TrendingUp, TrendingDown, Eye, Eye2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { mockAttackLogs } from '../utils/mockData';

export function Dashboard() {
  const securityMetrics = {
    totalLLMRequests: 1248392,
    injectionAttempts: 42891,
    blockedRequests: 41202,
    globalSecurityScore: 98.4
  };

  // Time series data
  const timeSeriesData = [
    { time: '00:00', requests: 231, blocked: 8 },
    { time: '04:00', requests: 156, blocked: 3 },
    { time: '08:00', requests: 432, blocked: 24 },
    { time: '12:00', requests: 678, blocked: 45 },
    { time: '16:00', requests: 523, blocked: 31 },
    { time: '20:00', requests: 412, blocked: 18 }
  ];

  // Threat vector distribution
  const threatVectorData = [
    { name: 'Prompt Injection', value: 45, color: '#ef4444' },
    { name: 'PII Leakage', value: 28, color: '#f59e0b' },
    { name: 'Jailbreak', value: 18, color: '#8b5cf6' },
    { name: 'Tool Misuse', value: 9, color: '#06b6d4' }
  ];

  // Recent security alerts
  const recentAlerts = [
    {
      id: 1,
      timestamp: '2 mins ago',
      endpoint: 'prod-llm-04',
      threatType: 'Prompt Injection',
      riskScore: 86,
      severity: 'CRITICAL',
      action: 'Blocked'
    },
    {
      id: 2,
      timestamp: '14 mins ago',
      endpoint: 'chat-bot-service',
      threatType: 'Jailbreak Attempt',
      riskScore: 82,
      severity: 'HIGH',
      action: 'Blocked'
    },
    {
      id: 3,
      timestamp: '1 hour ago',
      endpoint: 'rag-pipeline-v2',
      threatType: 'PII Exposure',
      riskScore: 64,
      severity: 'MEDIUM',
      action: 'Flagged'
    },
    {
      id: 4,
      timestamp: '3 hours ago',
      endpoint: 'customer-qa-api',
      threatType: 'Prompt Injection',
      riskScore: 45,
      severity: 'LOW',
      action: 'Allowed'
    }
  ];

  // Active projects
  const activeProjects = [
    { id: 1, name: 'Customer Support Bot', status: '98.9%', uptime: 'uptime' },
    { id: 2, name: 'RAGI Internal Search', status: '92.2%', uptime: 'uptime' },
    { id: 3, name: 'API Gateway v4', status: '94.8%', uptime: 'uptime' }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Posture</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time monitoring of LLM gateway traffic and middleware policy enforcement across active production environments.
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700">
            🔍 Scan Documents
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            🚩 Run Red Team Test
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total LLM Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">1,248,392</span>
              <Activity className="size-5 text-blue-500" />
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12.5% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 dark:from-red-950/20 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Injection Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">42,891</span>
              <AlertTriangle className="size-5 text-red-500" />
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">-4.2% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 dark:from-emerald-950/20 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Blocked Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">41,202</span>
              <CheckCircle2 className="size-5 text-emerald-500" />
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">+8.8% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Global Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">98.4</span>
              <TrendingUp className="size-5 text-purple-500" />
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">+0.3% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Request & Threat Trends</CardTitle>
            <CardDescription>Historical volume of safe vs. blocked requests</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" dark-stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend />
                <Area type="monotone" dataKey="requests" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRequests)" name="Allowed Requests" />
                <Area type="monotone" dataKey="blocked" stackId="2" stroke="#ef4444" fillOpacity={1} fill="url(#colorBlocked)" name="Blocked" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Threat Vector Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Threat Vector Distribution</CardTitle>
            <CardDescription>Breakdown of attack attempts</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={threatVectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {threatVectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-sm">
              {threatVectorData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                  <span className="ml-auto font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Security Alerts</CardTitle>
              <CardDescription>Last 5 critical interventions by the Sentinel Shield proxy</CardDescription>
            </div>
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700">View Logs &gt;</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Timestamp</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Endpoint</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Threat Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Risk Score</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Severity</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Action Taken</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((alert) => (
                  <tr key={alert.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{alert.timestamp}</td>
                    <td className="py-3 px-4 font-medium">{alert.endpoint}</td>
                    <td className="py-3 px-4">{alert.threatType}</td>
                    <td className="py-3 px-4">
                      <div className="w-12 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${alert.riskScore > 80 ? 'bg-red-500' : alert.riskScore > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${alert.riskScore}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        alert.severity === 'CRITICAL' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400' :
                        alert.severity === 'HIGH' ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400' :
                        alert.severity === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400' :
                        'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        alert.action === 'Blocked' ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400' :
                        alert.action === 'Flagged' ? 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400' :
                        'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400'
                      }`}>
                        {alert.action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Projects</CardTitle>
            <CardDescription>Managed enterprise environments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div>
                    <p className="font-medium text-sm">{project.name}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{project.status} uptime</p>
                  </div>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{project.status}</span>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4 border-dashed">
              + New Project
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compliance Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/50 mb-4">
                <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your current security configuration meets SOC2 Type II and HIPAA requirements for LLM proxy layers.</p>
              <Button variant="link" className="text-blue-600 hover:text-blue-700">
                Export Compliance Report &gt;
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Diagnostics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 text-slate-500 dark:text-slate-400">
              <AlertTriangle className="size-8 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
              <p className="text-xs">
                No critical high-severity issues detected in the proxy chain. Last health check passed at 03:32 AM.
              </p>
              <Button variant="link" className="text-blue-600 hover:text-blue-700 text-xs mt-3">
                Download Security Audit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
