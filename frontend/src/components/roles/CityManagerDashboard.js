import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getBoothsSummary, analyzeBooth, sendTargetedUpdate,
  getVoters, getManagerAlerts, managerAutoResolve,
  getConstituencySummary
} from '../../api';
import { 
  Globe, Search, 
  AlertTriangle, CheckCircle2,
  Zap,
  ChevronRight,
  MapPin, RefreshCw, Layers,
  Sparkles,
  BrainCircuit,
  ShieldAlert,
  BarChart3,
  Activity,
  Users,
  Target,
  Send
} from 'lucide-react';

const BoothCard = ({ booth, onClick }) => (
    <motion.div 
        layoutId={booth.id}
        onClick={onClick}
        className="glass-panel group p-4 rounded-2xl border border-border transition-all cursor-pointer bg-card relative overflow-hidden hover:border-emerald-500/30"
    >
        <div className="flex items-start justify-between mb-4">
            <div className={`size-10 rounded-xl flex items-center justify-center shadow-sm ${booth.status === 'critical' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                {booth.status === 'critical' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            </div>
            <div className="text-right">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Booth ID</p>
                <p className="text-lg font-display font-bold text-foreground">Booth {booth.booth_number}</p>
            </div>
        </div>

        <h3 className="text-xl font-display font-bold text-foreground mb-1 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{booth.name}</h3>
        <div className="flex items-center gap-1.5 mb-4">
            <MapPin size={10} className="text-muted-foreground" />
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Booth Location</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-border">
            <div>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Impact</p>
                <p className="text-xs font-display font-bold text-foreground">{booth.turnout}%</p>
            </div>
            <div>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Issues</p>
                <p className="text-xs font-display font-bold text-rose-500">{booth.issue_count}</p>
            </div>
            <div>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Sentiment</p>
                <p className={`text-xs font-display font-bold ${booth.sentiment_score > 70 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    {booth.sentiment_score}%
                </p>
            </div>
        </div>

        <div className="flex items-center justify-between text-muted-foreground group-hover:text-emerald-400 transition-colors">
            <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`size-1 rounded-full ${i === 1 ? 'bg-emerald-500' : 'bg-border'}`} />
                ))}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest">View Details</span>
                <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    </motion.div>
);

