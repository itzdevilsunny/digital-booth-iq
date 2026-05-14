import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAnalytics, getGrievances } from '../../api';
import { 
  Users, AlertTriangle, PhoneCall, RefreshCw, 
  TrendingUp, TrendingDown, ShieldCheck, Activity,
  BrainCircuit, Target, Zap, Lightbulb, PieChart as PieIcon,
  BarChart as BarIcon, LineChart as LineIcon, Info,
  Layers, Database, Network, ShieldAlert
} from 'lucide-react';
import { IntelligenceGraph } from '../intel/IntelligenceGraph';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, 
  Cell, BarChart, Bar, Legend 
} from 'recharts';

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

    const loadData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await getAnalytics(boothId);
            setStats(res);
        } catch (e) { 
            console.error('Analytics Fetch Error:', e);
            // Fallback empty stats to avoid blank screen if API fails
            setStats({
                total_voters: 0,
                sentiment_distribution: { positive: 0, neutral: 0, negative: 0 },
                total_issues: 0,
                resolved_issues: 0,
                pending_issues: 0,
                category_breakdown: {},
                trends: [],
                error: true
            });
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [boothId]);

    useEffect(() => { 
        loadData(true); 
        
        // --- LIVE ENGINE: Auto-refresh data every 30 seconds ---
        const interval = setInterval(() => {
            loadData(false); // Silent refresh
        }, 30000);

        return () => clearInterval(interval);
    }, [loadData]);

    const chartData = useMemo(() => {
        if (!stats) return null;
        
        const categoryData = Object.entries(stats.category_breakdown || {}).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value
        })).sort((a, b) => b.value - a.value);

        const sentimentData = [
            { name: 'Positive', value: stats.sentiment_distribution?.positive || 0, color: '#10b981' },
            { name: 'Neutral', value: stats.sentiment_distribution?.neutral || 0, color: '#6b7280' },
            { name: 'Negative', value: stats.sentiment_distribution?.negative || 0, color: '#ef4444' }
        ];

        return { categoryData, sentimentData, trends: stats.trends || [] };
    }, [stats]);

    if (loading) {
        return (
            <div className="py-40 text-center">
                <BrainCircuit size={48} className="mx-auto text-emerald-500 animate-pulse mb-4" />
                <h2 className="text-xl font-black text-foreground uppercase tracking-[8px]">Syncing Intelligence</h2>
            </div>
        );
    }

    if (!stats || stats.error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center animate-fade-in p-8">
                <div className="size-24 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20 text-destructive shadow-2xl shadow-destructive/20">
                    <ShieldAlert size={48} />
                </div>
                <div>
                    <h3 className="text-2xl font-display font-black text-foreground uppercase tracking-tight">Intelligence Stream Interrupted</h3>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm font-medium">We encountered a 500 status error while fetching real-time analytics. The system will attempt to reconnect automatically.</p>
                </div>
                <button 
                    onClick={() => loadData(true)}
                    className="px-8 py-3 rounded-2xl bg-foreground text-background font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                    Manual Recon
                </button>
            </div>
        );
    }

    const sentTotal = Object.values(stats.sentiment_distribution || {}).reduce((a, b) => a + b, 0);
    const sentPcts = Object.entries(stats.sentiment_distribution || {}).map(([k, v]) => ({
        key: k, value: v, pct: sentTotal > 0 ? ((v / sentTotal) * 100).toFixed(1) : 0
    }));

    const SENTIMENT_CONFIG = { 
        positive: { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Positive', icon: TrendingUp },
        neutral: { color: 'text-muted-foreground', bg: 'bg-muted', label: 'Neutral', icon: Activity },
        negative: { color: 'text-rose-500', bg: 'bg-rose-500', label: 'Negative', icon: TrendingDown }
    };

    const isIntelView = window.location.pathname.endsWith('/intel');

    if (isIntelView) {
        return (
            <div className="h-[calc(100vh-120px)] w-full">
                <IntelligenceGraph 
                    boothId={boothId} 
                    onNodeSelect={(node) => setSelectedVoter(node)} 
                />
            </div>
        );
    }

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

            {/* Strategic Intelligence View: 3 Columns for full bird's-eye view */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Knowledge Graph - Strategic Map (7 Columns) */}
                <div className="xl:col-span-8 bg-card rounded-[2.5rem] border border-border overflow-hidden relative shadow-2xl min-h-[600px] flex flex-col">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                                <Network size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[2px] text-foreground leading-none">Knowledge Graph</h3>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-[1px] mt-1">Voter Social Fabric & Influence Mapping</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-[2px] text-emerald-500">Live Engine</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 relative">
                        <IntelligenceGraph 
                            boothId={boothId} 
                            onNodeSelect={(node) => setSelectedVoter(node)} 
                        />
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4 p-4 bg-background/80 backdrop-blur-md rounded-2xl border border-border shadow-xl pointer-events-none">
                         <div className="flex items-center gap-3 pr-4 border-r border-border">
                             <div className="size-2 rounded-full bg-emerald-500" />
                             <span className="text-[8px] font-black uppercase tracking-[1px] text-muted-foreground">Pro-Incumbent</span>
                         </div>
                         <div className="flex items-center gap-3 pr-4 border-r border-border">
                             <div className="size-2 rounded-full bg-rose-500" />
                             <span className="text-[8px] font-black uppercase tracking-[1px] text-muted-foreground">Swing Voter</span>
                         </div>
                         <div className="flex items-center gap-3">
                             <div className="size-2 rounded-full bg-muted-foreground" />
                             <span className="text-[8px] font-black uppercase tracking-[1px] text-muted-foreground">Neutral/Unmapped</span>
                         </div>
                    </div>
                </div>

                {/* Analytical Sidebar (4 Columns) */}
                <div className="xl:col-span-4 space-y-6">
                    
                    {/* Strategic Advantage Panel: BoothIQ vs Traditional Portals */}
                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-[2.5rem] border border-indigo-500/20 relative overflow-hidden group/advantage">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover/advantage:scale-110 transition-transform duration-500">
                            <ShieldCheck size={80} className="text-indigo-400" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Zap size={16} />
                                </div>
                                <h4 className="text-[10px] font-black text-white tracking-[3px] uppercase">Strategic Edge</h4>
                            </div>

                            <h3 className="text-xl font-black text-white tracking-tighter uppercase mb-4">BoothIQ vs. Traditional Portals</h3>
                            <p className="text-[9px] font-bold text-indigo-200/60 uppercase tracking-[1.5px] mb-6 leading-relaxed">
                                Why we outperform reactive systems like Delhi CM Jan Sunwai.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { 
                                        title: "Predictive vs Reactive", 
                                        desc: "Traditional portals wait for complaints. BoothIQ's AI predicts sentiment volatility before issues escalate." 
                                    },
                                    { 
                                        title: "Social Fabric Mapping", 
                                        desc: "We don't just track complaints; we map influence and relationships to understand the ripple effect of every action." 
                                    },
                                    { 
                                        title: "Hyper-Local Precision", 
                                        desc: "Targeted at the Booth level (smallest democratic unit) for surgical intervention accuracy." 
                                    },
                                    { 
                                        title: "Multimodal Intelligence", 
                                        desc: "Integrated AI Vision and Voice analytics for instant infrastructure gap assessment." 
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="space-y-1">
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[2px]">{item.title}</p>
                                        <p className="text-[10px] font-bold text-white/70 leading-tight uppercase tracking-tight italic">"{item.desc}"</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Real-time Trend Graph */}
                    <div className="bg-card p-6 rounded-[2.5rem] border border-border group relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                                <LineIcon size={16} />
                            </div>
                            <h4 className="text-[10px] font-black text-foreground tracking-[3px] uppercase">Sentiment Pulse</h4>
                        </div>
                        
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData?.trends}>
                                    <defs>
                                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    />
                                    <Area type="monotone" dataKey="sentiment_score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Issue Category Distribution */}
                    <div className="bg-card p-6 rounded-[2.5rem] border border-border group relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                <PieIcon size={16} />
                            </div>
                            <h4 className="text-[10px] font-black text-foreground tracking-[3px] uppercase">Topic Hotspots</h4>
                        </div>
                        
                        <div className="h-48 w-full flex items-center">
                            <ResponsiveContainer width="60%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData?.categoryData}
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {chartData?.categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'][index % 5]} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="w-[40%] space-y-2">
                                {chartData?.categoryData.slice(0, 4).map((c, i) => (
                                    <div key={i} className="flex flex-col">
                                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[1px]">{c.name}</span>
                                        <span className="text-xs font-black text-foreground leading-none">{c.value} Reports</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Operational Feed / Insights */}
                    <div className="bg-card p-6 rounded-[2.5rem] border border-border flex-1 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20">
                                <BrainCircuit size={16} />
                            </div>
                            <h4 className="text-[10px] font-black text-foreground tracking-[3px] uppercase">AI Forensics</h4>
                        </div>
                        
                        <div className="space-y-4">
                            {stats.insights?.slice(0, 3).map((insight, i) => (
                                <div key={i} className="group/insight p-4 rounded-2xl bg-muted/20 border border-border hover:border-emerald-500/30 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`size-1.5 rounded-full ${insight.type === 'critical' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                        <span className="text-[8px] font-black uppercase tracking-[1px] text-muted-foreground">{insight.title}</span>
                                    </div>
                                    <p className="text-xs font-bold text-foreground leading-tight uppercase tracking-tighter mb-2 italic">"{insight.message}"</p>
                                    <div className="hidden group-hover/insight:block animate-in fade-in slide-in-from-top-1">
                                        <p className="text-[7px] font-black text-emerald-500 uppercase tracking-[2px] bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                            Rec: {insight.solution}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Public Sentiment Summary - Horizontal Bar */}
            <div className="bg-card p-8 rounded-[3rem] border border-border relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-125 transition-transform duration-1000">
                    <Database size={200} />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Target size={24} className="text-emerald-500" />
                            <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none">Voter Sentiment Audit</h3>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[5px]">Constituency-wide Public Mood Synthesis</p>
                    </div>

                    <div className="flex-1 max-w-2xl w-full">
                        <div className="flex justify-between items-end mb-4">
                             {sentPcts.map((s, idx) => (
                                 <div key={s.key} className="flex flex-col items-center gap-1">
                                     <span className="text-2xl font-black text-foreground tracking-tighter leading-none">{s.pct}%</span>
                                     <span className={`text-[8px] font-black uppercase tracking-[2px] ${SENTIMENT_CONFIG[s.key].color}`}>{s.key}</span>
                                 </div>
                             ))}
                        </div>
                        <div className="h-4 w-full rounded-full bg-muted overflow-hidden flex border border-border">
                            {sentPcts.map((s, idx) => (
                                <motion.div 
                                    key={s.key}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${s.pct}%` }}
                                    className={`h-full ${SENTIMENT_CONFIG[s.key].bg}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
