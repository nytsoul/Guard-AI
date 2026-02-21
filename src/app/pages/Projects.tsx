import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { FolderPlus, MoreVertical, Settings, Copy, Eye } from 'lucide-react';

export function Projects() {
  const projects = [
    {
      id: 1,
      name: 'Enterprise-LLM-01',
      description: 'Primary production gateway for internal knowledge base LLM.',
      environment: 'Production',
      status: 'Healthy',
      uptime: 98.4,
      totalRequests: 128402,
      blockedAttempts: 1244,
      securityScore: 98.2,
      lastUpdated: '2 days ago',
      apiKey: 'sk-••••••••••••••••'
    },
    {
      id: 2,
      name: 'Development-RAG-V2',
      description: 'Staging environment for RAG document processor',
      environment: 'Staging',
      status: 'Healthy',
      uptime: 97.1,
      totalRequests: 45231,
      blockedAttempts: 342,
      securityScore: 96.8,
      lastUpdated: '5 mins ago',
      apiKey: 'sk-••••••••••••••••'
    },
    {
      id: 3,
      name: 'Customer-Support-LLM',
      description: 'External facing customer support chatbot gateway',
      environment: 'Production',
      status: 'Healthy',
      uptime: 99.9,
      totalRequests: 892123,
      blockedAttempts: 12421,
      securityScore: 94.1,
      lastUpdated: '1 hour ago',
      apiKey: 'sk-••••••••••••••••'
    }
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage all your LLM gateway projects and deployments
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
          <FolderPlus className="size-4" />
          New Project
        </Button>
      </div>

      <div className="grid gap-6">
        {projects.map((project) => (
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
                  <CardDescription>{project.description}</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Project Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Requests</p>
                    <p className="text-2xl font-bold">{(project.totalRequests / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Blocked Attacks</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{project.blockedAttempts}</p>
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
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium">Healthy</span>
                    </div>
                  </div>
                </div>

                {/* API Key Section */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Project API Key</p>
                      <p className="font-mono text-sm">{project.apiKey}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="size-4" />
                    Configuration
                  </Button>
                  <Button variant="outline" size="sm">
                    Security Audit
                  </Button>
                  <Button variant="outline" size="sm">
                    View Logs
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                    Retrieve Key
                  </Button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">Last updated: {project.lastUpdated}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
