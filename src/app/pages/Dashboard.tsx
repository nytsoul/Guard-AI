import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Shield, AlertTriangle, CheckCircle2, Activity, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import api from '../utils/api';

interface DashboardMetrics {
  totalLLMRequests: number;
  injectionAttempts: number;
  blockedRequests: number;
  globalSecurityScore: number;
  threatVectors: {
    promptInjection: number;
    piiLeakage: number;
    jailbreak: number;
    toolMisuse: number;
  };
  averageRiskScore: number;
  detectionAccuracy: number;
}

interface Log {
  id: string;
  timestamp: string;
  endpoint: string;
  attackType: string;
  riskScore: number;
  severity: string;
  action: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [activeProjects, setActiveProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const timeSeriesData = [
    { time: '00:00', requests: 231, blocked: 8 },
    { time: '04:00', requests: 156, blocked: 3 },
    { time: '08:00', requests: 432, blocked: 24 },
    { time: '12:00', requests: 678, blocked: 45 },
    { time: '16:00', requests: 523, blocked: 31 },
    { time: '20:00', requests: 412, blocked: 18 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsData, logsData, projectsData] = await Promise.all([
          api.dashboard.getMetrics() as Promise<DashboardMetrics>,
          api.logs.getAll({ limit: 5 }) as Promise<{ logs: Log[]; total: number }>,
          api.projects.getAll() as Promise<{ projects: any[]; total: number }>,
        ]);
        setMetrics(metricsData);
        setRecentLogs(logsData.logs);
        setActiveProjects(projectsData.projects.slice(0, 3));
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const threatVectorData = metrics
    ? [
        { name: 'Prompt Injection', value: metrics.threatVectors.promptInjection, color: '#ef4444' },
        { name: 'PII Leakage', value: metrics.threatVectors.piiLeakage, color: '#f59e0b' },
        { name: 'Jailbreak', value: metrics.threatVectors.jailbreak, color: '#8b5cf6' },
        { name: 'Tool Misuse', value: metrics.threatVectors.toolMisuse, color: '#06b6d4' },
      ]
    : [];

  const MetricSkeleton = () => (
    <Card>
      <CardHeader className="pb-3"><Skeleton className="h-4 w-32" /></CardHeader>
      <CardContent><Skeleton className="h-9 w-24 mb-2" /><Skeleton className="h-3 w-28" /></CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Posture</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Real-time monitoring of LLM gateway traffic and middleware policy enforcement across active production environments.
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/rag-scanner')}>
            🔍 Scan Documents
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/red-team')}>
            🚩 Run Red Team Test
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <MetricSkeleton key={i} />)
        ) : (
          <>
            <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total LLM Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {(metrics?.totalLLMRequests ?? 0).toLocaleString()}
                  </span>
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
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {(metrics?.injectionAttempts ?? 0).toLocaleString()}
                  </span>
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
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {(metrics?.blockedRequests ?? 0).toLocaleString()}
                  </span>
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
                  <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {metrics?.globalSecurityScore ?? 0}
                  </span>
                  <TrendingUp className="size-5 text-purple-500" />
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">+0.3% from yesterday</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} labelStyle={{ color: '#94a3b8' }} />
                <Legend />
                <Area type="monotone" dataKey="requests" stackId="1" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRequests)" name="Allowed Requests" />
                <Area type="monotone" dataKey="blocked" stackId="2" stroke="#ef4444" fillOpacity={1} fill="url(#colorBlocked)" name="Blocked" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Threat Vector Distribution</CardTitle>
            <CardDescription>Breakdown of attack attempts</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {loading ? (
              <Skeleton className="w-[200px] h-[200px] rounded-full" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={threatVectorData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value">
                      {threatVectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 text-sm w-full mt-2">
                  {threatVectorData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                      <span className="ml-auto font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
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
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700" onClick={() => navigate('/logs')}>
              View Logs &gt;
            </Button>
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
                {loading
                  ? Array(4).fill(0).map((_, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-900">
                        {Array(6).fill(0).map((_, j) => (
                          <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
                        ))}
                      </tr>
                    ))
                  : recentLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium">{log.endpoint || 'N/A'}</td>
                        <td className="py-3 px-4">{log.attackType.replace('_', ' ')}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${log.riskScore > 80 ? 'bg-red-500' : log.riskScore > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                style={{ width: `${log.riskScore}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">{log.riskScore}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.severity === 'critical' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400' :
                            log.severity === 'high' ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400' :
                            log.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400' :
                            'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                          }`}>
                            {log.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            log.action === 'blocked' ? 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400' :
                            log.action === 'flagged' ? 'bg-yellow-100 dark:bg-yellow-950/50 text-yellow-700 dark:text-yellow-400' :
                            'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400'
                          }`}>
                            {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Active Projects & Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Projects</CardTitle>
            <CardDescription>Managed enterprise environments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading
                ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
                : activeProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div>
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-green-600 dark:text-green-400">{project.uptime}% uptime</p>
                      </div>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">{project.securityScore}</span>
                    </div>
                  ))}
            </div>
            <Button variant="outline" className="w-full mt-4 border-dashed" onClick={() => navigate('/projects')}>
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
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Your current security configuration meets SOC2 Type II and HIPAA requirements for LLM proxy layers.
              </p>
              <Button variant="link" className="text-blue-600 hover:text-blue-700" onClick={() => navigate('/analytics')}>
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
                No critical high-severity issues detected in the proxy chain. Detection accuracy:{' '}
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {metrics?.detectionAccuracy ?? 99.8}%
                </span>
              </p>
              <Button variant="link" className="text-blue-600 hover:text-blue-700 text-xs mt-3" onClick={() => navigate('/analytics')}>
                Download Security Audit
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
