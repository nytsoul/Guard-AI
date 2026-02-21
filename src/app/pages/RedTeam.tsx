import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Skeleton } from '../components/ui/skeleton';
import { Swords, Play, ShieldAlert, Target, Bug, Lock, AlertTriangle, CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

interface AttackVector {
  id: string;
  name: string;
  severity: string;
  enabled: boolean;
  tests: number;
}

interface SimulationResult {
  simulationId: string;
  status: string;
  startTime: string;
  estimatedDuration: number;
  timeline: {
    phase: number;
    timestamp: string;
    attacks: number;
    blocked: number;
    success: number;
    status: string;
  }[];
  summary: {
    totalAttacks: number;
    blockedAttacks: number;
    successfulAttacks: number;
    blockRate: number;
  };
}

interface Insight {
  type: string;
  severity: string;
  title: string;
  description: string;
  recommendation: string;
  affectedEndpoints: string[];
}

interface PastSimulation {
  id: string;
  name: string;
  timestamp: string;
  attacksRun: number;
  blocked: number;
  success: number;
  duration: number;
  status: string;
}

export function RedTeam() {
  const [running, setRunning] = useState(false);
  const [attackIntensity, setAttackIntensity] = useState([65]);
  const [batchSize, setBatchSize] = useState([25]);
  const [vectors, setVectors] = useState({
    jailbreaking: true,
    piiHarvesting: true,
    modelPoisoning: false,
    authBypass: true,
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [attackVectors, setAttackVectors] = useState<AttackVector[]>([]);
  const [pastSimulations, setPastSimulations] = useState<PastSimulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [insightsData, vectorsData, simsData] = await Promise.all([
          api.redTeam.getInsights() as Promise<{ insights: Insight[] }>,
          api.redTeam.getAttackVectors() as Promise<{ vectors: AttackVector[] }>,
          api.redTeam.getSimulations() as Promise<{ simulations: PastSimulation[] }>,
        ]);
        setInsights(insightsData.insights);
        setAttackVectors(vectorsData.vectors);
        setPastSimulations(simsData.simulations);
      } catch (err) {
        toast.error('Failed to load red team data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const runRedTeamTest = async () => {
    setRunning(true);
    setSimulationResult(null);
    try {
      const config = {
        intensity: attackIntensity[0],
        duration: batchSize[0] * 10,
        vectors: Object.entries(vectors).filter(([, v]) => v).map(([k]) => k),
      };
      const result = await api.redTeam.execute(config) as SimulationResult;
      setSimulationResult(result);
      toast.success('Red team simulation complete');

      // Refresh past simulations
      const simsData = await api.redTeam.getSimulations() as { simulations: PastSimulation[] };
      setPastSimulations(simsData.simulations);
    } catch (err) {
      toast.error('Simulation failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  const getInsightIcon = (type: string, severity: string) => {
    if (type === 'vulnerability') return <XCircle className="size-4 text-red-500" />;
    if (type === 'strength') return <CheckCircle2 className="size-4 text-green-500" />;
    return <AlertTriangle className="size-4 text-amber-500" />;
  };

  const getInsightBadge = (type: string, severity: string) => {
    if (type === 'vulnerability') return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
    if (type === 'strength') return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400';
  };

  const summary = simulationResult?.summary;

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
            <p className="text-sm text-slate-600 dark:text-slate-400">Adversarial testing & security validation suite</p>
          </div>
        </div>
        <Button onClick={runRedTeamTest} disabled={running} className="gap-2 bg-red-600 hover:bg-red-700">
          {running ? (
            <>
              <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Simulating...
            </>
          ) : (
            <>
              <Play className="size-4" />
              Launch Simulation
            </>
          )}
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-slate-50 dark:from-slate-900/50 to-transparent">
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
                  {summary ? summary.successfulAttacks : '—'}
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
                <p className="text-3xl font-bold">{summary ? summary.blockedAttacks : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="size-5 text-purple-500" />
              <div>
                <p className="text-xs text-slate-500">TOTAL ATTACKS</p>
                <p className="text-3xl font-bold">{summary ? summary.totalAttacks : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Test Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium">Attack Intensity</span>
                  <span className="text-sm text-slate-500">{attackIntensity[0]}%</span>
                </div>
                <Slider value={attackIntensity} onValueChange={setAttackIntensity} max={100} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium">Prompt Batch Size</span>
                  <span className="text-sm text-slate-500">{batchSize[0]}</span>
                </div>
                <Slider value={batchSize} onValueChange={setBatchSize} max={100} step={5} className="w-full" />
              </div>

              <div>
                <span className="text-sm font-medium mb-3 block">Attack Vectors</span>
                <div className="space-y-3">
                  {[
                    { key: 'jailbreaking', label: 'Jailbreaking', icon: Swords, color: 'text-red-500' },
                    { key: 'piiHarvesting', label: 'PII Harvesting', icon: AlertTriangle, color: 'text-amber-500' },
                    { key: 'modelPoisoning', label: 'Model Poisoning', icon: Bug, color: 'text-purple-500' },
                    { key: 'authBypass', label: 'Auth Bypass', icon: Lock, color: 'text-blue-500' },
                  ].map(({ key, label, icon: Icon, color }) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Icon className={`size-4 ${color}`} />
                        <span className="text-sm">{label}</span>
                      </div>
                      <Switch
                        checked={vectors[key as keyof typeof vectors]}
                        onCheckedChange={(val) => setVectors(prev => ({ ...prev, [key]: val }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available Attack Vectors from API */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Test Vectors</CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded mb-2" />)
                : attackVectors.map((vector) => (
                    <div key={vector.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-900 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${vector.enabled ? 'bg-green-500' : 'bg-slate-300'}`} />
                        <span className="text-xs">{vector.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{vector.tests} tests</span>
                        <Badge className={`text-[10px] ${vector.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' : vector.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'}`}>
                          {vector.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
            </CardContent>
          </Card>
        </div>

        {/* Center: Adversarial Insights */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adversarial Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg mb-3" />)
                : insights.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 mb-3">
                      <div className="mt-0.5">{getInsightIcon(item.type, item.severity)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.description}</p>
                        <Badge className={`mt-1.5 text-[10px] ${getInsightBadge(item.type, item.severity)}`}>
                          {item.type.toUpperCase()} · {item.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
            </CardContent>
          </Card>

          {/* Simulation Timeline */}
          {simulationResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Simulation Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {simulationResult.timeline.map((phase, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`size-3 rounded-full mt-1 ${phase.status === 'completed' ? 'bg-green-500' : phase.status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                        {i < simulationResult.timeline.length - 1 && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 my-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-xs font-mono text-slate-400">Phase {phase.phase}</p>
                        <p className="text-sm mt-0.5">{phase.attacks} attacks · {phase.blocked} blocked · {phase.success} bypassed</p>
                        <Badge className={`mt-1 text-[10px] ${phase.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'}`}>
                          {phase.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Past Simulations + Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Past Simulations</CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg mb-3" />)
                : pastSimulations.map((sim) => (
                    <div key={sim.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{sim.name}</span>
                        <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">{sim.status}</Badge>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500">
                        <span>{sim.attacksRun} run</span>
                        <span className="text-green-600">{sim.blocked} blocked</span>
                        <span className="text-red-600">{sim.success} bypassed</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(sim.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
            </CardContent>
          </Card>

          {/* Summary Card */}
          {summary && (
            <Card className="bg-gradient-to-br from-slate-50 dark:from-slate-900 to-transparent">
              <CardHeader>
                <CardTitle className="text-base">Simulation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="relative w-24 h-24 mx-auto">
                    <svg className="w-24 h-24" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={summary.blockRate >= 80 ? '#22c55e' : summary.blockRate >= 60 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${summary.blockRate}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{summary.blockRate}%</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{summary.blockedAttacks}</p>
                    <p className="text-[10px] text-slate-500">BLOCKED</p>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <p className="text-lg font-bold text-red-600">{summary.successfulAttacks}</p>
                    <p className="text-[10px] text-slate-500">BYPASSED</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
