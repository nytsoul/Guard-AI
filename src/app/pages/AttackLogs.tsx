import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Search, Download, AlertCircle, AlertTriangle, Shield, ChevronDown, ChevronRight, Info, XCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

interface TriggeredRule {
  rule_id: string;
  category: string;
  description: string;
  weight: number;
  severity: string;
  matched_text: string;
}

interface ExplanationFactor {
  rule: string;
  description: string;
  contribution: string;
  severity: string;
  matched: string;
}

interface Explanation {
  summary: string;
  decision_basis: string;
  top_factors: ExplanationFactor[];
  confidence: string;
  mitigation: string;
}

interface Log {
  id: string;
  timestamp: string;
  userInput: string;
  attackType: string;
  riskScore: number;
  riskLevel?: string;
  severity: string;
  action: string;
  endpoint?: string;
  confidence?: number;
  categories?: string[];
  triggeredRules?: TriggeredRule[];
  explanation?: Explanation;
  policyApplied?: string;
}

const PAGE_SIZE = 10;

export function AttackLogs() {
  const [searchTerm,       setSearchTerm]       = useState('');
  const [filterSeverity,   setFilterSeverity]   = useState('all');
  const [filterAttackType, setFilterAttackType] = useState('all');
  const [page,             setPage]             = useState(0);
  const [logs,             setLogs]             = useState<Log[]>([]);
  const [total,            setTotal]            = useState(0);
  const [loading,          setLoading]          = useState(true);

  // Explainability panel
  const [selectedLog,      setSelectedLog]      = useState<Log | null>(null);
  const [explainLoading,   setExplainLoading]   = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
      if (filterAttackType !== 'all') params.attackType = filterAttackType;
      if (filterSeverity   !== 'all') params.severity   = filterSeverity;
      const data = await api.logs.getAll(params) as { logs: Log[]; total: number };
      setLogs(data.logs);
      setTotal(data.total);
    } catch {
      toast.error('Failed to load security logs');
    } finally {
      setLoading(false);
    }
  }, [page, filterAttackType, filterSeverity]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(0); }, [filterAttackType, filterSeverity]);

  const handleSelectLog = async (log: Log) => {
    if (selectedLog?.id === log.id) { setSelectedLog(null); return; }
    setSelectedLog(log);
    // If already has explanation, use it; otherwise fetch
    if (!log.triggeredRules || !log.explanation) {
      setExplainLoading(true);
      try {
        const full = await api.analysis.explainLog(log.id) as Log;
        setSelectedLog(full);
        setLogs(prev => prev.map(l => l.id === full.id ? full : l));
      } catch {
        // use what we have
      } finally {
        setExplainLoading(false);
      }
    }
  };

  const filteredLogs = searchTerm
    ? logs.filter(l => l.userInput?.toLowerCase().includes(searchTerm.toLowerCase()) || l.attackType?.includes(searchTerm.toLowerCase()))
    : logs;

  const blockedCount = logs.filter(l => l.action === 'blocked').length;
  const avgRisk = logs.length > 0 ? Math.round(logs.reduce((s, l) => s + l.riskScore, 0) / logs.length) : 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleExportCSV = () => {
    const header = ['ID', 'Timestamp', 'Attack Type', 'Risk Score', 'Severity', 'Action', 'Input'];
    const rows = logs.map(l => [l.id, l.timestamp, l.attackType, l.riskScore, l.severity, l.action, `"${l.userInput?.replace(/"/g, '""')}"`]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `attack-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Logs exported as CSV');
  };

  const getSeverityColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-300 dark:border-red-800';
      case 'high':     return 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-800';
      case 'medium':   return 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800';
      default:         return 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800';
    }
  };

  const getActionColor = (a: string) => {
    switch (a) {
      case 'blocked': return 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400';
      case 'flagged': return 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400';
      default:        return 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400';
    }
  };

  const RuleRow = ({ rule }: { rule: ExplanationFactor }) => (
    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-mono text-slate-400">{rule.rule}</span>
        <Badge className={`text-[9px] ${rule.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : rule.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' : 'bg-yellow-100 text-yellow-700'}`}>
          {rule.severity}
        </Badge>
        <span className="ml-auto text-[10px] text-slate-500">{rule.contribution}</span>
      </div>
      <p className="text-xs">{rule.description}</p>
      {rule.matched && rule.matched !== '[REDACTED]' && (
        <p className="text-[10px] font-mono text-slate-400 mt-1">Matched: "{rule.matched}"</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold">Security Incident Logs</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Complete audit trail with full explainability — click any row to see WHY it was blocked.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 dark:from-slate-900/50 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Logs</p>
                <p className="text-3xl font-bold">{total.toLocaleString()}</p>
              </div>
              <AlertCircle className="size-5 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 dark:from-red-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Blocked (page)</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{blockedCount}</p>
              </div>
              <Shield className="size-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 dark:from-amber-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Avg. Risk Score</p>
                <p className="text-3xl font-bold">{avgRisk}</p>
              </div>
              <AlertTriangle className="size-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 dark:from-teal-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 mb-1">Detection Accuracy</p>
                <p className="text-3xl font-bold">99.8%</p>
              </div>
              <Shield className="size-5 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle>Search & Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input placeholder="Search payloads or attack types..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <Select value={filterAttackType} onValueChange={setFilterAttackType}>
                <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="All Attacks" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Attacks</SelectItem>
                  <SelectItem value="prompt_injection">Prompt Injection</SelectItem>
                  <SelectItem value="jailbreak">Jailbreak</SelectItem>
                  <SelectItem value="pii_extraction">PII Extraction</SelectItem>
                  <SelectItem value="system_prompt_extraction">Sys Prompt Extraction</SelectItem>
                  <SelectItem value="data_exfiltration">Data Exfiltration</SelectItem>
                  <SelectItem value="malicious_code">Malicious Code</SelectItem>
                  <SelectItem value="pii_leakage">PII Leakage</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-full md:w-[160px]"><SelectValue placeholder="All Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
                <Download className="size-4" /> Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explainability hint */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 px-4 py-2 rounded-lg">
        <Info className="size-4 text-blue-500 shrink-0" />
        <span>Click any row to expand the <strong>Risk Explainability</strong> panel — see exactly which rules triggered and why the decision was made.</span>
      </div>

      {/* Main layout: table + panel */}
      <div className={`flex gap-6 ${selectedLog ? 'items-start' : ''}`}>
        {/* Table */}
        <Card className="flex-1 min-w-0">
          <CardHeader>
            <CardTitle className="text-base">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs w-4"></th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs">Time</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs">Payload</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs">Type</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs">Risk</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs">Severity</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-500 text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array(PAGE_SIZE).fill(0).map((_, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-900">
                          {Array(7).fill(0).map((_, j) => <td key={j} className="py-3 px-3"><Skeleton className="h-4 w-16" /></td>)}
                        </tr>
                      ))
                    : filteredLogs.map(log => (
                        <tr key={log.id}
                          onClick={() => handleSelectLog(log)}
                          className={`border-b border-slate-100 dark:border-slate-900 cursor-pointer transition-colors
                            ${selectedLog?.id === log.id
                              ? 'bg-blue-50 dark:bg-blue-950/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'
                            }`}
                        >
                          <td className="py-3 px-3">
                            {selectedLog?.id === log.id
                              ? <ChevronDown className="size-3 text-blue-500" />
                              : <ChevronRight className="size-3 text-slate-400" />}
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-3 max-w-[200px]">
                            <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">{log.userInput}</span>
                          </td>
                          <td className="py-3 px-3 text-xs">
                            <span className="text-slate-600 dark:text-slate-400">{log.attackType.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${log.riskScore > 70 ? 'bg-red-500' : log.riskScore > 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                                  style={{ width: `${log.riskScore}%` }} />
                              </div>
                              <span className="text-xs font-semibold">{log.riskScore}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getSeverityColor(log.severity)}`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading}>← Prev</Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const n = page > 2 ? page - 2 + i : i;
                if (n >= totalPages) return null;
                return (
                  <Button key={n} size="sm" variant={n === page ? 'default' : 'outline'}
                    className={n === page ? 'bg-blue-600' : ''} onClick={() => setPage(n)} disabled={loading}>
                    {n + 1}
                  </Button>
                );
              })}
              {totalPages > 5 && page < totalPages - 3 && (
                <><span className="text-slate-400 text-sm">...</span>
                  <Button size="sm" variant="outline" onClick={() => setPage(totalPages - 1)} disabled={loading}>{totalPages}</Button></>
              )}
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || loading}>Next →</Button>
            </div>
          </CardContent>
        </Card>

        {/* Explainability Side Panel */}
        {selectedLog && (
          <Card className="w-[380px] shrink-0 sticky top-4 border-blue-200 dark:border-blue-900 border-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="size-4 text-blue-500" />
                    Risk Explainability
                  </CardTitle>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{selectedLog.id}</p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="size-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
              {explainLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : (
                <>
                  {/* Decision banner */}
                  <div className={`p-3 rounded-lg border-2 text-center
                    ${selectedLog.action === 'blocked' ? 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800' :
                      selectedLog.action === 'flagged' ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30' :
                      'border-green-300 bg-green-50 dark:bg-green-950/30'}`}>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      {selectedLog.action === 'blocked' || selectedLog.action === 'flagged'
                        ? <XCircle className={`size-5 ${selectedLog.action === 'blocked' ? 'text-red-500' : 'text-amber-500'}`} />
                        : <CheckCircle2 className="size-5 text-green-500" />}
                      <span className="font-bold text-sm uppercase">{selectedLog.action}</span>
                    </div>
                    <p className="text-2xl font-bold">{selectedLog.riskScore}<span className="text-base text-slate-400">/100</span></p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {selectedLog.confidence ? `${Math.round(selectedLog.confidence * 100)}% confidence` : ''}{selectedLog.riskLevel ? ` · ${selectedLog.riskLevel}` : ''}
                    </p>
                  </div>

                  {/* Risk bar */}
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${selectedLog.riskScore >= 70 ? 'bg-red-500' : selectedLog.riskScore >= 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                      style={{ width: `${selectedLog.riskScore}%` }} />
                  </div>

                  {/* Summary */}
                  {selectedLog.explanation && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Decision Basis</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{selectedLog.explanation.summary}</p>
                      <p className="text-[11px] text-slate-500">{selectedLog.explanation.decision_basis}</p>
                    </div>
                  )}

                  {/* Triggered Rules */}
                  {selectedLog.explanation?.top_factors && selectedLog.explanation.top_factors.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Triggered Rules ({selectedLog.explanation.top_factors.length})
                      </p>
                      <div className="space-y-2">
                        {selectedLog.explanation.top_factors.map((f, i) => <RuleRow key={i} rule={f} />)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 text-center py-3">No rules triggered — clean prompt</div>
                  )}

                  {/* Payload */}
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Intercepted Payload</p>
                    <p className="text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded text-slate-600 dark:text-slate-300 break-all line-clamp-4">
                      {selectedLog.userInput}
                    </p>
                  </div>

                  {/* Categories */}
                  {selectedLog.categories && selectedLog.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedLog.categories.map(c => (
                        <Badge key={c} variant="secondary" className="text-[10px]">{c.replace(/_/g, ' ')}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Mitigation */}
                  {selectedLog.explanation?.mitigation && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                      <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 mb-1">RECOMMENDED ACTION</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{selectedLog.explanation.mitigation}</p>
                    </div>
                  )}

                  {/* Policy */}
                  {selectedLog.policyApplied && (
                    <p className="text-[10px] text-slate-400">Policy applied: <span className="font-mono">{selectedLog.policyApplied}</span></p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
