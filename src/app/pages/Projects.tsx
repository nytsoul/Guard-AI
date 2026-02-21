import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { FolderPlus, MoreVertical, Settings, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

interface Project {
  id: string;
  name: string;
  environment: string;
  status: string;
  uptime: number;
  totalRequests: number;
  blockedAttempts: number;
  securityScore: number;
}

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectEnv, setNewProjectEnv] = useState('Production');
  const [creating, setCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

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
      const newProject = await api.projects.create({ name: newProjectName, environment: newProjectEnv }) as Project;
      setProjects(prev => [...prev, newProject]);
      setShowNewProjectDialog(false);
      setNewProjectName('');
      toast.success(`Project "${newProject.name}" created successfully`);
    } catch (err) {
      toast.error('Failed to create project');
    } finally {
      setCreating(false);
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

  const maskApiKey = (projectId: string) => {
    return visibleKeys[projectId] ? `sk_live_${projectId.padEnd(32, 'x')}` : 'sk-••••••••••••••••';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'bg-green-500';
      case 'initializing': return 'bg-blue-500';
      case 'degraded': return 'bg-yellow-500';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage all your LLM gateway projects and deployments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchProjects} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => setShowNewProjectDialog(true)}>
            <FolderPlus className="size-4" />
            New Project
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {loading
          ? Array(2).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-4">
                  <Skeleton className="h-7 w-48 mb-2" />
                  <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4 mb-4">
                    {Array(5).fill(0).map((_, j) => <Skeleton key={j} className="h-16 rounded-lg" />)}
                  </div>
                  <Skeleton className="h-14 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))
          : projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{project.name}</CardTitle>
                        <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                          {project.environment}
                        </Badge>
                      </div>
                      <CardDescription>
                        Gateway ID: <span className="font-mono">{project.id}</span>
                      </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Requests</p>
                        <p className="text-2xl font-bold">{(project.totalRequests / 1000).toFixed(0)}k</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Blocked Attacks</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{project.blockedAttempts.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Security Score</p>
                        <p className="text-2xl font-bold">{project.securityScore}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Uptime</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{project.uptime}%</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Status</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                          <span className="text-sm font-medium">{project.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Project API Key</p>
                          <p className="font-mono text-sm">{maskApiKey(project.id)}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(project.id)}
                            title={visibleKeys[project.id] ? 'Hide key' : 'Show key'}
                          >
                            {visibleKeys[project.id] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(maskApiKey(project.id), 'API Key')}
                          >
                            <Copy className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="size-4" />
                        Configuration
                      </Button>
                      <Button variant="outline" size="sm">
                        Security Audit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(project.id, 'Project ID')}
                      >
                        Copy ID
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Set up a new LLM gateway project with Sentinel Shield protection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                placeholder="e.g. Customer Support LLM"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-env">Environment</Label>
              <select
                id="project-env"
                value={newProjectEnv}
                onChange={(e) => setNewProjectEnv(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm bg-transparent"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Development">Development</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewProjectDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleCreateProject}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Project'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
