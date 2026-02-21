import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export function PolicyConfig() {
  const [blockHighRisk, setBlockHighRisk] = useState(true);
  const [blockMediumRisk, setBlockMediumRisk] = useState(true);
  const [enableOutputScanning, setEnableOutputScanning] = useState(true);
  const [enableToolGuard, setEnableToolGuard] = useState(false);
  const [piRedaction, setPiRedaction] = useState(true);
  const [sensitivity, setSensitivity] = useState([75]);
  const [forbiddenPhrases, setForbiddenPhrases] = useState('malware 🔧\nexploit 📁\n|jailbreak 🔓\nsystem prompt 📌');

  const handleSave = () => {
    toast.success('Policy configuration saved successfully');
  };

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Security Posture Configuration</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Define how the proxy handles incoming prompts and outgoing LLM responses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Firewall Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Input Firewall (Inbound)
              </CardTitle>
              <CardDescription>Filters and sanitizes user prompts before they reach the LLM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Block High-Risk Prompts */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Block High-risk Prompts
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Automatically reject prompts with clear injection or jailbreak patterns
                  </p>
                </div>
                <Switch checked={blockHighRisk} onCheckedChange={setBlockHighRisk} />
              </div>

              {/* Block Medium-Risk Prompts */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Block Medium-risk Prompts
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Flag and reject prompts that use indirect jailbreaking techniques or social engineering
                  </p>
                </div>
                <Switch checked={blockMediumRisk} onCheckedChange={setBlockMediumRisk} />
              </div>
            </CardContent>
          </Card>

          {/* Output Guard Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                Output Filter & Tool Guard
              </CardTitle>
              <CardDescription>Controls what the model is allowed to return to the user or external tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable Output Scanning */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Enable Output Scanning
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Scan LLM responses for PII, handles forbidden content, and unauthorized tools
                  </p>
                </div>
                <Switch checked={enableOutputScanning} onCheckedChange={setEnableOutputScanning} />
              </div>

              {/* Enable Tool Guard */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Enable Tool Guard
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Enforce output validation and permission checks on all outgoing function calls
                  </p>
                </div>
                <Switch checked={enableToolGuard} onCheckedChange={setEnableToolGuard} />
              </div>

              {/* PII Redaction */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    PII Redaction
                  </Label>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Automatically mask phone numbers, emails, and SSNs in responses
                  </p>
                </div>
                <Switch checked={piRedaction} onCheckedChange={setPiRedaction} />
              </div>
            </CardContent>
          </Card>

          {/* Detection Sensitivity Slider */}
          <Card>
            <CardHeader>
              <CardTitle>Detection Sensitivity</CardTitle>
              <CardDescription>Adjust how aggressively threats are detected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Sensitivity Level</Label>
                  <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                    {sensitivity[0] > 80 ? 'STRICT' : sensitivity[0] > 50 ? 'BALANCED' : 'PERMISSIVE'}
                  </Badge>
                </div>
                <Slider
                  value={sensitivity}
                  onValueChange={setSensitivity}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>PERMISSIVE</span>
                  <span>BALANCED</span>
                  <span>STRICT</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Global Forbidden Phrases */}
          <Card>
            <CardHeader>
              <CardTitle>Global Forbidden Phrases</CardTitle>
              <CardDescription>
                Any prompt containing these keywords will be immediately blocked regardless of context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={forbiddenPhrases}
                  onChange={(e) => setForbiddenPhrases(e.target.value)}
                  placeholder="Enter phrases to block (one per line)..."
                  rows={4}
                  className="font-mono text-sm"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {forbiddenPhrases.split('\n').filter(p => p.trim()).map((phrase, i) => (
                    <Badge key={i} variant="secondary" className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                      {phrase}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Deploy Changes Section */}
          <Card className="bg-gradient-to-br from-blue-50 dark:from-blue-950/20 to-transparent border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-base">Deploy Changes</CardTitle>
              <CardDescription>Finalize policy updates to all LLM nodes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                <Save className="size-4" />
                Save & Deploy Policy
              </Button>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Will be applied within 15 seconds to all proxy nodes
              </p>
            </CardContent>
          </Card>

          {/* Audit Note */}
          <Card className="bg-slate-50 dark:bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-base">Audit NOTE</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Describe why these changes are being made
              </p>
              <Textarea
                placeholder="Add rationale for these policy changes..."
                rows={3}
                className="mt-2 text-xs"
              />
            </CardContent>
          </Card>

          {/* Policy Optimizer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Policy Optimizer</CardTitle>
              <CardDescription>Analysis-driven improvements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <CheckCircle2 className="size-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Your current sensitivity (75%) combined with High-Risk: BLOCKED is excellent for most workloads.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Benchmark: 99.2% of common threats detected with minimal false positives
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Change Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <div>
                    <p className="font-medium">v2.4.1</p>
                    <p className="text-slate-500 dark:text-slate-400">Yesterday by admin_user</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <div>
                    <p className="font-medium">v2.4.0</p>
                    <p className="text-slate-500 dark:text-slate-400">Oct 26, 2023 by alex_smith</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <div>
                    <p className="font-medium">v2.3.9</p>
                    <p className="text-slate-500 dark:text-slate-400">Oct 24, 2023 by alex_admin</p>
                  </div>
                </div>
              </div>
              <Button variant="link" className="text-blue-600 hover:text-blue-700 text-xs mt-3">
                View Full Audit Trail →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
