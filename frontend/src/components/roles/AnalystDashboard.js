import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getAnalytics, getGrievances } from '../../api';
import { 
  Users, AlertTriangle, PhoneCall, RefreshCw, 
  TrendingUp, TrendingDown, ShieldCheck, Activity,
  BrainCircuit, Network, Target, Zap, Lightbulb, BarChart2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const MetricCard = ({ label, value, icon: Icon, color, trend, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative group p-5 rounded-[2rem] bg-card border border-border overflow-hidden"
    >
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12">
            <Icon size={80} strokeWidth={1} />
        </div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="size-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-emerald-500 transition-colors border border-border">
                    <Icon size={14} strokeWidth={2.5} />
                </div>
                <p className="text-[9px] font-black uppercase tracking-[2px] text-muted-foreground">{label}</p>
            </div>
            
            <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">{value}</h3>
                    {trend && (
                        <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            trend.startsWith('+') 
                                ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' 
                                : 'text-rose-500 border-rose-500/20 bg-rose-500/5'
                        } uppercase tracking-widest`}>
                            {trend}
                        </div>
                    )}
                </div>
                <div className="h-1 w-8 bg-emerald-500/20 rounded-full group-hover:w-16 transition-all duration-500" />
            </div>
        </div>
    </motion.div>
);

export default function AnalystDashboard({ currentUser, boothId }) {
    const [stats, setStats] = useState(null);
    const [grievances, setGrievances] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                getAnalytics(boothId),
                getGrievances({ booth_id: boothId })
            ]);
            
            const [aRes, gRes] = results;
            
            setStats(aRes.status === 'fulfilled' ? aRes.value : null);
            setGrievances(gRes.status === 'fulfilled' ? gRes.value || [] : []);
            
            if (results.some(r => r.status === 'rejected')) {
                console.error("Analyst sync partial failure:", results.filter(r => r.status === 'rejected'));
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [boothId]);

    useEffect(() => { loadData(); }, [loadData]);

    // ⚠️ Must be above early returns — Rules of Hooks
    const chartData = useMemo(() => {
        const cats = {};
        grievances.forEach(g => {
            const cat = g.category || 'General';
            if (!cats[cat]) cats[cat] = { name: cat, resolved: 0, pending: 0, total: 0 };
            cats[cat].total += 1;
            if (g.status === 'resolved') cats[cat].resolved += 1;
            else cats[cat].pending += 1;
        });
        if (Object.keys(cats).length === 0 && stats) {
            return [
                { name: 'Pending', resolved: 0, pending: stats.pending_issues || 0, total: stats.pending_issues || 0 },
                { name: 'Resolved', resolved: stats.resolved_issues || 0, pending: 0, total: stats.resolved_issues || 0 },
            ];
        }
        return Object.values(cats).sort((a, b) => b.total - a.total).slice(0, 7);
    }, [grievances, stats]);

    if (loading) {
        return (
            <div className="py-40 text-center">
                <div className="relative size-32 mx-auto mb-10">
                    <div className="absolute inset-0 border-[6px] border-border rounded-full" />
                    <div className="absolute inset-0 border-[6px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-emerald-500">
                        <BrainCircuit size={48} className="animate-pulse" />
                    </div>
                </div>
                <h2 className="text-xl font-black text-foreground uppercase tracking-[8px] mb-4">Loading Data</h2>
                <div className="flex justify-center gap-1">
                    {[1,2,3].map(i => (
                        <motion.div 
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            className="size-1.5 rounded-full bg-emerald-500"
                        />
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="py-32 text-center bg-card rounded-[4rem] border border-border mx-auto max-w-2xl px-10">
                <div className="size-24 rounded-[2.5rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-10 shadow-2xl shadow-rose-500/20">
                    <AlertTriangle size={48} strokeWidth={3} />
                </div>
                <h4 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-4 leading-none">Connection Error</h4>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[4px] leading-relaxed">Unable to connect to database. Retrying soon...</p>
            </div>
        );
    }

    const sentTotal = Object.values(stats.sentiment_distribution || {}).reduce((a, b) => a + b, 0);
    const sentPcts = Object.entries(stats.sentiment_distribution || {}).map(([k, v]) => ({
        key: k, value: v, pct: sentTotal > 0 ? ((v / sentTotal) * 100).toFixed(1) : 0
    }));

    const SENTIMENT_CONFIG = { 
        positive: { color: 'text-emerald-600', bg: 'bg-emerald-600', label: 'Positive Trend', icon: TrendingUp },
        neutral: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'No Change', icon: Activity },
        negative: { color: 'text-rose-600', bg: 'bg-rose-600', label: 'Negative Trend', icon: TrendingDown }
    };

    return (
        <div className="space-y-8 pb-12 overflow-hidden">
            {/* Contextual Subheader - Compact */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="size-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">Booth Analytics</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[5px]">Booth ID: {boothId}</p>
                        <span className="size-1 rounded-full bg-border" />
                        <p className="text-emerald-500/50 text-[9px] font-black uppercase tracking-[3px]">Status: Updated</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={loadData} className="group relative px-6 py-3 bg-muted rounded-xl border border-border hover:border-emerald-500/50 transition-all active:scale-95">
                        <div className="flex items-center gap-3 relative z-10">
                            <RefreshCw size={14} className={`text-muted-foreground group-hover:text-emerald-500 transition-colors ${loading ? 'animate-spin' : ''}`} />
                            <span className="text-[9px] font-black text-foreground uppercase tracking-[2px]">Refresh</span>
                        </div>
                    </button>
                    
                    <div className="size-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/20 border border-emerald-500 cursor-pointer hover:bg-emerald-500 transition-all">
                        <Activity size={18} strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* Tactical Metrics Group */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Voters" value={stats.total_voters} icon={Users} color="#1a1a1a" trend="+1.2%" delay={0.1} />
                <MetricCard label="Complaints" value={stats.total_issues} icon={AlertTriangle} color="#f59e0b" trend="-4.8%" delay={0.2} />
                <MetricCard label="Resolution Rate" value={`${Math.round((stats.resolved_issues / (stats.total_issues || 1)) * 100)}%`} icon={ShieldCheck} color="#10b981" delay={0.3} />
                <MetricCard label="Total Calls" value={stats.total_calls} icon={PhoneCall} color="#6366f1" trend="+14%" delay={0.4} />
            </div>

            {/* Visual Analytics Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Knowledge Graph Card - Compact */}
                <div className="lg:col-span-2 bg-card p-6 rounded-[2.5rem] border border-border relative overflow-hidden group">
                    <div className="absolute top-6 right-6 z-20">
                         <div className="flex items-center gap-2 bg-background/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-border">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[8px] font-black uppercase tracking-[2px] text-emerald-500">Live</span>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xl">
                            <BarChart2 size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-foreground tracking-tighter uppercase leading-none">Issue Breakdown</h4>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[3px] mt-1">Complaints by Category</p>
                        </div>
                    </div>

                    {chartData.length === 0 ? (
                        <div className="h-[400px] flex items-center justify-center text-center">
                            <div className="space-y-3">
                                <BrainCircuit size={32} className="mx-auto text-white/10 animate-pulse" />
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[4px]">No data yet...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 60 }} barCategoryGap="30%">
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fill: 'hsla(var(--foreground), 0.3)', fontSize: 10, fontWeight: 900 }}
                                        tickLine={false}
                                        axisLine={{ stroke: 'hsla(var(--foreground), 0.05)' }}
                                        angle={-35}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis 
                                        tick={{ fill: 'hsla(var(--foreground), 0.2)', fontSize: 10, fontWeight: 700 }}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip 
                                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, padding: '10px 16px' }}
                                        labelStyle={{ color: 'hsl(var(--primary))', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}
                                        itemStyle={{ color: 'hsla(var(--foreground), 0.6)', fontWeight: 700, fontSize: 11 }}
                                        cursor={{ fill: 'hsla(var(--foreground), 0.03)' }}
                                    />
                                    <Bar dataKey="resolved" name="Resolved" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="pending" name="Pending" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            {/* Legend */}
                            <div className="flex items-center justify-center gap-8 mt-4">
                                <div className="flex items-center gap-2">
                                    <span className="size-3 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[2px]">Resolved</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="size-3 rounded-full bg-rose-500" />
                                    <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[2px]">Pending</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sentiment Breakdown Card - Compact */}
                <div className="bg-card p-6 rounded-[2.5rem] border border-border flex flex-col relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-10 rounded-xl bg-muted text-foreground flex items-center justify-center border border-border shadow-xl">
                            <Target size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-black text-foreground tracking-tighter uppercase leading-none">Public Sentiment</h4>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[3px] mt-1">Sentiment Distribution</p>
                        </div>
                    </div>

                    <div className="space-y-6 flex-1 flex flex-col justify-center">
                        {sentPcts.map((s, idx) => {
                            const config = SENTIMENT_CONFIG[s.key] || SENTIMENT_CONFIG.neutral;
                            const SIcon = config.icon;
                            return (
                                <div key={s.key} className="group/item">
                                    <div className="flex justify-between items-end mb-3">
                                        <div className="flex items-center gap-2">
                                            <SIcon size={14} className={`${config.color} group-hover/item:scale-110 transition-transform`} />
                                            <span className={`text-[8px] font-black uppercase tracking-[2px] ${config.color} group-hover/item:text-foreground transition-colors`}>{config.label}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-foreground tracking-tighter leading-none">
                                                {s.pct}<span className="text-[10px] text-foreground/20 ml-1">%</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden relative border border-border">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${s.pct}%` }} 
                                            transition={{ duration: 2, delay: idx * 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className={`h-full rounded-full ${config.bg} shadow-[0_0_15px_rgba(0,0,0,0.5)]`} 
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <p className="text-[8px] font-black text-muted-foreground/20 uppercase tracking-[2px]">COUNT</p>
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[3px]">{s.value} VOTERS</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-14 pt-10 border-t border-border">
                        <div className="flex items-center gap-4 p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                             <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xl shadow-emerald-600/20">
                                <Zap size={18} strokeWidth={3} />
                             </div>
                             <p className="text-[10px] font-black text-emerald-500/80 leading-relaxed uppercase tracking-[2px]">
                                Booth is stable. No major changes in last 24h.
                             </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Strategic Insights Layer */}
            <div className="grid lg:grid-cols-2 gap-8">
                 {/* AI Insights - Compact */}
                 <div className="bg-card p-6 rounded-[2.5rem] border border-border relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-xl">
                                <BrainCircuit size={20} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-2xl font-black text-foreground tracking-tighter uppercase leading-none">Insights</h4>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        {stats.insights.map((insight, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, x: -20 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                transition={{ delay: 0.5 + (i * 0.1), duration: 0.5 }}
                                className={`flex flex-col gap-4 p-5 rounded-[1.5rem] border transition-all group/insight ${
                                    insight.type === 'critical' ? 'bg-rose-500/5 border-rose-500/20' : 
                                    insight.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' : 
                                    'bg-muted/40 border-border'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`size-8 rounded-lg flex items-center justify-center border ${
                                            insight.type === 'critical' ? 'bg-rose-500 text-white border-rose-400' : 
                                            insight.type === 'warning' ? 'bg-amber-500 text-white border-amber-400' : 
                                            'bg-emerald-600 text-white border-emerald-500'
                                        }`}>
                                            <Lightbulb size={16} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[2px]">{insight.title}</span>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${
                                        insight.type === 'critical' ? 'border-rose-500/30 text-rose-500' : 'border-emerald-500/30 text-emerald-500'
                                    }`}>
                                        {insight.type}
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-lg font-black text-foreground leading-tight uppercase tracking-tighter mb-4">
                                        "{insight.message}"
                                    </p>
                                    <div className="p-6 bg-background/50 rounded-2xl border border-white/5 backdrop-blur-sm">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[3px] mb-2 flex items-center gap-2">
                                            <Target size={12} className="text-emerald-500" /> Recommended Solution
                                        </p>
                                        <p className="text-sm font-bold text-emerald-400 italic">
                                            {insight.solution}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Efficiency Index Card - Compact */}
                <div className="bg-card p-6 rounded-[2.5rem] border border-border flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    <div className="relative text-center z-10 w-full">
                        <div className="relative size-48 mx-auto mb-6">
                             <svg className="size-full -rotate-90">
                                <circle cx="96" cy="96" r="80" fill="transparent" stroke="var(--border)" strokeWidth="15" />
                                <motion.circle 
                                    cx="96" cy="96" r="80" fill="transparent" stroke="#10b981" strokeWidth="15"
                                    strokeDasharray="502" 
                                    initial={{ strokeDashoffset: 502 }}
                                    animate={{ strokeDashoffset: 502 - (502 * (stats.total_issues > 0 ? (stats.resolved_issues / stats.total_issues) : 0)) }}
                                    transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 1 }}
                                    strokeLinecap="round"
                                />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-foreground tracking-tighter leading-none">
                                    {stats.total_issues > 0 ? Math.round((stats.resolved_issues / stats.total_issues) * 100) : 0}<span className="text-xl text-muted-foreground ml-1">%</span>
                                </span>
                             </div>
                        </div>
                        
                        <h4 className="text-2xl font-black text-foreground tracking-tighter uppercase leading-none mb-2">Resolution</h4>
                        <p className="text-muted-foreground text-[9px] font-black uppercase tracking-[3px] max-w-sm mx-auto mb-8 leading-relaxed">Performance Index</p>
                        
                        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mx-auto">
                            <div className="p-4 bg-muted rounded-[1.5rem] border border-border group-hover:border-emerald-500/30 transition-all">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[3px] mb-1">DONE</p>
                                <p className="text-2xl font-black text-emerald-500 tracking-tighter leading-none">{stats.resolved_issues}</p>
                            </div>
                            <div className="p-4 bg-muted rounded-[1.5rem] border border-border group-hover:border-rose-500/30 transition-all">
                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[3px] mb-1">OPEN</p>
                                <p className="text-2xl font-black text-rose-500 tracking-tighter leading-none">{stats.pending_issues}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
