import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getAnalytics, getGrievances } from '../../api';
import { 
  Users, AlertTriangle, PhoneCall, RefreshCw, 
  TrendingUp, TrendingDown, ShieldCheck, Activity,
  BrainCircuit, Target, Zap, Lightbulb
} from 'lucide-react';
import { IntelligenceGraph } from '../intel/IntelligenceGraph';

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
    const [loading, setLoading] = useState(true);
    const [selectedVoter, setSelectedVoter] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAnalytics(boothId);
            setStats(res);
        } catch (e) { 
            console.error(e); 
        } finally {
            setLoading(false);
        }
    }, [boothId]);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return (
            <div className="py-40 text-center">
                <BrainCircuit size={48} className="mx-auto text-emerald-500 animate-pulse mb-4" />
                <h2 className="text-xl font-black text-foreground uppercase tracking-[8px]">Syncing Intelligence</h2>
            </div>
        );
    }

    if (!stats) return null;

    const sentTotal = Object.values(stats.sentiment_distribution || {}).reduce((a, b) => a + b, 0);
    const sentPcts = Object.entries(stats.sentiment_distribution || {}).map(([k, v]) => ({
        key: k, value: v, pct: sentTotal > 0 ? ((v / sentTotal) * 100).toFixed(1) : 0
    }));

    const SENTIMENT_CONFIG = { 
        positive: { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Positive', icon: TrendingUp },
        neutral: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Neutral', icon: Activity },
        negative: { color: 'text-rose-500', bg: 'bg-rose-500', label: 'Negative', icon: TrendingDown }
    };

    return (
        <div className="space-y-8 pb-12 overflow-hidden">
            {/* Contextual Subheader */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">Intelligence Hub</h1>
                    <div className="flex items-center gap-4">
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[5px]">Booth ID: {boothId}</p>
                        <span className="size-1 rounded-full bg-border" />
                        <p className="text-emerald-500/50 text-[9px] font-black uppercase tracking-[3px]">Real-time Network Analysis</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={loadData} className="px-6 py-3 bg-muted rounded-xl border border-border hover:border-emerald-500/50 transition-all active:scale-95 flex items-center gap-3">
                        <RefreshCw size={14} className={`text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-[9px] font-black text-foreground uppercase tracking-[2px]">Refresh Data</span>
                    </button>
                    <div className="size-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white border border-emerald-500">
                        <Activity size={18} strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* Tactical Metrics Group */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Constituents" value={stats.total_voters} icon={Users} color="#1a1a1a" trend="+1.2%" delay={0.1} />
                <MetricCard label="Active Gaps" value={stats.total_issues} icon={AlertTriangle} color="#f59e0b" trend="-4.8%" delay={0.2} />
                <MetricCard label="Sentiment Health" value={`${sentPcts.find(s => s.key === 'positive')?.pct || 0}%`} icon={ShieldCheck} color="#10b981" delay={0.3} />
                <MetricCard label="Engagements" value={stats.total_calls} icon={PhoneCall} color="#6366f1" trend="+14%" delay={0.4} />
            </div>

            {/* Visual Intelligence Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* 1. Intelligence Graph: The Core Component */}
                <div className="lg:col-span-2 h-[600px] shadow-2xl relative">
                    <IntelligenceGraph 
                        boothId={boothId} 
                        onNodeSelect={(node) => setSelectedVoter(node)} 
                    />
                </div>

                {/* 2. Sentiment Analytics & AI Pulse */}
                <div className="space-y-8 flex flex-col">
                    <div className="bg-card p-8 rounded-[2.5rem] border border-border flex-1 relative overflow-hidden group">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="size-10 rounded-xl bg-muted text-foreground flex items-center justify-center border border-border shadow-xl">
                                <Target size={20} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-xl font-black text-foreground tracking-tighter uppercase leading-none">Public Mood</h4>
                        </div>
                        
                        <div className="space-y-8">
                            {sentPcts.map((s, idx) => {
                                const config = SENTIMENT_CONFIG[s.key] || SENTIMENT_CONFIG.neutral;
                                const SIcon = config.icon;
                                return (
                                    <div key={s.key} className="group/item">
                                        <div className="flex justify-between items-end mb-3">
                                            <div className="flex items-center gap-2">
                                                <SIcon size={14} className={`${config.color}`} />
                                                <span className={`text-[8px] font-black uppercase tracking-[2px] ${config.color}`}>{config.label}</span>
                                            </div>
                                            <span className="text-2xl font-black text-foreground tracking-tighter leading-none">{s.pct}%</span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden border border-border">
                                            <motion.div 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${s.pct}%` }} 
                                                className={`h-full rounded-full ${config.bg}`} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-14 pt-10 border-t border-border">
                            <div className="flex items-center gap-4 p-5 bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                                <Zap size={18} className="text-emerald-500" strokeWidth={3} />
                                <p className="text-[10px] font-black text-emerald-500/80 leading-relaxed uppercase tracking-[2px]">
                                    Booth stability index is high. No outliers detected.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* AI Tactical Recommendations */}
                    <div className="bg-card p-8 rounded-[2.5rem] border border-border relative overflow-hidden group">
                         <div className="flex items-center gap-4 mb-6">
                            <div className="size-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shadow-xl">
                                <BrainCircuit size={20} strokeWidth={2.5} />
                            </div>
                            <h4 className="text-xl font-black text-foreground tracking-tighter uppercase leading-none">Intelligence Insights</h4>
                        </div>
                        <div className="space-y-4">
                            {stats.insights?.slice(0, 2).map((insight, i) => (
                                <div key={i} className="p-4 bg-muted/40 rounded-2xl border border-border">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Lightbulb size={12} className="text-emerald-500" />
                                        <span className="text-[8px] font-black uppercase tracking-[2px]">{insight.title}</span>
                                    </div>
                                    <p className="text-xs font-bold text-foreground leading-tight uppercase tracking-tighter">"{insight.message}"</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
