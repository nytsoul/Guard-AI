import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Swords, Play, ShieldAlert, Target, Bug, Lock, AlertTriangle,
  CheckCircle2, XCircle, Terminal, Zap, ChevronDown, ChevronRight, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

// ─────── Types ───────────────────────────────
interface AttackResult {
  prompt: string;
  category: string;
  riskScore: number;
  riskLevel: string;
  action: string;
  detected: boolean;
  blocked: boolean;
  confidence: number;
  triggeredRules: { rule_id: string; description: string; weight: number; severity: string }[];
  explanation: {
    summary: string;
    decision_basis: string;
    top_factors: { rule: string; description: string; contribution: string; severity: string; matched: string }[];
    confidence: string;
    mitigation: string;
  };
}

interface AdvRun {
  runId: string;
  timestamp: string;
  summary: {
    total: number; blocked: number; undetected: number;
    bypassed: number; avgRiskScore: number; securityScore: number; blockRate: number;
  };
  categoryBreakdown: Record<string, { total: number; blocked: number; undetected: number }>;
  findings: { category: string; bypassRate: number; severity: string; recommendation: string }[];
  attacks: AttackResult[];
}

interface PastSimulation {
  id: string; name: string; timestamp: string;
  attacksRun: number; blocked: number; success: number; duration: number; status: string;
}

interface Insight {
  type: string; severity: string; title: string; description: string;
  recommendation: string; affectedEndpoints: string[];
}

const ALL_CATEGORIES = [
  { id: 'prompt_injection',         label: 'Prompt Injection',         color: 'text-red-500',    severity: 'critical' },
  { id: 'jailbreak',                label: 'Jailbreak',                color: 'text-orange-500', severity: 'critical' },
  { id: 'pii_extraction',           label: 'PII Extraction',           color: 'text-amber-500',  severity: 'high' },
  { id: 'system_prompt_extraction', label: 'Sys Prompt Extraction',    color: 'text-purple-500', severity: 'high' },
  { id: 'data_exfiltration',        label: 'Data Exfiltration',        color: 'text-pink-500',   severity: 'critical' },
  { id: 'malicious_code',           label: 'Malicious Code Gen',       color: 'text-red-700',    severity: 'high' },
];

