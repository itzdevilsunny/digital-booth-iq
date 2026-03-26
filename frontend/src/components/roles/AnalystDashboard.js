import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { getAnalytics, getGraphData } from '../../api';
import { 
  Users, AlertTriangle, PhoneCall, RefreshCw, 
  TrendingUp, TrendingDown, ShieldCheck, Activity,
  BrainCircuit, Network, Target, Zap, Lightbulb
} from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

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
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);

    // Tactical Defense: Ensure graph links only reference existing nodes to prevent crash
    const validatedGraphData = useMemo(() => {
        const nodeIds = new Set(graphData.nodes.map(n => String(n.id)));
        return {
            nodes: graphData.nodes,
            links: graphData.links.filter(l => 
                nodeIds.has(String(l.source)) && nodeIds.has(String(l.target))
            )
        };
    }, [graphData]);

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
            <div className="py-40 text-center">
                <div className="relative size-32 mx-auto mb-10">
                    <div className="absolute inset-0 border-[6px] border-white/5 rounded-full" />
                    <div className="absolute inset-0 border-[6px] border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-emerald-500">
                        <BrainCircuit size={48} className="animate-pulse" />
                    </div>
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-[8px] mb-4">SYNTHESIZING_PIPELINE</h2>
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
                <h4 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 leading-none">CORE_LINK_FAILURE</h4>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[4px] leading-relaxed">UNABLE_TO_ESTABLISH_HANDSHAKE_WITH_ANALYTICS_NODE. INITIATING_AUTO_RECOVERY...</p>
            </div>
        );
    }

    const sentTotal = Object.values(stats.sentiment_distribution).reduce((a, b) => a + b, 0);
    const sentPcts = Object.entries(stats.sentiment_distribution).map(([k, v]) => ({
        key: k, value: v, pct: sentTotal > 0 ? ((v / sentTotal) * 100).toFixed(1) : 0
    }));

    const SENTIMENT_CONFIG = { 
        positive: { color: 'text-emerald-600', bg: 'bg-emerald-600', label: 'Positive Trajectory', icon: TrendingUp },
        neutral: { color: 'text-white/40', bg: 'bg-white/10', label: 'Static Alignment', icon: Activity },
        negative: { color: 'text-rose-600', bg: 'bg-rose-600', label: 'Negative Variance', icon: TrendingDown }
    };

    return (
        <div className="space-y-12 pb-24 overflow-hidden">
            {/* Contextual Subheader */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-white/5">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="size-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter uppercase leading-none">INTEL_MATRIX</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[5px]">RECON_ID: /BOOTH-{boothId}_ALPHA</p>
                        <span className="size-1 rounded-full bg-white/10" />
                        <p className="text-emerald-500/50 text-[9px] font-black uppercase tracking-[3px]">STATUS: SYNCED</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={loadData} className="group relative px-8 py-4 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/50 transition-all active:scale-95">
                        <div className="flex items-center gap-3 relative z-10">
                            <RefreshCw size={16} className={`text-white/40 group-hover:text-emerald-500 transition-colors ${loading ? 'animate-spin' : ''}`} />
                            <span className="text-[10px] font-black text-white uppercase tracking-[3px]">RESYNC_NODES</span>
                        </div>
                    </button>
                    
                    <div className="size-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-600/20 border border-emerald-500 cursor-pointer hover:bg-emerald-500 transition-all">
                        <Activity size={24} strokeWidth={3} />
                    </div>
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
                <div className="lg:col-span-2 bg-[#141414] p-10 rounded-[4rem] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-10 right-10 z-20">
                         <div className="flex items-center gap-3 bg-black/40 backdrop-blur-xl px-4 py-2 rounded-full border border-white/5">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                            <span className="text-[9px] font-black uppercase tracking-[3px] text-emerald-500/80">LIVE_RELATIONAL_STREAM</span>
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-12">
                        <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                            <Network size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">SOCIAL_TOPOLOGY</h4>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mt-2">FAMILY_RELATIONAL_MATRIX_V2.0</p>
                        </div>
                    </div>

                    <div className="h-[550px] w-full bg-black/40 rounded-[3rem] border border-white/5 relative cursor-crosshair overflow-hidden group/canvas transition-all">
                        {validatedGraphData.nodes.length > 0 ? (
                            <ForceGraph2D
                                graphData={validatedGraphData}
                                nodeLabel={node => `
                                    <div class="px-5 py-4 bg-[#0c0c0c] text-white rounded-3xl shadow-2xl font-black text-[10px] border border-white/5">
                                        <div class="font-black border-b border-white/5 mb-3 pb-2 text-emerald-500 uppercase tracking-[2px]">${node.label}</div>
                                        <div class="flex justify-between gap-10 mb-2 opacity-50 uppercase tracking-[1px]"><span>INFLUENCE</span> <span class="font-black text-white">${node.influence}</span></div>
                                        <div class="flex justify-between gap-10 opacity-50 uppercase tracking-[1px]"><span>RISK_VECTOR</span> <span class="font-black text-emerald-400 uppercase">${node.risk}</span></div>
                                    </div>
                                `}
                                nodeColor={node => {
                                    if (node.sentiment === 'positive') return '#10b981';
                                    if (node.sentiment === 'negative') return '#f43f5e';
                                    return '#444444';
                                }}
                                nodeVal={node => node.influence + 4}
                                linkColor={() => '#1a1a1a'}
                                linkWidth={1}
                                backgroundColor="transparent"
                                width={800}
                                height={550}
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center space-y-6">
                                    <BrainCircuit size={64} className="mx-auto text-white/10 animate-pulse" />
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[6px]">MAPPING_NEURAL_NODES...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sentiment Breakdown Card */}
                <div className="bg-[#141414] p-10 rounded-[4rem] border border-white/5 flex flex-col relative overflow-hidden group">
                    <div className="flex items-center gap-4 mb-14">
                        <div className="size-14 rounded-2xl bg-white/5 text-white flex items-center justify-center border border-white/10 shadow-2xl">
                            <Target size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">SENTIMENT_BIAS</h4>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mt-2">DISTRIBUTION_OF_SECTOR_SUPPORT</p>
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
                                        <p className="text-[8px] font-black text-white/10 uppercase tracking-[2px]">VECTOR_DENSITY</p>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-[3px]">{s.value}_UNITS</p>
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
                                SECTOR_ALPHA_STABILIZED. NO_ANOMALOUS_SHIFT_IN_24H_CYCLE.
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
                            <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">TACTICAL_INSIGHTS <span className="text-xs text-emerald-500/40 ml-3 font-mono tracking-[4px]">V4.0</span></h4>
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
                        
                        <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-4">REGISTRY_EFFICIENCY</h4>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[4px] max-w-sm mx-auto mb-12 leading-relaxed">REAL_TIME_RESOLUTION_VELOCITY_BENCHMARKING_SYSTEM</p>
                        
                        <div className="grid grid-cols-2 gap-6 w-full max-w-md mx-auto">
                            <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 group-hover:border-emerald-500/30 transition-all">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-3">ARCHIVED</p>
                                <p className="text-4xl font-black text-emerald-500 tracking-tighter leading-none">{stats.resolved_issues}</p>
                            </div>
                            <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 group-hover:border-rose-500/30 transition-all">
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[4px] mb-3">BACKLOG</p>
                                <p className="text-4xl font-black text-rose-500 tracking-tighter leading-none">{stats.pending_issues}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