export default function CityManagerDashboard({ currentUser, boothId }) {
    const [summary, setSummary] = useState(null);
    const [booths, setBooths] = useState([]);
    const [selectedBooth, setSelectedBooth] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [resolving, setResolving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    
    // States for the Action Flow
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [selectedVoters, setSelectedVoters] = useState([]);
    const [voterFilter, setVoterFilter] = useState({ segment: '', sentiment: '' });
    const [voters, setVoters] = useState([]);
    const [sendingUpdate, setSendingUpdate] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

    const loadBooths = useCallback(async () => {
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                getBoothsSummary(),
                getVoters(),
                getManagerAlerts(),
                getConstituencySummary()
            ]);
            
            const [bRes, vRes, aRes, sRes] = results;
            setBooths(bRes.status === 'fulfilled' ? bRes.value || [] : []);
            setVoters(vRes.status === 'fulfilled' ? vRes.value || [] : []);
            setAlerts(aRes.status === 'fulfilled' ? aRes.value || [] : []);
            setSummary(sRes.status === 'fulfilled' ? sRes.value : null);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, []);

    useEffect(() => { loadBooths(); }, [loadBooths]);

    const loadBoothVoters = useCallback(async (boothId) => {
        if (!boothId) return;
        try {
            const voterData = await getVoters(boothId);
            setVoters(voterData || []);
        } catch (e) { console.error(e); }
    }, []);

    const handleAnalyze = async (boothId) => {
        setAnalyzing(true);
        try {
            const result = await analyzeBooth(boothId);
            setAnalysisResult(result);
            await loadBoothVoters(boothId);
            if (result.top_priority) {
                setVoterFilter(prev => ({ ...prev, segment: result.top_priority }));
            }
        } catch (e) { console.error(e); }
        setAnalyzing(false);
    };

    useEffect(() => {
        if (selectedBooth) {
            loadBoothVoters(selectedBooth.id);
        }
    }, [selectedBooth, loadBoothVoters]);

    const handleAutoResolve = async () => {
        setResolving(true);
        try {
            const res = await managerAutoResolve();
            if (res.status === 'success') {
                alert(`Smart Assignment: Successfully auto-assigned ${res.assigned_count} grievances to available field workers.`);
                loadBooths();
            } else {
                alert("Smart Assignment: No unassigned grievances detected in the system.");
            }
        } catch (e) { console.error(e); }
        setResolving(false);
    };

    const handleSendUpdate = async () => {
        if (!updateMessage || selectedVoters.length === 0) return;
        setSendingUpdate(true);
        try {
            await sendTargetedUpdate({
                booth_id: selectedBooth.id,
                voter_ids: selectedVoters,
                message: updateMessage,
                action_type: 'targeted'
            });
            setUpdateMessage('');
            setSelectedVoters([]);
        } catch (e) { console.error(e); }
        setSendingUpdate(false);
    };

    const filteredBooths = booths.filter(b => 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.booth_number.toString().includes(searchQuery)
    );

    const filteredVoters = voters.filter(v => {
        const segmentMatch = !voterFilter.segment || v.segment === voterFilter.segment;
        const sentMatch = !voterFilter.sentiment || v.sentiment === voterFilter.sentiment;
        return segmentMatch && sentMatch;
    });

    // Main Grid View
    if (!selectedBooth) {
        return (
            <div className="space-y-6 animate-fade-in relative z-10 min-h-screen bg-background p-4 md:p-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-8 rounded-xl bg-foreground text-background flex items-center justify-center shadow-md">
                                <Globe size={16} />
                            </div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[3px]">City Management Dashboard</p>
                        </div>
                        <h1 className="text-3xl font-display font-bold text-foreground tracking-tighter uppercase mb-1">City Dashboard</h1>
                        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest">Manager: {currentUser?.city_id || 'CAPITAL_NCR'}</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <button 
                            onClick={handleAutoResolve}
                            disabled={resolving}
                            className="px-5 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-[2px] flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {resolving ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            Smart Assignment
                        </button>
                        <div className="relative group w-full md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" size={14} />
                            <input 
                                type="text" 
                                placeholder="Search booth area..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl font-display font-bold text-xs tracking-tight text-foreground focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none transition-all placeholder:text-muted-foreground/30"
                            />
                        </div>
                    </div>
                </div>

                {/* AI Automation Alerts Bar */}
                {alerts.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-emerald-500" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[4px] text-muted-foreground">High Priority Notifications</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {alerts.map((alert) => (
                                <motion.div 
                                    key={alert.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${
                                        alert.type === 'critical' ? 'bg-rose-500/5 border-rose-500/20 text-rose-500' : 
                                        alert.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 
                                        'bg-emerald-500/5 border-emerald-500/20 text-emerald-500'
                                    }`}
                                >
                                    <div className={`size-6 rounded-lg flex items-center justify-center shrink-0 ${
                                        alert.type === 'critical' ? 'bg-rose-500 text-white' : 
                                        alert.type === 'warning' ? 'bg-amber-500 text-white' : 
                                        'bg-emerald-500 text-white'
                                    }`}>
                                        <Zap size={10} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-tight mb-0.5">{alert.title} <span className="opacity-40 ml-2">({new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span></p>
                                        <p className="text-[9px] font-medium leading-tight opacity-60">{alert.message}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Booth Overview Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBooths.map((booth) => (
                        <BoothCard key={booth.id} booth={booth} onClick={() => setSelectedBooth(booth)} />
                    ))}
                    
                    {/* Placeholder Card */}
                    <div className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-6 opacity-20 hover:opacity-100 transition-opacity cursor-help bg-muted">
                        <div className="size-10 rounded-full border-2 border-border flex items-center justify-center mb-3">
                            <Layers size={16} className="text-muted-foreground" />
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center">Waiting for Assignment...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Selected Booth Detail View (Strategic Intervention)
    return (
        <div className="animate-fade-in space-y-6 relative z-10 min-h-screen bg-background p-4 md:p-6">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            setSelectedBooth(null);
                            setAnalysisResult(null);
                        }}
                        className="size-10 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95 flex items-center justify-center shadow-sm"
                    >
                        <Globe size={16} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Processing</p>
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-foreground tracking-tight uppercase">{selectedBooth.name}</h2>
                    </div>
                </div>
                
                <button 
                    onClick={() => handleAnalyze(selectedBooth.id)}
                    disabled={analyzing}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${analyzing ? 'bg-muted text-muted-foreground' : 'bg-foreground text-background shadow-lg shadow-foreground/10 hover:scale-105 active:scale-95'}`}
                >
                    {analyzing ? <RefreshCw className="animate-spin" size={14} /> : <BrainCircuit size={14} />}
                    {analyzing ? 'Processing...' : 'Analyze Booth'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Booth Report */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="glass-panel p-6 rounded-2xl border border-border shadow-sm relative overflow-hidden bg-card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                <ShieldAlert size={16} />
                            </div>
                            <h3 className="text-lg font-display font-bold text-foreground tracking-tight uppercase">Live Updates</h3>
                        </div>

                        <AnimatePresence mode="wait">
                            {analysisResult ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.98 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    exit={{ opacity: 0 }}
                                    className="space-y-5"
                                >
                                    <div className="p-5 rounded-2xl bg-muted border border-border text-sm font-medium leading-snug italic text-foreground/70 relative">
                                        <div className="absolute -top-2 -left-2 size-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-sm">
                                            <Sparkles size={12} />
                                        </div>
                                        "{analysisResult.recommendation}"
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-xl bg-muted border border-border shadow-sm">
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 text-center">Main Area Concern</p>
                                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider text-center">{analysisResult.top_priority}</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-muted border border-border shadow-sm">
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 text-center">Affected Voters</p>
                                            <p className="text-[10px] font-bold text-foreground uppercase tracking-wider text-center">{analysisResult.affected_count} Households</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="py-12 text-center space-y-4 border-2 border-dashed border-border rounded-2xl">
                                    <BarChart3 size={32} className="mx-auto text-muted-foreground/20" />
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[3px] max-w-[160px] mx-auto">
                                        Start scanning to detect issues.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="text-emerald-500" size={20} />
                            <h3 className="font-black text-foreground uppercase tracking-tight">Institutional Metrics</h3>
                        </div>
                        <div className="space-y-6">
                            {[
                                { label: 'Outreach Rate', value: summary?.metrics?.total_turnout || '72%', color: 'bg-emerald-500' },
                                { label: 'Issue Resolution', value: `${summary?.metrics?.active_issues === 0 ? '100%' : '84%'}`, color: 'bg-indigo-500' },
                                { label: 'System Latency', value: summary?.metrics?.system_latency || '24ms', color: 'bg-amber-500' },
                            ].map((stat, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-sm font-black text-foreground">{stat.value}</p>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: typeof stat.value === 'string' && stat.value.includes('%') ? stat.value : '95%' }}
                                            className={`h-full ${stat.color} rounded-full`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Voter Segmentation Interface */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="glass-panel p-6 rounded-2xl border border-border shadow-sm bg-card flex flex-col h-[550px]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-muted-foreground" />
                                <h3 className="text-lg font-display font-bold text-foreground tracking-tight uppercase">Voter Distribution</h3>
                            </div>
                            <div className="flex gap-2">
                                <select 
                                    className="px-3 py-1.5 bg-muted border border-border rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    value={voterFilter.sentiment}
                                    onChange={(e) => setVoterFilter(prev => ({ ...prev, sentiment: e.target.value }))}
                                >
                                    <option value="">All Sentiment</option>
                                    <option value="positive">Satisfied</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="negative">Dissatisfied</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            <AnimatePresence>
                                {filteredVoters.map((voter, idx) => (
                                    <motion.div 
                                        key={voter.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => {
                                            setSelectedVoters(prev => 
                                                prev.includes(voter.id) 
                                                    ? prev.filter(id => id !== voter.id)
                                                    : [...prev, voter.id]
                                            )
                                        }}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden ${selectedVoters.includes(voter.id) ? 'bg-foreground border-foreground text-background shadow-md translate-x-1' : 'bg-muted border-border hover:border-emerald-500/30'}`}
                                    >
                                        <div className="flex items-center justify-between relative z-10">
                                            <div>
                                                <h4 className={`text-sm font-display font-bold leading-none mb-1 ${selectedVoters.includes(voter.id) ? 'text-background' : 'text-foreground group-hover:text-emerald-400'}`}>
                                                    {voter.name}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <p className={`text-[8px] font-bold uppercase tracking-widest ${selectedVoters.includes(voter.id) ? 'text-background/40' : 'text-muted-foreground/40'}`}>
                                                        {voter.segment || 'Regular Voter'}
                                                    </p>
                                                    <div className={`size-1 rounded-full ${voter.sentiment === 'positive' ? 'bg-emerald-500' : voter.sentiment === 'negative' ? 'bg-rose-500' : 'bg-border'}`} />
                                                    <p className={`text-[8px] font-bold uppercase tracking-widest ${voter.sentiment === 'positive' ? 'text-emerald-500' : voter.sentiment === 'negative' ? 'text-rose-500' : 'text-muted-foreground/40'}`}>
                                                        {voter.sentiment}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`size-8 rounded-lg flex items-center justify-center transition-all ${selectedVoters.includes(voter.id) ? 'bg-emerald-500 text-white animate-fade-in' : 'bg-foreground/5 text-muted-foreground/20 group-hover:opacity-100'}`}>
                                                {selectedVoters.includes(voter.id) ? <CheckCircle2 size={14} /> : <Target size={14} />}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        
                        <div className="mt-5 pt-5 border-t border-border flex items-center justify-between">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[3px]">Voter Selection</p>
                            <div className="px-3 py-1.5 rounded-full bg-foreground text-background text-[10px] font-display font-bold uppercase">
                                {selectedVoters.length} Selected
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engagement Action Panel */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="glass-panel p-6 rounded-2xl border border-border shadow-sm bg-card sticky top-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Target size={16} className="text-emerald-500" />
                            <h3 className="text-lg font-display font-bold text-foreground tracking-tight uppercase">Actions</h3>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Message Text</label>
                                <textarea 
                                    placeholder="Enter message for selected voters..."
                                    value={updateMessage}
                                    onChange={(e) => setUpdateMessage(e.target.value)}
                                    className="w-full h-32 p-4 bg-muted border border-border rounded-xl text-xs font-medium text-foreground placeholder:text-muted-foreground/20 focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none italic"
                                />
                            </div>
                            
                            <button 
                                onClick={handleSendUpdate}
                                disabled={sendingUpdate || selectedVoters.length === 0}
                                className={`w-full py-3.5 rounded-xl text-[9px] font-bold uppercase tracking-[2px] flex items-center justify-center gap-2 transition-all ${sendingUpdate || selectedVoters.length === 0 ? 'bg-muted text-muted-foreground' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'}`}
                            >
                                {sendingUpdate ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
                                {sendingUpdate ? 'Sending...' : 'Send Message'}
                            </button>

                            <div className="space-y-2 pt-4">
                                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">Additional Actions</p>
                                {[
                                    { label: 'High Priority Task', icon: Layers },
                                    { label: 'Urgent Action', icon: ShieldAlert }
                                ].map((action, i) => (
                                    <button key={i} className="w-full p-3 rounded-xl border border-border flex items-center justify-between text-muted-foreground hover:bg-muted hover:text-foreground transition-all group">
                                        <div className="flex items-center gap-2">
                                            <action.icon size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-[9px] font-bold uppercase tracking-widest">{action.label}</span>
                                        </div>
                                        <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

