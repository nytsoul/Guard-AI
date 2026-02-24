import { Outlet, Link, useLocation } from 'react-router';
import { Shield, LayoutDashboard, FileText, Settings, ScanSearch, Swords, MessageSquare, FolderKanban, Moon, Sun, LogOut, BarChart3 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Footer } from './Footer';

export function Layout() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
    { path: '/logs', icon: FileText, label: 'Attack Logs' },
    { path: '/policy', icon: Settings, label: 'Policy Config' },
    { path: '/rag-scanner', icon: ScanSearch, label: 'RAG Scanner' },
    { path: '/red-team', icon: Swords, label: 'Red Team' },
    { path: '/chat-demo', icon: MessageSquare, label: 'Chat Demo' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <Shield className="size-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">GuardAI</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enterprise LLM Security</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <item.icon className="size-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-600 dark:text-slate-400">Theme</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0"
            >
              {theme === 'light' ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-sm"
            onClick={() => {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('user_email');
              window.location.href = '/login';
            }}
          >
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen flex flex-col">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>GuardAI</span>
                  <span>/</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {navItems.find(item => item.path === location.pathname)?.label || 'Home'}
                  </span>
                </div>
                <h2 className="font-semibold text-xl">
                  {navItems.find(item => item.path === location.pathname)?.label || 'GuardAI'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-400 text-xs font-medium flex items-center gap-1.5">
                  <div className="size-2 bg-green-500 rounded-full" />
                  All Systems Operational
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 flex-1">
          <Outlet />
        </div>
        <Footer variant="app" />
      </main>
    </div>
  );
}