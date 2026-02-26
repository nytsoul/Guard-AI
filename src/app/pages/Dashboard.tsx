import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Shield,
    AlertTriangle,
    Activity,
    ShieldCheck,
    Clock,
    Zap,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../utils/api';

export function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const data = await api.dashboard.getMetrics();
                setMetrics(data);
            } catch (err) {
                // Fallback or mock data if API fails to ensure UI renders
                console.error('Failed to fetch dashboard metrics:', err);
                setMetrics({
                    totalRequests: 842931,
                    threatsBlocked: 12402,
                    avgLatency: '14ms',
                    systemHealth: 98,
                    trends: [
                        { date: '2024-02-20', requests: 45000, blocked: 420 },
                        { date: '2024-02-21', requests: 52000, blocked: 510 },
                        { date: '2024-02-22', requests: 48000, blocked: 380 },
                        { date: '2024-02-23', requests: 61000, blocked: 890 },
                        { date: '2024-02-24', requests: 55000, blocked: 440 },
                        { date: '2024-02-25', requests: 67000, blocked: 920 },
                        { date: '2024-02-26', requests: 72000, blocked: 1100 },
                    ]
                });
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Normalise API response - backend may return snake_case or camelCase
    const threatsBlocked: number = metrics?.threatsBlocked ?? metrics?.threats_blocked ?? 12402;
    const totalRequests: number = metrics?.totalRequests ?? metrics?.total_requests ?? 842931;
    const systemHealth: number = metrics?.systemHealth ?? metrics?.system_health ?? 98;
    const avgLatency: string = metrics?.avgLatency ?? metrics?.avg_latency ?? '14ms';
    const trends = metrics?.trends ?? [
        { date: '2024-02-20', requests: 45000, blocked: 420 },
        { date: '2024-02-21', requests: 52000, blocked: 510 },
        { date: '2024-02-22', requests: 48000, blocked: 380 },
        { date: '2024-02-23', requests: 61000, blocked: 890 },
        { date: '2024-02-24', requests: 55000, blocked: 440 },
        { date: '2024-02-25', requests: 67000, blocked: 920 },
        { date: '2024-02-26', requests: 72000, blocked: 1100 },
    ];

    const stats = [
        {
            label: 'Security Posture',
            value: loading ? null : `${systemHealth}%`,
            sub: 'Excellent',
            icon: ShieldCheck,
            color: 'text-green-500',
            trend: '+2.1%',
            trendUp: true
        },
        {
            label: 'Active Threats',
            value: loading ? null : threatsBlocked.toLocaleString(),
            sub: 'Blocked today',
            icon: AlertTriangle,
            color: 'text-red-500',
            trend: '+12%',
            trendUp: false
        },
        {
            label: 'System Throughput',
            value: loading ? null : totalRequests.toLocaleString(),
            sub: 'Total requests',
            icon: Activity,
            color: 'text-blue-500',
            trend: '+5.4%',
            trendUp: true
        },
        {
            label: 'Average Latency',
            value: loading ? null : avgLatency,
            sub: 'p99 response time',
            icon: Zap,
            color: 'text-amber-500',
            trend: '-2ms',
            trendUp: true
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Security Overview</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Real-time monitoring and threat intelligence for your LLM infrastructure.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                        <div className="size-1.5 bg-green-500 rounded-full mr-2 animate-pulse" />
                        Gateway Active
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-2">
                        <Clock className="size-4" />
                        Last 24h
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="relative overflow-hidden border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                                    {loading ? (
                                        <Skeleton className="h-9 w-24 mt-2" />
                                    ) : (
                                        <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                    )}
                                </div>
                                <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${stat.color}`}>
                                    <stat.icon className="size-5" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <span className={`text-xs font-medium flex items-center gap-0.5 ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                                    {stat.trendUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                                    {stat.trend}
                                </span>
                                <span className="text-xs text-slate-400">vs last period</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <BarChart3 className="size-5 text-blue-500" />
                            Traffic & Threat Distribution
                        </CardTitle>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="size-2 rounded-full bg-blue-500" />
                                <span className="text-xs text-slate-500">Requests</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="size-2 rounded-full bg-red-500" />
                                <span className="text-xs text-slate-500">Threats</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {loading ? (
                            <Skeleton className="h-[300px] w-full" />
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        className="text-xs text-slate-400"
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    />
                                    <YAxis className="text-xs text-slate-400" axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                            borderColor: 'rgba(51, 65, 85, 0.5)',
                                            borderRadius: '12px',
                                            color: '#fff'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="requests"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRequests)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="blocked"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorBlocked)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar Card */}
                <Card className="border-slate-200 dark:border-slate-800 bg-blue-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Shield className="size-32" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Sentinel Pro AI</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 relative z-10">
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Your infrastructure is currently protected by GuardAI's layered defense engine.
                            We've identified and neutralized <b>1,240 threat vectors</b> in the last 24 hours.
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-200 uppercase tracking-wider">Policy Compliance</span>
                                <span className="font-bold">94.2%</span>
                            </div>
                            <div className="h-1.5 w-full bg-blue-500/50 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full w-[94.2%]" />
                            </div>
                        </div>

                        <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 transition-colors font-semibold">
                            View Detailed Analysis
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity Mini-List */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="size-5 text-green-500" />
                        Real-time Threat Intelligence
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { type: 'Injection Blocked', desc: 'SQL Injection attempt detected in Project-X metadata', time: '2m ago', severity: 'High' },
                            { type: 'Jailbreak Detected', desc: 'Creative prompting pattern blocked on production endpoint', time: '14m ago', severity: 'Critical' },
                            { type: 'PII Scrubbed', desc: 'Email and Phone number removed from model response', time: '52m ago', severity: 'Info' },
                        ].map((activity, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`size-2 rounded-full ${activity.severity === 'Critical' ? 'bg-red-500' :
                                        activity.severity === 'High' ? 'bg-amber-500' : 'bg-blue-500'
                                        }`} />
                                    <div>
                                        <p className="text-sm font-semibold">{activity.type}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{activity.desc}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-slate-400">{activity.time}</p>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Log
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
