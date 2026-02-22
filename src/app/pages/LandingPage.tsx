import { useNavigate } from 'react-router';
import { Shield, Lock, Zap, Eye, Server, ArrowRight, CheckCircle, ChevronRight, Globe, Layers, ShieldCheck, BarChart3, Moon, Sun } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Footer } from '../components/Footer';
import { useTheme } from '../contexts/ThemeContext';

const features = [
  {
    icon: Lock,
    title: 'Input Firewall',
    description: 'Intercepts and neutralizes prompt injection attacks, jailbreak attempts, and malicious payloads in real-time before they reach your LLM.',
  },
  {
    icon: Eye,
    title: 'Output Guard',
    description: 'Monitors and sanitizes model responses to prevent data leakage, hallucination propagation, and policy-violating content from reaching end users.',
  },
  {
    icon: Zap,
    title: 'Red Team Simulation',
    description: 'Continuously probes your defenses with 1,200+ adversarial attack vectors to identify vulnerabilities before malicious actors discover them.',
  },
  {
    icon: Server,
    title: 'RAG Scanner',
    description: 'Deep-scans your Retrieval-Augmented Generation pipeline for data poisoning, unauthorized access patterns, and embedding manipulation threats.',
  },
  {
    icon: ShieldCheck,
    title: 'Policy Engine',
    description: 'Granular, customizable security policies with sensitivity controls, forbidden phrase detection, and automated compliance enforcement.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reporting',
    description: 'Real-time dashboards, threat intelligence feeds, and automated compliance reports with SOC2, HIPAA, and GDPR coverage.',
  },
];

const stats = [
  { value: '99.97%', label: 'Uptime SLA' },
  { value: '< 12ms', label: 'Avg. Latency' },
  { value: '2.4M+', label: 'Threats Blocked' },
  { value: '500+', label: 'Enterprise Clients' },
];

const trustedLogos = ['OpenAI', 'Anthropic', 'Google', 'Meta', 'Microsoft', 'AWS'];

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <Shield className="size-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900 dark:text-white">GuardAI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#stats" className="hover:text-slate-900 dark:hover:text-white transition-colors">Why Us</a>
            <a href="#trusted" className="hover:text-slate-900 dark:hover:text-white transition-colors">Trusted By</a>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate('/login')}
            >
              Get Started <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Gradient background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8">
            <ShieldCheck className="size-4" />
            Trusted by 500+ Enterprise Teams
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            Secure Your{' '}
            <span className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 dark:from-blue-400 dark:via-blue-500 dark:to-indigo-500 bg-clip-text text-transparent">
              LLM Infrastructure
            </span>
            <br />
            With Layered Defenses
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Enterprise-grade security middleware that sits between your applications and LLM providers.
            Detect, block, and report threats in real-time with zero latency overhead.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white text-base px-8 py-6 rounded-xl shadow-lg shadow-blue-600/20"
              onClick={() => navigate('/login')}
            >
              Start Free Trial <ArrowRight className="size-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-base px-8 py-6 rounded-xl"
              onClick={() => navigate('/login')}
            >
              View Live Demo
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="size-4 text-green-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="size-4 text-green-500" /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="size-4 text-green-500" /> SOC2 Compliant</span>
          </div>
        </div>

        {/* Hero visual - terminal mock */}
        <div className="max-w-4xl mx-auto mt-16 relative z-10">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 shadow-2xl overflow-hidden backdrop-blur">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-yellow-500/80" />
                <div className="size-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-slate-500 ml-2 font-mono">guardai-console</span>
            </div>
            <div className="p-6 font-mono text-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">$</span>
                <span className="text-slate-700 dark:text-slate-300">guardai init --project enterprise-llm</span>
              </div>
              <div className="text-slate-500">✓ Connected to gateway proxy...</div>
              <div className="text-slate-500">✓ Input firewall activated (12 rules loaded)</div>
              <div className="text-slate-500">✓ Output guard configured (PII, toxicity, hallucination)</div>
              <div className="text-slate-500">✓ Red team vectors loaded (1,247 attack patterns)</div>
              <div className="text-blue-600 dark:text-blue-400">✓ Sentinel Shield is protecting your LLM infrastructure</div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">$</span>
                <span className="text-slate-400 animate-pulse">_</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 border-y border-slate-200 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-medium mb-4">
              <Layers className="size-3" /> PLATFORM CAPABILITIES
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Complete Security Coverage for Your AI Stack
            </h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Six integrated defense layers working together to protect every aspect of your LLM infrastructure, from input to output and everything in between.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
              >
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 w-fit mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                <div className="mt-4 flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ChevronRight className="size-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section id="trusted" className="py-16 px-6 border-t border-slate-200 dark:border-slate-800/60">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-8">Trusted by teams securing models from</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {trustedLogos.map((name) => (
              <div key={name} className="flex items-center gap-2 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                <Globe className="size-5" />
                <span className="text-lg font-semibold">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-12 md:p-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Ready to Secure Your LLM Infrastructure?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto mb-8">
              Deploy Sentinel Shield in minutes with zero changes to your existing architecture.
              Start protecting against prompt injection, data leakage, and adversarial attacks today.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-base px-8 py-6 rounded-xl"
                onClick={() => navigate('/login')}
              >
                Get Started for Free <ArrowRight className="size-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-base px-8 py-6 rounded-xl"
              >
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
