import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Search, Download, Filter, AlertCircle, AlertTriangle, Shield, Clock } from 'lucide-react';
import { mockAttackLogs } from '../utils/mockData';
import type { AttackLog } from '../utils/security';

export function AttackLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterAttackType, setFilterAttackType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');

  const filteredLogs = mockAttackLogs.filter((log) => {
    const matchesSearch = log.userInput.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'all' || log.riskLevel === filterRisk;
    const matchesAttackType = filterAttackType === 'all' || log.attackType === filterAttackType;
    return matchesSearch && matchesRisk && matchesAttackType;
  });

  // Statistics
  const totalLogs = mockAttackLogs.length;
  const blockedThreats = mockAttackLogs.filter(l => l.action === 'blocked').length;
  const avgRiskScore = Math.round(mockAttackLogs.reduce((sum, log) => sum + log.riskScore, 0) / totalLogs);
  const detectionAccuracy = 99.8;

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800';
      case 'high': return 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800';
      case 'low': return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800';
      default: return '';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'blocked': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
      case 'warned': return 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400';
      case 'allowed': return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
      default: return '';
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Security Incident Logs</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Complete audit trail of all LLM security events and threat detections across your infrastructure
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 dark:from-slate-900/50 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Logs</p>
                <p className="text-3xl font-bold">{totalLogs.toLocaleString()}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12% from yesterday</p>
              </div>
              <AlertCircle className="size-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 dark:from-red-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Blocked Threats</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{blockedThreats}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">Critical: 24 active</p>
              </div>
              <Shield className="size-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 dark:from-amber-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Avg. Risk Score</p>
                <p className="text-3xl font-bold">{avgRiskScore}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Within safety baseline</p>
              </div>
              <AlertTriangle className="size-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-50 dark:from-teal-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Detection Accuracy</p>
                <p className="text-3xl font-bold">{detectionAccuracy}%</p>
                <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">Trained on v4.2 engine</p>
              </div>
              <Shield className="size-5 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Search payloads, IDs, or inputs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last 1 Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterAttackType} onValueChange={setFilterAttackType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Attacks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Attacks</SelectItem>
                  <SelectItem value="prompt_injection">Prompt Injection</SelectItem>
                  <SelectItem value="jailbreak">Jailbreak Attempt</SelectItem>
                  <SelectItem value="pii_leakage">PII Leakage</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRisk} onValueChange={setFilterRisk}>
                <SelectTrigger className="w-full md:w-[160px]">
                  <SelectValue placeholder="All Risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="gap-2">
                <Download className="size-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Showing 1-6 of {filteredLogs.length} incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Timestamp</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">User Input (Payload)</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Attack Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Risk</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Severity</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600 dark:text-slate-400">Action Taken</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.slice(0, 6).map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{log.timestamp.toLocaleString()}</td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{log.userInput}</span>
                    </td>
                    <td className="py-3 px-4 text-sm">{log.attackType.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${log.riskScore > 80 ? 'bg-red-500' : log.riskScore > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${log.riskScore}%` }}
                          />
                        </div>
                        <span className="font-semibold text-xs">{log.riskScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${getSeverityColor(log.severity)}`}>
                        {log.severity.charAt(0).toUpperCase() + log.severity.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getActionColor(log.action)}`}>
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

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2">
        <Button variant="outline" disabled>&lt; Previous</Button>
        <Button className="bg-blue-600">1</Button>
        <Button variant="outline">2</Button>
        <Button variant="outline">3</Button>
        <span className="text-sm text-slate-600 dark:text-slate-400">...</span>
        <Button variant="outline">12</Button>
        <Button variant="outline">Next &gt;</Button>
      </div>
    </div>
  );
}
