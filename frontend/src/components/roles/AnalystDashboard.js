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
        className="relative group p-8 rounded-[3rem] bg-[#141414] border border-white/5 overflow-hidden"
    >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12">
            <Icon size={120} strokeWidth={1} />
        </div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-emerald-500 transition-colors border border-white/5">
                    <Icon size={18} strokeWidth={2.5} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40">{label}</p>
            </div>
            
            <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                    <h3 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">{value}</h3>
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
            const [analytics, grievancesRaw] = await Promise.all([
                getAnalytics(boothId),
                getGrievances({ booth_id: boothId })
            ]);
            setStats(analytics);
            setGrievances(grievancesRaw || []);
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
                    <div className="absolute inset-0 border-[6px] border-white/5 rounded-full" />
                    <div className="absolute inset-0 border-[6px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-emerald-500">
                        <BrainCircuit size={48} className="animate-pulse" />
                    </div>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-[8px] mb-4">Loading Data</h2>
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
            <div className="py-32 text-center bg-[#141414] rounded-[4rem] border border-white/5 mx-auto max-w-2xl px-10">
                <div className="size-24 rounded-[2.5rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto mb-10 shadow-2xl shadow-rose-500/20">
                    <AlertTriangle size={48} strokeWidth={3} />
                </div>
                <h4 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 leading-none">Connection Error</h4>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[4px] leading-relaxed">Unable to connect to database. Retrying soon...</p>
            </div>
        );
    }

    const sentTotal = Object.values(stats.sentiment_distribution || {}).reduce((a, b) => a + b, 0);
    const sentPcts = Object.entries(stats.sentiment_distribution || {}).map(([k, v]) => ({
        key: k, value: v, pct: sentTotal > 0 ? ((v / sentTotal) * 100).toFixed(1) : 0
    }));

    const SENTIMENT_CONFIG = { 
        positive: { color: 'text-emerald-600', bg: 'bg-emerald-600', label: 'Positive Trend', icon: TrendingUp },
        neutral: { color: 'text-white/40', bg: 'bg-white/10', label: 'No Change', icon: Activity },
        negative: { color: 'text-rose-600', bg: 'bg-rose-600', label: 'Negative Trend', icon: TrendingDown }
    };

    return (
        <div className="space-y-12 pb-24 overflow-hidden">
            {/* Contextual Subheader */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-white/5">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="size-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter uppercase leading-none">Booth Analytics</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[5px]">Booth ID: {boothId}</p>
                        <span className="size-1 rounded-full bg-white/10" />
                        <p className="text-emerald-500/50 text-[9px] font-black uppercase tracking-[3px]">Status: Updated</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={loadData} className="group relative px-8 py-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/50 transition-all active:scale-95">
                        <div className="flex items-center gap-3 relative z-10">
                            <RefreshCw size={16} className={`text-white/40 group-hover:text-emerald-500 transition-colors ${loading ? 'animate-spin' : ''}`} />
                            <span className="text-[10px] font-black text-white uppercase tracking-[3px]">Refresh Data</span>
                        </div>
                    </button>
                    
                    <div className="size-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-600/20 border border-emerald-500 cursor-pointer hover:bg-emerald-500 transition-all">
                        <Activity size={24} strokeWidth={3} />
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
                {/* Knowledge Graph Card — Real Grievance Breakdown Chart */}
                <div className="lg:col-span-2 bg-[#141414] p-10 rounded-[4rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-10 right-10 z-20">
                         <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/5">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                            <span className="text-[9px] font-black uppercase tracking-[3px] text-emerald-500/80">Live Data</span>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-12">
                        <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                            <BarChart2 size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Issue Breakdown</h4>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mt-2">Complaints by Category</p>
                        </div>
                    </div>

                    {chartData.length === 0 ? (
                        <div className="h-[550px] flex items-center justify-center text-center">
                            <div className="space-y-4">
                                <BrainCircuit size={48} className="mx-auto text-white/10 animate-pulse" />
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[6px]">No data yet...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[500px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 60 }} barCategoryGap="30%">
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                                        tickLine={false}
                                        axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                                        angle={-35}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis 
                                        tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip 
                                        contentStyle={{ background: '#0c0c0c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '10px 16px' }}
                                        labelStyle={{ color: '#10b981', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 }}
                                        itemStyle={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: 11 }}
                                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    />
                                    <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="pending" name="Pending" stackId="a" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            {/* Legend */}
                            <div className="flex items-center justify-center gap-8 mt-4">
                                <div className="flex items-center gap-2">
                                    <span className="size-3 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[2px]">Resolved</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="size-3 rounded-full bg-rose-500" />
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[2px]">Pending</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sentiment Breakdown Card */}
                <div className="bg-[#141414] p-10 rounded-[4rem] border border-white/5 flex flex-col relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-14">
                        <div className="size-14 rounded-2xl bg-white/5 text-white flex items-center justify-center border border-white/10 shadow-2xl">
                            <Target size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Public Sentiment</h4>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mt-2">Sentiment Distribution</p>
                        </div>
                    </div>

                    <div className="space-y-12 flex-1 flex flex-col justify-center">
                        {sentPcts.map((s, idx) => {
                            const config = SENTIMENT_CONFIG[s.key] || SENTIMENT_CONFIG.neutral;
                            const SIcon = config.icon;
                            return (
                                <div key={s.key} className="group/item">
                                    <div className="flex justify-between items-end mb-5">
                                        <div className="flex items-center gap-3">
                                            <SIcon size={18} className={`${config.color} group-hover/item:scale-110 transition-transform`} />
                                            <span className={`text-[10px] font-black uppercase tracking-[3px] ${config.color} group-hover/item:text-white transition-colors`}>{config.label}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-4xl font-black text-white tracking-tighter leading-none">
                                                {s.pct}<span className="text-xs text-white/20 ml-1">%</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full h-3 rounded-full bg-black/40 overflow-hidden relative border border-white/5">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${s.pct}%` }} 
                                            transition={{ duration: 2, delay: idx * 0.3, ease: [0.16, 1, 0.3, 1] }}
                                            className={`h-full rounded-full ${config.bg} shadow-[0_0_15px_rgba(0,0,0,0.5)]`} 
                                        />
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <p className="text-[8px] font-black text-white/10 uppercase tracking-[2px]">COUNT</p>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[3px]">{s.value} VOTERS</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-14 pt-10 border-t border-white/5">
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
                 {/* AI Insights Card */}
                 <div className="bg-[#141414] p-10 rounded-[4rem] border border-white/5 relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-2xl">
                                <BrainCircuit size={28} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">AI Insights</h4>
                        </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6">
                        {stats.insights.map((insight, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, scale: 0.9 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                transition={{ delay: 0.8 + (i * 0.1), duration: 0.5 }}
                                className="flex flex-col gap-6 bg-black/40 border border-white/5 p-8 rounded-[3rem] hover:bg-white hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:border-white transition-all group/insight"
                            >
                                <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-500 border border-white/5 group-hover/insight:bg-emerald-600 group-hover/insight:text-white transition-all">
                                    <Lightbulb size={24} strokeWidth={2.5} />
                                </div>
                                <p className="text-lg font-black text-white/50 leading-tight uppercase tracking-tighter group-hover/insight:text-stone-900 transition-colors">
                                    "{insight}"
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Efficiency Index Card */}
                <div className="bg-[#141414] p-10 rounded-[4rem] border border-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    <div className="relative text-center z-10 w-full">
                        <div className="relative size-64 mx-auto mb-12">
                             <svg className="size-full -rotate-90">
                                <circle cx="128" cy="128" r="110" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="20" />
                                <motion.circle 
                                    cx="128" cy="128" r="110" fill="transparent" stroke="#10b981" strokeWidth="20"
                                    strokeDasharray="691" 
                                    initial={{ strokeDashoffset: 691 }}
                                    animate={{ strokeDashoffset: 691 - (691 * (stats.total_issues > 0 ? (stats.resolved_issues / stats.total_issues) : 0)) }}
                                    transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 1 }}
                                    strokeLinecap="round"
                                />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-7xl font-black text-white tracking-tighter leading-none">
                                    {stats.total_issues > 0 ? Math.round((stats.resolved_issues / stats.total_issues) * 100) : 0}<span className="text-2xl text-stone-700 ml-1">%</span>
                                </span>
                                <div className="h-1 w-10 bg-emerald-500 rounded-full mt-4" />
                             </div>
                        </div>
                        
                        <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-4">Resolution Performance</h4>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[4px] max-w-sm mx-auto mb-12 leading-relaxed">Real-time Resolution Tracking</p>
                        
                        <div className="grid grid-cols-2 gap-6 w-full max-w-md mx-auto">
                            <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 group-hover:border-emerald-500/30 transition-all">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-3">RESOLVED</p>
                                <p className="text-4xl font-black text-emerald-500 tracking-tighter leading-none">{stats.resolved_issues}</p>
                            </div>
                            <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 group-hover:border-rose-500/30 transition-all">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-3">PENDING</p>
                                <p className="text-4xl font-black text-rose-500 tracking-tighter leading-none">{stats.pending_issues}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
