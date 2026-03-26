import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAnalytics, getGraphData } from '../../api';
import { 
  BarChart3, Users, AlertTriangle, CheckCircle2, 
  PhoneCall, Lightbulb, RefreshCw, TrendingUp, 
  TrendingDown, Zap, ShieldCheck, Activity,
  Target, BrainCircuit, Network, Info,
  ArrowUpRight, Database, Search, Filter,
  Maximize2
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

const MetricCard = ({ label, value, icon: Icon, color, trend, delay }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="glass-panel p-6 rounded-[2rem] border border-stone-200/60 shadow-sm relative overflow-hidden group"
    >
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon size={64} />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-xl bg-stone-100 text-stone-400 group-hover:text-stone-900 transition-colors shadow-sm`}>
                    <Icon size={16} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-stone-400">{label}</p>
            </div>
            <div className="flex items-end justify-between">
                <h3 className="text-4xl font-display font-bold text-stone-900 tracking-tight">{value}</h3>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold ${trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2.5 py-0.5 rounded-full border border-current opacity-70`}>
                        {trend.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {trend}
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

export default function AnalystDashboard({ currentUser, boothId }) {
    const [stats, setStats] = useState(null);
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [analytics, graph] = await Promise.all([
                getAnalytics(boothId),
                getGraphData()
            ]);
            setStats(analytics);
            setGraphData(graph);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [boothId]);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return (
            <div className="py-40 text-center animate-fade-in">
                <div className="relative size-24 mx-auto mb-8">
                    <div className="absolute inset-0 border-4 border-stone-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
                        <BrainCircuit size={32} className="animate-pulse" />
                    </div>
                </div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-[4px]">Synthesizing Intelligence Pipeline...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="py-32 text-center glass-panel rounded-[3rem] border-dashed border-stone-200">
                <AlertTriangle size={64} className="mx-auto mb-6 text-stone-200" />
                <h4 className="text-2xl font-display font-bold text-stone-900 mb-2">Core Link Failure</h4>
                <p className="text-stone-400 text-sm max-w-xs mx-auto font-medium">Unable to establish secure handshake with analytics node. Retrying in automated sequence...</p>
            </div>
        );
    }

    const sentTotal = Object.values(stats.sentiment_distribution).reduce((a, b) => a + b, 0);
    const sentPcts = Object.entries(stats.sentiment_distribution).map(([k, v]) => ({
        key: k, value: v, pct: sentTotal > 0 ? ((v / sentTotal) * 100).toFixed(1) : 0
    }));

    const SENTIMENT_CONFIG = { 
        positive: { color: 'text-emerald-600', bg: 'bg-emerald-600', label: 'Positive Trajectory', icon: TrendingUp },
        neutral: { color: 'text-stone-400', bg: 'bg-stone-300', label: 'Static Alignment', icon: Activity },
        negative: { color: 'text-rose-600', bg: 'bg-rose-600', label: 'Negative Variance', icon: TrendingDown }
    };

    return (
        <div className="space-y-10 animate-fade-in relative z-10">
            {/* Contextual Subheader */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-stone-200/60 font-display">
                <div>
                    <h1 className="text-4xl font-bold text-stone-900 tracking-tight">Intelligence Matrix</h1>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1 mr-4">RECON_ID: /BOOTH-{boothId}_ALPHA</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadData} className="px-5 py-2.5 rounded-full bg-white text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-2 border border-stone-200/50 shadow-sm">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Resync Nodes</span>
                    </button>
                </div>
            </div>

            {/* Tactical Metrics Group */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Universe" value={stats.total_voters} icon={Users} color="#1a1a1a" trend="+1.2%" delay={0.1} />
                <MetricCard label="Vulnerabilities" value={stats.total_issues} icon={AlertTriangle} color="#f59e0b" trend="-4.8%" delay={0.2} />
                <MetricCard label="Resolution Rate" value={`${Math.round((stats.resolved_issues / (stats.total_issues || 1)) * 100)}%`} icon={ShieldCheck} color="#10b981" delay={0.3} />
                <MetricCard label="Tactical Comms" value={stats.total_calls} icon={PhoneCall} color="#6366f1" trend="+14%" delay={0.4} />
            </div>

            {/* Visual Analytics Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Knowledge Graph Card */}
                <div className="lg:col-span-2 glass-panel p-8 rounded-[3rem] border border-stone-200/50 shadow-sm flex flex-col relative overflow-hidden group">
                    <div className="absolute top-8 right-8 z-20">
                         <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200/50 shadow-sm">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-600">Live Relational View</span>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-10">
                        <div className="size-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Network size={20} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Social Topology</h4>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Family & Community Relationship Matrix</p>
                        </div>
                    </div>

                    <div className="h-[500px] w-full bg-stone-50 rounded-[2.5rem] border border-stone-100 relative cursor-crosshair overflow-hidden">
                        {graphData.nodes.length > 0 ? (
                            <ForceGraph2D
                                graphData={graphData}
                                nodeLabel={node => `
                                    <div class="px-3 py-2 bg-stone-900 text-white rounded-xl shadow-2xl font-sans text-[10px] border border-white/10">
                                        <div class="font-bold border-b border-white/10 mb-2 pb-1 text-emerald-400">${node.label}</div>
                                        <div class="flex justify-between gap-6 mb-1 opacity-70"><span>INFLUENCE:</span> <span class="font-bold">${node.influence}</span></div>
                                        <div class="flex justify-between gap-6 opacity-70"><span>RISK_LVL:</span> <span class="font-bold text-emerald-400 uppercase">${node.risk}</span></div>
                                    </div>
                                `}
                                nodeColor={node => {
                                    if (node.sentiment === 'positive') return '#10b981';
                                    if (node.sentiment === 'negative') return '#ef4444';
                                    return '#94a3b8';
                                }}
                                nodeVal={node => node.influence + 2}
                                linkColor={() => '#e2e8f0'}
                                linkWidth={1.5}
                                backgroundColor="transparent"
                                width={800}
                                height={500}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <BrainCircuit size={48} className="mx-auto mb-6 text-stone-200 animate-pulse" />
                                    <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[4px]">Mapping Tactical Space...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sentiment Breakdown Card */}
                <div className="glass-panel p-8 rounded-[3rem] border border-stone-200/50 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="size-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-lg">
                            <Target size={20} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-display font-bold text-stone-900 tracking-tight">Sentiment Bias</h4>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Distribution of Localized Support</p>
                        </div>
                    </div>

                    <div className="space-y-10 flex-1 flex flex-col justify-center">
                        {sentPcts.map((s, idx) => {
                            const config = SENTIMENT_CONFIG[s.key] || SENTIMENT_CONFIG.neutral;
                            const SIcon = config.icon;
                            return (
                                <div key={s.key} className="group">
                                    <div className="flex justify-between items-end mb-4">
                                        <div className="flex items-center gap-2">
                                            <SIcon size={14} className={config.color} />
                                            <span className={`text-[10px] font-bold uppercase tracking-[2px] ${config.color} group-hover:text-stone-900 transition-colors`}>{config.label}</span>
                                        </div>
                                        <span className="text-2xl font-display font-bold text-stone-900">
                                            {s.pct}<span className="text-xs text-stone-300 ml-1 ml-0.5">%</span>
                                        </span>
                                    </div>
                                    <div className="w-full h-2.5 rounded-full bg-stone-100 overflow-hidden relative border border-stone-200/30">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${s.pct}%` }} 
                                            transition={{ duration: 1.5, delay: idx * 0.2, ease: "circOut" }}
                                            className={`h-full rounded-full ${config.bg} shadow-lg shadow-stone-900/10`} 
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-stone-300 mt-2 uppercase tracking-widest text-right">RAW_VAL: {s.value}_UNITS</p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-12 pt-8 border-t border-stone-100">
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                             <div className="size-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <Zap size={14} />
                             </div>
                             <p className="text-[10px] font-bold text-emerald-800 leading-tight uppercase tracking-widest">
                                Sentiment has stabilized in Sector Alpha over the last 24h cycle.
                             </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Strategic Insights Layer */}
            <div className="grid lg:grid-cols-2 gap-8">
                 {/* AI Insights Card */}
                 <div className="glass-panel p-8 rounded-[3rem] border border-stone-200/50 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-3">
                            <BrainCircuit size={22} className="text-emerald-600" />
                            <h4 className="text-2xl font-display font-bold text-stone-900 tracking-tight uppercase">Tactical Insights <span className="text-xs text-stone-300 ml-2 font-mono">v4.0</span></h4>
                        </div>
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                        {stats.insights.map((insight, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="flex flex-col gap-4 bg-stone-50 border border-stone-100 p-6 rounded-[2rem] hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 transition-all group"
                            >
                                <div className="size-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                    <Lightbulb size={20} />
                                </div>
                                <p className="text-sm font-medium text-stone-600 leading-relaxed italic pr-4">
                                    "{insight}"
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Efficiency Index Card */}
                <div className="glass-panel p-8 rounded-[3rem] border border-stone-200/50 shadow-sm flex flex-col items-center justify-center relative overflow-hidden bg-stone-900">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                         <Database size={200} className="absolute -bottom-20 -right-20 text-white" />
                    </div>
                    
                    <div className="relative text-center z-10">
                        <div className="relative size-48 mx-auto mb-8">
                             <svg className="size-full -rotate-90">
                                <circle cx="96" cy="96" r="88" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                                <motion.circle 
                                    cx="96" cy="96" r="88" fill="transparent" stroke="#10b981" strokeWidth="12"
                                    strokeDasharray="553" 
                                    initial={{ strokeDashoffset: 553 }}
                                    animate={{ strokeDashoffset: 553 - (553 * (stats.total_issues > 0 ? (stats.resolved_issues / stats.total_issues) : 0)) }}
                                    transition={{ duration: 2, ease: "expoOut", delay: 1 }}
                                    strokeLinecap="round"
                                />
                             </svg>
                             <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-display font-bold text-white tracking-tighter">
                                    {stats.total_issues > 0 ? Math.round((stats.resolved_issues / stats.total_issues) * 100) : 0}<span className="text-xl text-stone-500">%</span>
                                </span>
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[4px] mt-2">Operational Coeff</span>
                             </div>
                        </div>
                        
                        <h4 className="text-xl font-display font-bold text-white mb-2">Registry Efficiency Index</h4>
                        <p className="text-stone-400 text-xs max-w-xs mx-auto mb-8 font-medium">Real-time resolution velocity benchmarking against Sector Alpha-17 standard protocols.</p>
                        
                        <div className="flex gap-4">
                            <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1">Archived</p>
                                <p className="text-lg font-bold text-white">{stats.resolved_issues}</p>
                            </div>
                            <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mb-1">Backlog</p>
                                <p className="text-lg font-bold text-rose-500">{stats.pending_issues}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