// ─────── Component ────────────────────────────
export function RedTeam() {
  // Config
  const [attackCount,     setAttackCount]     = useState([20]);
  const [attackIntensity, setAttackIntensity] = useState([65]);
  const [selectedCats,    setSelectedCats]    = useState<string[]>(ALL_CATEGORIES.map(c => c.id));
  const [teamContext,     setTeamContext]      = useState('');

  // State
  const [generating,      setGenerating]      = useState(false);
  const [executing,       setExecuting]       = useState(false);
  const [currentRun,      setCurrentRun]      = useState<AdvRun | null>(null);
  const [expandedAttack,  setExpandedAttack]  = useState<number | null>(null);
  const [pastRuns,        setPastRuns]        = useState<AdvRun[]>([]);
  const [pastSims,        setPastSims]        = useState<PastSimulation[]>([]);
  const [insights,        setInsights]        = useState<Insight[]>([]);
  const [loading,         setLoading]         = useState(true);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [insightsData, simsData, runsData] = await Promise.all([
          api.redTeam.getInsights() as Promise<{ insights: Insight[] }>,
          api.redTeam.getSimulations() as Promise<{ simulations: PastSimulation[] }>,
          api.redTeam.getRuns(5) as Promise<{ runs: AdvRun[] }>,
        ]);
        setInsights(Array.isArray(insightsData.insights) ? insightsData.insights : []);
        setPastSims(Array.isArray(simsData.simulations) ? simsData.simulations : []);
        setPastRuns(runsData.runs);
      } catch { toast.error('Failed to load red team data'); }
      finally { setLoading(false); }
    };
    fetchInitial();
  }, []);

  const handleGenerate = async () => {
    if (selectedCats.length === 0) { toast.error('Select at least one attack category'); return; }
    setGenerating(true);
    setCurrentRun(null);
    try {
      const run = await api.redTeam.generate({
        count: attackCount[0],
        categories: selectedCats,
        team: teamContext || undefined,
      }) as AdvRun;
      // Ensure summary and attacks exist (guard against shape mismatch)
      if (!run.summary) {
        run.summary = { total: 0, blocked: 0, undetected: 0, bypassed: 0, avgRiskScore: 0, securityScore: 0, blockRate: 0 };
      }
      if (!run.attacks) run.attacks = [];
      if (!run.findings) run.findings = [];
      if (!run.categoryBreakdown) run.categoryBreakdown = {};
      setCurrentRun(run);
      toast.success(`Generated ${run.summary.total} attacks — Block rate: ${run.summary.blockRate}%`);
      // Refresh runs list and insights
      const [runsData, insightsData] = await Promise.all([
        api.redTeam.getRuns(5) as Promise<{ runs: AdvRun[] }>,
        api.redTeam.getInsights() as Promise<{ insights: Insight[] }>,
      ]);
      setPastRuns(runsData.runs);
      setInsights(Array.isArray(insightsData.insights) ? insightsData.insights : []);
    } catch { toast.error('Generation failed. Please try again.'); }
    finally { setGenerating(false); }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const config = {
        intensity: attackIntensity[0],
        duration: 300,
        vectors: selectedCats,
      };
      await api.redTeam.execute(config);
      const simsData = await api.redTeam.getSimulations() as { simulations: PastSimulation[] };
      setPastSims(simsData.simulations);
      toast.success('Red team simulation complete');
    } catch { toast.error('Simulation failed'); }
    finally { setExecuting(false); }
  };

  const toggleCat = (id: string) => {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const getActionBadge = (action: string) => {
    if (action === 'blocked') return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
    if (action === 'flagged') return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
    if (action === 'warned')  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
    return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
  };

  const summary = currentRun?.summary;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-950/50 rounded-lg">
            <Terminal className="size-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Red Team Terminal</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Automated adversarial generation, firewall scoring & vulnerability reporting
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExecute} disabled={executing || generating} variant="outline" className="gap-2 border-red-300 text-red-600 hover:bg-red-50">
            {executing ? <div className="size-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" /> : <Play className="size-4" />}
            {executing ? 'Running...' : 'Run Simulation'}
          </Button>
          <Button onClick={handleGenerate} disabled={generating || executing} className="gap-2 bg-red-600 hover:bg-red-700">
            {generating ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="size-4" />}
            {generating ? 'Generating...' : 'Generate Attacks'}
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 dark:from-emerald-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="size-5 text-emerald-500" />
              <div>
                <p className="text-xs text-slate-500">BLOCK RATE</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {summary ? `${summary.blockRate}%` : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 dark:from-red-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bug className="size-5 text-red-500" />
              <div>
                <p className="text-xs text-slate-500">BYPASSED</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {summary ? summary.bypassed : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="size-5 text-blue-500" />
              <div>
                <p className="text-xs text-slate-500">BLOCKED</p>
                <p className="text-3xl font-bold">{summary ? summary.blocked : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="size-5 text-purple-500" />
              <div>
                <p className="text-xs text-slate-500">SECURITY SCORE</p>
                <p className="text-3xl font-bold">{summary ? `${summary.securityScore}%` : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generator">
        <TabsList className="mb-4">
          <TabsTrigger value="generator" className="gap-2"><Zap className="size-4" />Attack Generator</TabsTrigger>
          <TabsTrigger value="insights"  className="gap-2"><AlertTriangle className="size-4" />Insights</TabsTrigger>
          <TabsTrigger value="history"   className="gap-2"><BarChart3 className="size-4" />History</TabsTrigger>
        </TabsList>

        {/* ── Generator Tab ── */}
        <TabsContent value="generator">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Config Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Generator Config</CardTitle>
                  <CardDescription>Configure and launch the adversarial engine</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Attack Count</span>
                      <span className="text-sm text-slate-500">{attackCount[0]}</span>
                    </div>
                    <Slider value={attackCount} onValueChange={setAttackCount} min={5} max={50} step={5} />
                    <div className="flex justify-between text-xs text-slate-400 mt-1"><span>5</span><span>50</span></div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Simulation Intensity</span>
                      <span className="text-sm text-slate-500">{attackIntensity[0]}%</span>
                    </div>
                    <Slider value={attackIntensity} onValueChange={setAttackIntensity} min={10} max={100} step={5} />
                  </div>

                  <div>
                    <span className="text-sm font-medium mb-3 block">Team Context</span>
                    <select value={teamContext} onChange={e => setTeamContext(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm bg-transparent">
                      <option value="">Default policy</option>
                      <option value="finance">Finance</option>
                      <option value="support">Customer Support</option>
                      <option value="internal">Internal</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-sm font-medium mb-3 block">Attack Categories</span>
                    <div className="space-y-2">
                      {ALL_CATEGORIES.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Swords className={`size-3.5 ${cat.color}`} />
                            <span className="text-xs">{cat.label}</span>
                            <Badge className={`text-[9px] ${cat.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'}`}>
                              {cat.severity}
                            </Badge>
                          </div>
                          <Switch checked={selectedCats.includes(cat.id)} onCheckedChange={() => toggleCat(cat.id)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={handleGenerate} disabled={generating || executing || selectedCats.length === 0}
                    className="w-full gap-2 bg-red-600 hover:bg-red-700">
                    {generating ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="size-4" />}
                    {generating ? 'Generating Attacks...' : `Generate ${attackCount[0]} Attacks`}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2 space-y-4">
              {!currentRun && !generating && (
                <Card className="min-h-[400px] flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <Swords className="size-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No attack run yet</p>
                    <p className="text-xs mt-1">Configure and click "Generate Attacks" to fire the adversarial engine.</p>
                  </div>
                </Card>
              )}

              {generating && (
                <Card>
                  <CardContent className="pt-6 text-center space-y-3">
                    <div className="size-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-medium">Running adversarial engine...</p>
                    <p className="text-xs text-slate-500">Generating {attackCount[0]} attack prompts across {selectedCats.length} categories and scoring each through your firewall</p>
                  </CardContent>
                </Card>
              )}

              {currentRun && !generating && (
                <>
                  {/* Summary Card */}
                  <Card className="border-2 border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Run Summary</CardTitle>
                        <span className="text-xs text-slate-400">{new Date(currentRun.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                          { label: 'Total', value: currentRun.summary.total,     color: 'text-slate-700 dark:text-slate-200' },
                          { label: 'Blocked', value: currentRun.summary.blocked, color: 'text-green-600 dark:text-green-400' },
                          { label: 'Bypassed', value: currentRun.summary.bypassed, color: 'text-red-600 dark:text-red-400' },
                          { label: 'Avg Risk', value: `${currentRun.summary.avgRiskScore}`, color: 'text-amber-600 dark:text-amber-400' },
                        ].map(s => (
                          <div key={s.label} className="text-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{s.label.toUpperCase()}</p>
                          </div>
                        ))}
                      </div>

                      {/* Security score gauge */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative w-16 h-16 shrink-0">
                          <svg viewBox="0 0 36 36" className="w-16 h-16">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                              stroke={currentRun.summary.securityScore >= 80 ? '#22c55e' : currentRun.summary.securityScore >= 60 ? '#f59e0b' : '#ef4444'}
                              strokeWidth="3" strokeDasharray={`${currentRun.summary.securityScore}, 100`} />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold">{currentRun.summary.securityScore}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Security Score</p>
                          <p className="text-xs text-slate-500">{currentRun.summary.blockRate}% block rate across all categories</p>
                        </div>
                      </div>

                      {/* Category Breakdown */}
                      {Object.keys(currentRun.categoryBreakdown).length > 0 && (
                        <div className="space-y-2">
                          {Object.entries(currentRun.categoryBreakdown).map(([cat, stats]) => {
                            const blockPct = Math.round(stats.blocked / stats.total * 100);
                            return (
                              <div key={cat} className="flex items-center gap-2 text-xs">
                                <span className="w-36 text-slate-600 dark:text-slate-400 truncate">{cat.replace(/_/g, ' ')}</span>
                                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full ${blockPct >= 80 ? 'bg-green-500' : blockPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                    style={{ width: `${blockPct}%` }} />
                                </div>
                                <span className="w-10 text-right font-mono">{blockPct}%</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Vulnerability Findings */}
                      {currentRun.findings.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vulnerability Findings</p>
                          {currentRun.findings.map((f, i) => (
                            <div key={i} className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={`text-[10px] ${f.severity === 'critical' ? 'bg-red-500 text-white' : f.severity === 'high' ? 'bg-orange-500 text-white' : 'bg-amber-500 text-white'}`}>
                                  {f.severity.toUpperCase()}
                                </Badge>
                                <span className="text-xs font-medium">{f.category.replace(/_/g, ' ')} — {f.bypassRate}% bypass rate</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">{f.recommendation}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Attack Results List */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Attack Results ({currentRun.attacks.length})</CardTitle>
                      <CardDescription className="text-xs">Click any attack to see the full explainability breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {currentRun.attacks.map((attack, idx) => (
                          <div key={idx}>
                            <button
                              className={`w-full text-left p-3 rounded-lg border transition-colors ${attack.blocked ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30' : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30'}`}
                              onClick={() => setExpandedAttack(expandedAttack === idx ? null : idx)}
                            >
                              <div className="flex items-center gap-2">
                                {attack.blocked
                                  ? <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                                  : <XCircle className="size-4 text-red-600 shrink-0" />}
                                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 w-36 truncate">[{attack.category}]</span>
                                <span className="text-xs flex-1 truncate">{attack.prompt}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Badge className={`text-[9px] ${getActionBadge(attack.action)}`}>{attack.action}</Badge>
                                  <span className="text-[10px] text-slate-400 font-mono">{attack.riskScore}</span>
                                  {expandedAttack === idx ? <ChevronDown className="size-3 text-slate-400" /> : <ChevronRight className="size-3 text-slate-400" />}
                                </div>
                              </div>
                            </button>

                            {expandedAttack === idx && (
                              <div className="mt-1 ml-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                                <div>
                                  <p className="text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Full Prompt</p>
                                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded">{attack.prompt}</p>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                    <p className="text-sm font-bold">{attack.riskScore}</p>
                                    <p className="text-[10px] text-slate-500">RISK SCORE</p>
                                  </div>
                                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                    <p className="text-sm font-bold capitalize">{attack.riskLevel}</p>
                                    <p className="text-[10px] text-slate-500">LEVEL</p>
                                  </div>
                                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                    <p className="text-sm font-bold">{Math.round(attack.confidence * 100)}%</p>
                                    <p className="text-[10px] text-slate-500">CONFIDENCE</p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Why this decision?</p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400">{attack.explanation.summary}</p>
                                  <p className="text-xs text-slate-500 mt-1">{attack.explanation.decision_basis}</p>
                                </div>

                                {attack.explanation.top_factors.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Triggered Rules</p>
                                    {attack.explanation.top_factors.map((f, fi) => (
                                      <div key={fi} className="flex items-start gap-2 text-xs p-2 bg-slate-50 dark:bg-slate-800 rounded mb-1">
                                        <Badge className={`shrink-0 text-[9px] ${f.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-amber-100 text-amber-700'}`}>
                                          {f.severity}
                                        </Badge>
                                        <div>
                                          <p className="font-mono text-slate-500">{f.rule}</p>
                                          <p>{f.description} <span className="text-slate-400">({f.contribution})</span></p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs text-blue-700 dark:text-blue-400">
                                  <strong>Recommended Action:</strong> {attack.explanation.mitigation}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Insights Tab ── */}
        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Adversarial Insights</CardTitle>
                <CardDescription>Generated from your most recent adversarial run</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg mb-3" />)
                ) : insights.map((item, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 mb-3">
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        {item.type === 'vulnerability' ? <XCircle className="size-4 text-red-500" />
                          : item.type === 'strength' ? <CheckCircle2 className="size-4 text-green-500" />
                          : <AlertTriangle className="size-4 text-amber-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <Badge className={`text-[10px] ${item.severity === 'high' || item.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : item.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {item.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">→ {item.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && insights.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-8">Run the generator to produce live insights</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Simulations</CardTitle>
                <CardDescription>Past red team simulation runs</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg mb-3" />)
                ) : pastSims.map((sim) => (
                  <div key={sim.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{sim.name}</span>
                      <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">{sim.status}</Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      <span>{sim.attacksRun} attacks</span>
                      <span className="text-green-600">{sim.blocked} blocked</span>
                      <span className="text-red-600">{sim.success} bypassed</span>
                      <span>{sim.duration}s</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(sim.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Past Adversarial Runs</CardTitle>
              <CardDescription>History of all automated attack generation runs</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg mb-3" />)
              ) : pastRuns.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <BarChart3 className="size-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No past runs. Generate your first adversarial batch above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastRuns.map((run) => (
                    <div key={run.runId} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-mono text-slate-500">{run.runId}</p>
                          <p className="text-xs text-slate-400">{new Date(run.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{run.summary.securityScore}%</p>
                          <p className="text-[10px] text-slate-400">SECURITY SCORE</p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
                        <span>{run.summary.total} attacks</span>
                        <span className="text-green-600">{run.summary.blocked} blocked</span>
                        <span className="text-red-600">{run.summary.bypassed} bypassed</span>
                        <span>Avg risk: {run.summary.avgRiskScore}</span>
                      </div>
                      {run.findings && run.findings.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {run.findings.slice(0, 3).map((f, fi) => (
                            <Badge key={fi} className={`text-[10px] ${f.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : 'bg-amber-100 text-amber-700'}`}>
                              {f.category.replace(/_/g, ' ')} {f.bypassRate}% bypass
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
