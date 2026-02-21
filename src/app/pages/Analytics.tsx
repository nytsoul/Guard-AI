import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Calendar, TrendingUp, Shield, AlertTriangle, Clock, Download, FileText, CheckCircle2 } from 'lucide-react';

export function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');

  // Request & Threat Trends data
  const trendData = [
    { date: 'Mon', requests: 18200, threats: 420, blocked: 410 },
    { date: 'Tue', requests: 21400, threats: 380, blocked: 375 },
    { date: 'Wed', requests: 19800, threats: 510, blocked: 498 },
    { date: 'Thu', requests: 22600, threats: 340, blocked: 338 },
    { date: 'Fri', requests: 24100, threats: 620, blocked: 608 },
    { date: 'Sat', requests: 12800, threats: 190, blocked: 188 },
    { date: 'Sun', requests: 11400, threats: 150, blocked: 148 },
  ];

  // Attack vectors
  const attackVectorData = [
    { name: 'Prompt Injection', value: 42, color: '#ef4444' },
    { name: 'Jailbreak', value: 28, color: '#f59e0b' },
    { name: 'Data Extraction', value: 15, color: '#8b5cf6' },
    { name: 'PII Leakage', value: 10, color: '#3b82f6' },
    { name: 'Other', value: 5, color: '#6b7280' },
  ];

  // Latency data
  const latencyData = [
    { time: '00:00', p50: 12, p95: 28, p99: 45 },
    { time: '04:00', p50: 10, p95: 22, p99: 35 },
    { time: '08:00', p50: 18, p95: 38, p99: 62 },
    { time: '12:00', p50: 22, p95: 45, p99: 78 },
    { time: '16:00', p50: 20, p95: 42, p99: 68 },
    { time: '20:00', p50: 15, p95: 32, p99: 52 },
  ];

  // Compliance data
  const complianceItems = [
    { standard: 'SOC 2 Type II', status: 'compliant', lastAudit: '2024-01-15', score: 98 },
    { standard: 'GDPR', status: 'compliant', lastAudit: '2024-02-01', score: 96 },
    { standard: 'HIPAA', status: 'review', lastAudit: '2023-12-20', score: 89 },
    { standard: 'ISO 27001', status: 'compliant', lastAudit: '2024-01-28', score: 95 },
    { standard: 'OWASP LLM Top 10', status: 'compliant', lastAudit: '2024-02-10', score: 92 },
    { standard: 'NIST AI RMF', status: 'review', lastAudit: '2024-01-05', score: 87 },
  ];

  // Reports
  const reports = [
    { name: 'Weekly Security Summary', schedule: 'Every Monday', recipients: 'security-team@corp.com', format: 'PDF' },
    { name: 'Monthly Compliance Report', schedule: '1st of month', recipients: 'compliance@corp.com', format: 'PDF' },
    { name: 'Daily Threat Digest', schedule: 'Daily 9:00 AM', recipients: 'ciso@corp.com', format: 'Email' },
    { name: 'Incident Response Log', schedule: 'On-demand', recipients: 'soc@corp.com', format: 'CSV' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Security metrics, trends, compliance status and automated reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'ghost'}
                size="sm"
                className="text-xs h-7 px-3"
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="size-5 text-blue-500" />
              <div>
                <p className="text-xs text-slate-500">TOTAL REQUESTS</p>
                <p className="text-2xl font-bold">130,300</p>
                <p className="text-xs text-green-600">↑ 12.3% vs last period</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 dark:from-red-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-red-500" />
              <div>
                <p className="text-xs text-slate-500">THREATS DETECTED</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">2,610</p>
                <p className="text-xs text-red-600">↑ 5.2% vs last period</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 dark:from-green-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-green-500" />
              <div>
                <p className="text-xs text-slate-500">BLOCK RATE</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">98.1%</p>
                <p className="text-xs text-green-600">↑ 0.3% vs last period</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 dark:from-amber-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="size-5 text-amber-500" />
              <div>
                <p className="text-xs text-slate-500">AVG LATENCY</p>
                <p className="text-2xl font-bold">18ms</p>
                <p className="text-xs text-green-600">↓ 2ms vs last period</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request & Threat Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Request & Threat Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="requests" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Requests" />
                <Area type="monotone" dataKey="threats" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Threats" />
                <Area type="monotone" dataKey="blocked" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} name="Blocked" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attack Vector Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Attack Vector Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={attackVectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {attackVectorData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {attackVectorData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latency Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Security Middleware Latency (ms)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="time" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="p50" fill="#3b82f6" name="p50" radius={[4, 4, 0, 0]} />
              <Bar dataKey="p95" fill="#f59e0b" name="p95" radius={[4, 4, 0, 0]} />
              <Bar dataKey="p99" fill="#ef4444" name="p99" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Compliance & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {complianceItems.map((item, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.standard}</span>
                    <Badge className={
                      item.status === 'compliant'
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 text-[10px]'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-[10px]'
                    }>
                      {item.status === 'compliant' ? (
                        <><CheckCircle2 className="size-2.5 mr-1" /> Compliant</>
                      ) : (
                        <><Calendar className="size-2.5 mr-1" /> In Review</>
                      )}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Score: {item.score}%</span>
                    <span>Audit: {item.lastAudit}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${item.score >= 95 ? 'bg-green-500' : item.score >= 90 ? 'bg-blue-500' : 'bg-amber-500'}`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Automated Report Delivery */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Automated Report Delivery</CardTitle>
              <Button variant="outline" size="sm" className="text-xs">+ Add Report</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.map((report, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="size-3.5 text-blue-500" />
                        <span className="text-sm font-medium">{report.name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{report.recipients}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{report.format}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="size-3 text-slate-400" />
                    <span className="text-xs text-slate-500">{report.schedule}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
