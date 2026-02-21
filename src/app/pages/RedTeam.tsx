import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Swords, Play, ShieldAlert, Target, Bug, Lock, AlertTriangle, CheckCircle2, XCircle, Terminal } from 'lucide-react';
import { generateRedTeamTests, analyzePrompt } from '../utils/security';
import { toast } from 'sonner';

interface TestResult {
  prompt: string;
  expectedThreat: string;
  detected: boolean;
  blocked: boolean;
  riskScore: number;
  actualThreat: string;
}

export function RedTeam() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [attackIntensity, setAttackIntensity] = useState([65]);
  const [batchSize, setBatchSize] = useState([25]);
  const [vectors, setVectors] = useState({
    jailbreaking: true,
    piiHarvesting: true,
    modelPoisoning: false,
    authBypass: true,
  });
  const [summary, setSummary] = useState<{
    total: number; blocked: number; passed: number; failed: number; score: number;
  } | null>(null);

  const runRedTeamTest = async () => {
    setRunning(true);
    setProgress(0);
    setResults([]);
    setSummary(null);

    const tests = generateRedTeamTests();
    const testResults: TestResult[] = [];
    const policy = { blockHigh: true, blockMedium: false, sensitivity: attackIntensity[0] / 100 };

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      await new Promise(resolve => setTimeout(resolve, 400));
      const analysis = analyzePrompt(test.prompt, policy);
      testResults.push({
        prompt: test.prompt,
        expectedThreat: test.expectedThreat,
        detected: analysis.attackType !== 'none',
        blocked: analysis.blocked,
        riskScore: analysis.riskScore,
        actualThreat: analysis.attackType
      });
      setProgress(((i + 1) / tests.length) * 100);
      setResults([...testResults]);
    }

    const blocked = testResults.filter(r => r.blocked && r.expectedThreat !== 'none').length;
    const shouldBlock = testResults.filter(r => r.expectedThreat !== 'none').length;
    const passed = blocked;
    const failed = shouldBlock - blocked;
    const score = shouldBlock > 0 ? Math.round((blocked / shouldBlock) * 100) : 100;
    setSummary({ total: testResults.length, blocked, passed, failed, score });
    setRunning(false);
    toast.success('Red team simulation complete');
  };

  // Adversarial insights data
  const insights = [
    { label: 'Jailbreak via role-play persona switch', status: 'blocked', color: 'text-red-500' },
    { label: 'Multi-step prompt chaining for data exfil', status: 'filtered', color: 'text-amber-500' },
    { label: 'Token limit overflow to bypass guardrails', status: 'vulnerable', color: 'text-red-600' },
    { label: 'PII extraction via indirect prompt injection', status: 'blocked', color: 'text-red-500' },
    { label: 'System prompt leak via encoding tricks', status: 'blocked', color: 'text-red-500' },
  ];

  // Timeline data
  const timeline = [
    { time: '14:01:22', event: 'Injected adversarial prompt batch #1', status: 'executed' },
    { time: '14:01:24', event: 'Jailbreak attempt detected & blocked', status: 'blocked' },
    { time: '14:01:27', event: 'PII harvesting vector deployed', status: 'executed' },
    { time: '14:01:29', event: 'Auth bypass payload — BLOCKED', status: 'blocked' },
    { time: '14:01:33', event: 'Model poisoning test — FILTERED', status: 'filtered' },
    { time: '14:01:35', event: 'Token overflow test initiated', status: 'executed' },
  ];

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
              Adversarial testing & security validation suite
            </p>
          </div>
        </div>
        <Button
          onClick={runRedTeamTest}
          disabled={running}
          className="gap-2 bg-red-600 hover:bg-red-700"
        >
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
                <p className="text-xs text-slate-500">GLOBAL SECURITY RATING</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{summary?.score ?? 87}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 dark:from-red-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bug className="size-5 text-red-500" />
              <div>
                <p className="text-xs text-slate-500">VULNERABLE ENDPOINTS</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary?.failed ?? 3}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="size-5 text-blue-500" />
              <div>
                <p className="text-xs text-slate-500">BLOCKED ATTACKS</p>
                <p className="text-3xl font-bold">{summary?.blocked ?? 42}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 dark:from-purple-950/20 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="size-5 text-purple-500" />
              <div>
                <p className="text-xs text-slate-500">TEST COVERAGE</p>
                <p className="text-3xl font-bold">94%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {running && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Simulation Progress</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Test Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Attack Intensity */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium">Attack Intensity</span>
                  <span className="text-sm text-slate-500">{attackIntensity[0]}%</span>
                </div>
                <Slider
                  value={attackIntensity}
                  onValueChange={setAttackIntensity}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Prompt Batch Size */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium">Prompt Batch Size</span>
                  <span className="text-sm text-slate-500">{batchSize[0]}</span>
                </div>
                <Slider
                  value={batchSize}
                  onValueChange={setBatchSize}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Attack Vectors */}
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
        </div>

        {/* Center: Test Results / Adversarial Insights */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adversarial Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                    <div className="mt-0.5">
                      {item.status === 'blocked' ? (
                        <XCircle className="size-4 text-red-500" />
                      ) : item.status === 'filtered' ? (
                        <AlertTriangle className="size-4 text-amber-500" />
                      ) : (
                        <Bug className="size-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{item.label}</p>
                      <Badge className={`mt-1 text-[10px] ${
                        item.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                        item.status === 'filtered' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                        'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Real-time test results */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Live Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {results.map((result, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border text-sm ${
                      result.blocked
                        ? 'border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20'
                        : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {result.blocked ? (
                          <CheckCircle2 className="size-3.5 text-green-600" />
                        ) : (
                          <XCircle className="size-3.5 text-red-600" />
                        )}
                        <span className="text-xs font-medium">Test #{idx + 1}</span>
                        <Badge variant="outline" className="text-[10px] ml-auto">
                          {result.expectedThreat.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{result.prompt}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Execution Timeline */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Execution Timeline</CardTitle>
                <Badge variant="outline" className="text-xs">Live</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`size-3 rounded-full mt-1 ${
                        item.status === 'blocked' ? 'bg-red-500' :
                        item.status === 'filtered' ? 'bg-amber-500' :
                        'bg-blue-500'
                      }`} />
                      {i < timeline.length - 1 && (
                        <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 my-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-xs font-mono text-slate-400">{item.time}</p>
                      <p className="text-sm mt-0.5">{item.event}</p>
                      <Badge className={`mt-1 text-[10px] ${
                        item.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                        item.status === 'filtered' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                      }`}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
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
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={summary.score >= 80 ? '#22c55e' : summary.score >= 60 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeDasharray={`${summary.score}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{summary.score}%</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{summary.passed}</p>
                    <p className="text-[10px] text-slate-500">BLOCKED</p>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <p className="text-lg font-bold text-red-600">{summary.failed}</p>
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