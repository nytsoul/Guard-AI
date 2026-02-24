import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import {
  FolderPlus, MoreVertical, Settings, Copy, Eye, EyeOff, RefreshCw,
  Shield, Activity, Zap, Server, Search, TrendingUp, AlertTriangle, ExternalLink,
  ChevronRight, Clock, Globe, Key, Layers, BarChart3, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

interface Project {
  id: string;
  name: string;
  environment: string;
  apiKey?: string;
  status: string;
  uptime: number;
  totalRequests: number;
  blockedAttempts: number;
  securityScore: number;
  createdAt?: string;
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectEnv, setNewProjectEnv] = useState('Production');
  const [newProjectApiKey, setNewProjectApiKey] = useState('');
  const [creating, setCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnv, setFilterEnv] = useState<string>('All');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const data = await api.projects.getAll() as { projects: Project[]; total: number };
      setProjects(data.projects);
    } catch (err) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Project name is required');
      return;
    }
    setCreating(true);
    try {
      const newProject = await api.projects.create({
        name: newProjectName,
        environment: newProjectEnv,
        apiKey: newProjectApiKey || undefined,
      }) as Project;
      setProjects(prev => [...prev, newProject]);
      setShowNewProjectDialog(false);
      setNewProjectName('');
      setNewProjectApiKey('');
      toast.success(`Project "${newProject.name}" created successfully`);
    } catch (err) {
      toast.error('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await api.projects.delete(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setShowDeleteDialog(null);
      toast.success('Project deleted successfully');
    } catch (err) {
      toast.error('Failed to delete project');
      setShowDeleteDialog(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    });
  };

  const toggleKeyVisibility = (projectId: string) => {
    setVisibleKeys(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  };

  const getApiKey = (project: Project) => {
    return project.apiKey || `sk_live_${project.id.padEnd(32, 'x')}`;
  };

  const maskApiKey = (project: Project) => {
    const key = getApiKey(project);
    return visibleKeys[project.id] ? key : `${key.slice(0, 7)}${'•'.repeat(16)}`;
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return { color: 'text-emerald-500', bg: 'bg-emerald-500', ring: 'ring-emerald-500/20', label: 'Healthy', pulse: true };
      case 'initializing': return { color: 'text-blue-500', bg: 'bg-blue-500', ring: 'ring-blue-500/20', label: 'Initializing', pulse: true };
      case 'degraded': return { color: 'text-amber-500', bg: 'bg-amber-500', ring: 'ring-amber-500/20', label: 'Degraded', pulse: false };
      default: return { color: 'text-slate-400', bg: 'bg-slate-400', ring: 'ring-slate-400/20', label: status || 'Unknown', pulse: false };
    }
  };

  const getEnvConfig = (env: string) => {
    switch (env?.toLowerCase()) {
      case 'production': return { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: Globe };
      case 'staging': return { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Layers };
      case 'development': return { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Server };
      default: return { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Server };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-emerald-500';
    if (score >= 85) return 'text-blue-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 95) return 'stroke-emerald-500';
    if (score >= 85) return 'stroke-blue-500';
    if (score >= 70) return 'stroke-amber-500';
    return 'stroke-red-500';
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEnv = filterEnv === 'All' || p.environment === filterEnv;
    return matchesSearch && matchesEnv;
  });

  const environments = ['All', ...new Set(projects.map(p => p.environment))];

  // Summary stats
  const totalRequests = projects.reduce((sum, p) => sum + (p.totalRequests || 0), 0);
  const totalBlocked = projects.reduce((sum, p) => sum + (p.blockedAttempts || 0), 0);
  const avgScore = projects.length
    ? Math.round(projects.reduce((sum, p) => sum + (p.securityScore || 0), 0) / projects.length * 10) / 10
    : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your LLM gateway deployments and monitor security posture across environments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchProjects(); }} className="gap-2 text-slate-600 dark:text-slate-300">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20"
            onClick={() => setShowNewProjectDialog(true)}
          >
            <FolderPlus className="size-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="p-2.5 rounded-lg bg-blue-500/10">
            <Layers className="size-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{projects.length}</p>
            <p className="text-xs text-slate-500">Total Projects</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="p-2.5 rounded-lg bg-emerald-500/10">
            <Activity className="size-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{(totalRequests / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-slate-500">Total Requests</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="p-2.5 rounded-lg bg-red-500/10">
            <AlertTriangle className="size-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{(totalBlocked / 1000).toFixed(1)}k</p>
            <p className="text-xs text-slate-500">Threats Blocked</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          <div className="p-2.5 rounded-lg bg-purple-500/10">
            <Shield className="size-5 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{avgScore}</p>
            <p className="text-xs text-slate-500">Avg. Security Score</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search projects by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
          {environments.map(env => (
            <button
              key={env}
              onClick={() => setFilterEnv(env)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filterEnv === env
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading
          ? Array(3).fill(0).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {Array(4).fill(0).map((_, j) => <Skeleton key={j} className="h-16 rounded-lg" />)}
                </div>
                <Skeleton className="h-12 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))
          : filteredProjects.map((project) => {
            const statusCfg = getStatusConfig(project.status);
            const envCfg = getEnvConfig(project.environment);
            const EnvIcon = envCfg.icon;
            const isExpanded = expandedCard === project.id;

            return (
              <div
                key={project.id}
                className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/5 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5"
              >
                {/* Top accent gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                {/* Card Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="text-lg font-semibold truncate">{project.name}</h3>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${envCfg.bg} ${envCfg.color} border ${envCfg.border}`}>
                          <EnvIcon className="size-3" />
                          {project.environment}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono">{project.id}</span>
                        <span className="flex items-center gap-1">
                          <div className={`size-1.5 rounded-full ${statusCfg.bg} ${statusCfg.pulse ? 'animate-pulse' : ''}`} />
                          <span className={statusCfg.color}>{statusCfg.label}</span>
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      onClick={() => setExpandedCard(isExpanded ? null : project.id)}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </div>

                  {/* Security Score + Metrics Row */}
                  <div className="flex items-center gap-4 mt-4">
                    {/* Circular Score */}
                    <div className="relative flex-shrink-0">
                      <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
                        <circle
                          cx="32" cy="32" r="28" fill="none" strokeWidth="4" strokeLinecap="round"
                          strokeDasharray={`${(project.securityScore / 100) * 175.9} 175.9`}
                          className={`${getScoreRingColor(project.securityScore)} transition-all duration-1000`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-sm font-bold ${getScoreColor(project.securityScore)}`}>
                          {project.securityScore}
                        </span>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-1">
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Requests</p>
                        <p className="text-lg font-semibold">{(project.totalRequests / 1000).toFixed(0)}k</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Blocked</p>
                        <p className="text-lg font-semibold text-red-600 dark:text-red-400">{project.blockedAttempts.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Uptime</p>
                        <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{project.uptime}%</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Block Rate</p>
                        <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                          {project.totalRequests ? ((project.blockedAttempts / project.totalRequests) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* API Key Section */}
                <div className="mx-5 mb-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Key className="size-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-xs truncate text-slate-600 dark:text-slate-300">{maskApiKey(project)}</span>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                      <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => toggleKeyVisibility(project.id)}>
                        {visibleKeys[project.id] ? <EyeOff className="size-3.5 text-slate-400" /> : <Eye className="size-3.5 text-slate-400" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => copyToClipboard(getApiKey(project), 'API Key')}>
                        <Copy className="size-3.5 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Footer */}
                <div className="px-5 pb-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800"
                  >
                    <Settings className="size-3.5" /> Config
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800"
                  >
                    <BarChart3 className="size-3.5" /> Metrics
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 h-8 px-2.5 border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800"
                    onClick={() => setShowDeleteDialog(project.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

        {/* Add New Project Card */}
        {!loading && (
          <button
            onClick={() => setShowNewProjectDialog(true)}
            className="group relative rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 min-h-[280px] flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
          >
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
              <FolderPlus className="size-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Create New Project
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Set up a new LLM gateway</p>
            </div>
          </button>
        )}
      </div>

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && projects.length > 0 && (
        <div className="text-center py-12">
          <Search className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No projects match your search</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                <FolderPlus className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription className="mt-0.5">Set up a new LLM gateway with Sentinel Shield protection.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="project-name" className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g. Customer Support LLM"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">Environment</Label>
              <div className="grid grid-cols-3 gap-2">
                {['Production', 'Staging', 'Development'].map(env => {
                  const cfg = getEnvConfig(env);
                  const EnvIcon = cfg.icon;
                  return (
                    <button
                      key={env}
                      onClick={() => setNewProjectEnv(env)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all ${newProjectEnv === env
                          ? `${cfg.bg} ${cfg.color} ${cfg.border} border-current shadow-sm`
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                    >
                      <EnvIcon className="size-4" />
                      {env}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-api-key" className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                API Key <span className="text-slate-400 font-normal normal-case">(optional — auto-generated if blank)</span>
              </Label>
              <Input
                id="project-api-key"
                placeholder="sk_live_... or leave blank"
                value={newProjectApiKey}
                onChange={(e) => setNewProjectApiKey(e.target.value)}
                className="font-mono text-sm bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div className="flex gap-3 pt-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowNewProjectDialog(false); setNewProjectApiKey(''); }}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20"
                onClick={handleCreateProject}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              This will permanently remove the project, its API keys, and all associated security logs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => showDeleteDialog && handleDeleteProject(showDeleteDialog)}
            >
              Delete Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
