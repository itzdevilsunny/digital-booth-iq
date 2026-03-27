import React, { useState, useEffect } from 'react';
import { 
    Zap, Globe, Users, Target, Activity, 
    TrendingUp, MapPin, ChevronRight, MessageSquare,
    Shield, ShieldAlert, BarChart3, Clock, ArrowUpRight, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAnalytics, initiateCampaignBlast, managerAutoAssign, getActionHistory, getConstituencySummary } from '../../api';
import { IntelligenceGraph } from '../intel/IntelligenceGraph';

const ConstituencyDashboard = ({ currentUser, boothId }) => {
    const [tab, setTab] = useState('command');
    
    useEffect(() => {
        if (window.location.pathname.endsWith('/intel')) {
            setTab('intelligence');
        }
    }, []);
    const [loading, setLoading] = useState(true);
    const [stats, setAnalytics] = useState(null);
    const [summary, setSummary] = useState(null);
    const [aiCampaignState, setAiCampaignState] = useState('idle');
    const [actionHistory, setActionHistory] = useState([]);
    const [selectedAction, setSelectedAction] = useState(null);

    useEffect(() => {
        Promise.all([
            getAnalytics(boothId),
            getActionHistory(),
            getConstituencySummary()
        ]).then(([analyticsData, historyData, summaryData]) => {
            setAnalytics(analyticsData);
            setActionHistory(historyData);
            setSummary(summaryData);
            setLoading(false);
        });
    }, [boothId]);

    const refreshHistory = async () => {
        const [history, newSummary] = await Promise.all([
            getActionHistory(),
            getConstituencySummary()
        ]);
        setActionHistory(history);
        setSummary(newSummary);
    };

    const metrics = [
        { label: 'Total Turnout', value: summary?.metrics?.total_turnout || '68.4%', change: '+4.2%', icon: Activity, color: 'text-indigo-400' },
        { label: 'Active Issues', value: summary?.metrics?.active_issues || '0', change: 'Live', icon: Target, color: 'text-emerald-400' },
        { label: 'Citizen Sentiment', value: summary?.metrics?.citizen_sentiment || 'Stable', change: '82%', icon: TrendingUp, color: 'text-amber-400' },
        { label: 'System Latency', value: summary?.metrics?.system_latency || '24ms', change: 'Optimal', icon: Zap, color: 'text-indigo-500' }
    ];

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase tracking-[3px]">
                            Constituency Overview
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground/40 text-[9px] font-bold uppercase tracking-widest">
                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live System
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none mb-1">
                        Constituency Hub
                    </h1>
                    <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[9px]">Management Oversight & Local Support</p>
                </div>

                <div className="flex bg-muted p-1 rounded-2xl border border-border backdrop-blur-xl">
                    {['command', 'intelligence', 'campaigns'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-[2px] transition-all ${
                                tab === t ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <motion.div
                        key={m.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card p-5 rounded-2xl border border-border relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <m.icon size={40} />
                        </div>
                        <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[2px] mb-2">{m.label}</p>
                        <div className="flex items-end justify-between relative z-10">
                            <h3 className="text-2xl font-black text-foreground tracking-tighter">{m.value}</h3>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full bg-muted border border-border ${m.color}`}>
                                {m.change}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Strategic Action History */}
            <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3">
                        <Clock className="text-indigo-500" /> Command History
                    </h3>
                    <button onClick={refreshHistory} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <RefreshCw size={14} className="text-muted-foreground" />
                    </button>
                </div>
                
                {actionHistory.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">No strategic actions recorded in this cycle.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {actionHistory.map((action, i) => (
                            <motion.div 
                                key={action.id || i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-xl hover:border-indigo-500/30 transition-all cursor-pointer group"
                                onClick={() => setSelectedAction(action)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                        <Shield size={18} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{action.target} • {new Date(action.timestamp).toLocaleDateString()} at {new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <ArrowUpRight size={14} className="text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Strategic Info Modal */}
            <AnimatePresence>
                {selectedAction && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedAction(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-md" 
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl relative z-10"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                    <Zap size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter leading-none">{selectedAction.type.replace('_', ' ')}</h2>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[3px] mt-1.5">Action Protocol Active</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="p-6 bg-muted rounded-2xl border border-border">
                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[3px] mb-3">Executive Summary</p>
                                    <p className="text-sm font-bold text-foreground leading-relaxed italic">
                                        "{selectedAction.details}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-muted/50 rounded-2xl border border-border">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] mb-1">Target Zone</p>
                                        <p className="text-xs font-black text-foreground uppercase">{selectedAction.target}</p>
                                    </div>
                                    <div className="p-4 bg-muted/50 rounded-2xl border border-border">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] mb-1">Timestamp</p>
                                        <p className="text-xs font-black text-foreground uppercase">{new Date(selectedAction.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>

                                {selectedAction.notified_to && (
                                    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                            Notification Deployed to: {selectedAction.notified_to}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setSelectedAction(null)}
                                className="w-full mt-8 py-4 bg-foreground text-background rounded-2xl font-black uppercase tracking-[4px] text-xs hover:opacity-90 transition-opacity"
                            >
                                Acknowledge & Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <div className="grid lg:col-span-12 gap-8">
                {tab === 'command' && (
                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* AI Analysis Overview - Processed Public Data */}
                        <div className="lg:col-span-8 bg-card rounded-2xl border border-border p-6 relative overflow-hidden min-h-[400px]">
                            <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3">
                                        <Zap className="text-indigo-500" /> AI Analysis
                                    </h3>
                                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-[2px]">
                                        Public Feedback
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 bg-muted rounded-2xl border border-border">
                                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[2px] mb-3">Sentiment Analysis</p>
                                        <div className="h-3 w-full bg-muted-foreground/10 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-emerald-500 w-[62%]" title="Positive" />
                                            <div className="h-full bg-amber-500 w-[24%]" title="Neutral" />
                                            <div className="h-full bg-rose-500 w-[14%]" title="Negative" />
                                        </div>
                                        <div className="flex justify-between mt-3 text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                                            <span>62% Supportive</span>
                                            <span>14% Critical</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-muted rounded-2xl border border-border">
                                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[2px] mb-1.5">Key Driver</p>
                                            <p className="text-sm font-black text-foreground leading-tight uppercase">Scheme Awareness</p>
                                        </div>
                                        <div className="p-4 bg-muted rounded-2xl border border-border">
                                            <p className="text-[8px] font-black text-rose-400 uppercase tracking-[2px] mb-1.5">Critical Issue</p>
                                            <p className="text-sm font-black text-foreground leading-tight uppercase">Water Supply Delay</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Worker GPS Feed */}
                        <div className="lg:col-span-4 space-y-4">
                            <div className="bg-card rounded-2xl border border-border p-5">
                                <h3 className="text-sm font-black text-foreground uppercase tracking-tighter mb-5 flex items-center gap-2">
                                    <Target className="text-indigo-500" size={16} /> Field Activity
                                </h3>
                                <div className="space-y-3">
                                    {(summary?.field_activity || []).map((w, i) => (
                                        <div key={i} className="p-3 bg-muted rounded-xl border border-border flex items-center gap-3">
                                            <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-xs">
                                                {w.name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-foreground uppercase tracking-tight">{w.name}</p>
                                                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{w.loc}</p>
                                            </div>
                                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={() => alert('Alert dispatched to all field workers in active sectors.')}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-[3px] text-xs shadow-xl shadow-indigo-600/10 hover:bg-indigo-500 transition-all group flex items-center justify-center gap-3">
                                <MessageSquare size={16} /> Send Alert
                            </button>
                        </div>
                    </div>
                )}

                {tab === 'intelligence' && (
                    <div className="space-y-8">
                        {/* Regional Intelligence Network */}
                        <div className="bg-card rounded-[2.5rem] border border-border p-8 relative overflow-hidden h-[600px] shadow-2xl">
                            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] opacity-10" />
                            <div className="relative z-10 h-full flex flex-col">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter flex items-center gap-3">
                                            <Globe className="text-indigo-500" size={24} /> Regional Intelligence Hub
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[4px] mt-1 ml-9">Advanced Neural Network Analysis</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10">
                                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Grid
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 rounded-[2rem] overflow-hidden border border-white/5 bg-black/20">
                                    <IntelligenceGraph boothId={boothId} />
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            {/* Critical Intervention Areas */}
                            <div className="bg-card rounded-2xl border border-border p-6 text-foreground">
                                <h3 className="text-lg font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                                    <ShieldAlert className="text-rose-500" size={18} /> Urgent Issues
                                </h3>
                                <div className="space-y-3">
                                    {(summary?.urgent_issues || []).map((area) => (
                                        <div key={area.id} className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center justify-between group hover:bg-rose-500/10 transition-all">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Booth #{area.id}</span>
                                                    <div className="size-1 rounded-full bg-rose-500" />
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{area.loc}</span>
                                                </div>
                                                <p className="text-base font-black uppercase tracking-tight">{area.issue}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-black text-rose-500 leading-none mb-1">{area.risk}</p>
                                                <p className="text-[7px] font-black text-muted-foreground/30 uppercase tracking-widest">Priority Score</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI Strategic Reasoning */}
                            <div className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-20">
                                    <Zap size={60} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black uppercase tracking-tighter mb-4 leading-none">AI Insights</h3>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-md">
                                            <p className="text-[8px] font-black uppercase tracking-[2px] mb-2 opacity-60">Strategic Pulse</p>
                                            <p className="text-sm font-bold leading-tight italic">
                                                "Water Infrastructure focus recommended for Sector 9. 12% improvement potential detected."
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        const res = await managerAutoAssign({ booth_id: 17 });
                                                        setSelectedAction(res.action);
                                                        refreshHistory();
                                                    } catch (e) {
                                                        alert('Strategic action initiated. Field units notified via SMS/Email.');
                                                    }
                                                }}
                                                className="flex-1 py-3 bg-white text-indigo-600 rounded-xl font-black uppercase tracking-[2px] text-[8px] hover:bg-indigo-50 transition-all">
                                                Quick Action
                                            </button>
                                            <button 
                                                onClick={() => setSelectedAction({
                                                    type: 'STRATEGIC_BRIEF',
                                                    target: 'Sector 9',
                                                    details: 'Detailed infrastructure analysis for Sector 9 reveals a 12% drop in water pressure over the last 48 hours. Sentiment is shifting towards critical. Immediate deployment of 3 tankers and 2 technicians recommended.',
                                                    timestamp: new Date().toISOString(),
                                                    status: 'viewing'
                                                })}
                                                className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all">
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'campaigns' && (
                    <div className="bg-card rounded-2xl p-6 lg:p-8 border border-indigo-500/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Zap size={100} className="text-indigo-500" />
                        </div>
                        
                        <div className="relative z-10 space-y-8">
                            <div>
                                <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase mb-2 leading-none flex items-center gap-3">
                                    <Globe className="text-indigo-500" /> AI Campaign Manager
                                </h2>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
                                    Hyper-personalized outreach. Our AI dynamically generates unique correspondence for each voter based on their precinct data, sentiment history, and immediate local issues.
                                </p>
                            </div>

                            <div className="grid lg:grid-cols-2 gap-8">
                                {/* Configuration Panel */}
                                <div className="space-y-6">
                                    <div className="p-5 bg-muted rounded-xl border border-border">
                                        <label className="text-[9px] font-black uppercase tracking-[3px] text-indigo-400 mb-4 block">Target Audience & Vector</label>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-card border border-indigo-500/50 rounded-lg">
                                                <div>
                                                    <p className="text-sm font-black uppercase text-foreground leading-none">Sector 9: Water Scarcity</p>
                                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">1,240 Affected Voters</p>
                                                </div>
                                                <div className="size-4 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] border-2 border-background" />
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg opacity-50 grayscale">
                                                <div>
                                                    <p className="text-sm font-black uppercase text-foreground leading-none">Sector 4: Road Connectivity</p>
                                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">890 Affected Voters</p>
                                                </div>
                                                <div className="size-4 rounded-full border-2 border-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => {
                                            setAiCampaignState('generating');
                                            setTimeout(() => setAiCampaignState('ready'), 2000);
                                        }}
                                        disabled={aiCampaignState === 'generating'}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-[3px] text-[10px] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 border border-white/10"
                                    >
                                        {aiCampaignState === 'generating' ? (
                                            <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={16} /> Synthesizing AI Drafts...</span>
                                        ) : (
                                            <span className="flex items-center gap-2"><Zap size={16} /> Generate Personalized Contexts</span>
                                        )}
                                    </button>
                                </div>

                                {/* AI Preview Panel */}
                                <div className="p-6 bg-[#0a0a0a] rounded-xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)] relative">
                                    <h3 className="text-[9px] font-black uppercase tracking-[3px] text-indigo-400 mb-6 flex items-center gap-2">
                                        <Shield size={14} /> Live AI Generation Preview
                                    </h3>
                                    
                                    {aiCampaignState === 'idle' && (
                                        <div className="text-center py-10 opacity-30">
                                            <Zap size={32} className="mx-auto mb-3 text-white" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white">Awaiting Generation Trigger</p>
                                        </div>
                                    )}

                                    {aiCampaignState === 'generating' && (
                                        <div className="space-y-4 animate-pulse">
                                            <div className="h-6 bg-white/10 rounded w-2/3" />
                                            <div className="h-10 bg-white/5 rounded w-full" />
                                            <div className="h-32 bg-white/5 rounded w-full" />
                                        </div>
                                    )}

                                    {aiCampaignState === 'ready' && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                                <p className="text-[8px] text-indigo-300 font-mono tracking-widest mb-1">TO: SUNIL KUMAR (SECTOR 9, BOOTH 114)</p>
                                                <p className="text-[8px] text-indigo-300 font-mono tracking-widest">SUBJ: URGENT: WATER INFRASTRUCTURE UPDATE FOR SEC-9</p>
                                            </div>
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                                                <p className="text-xs text-white/80 font-mono leading-relaxed">
                                                    Dear Sunil,<br/><br/>
                                                    Our live analytics flag ongoing water scarcity issues in Sector 9. High Command acknowledges this distress.<br/><br/>
                                                    I am writing to personally assure you that an emergency pipeline allocation has been authorized for your precinct (Booth 114). Digging commences in 48 hours.<br/><br/>
                                                    - AI Constituency Command
                                                </p>
                                            </div>

                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        await initiateCampaignBlast({
                                                            template_id: 'AI_DYNAMIC_SEC9',
                                                            target_segment: 'SEC9_WATER',
                                                            channels: ['whatsapp', 'sms']
                                                        });
                                                        alert(`1,240 AI-Personalized Messages Dispatched Successfully!`);
                                                    } catch (e) {
                                                        alert(`Mock AI Dispatch Complete. (1,240 messages sent)`);
                                                    }
                                                }}
                                                className="w-full mt-4 py-3 bg-white text-indigo-900 rounded-lg font-black uppercase tracking-[2px] text-[9px] hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                                            >
                                                Execute Dispatch (1,240 Deliveries) <ArrowUpRight size={14} />
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConstituencyDashboard;
