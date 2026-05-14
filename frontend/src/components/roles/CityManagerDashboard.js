import {
  getBoothsSummary, analyzeBooth, sendTargetedUpdate,
  getVoters, getManagerAlerts, managerAutoResolve,
  getConstituencySummary, getWorkerPerformance, getCampaignOversight,
  seedData, managerBroadcast, getCampaignLogs, managerAutoAssign,
  getManagerRankings
} from '../../api';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, Tooltip as ChartTooltip 
} from 'recharts';
import { IntelligenceGraph } from '../intel/IntelligenceGraph';
import { 
  Globe, Search, 
  AlertTriangle, CheckCircle2,
  Zap, ChevronRight, MapPin, RefreshCw, Layers,
  Sparkles, BrainCircuit, ShieldAlert, BarChart3,
  Activity, Users, Target, Database, Send, X
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BoothCard = ({ booth, onClick, isCrisisMode, onDeploy }) => (
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
                {isCrisisMode && booth.pending_grievances > 0 && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeploy(booth);
                        }}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/30 active:scale-95"
                    >
                        Deploy Assets
                    </button>
                )}
                <span className="text-[9px] font-bold uppercase tracking-widest">View Details</span>
                <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
        {isCrisisMode && booth.pending_grievances > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-red-600 animate-pulse" />
        )}
    </motion.div>
);

export default function CityManagerDashboard({ currentUser, boothId }) {
    const [booths, setBooths] = useState([]);
    const [selectedBooth, setSelectedBooth] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [seeding, setSeeding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);

    const handleSeedData = async () => {
        if (!window.confirm("This will clear current data and seed 1000+ synthetic records. Proceed?")) return;
        setSeeding(true);
        try {
            await seedData();
            await loadBooths(true);
            alert("Regional Intelligence Fabric Initialized Successfully.");
        } catch (e) { 
            console.error(e);
            alert("Initialization failed. Check permissions.");
        }
        setSeeding(false);
    };
    const [activeTab, setActiveTab] = useState('overview');
    const [performance, setPerformance] = useState([]);
    const [oversight, setOversight] = useState([]);
    const [summary, setSummary] = useState({
        total_voters: 0,
        pending_grievances: 0,
        resolved_today: 0,
        avg_sentiment: 'Neutral'
    });
    const [pulseLogs, setPulseLogs] = useState([
        { msg: "Regional Intelligence Fabric Synchronized", time: "Just now", type: "success" },
        { msg: "Booth 17: High voter turnout detected in Sector 9", time: "2m ago", type: "info" },
        { msg: "Operational Command: All units active", time: "5m ago", type: "success" }
    ]);
    
    // States for the Action Flow
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [selectedVoters, setSelectedVoters] = useState([]);
    const [voterFilter, setVoterFilter] = useState({ segment: '', sentiment: '' });
    const [voters, setVoters] = useState([]);
    const [sendingUpdate, setSendingUpdate] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [campaignLogs, setCampaignLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [isCrisisMode, setIsCrisisMode] = useState(false);
    const [deploymentLoading, setDeploymentLoading] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);
    const [optimizationLogs, setOptimizationLogs] = useState([]);
    const [showOptimizationModal, setShowOptimizationModal] = useState(false);

    const [sentimentData] = useState([
        { time: '08:00', score: 62 },
        { time: '10:00', score: 65 },
        { time: '12:00', score: 58 },
        { time: '14:00', score: 72 },
        { time: '16:00', score: 68 },
        { time: '18:00', score: 75 },
        { time: '20:00', score: 82 },
    ]);

    const [rankings, setRankings] = useState({ sectors: [], agents: [], regional_health: 0, efficiency_gain: '' });

    const [refreshing, setRefreshing] = useState(false);
    
    const handleOptimizeDeployment = async () => {
        setIsOptimizing(true);
        setOptimizationLogs([]);
        setShowOptimizationModal(true);
        
        try {
            const result = await managerAutoAssign({});
            
            if (result.reasoning) {
                // Simulate sequential reasoning steps for better UX
                for (const step of result.reasoning) {
                    setOptimizationLogs(prev => [...prev, { msg: step, time: new Date().toLocaleTimeString() }]);
                    await new Promise(r => setTimeout(r, 1200));
                }
            }

            if (result.status === 'success' || result.status === 'demo_success') {
                setOptimizationLogs(prev => [...prev, { msg: "Deployment calibration complete. Strategic units mobilized.", time: new Date().toLocaleTimeString(), type: 'success' }]);
                await loadBooths(true);
            } else {
                toast.error("Optimization failed: " + result.message);
            }
        } catch (error) {
            console.error("Optimization error:", error);
            toast.error("Resource deployment failed. Check connectivity.");
        } finally {
            setIsOptimizing(false);
        }
    };

    const loadBooths = useCallback(async (force = false) => {
        if (force) setRefreshing(true);
        else setLoading(true);
        
        try {
            const results = await Promise.allSettled([
                getBoothsSummary(force),
                getVoters(null, force),
                getManagerAlerts(),
                getConstituencySummary(force),
                getWorkerPerformance(),
                getCampaignOversight(),
                getManagerRankings()
            ]);
            
            const [bRes, vRes, aRes, sRes, pRes, oRes, rRes] = results;
            const boothsData = bRes.status === 'fulfilled' ? bRes.value || [] : [];
            const performanceData = pRes.status === 'fulfilled' ? pRes.value || [] : [];
            
            setBooths(boothsData);
            setVoters(vRes.status === 'fulfilled' ? vRes.value || [] : []);
            setAlerts(aRes.status === 'fulfilled' ? aRes.value || [] : []);
            setPerformance(performanceData);
            setOversight(oRes.status === 'fulfilled' ? oRes.value || [] : []);
            
            if (rRes.status === 'fulfilled' && rRes.value) {
                setRankings(rRes.value);
            } else {
                setRankings({ sectors: [], agents: [], regional_health: 84, efficiency_gain: '12.2%' });
            }

            // Calculate aggregate regional summary
            const totalVoters = boothsData.reduce((acc, b) => acc + (b.total_voters || 0), 0);
            const totalGrievances = boothsData.reduce((acc, b) => acc + (b.pending_issues || 0), 0);
            const totalResolved = performanceData.reduce((acc, a) => acc + (a.resolved || 0), 0);
            
            setSummary({
                total_voters: totalVoters,
                pending_grievances: totalGrievances,
                resolved_today: totalResolved,
                avg_sentiment: 'Stable'
            });

            setPulseLogs(prev => [
                { msg: `Regional Intel Sync: ${boothsData.length} Booths processing`, time: "Just now", type: "success" },
                ...prev.slice(0, 4)
            ]);
        } catch (e) { console.error(e); }
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => { 
        loadBooths(); 
        
        // --- LIVE ENGINE: Auto-refresh data every 60 seconds (Slow fallback) ---
        const interval = setInterval(() => {
            loadBooths(false);
        }, 60000);

        // --- REAL-TIME ENGINE: SSE Pulse ---
        const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        const eventSource = new EventSource(`${baseUrl}/api/manager/pulse-stream`);
        
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setPulseLogs(prev => [data, ...prev.slice(0, 5)]);
                
                if (data.type === 'broadcast') {
                    toast.success(data.msg, { 
                        icon: '📢', 
                        duration: 8000,
                        className: 'bg-[#0f172a] text-white border-indigo-500' 
                    });
                }
            } catch (e) { console.error("SSE Parse Error", e); }
        };

        return () => {
            clearInterval(interval);
            eventSource.close();
        };
    }, [loadBooths]);

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

    const handleViewCampaign = async (booth) => {
        setSelectedCampaign(booth);
        setLoadingLogs(true);
        try {
            const logs = await getCampaignLogs(booth.booth_id);
            setCampaignLogs(logs || []);
        } catch (e) { console.error(e); }
        setLoadingLogs(false);
    };

    const handleDeployResources = async () => {
        setDeploymentLoading(true);
        try {
            const res = await managerAutoAssign({ booth_id: selectedBooth?.id });
            const newPulse = { msg: "EMERGENCY: Strategic resources deployed to region", time: "Just now", type: "error" };
            setPulseLogs(prev => [newPulse, ...prev.slice(0, 5)]);
            alert("Crisis Protocol Activated: Resources have been deployed and field units notified.");
        } catch (e) { console.error(e); }
        setDeploymentLoading(false);
    };

    const handleBroadcast = async () => {
        if (!broadcastMessage) return;
        setSendingBroadcast(true);
        try {
            await managerBroadcast({ message: broadcastMessage });
            const newPulse = { msg: "GLOBAL: Regional directive broadcasted to all sectors", time: "Just now", type: "info" };
            setPulseLogs(prev => [newPulse, ...prev.slice(0, 5)]);
            setIsBroadcasting(false);
            setBroadcastMessage('');
        } catch (e) { console.error(e); }
        setSendingBroadcast(false);
    };



    const filteredBooths = booths.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             b.booth_number.toString().includes(searchQuery);
        const matchesCrisis = !isCrisisMode || (b.pending_grievances > 0);
        return matchesSearch && matchesCrisis;
    }).sort((a, b) => isCrisisMode ? (b.pending_grievances - a.pending_grievances) : 0);

    const filteredVoters = voters.filter(v => {
        const segmentMatch = !voterFilter.segment || v.segment === voterFilter.segment;
        const sentMatch = !voterFilter.sentiment || v.sentiment === voterFilter.sentiment;
        return segmentMatch && sentMatch;
    });

    // Main Grid View
    if (!selectedBooth) {
        return (
            <div className={`space-y-6 animate-fade-in relative z-10 min-h-screen max-w-full overflow-x-hidden ${isCrisisMode ? 'bg-red-950/20' : 'bg-background'} p-4 md:p-6 pb-24 transition-colors duration-1000`}>
                {/* Ambient Crisis Background */}
                {isCrisisMode && (
                    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[99]">
                        <div className="absolute top-0 left-0 w-full h-full bg-red-600/5 animate-pulse" />
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.1)_1px,transparent_1px)] bg-[size:100%_4px] animate-scanline" />
                        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-red-500/10 blur-[150px] rounded-full animate-pulse" />
                        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-orange-500/10 blur-[150px] rounded-full animate-pulse-slow" />
                    </div>
                )}
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-8 rounded-xl bg-foreground text-background flex items-center justify-center shadow-md">
                                <Globe size={16} />
                            </div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[3px]">City Management Dashboard</p>
                        </div>
                        <h1 className="text-3xl font-display font-bold text-foreground tracking-tighter uppercase mb-1">Operational Command</h1>
                        <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-widest">Region: {currentUser?.city_id || 'CAPITAL_NCR'}</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-3 mr-4">
                            {refreshing && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Syncing Intel...</span>
                                </div>
                            )}
                            <button 
                                onClick={() => loadBooths(true)}
                                disabled={refreshing}
                                className="size-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-emerald-500 transition-all active:rotate-180"
                            >
                                <RefreshCw size={16} className={refreshing ? 'animate-spin text-emerald-500' : ''} />
                            </button>
                        </div>
                        <div className="flex bg-card p-1 rounded-2xl border border-border">
                            {[
                                { id: 'overview', label: 'Overview', icon: Layers },
                                { id: 'performance', label: 'Performance', icon: Activity },
                                { id: 'campaign', label: 'Campaigns', icon: Target },
                                { id: 'intelligence', label: 'Intel Map', icon: BrainCircuit }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:bg-muted'}`}
                                >
                                    <tab.icon size={12} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={handleSeedData}
                            disabled={seeding}
                            className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-[2px] flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {seeding ? <RefreshCw size={12} className="animate-spin" /> : <Database size={12} />}
                            Initialize Region
                        </button>
                        
                        <button 
                            onClick={() => setIsBroadcasting(true)}
                            className="px-5 py-3 bg-indigo-600/10 text-indigo-500 border border-indigo-500/20 rounded-xl text-[9px] font-bold uppercase tracking-[2px] flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                        >
                            <Send size={12} />
                            Broadcast Directive
                        </button>

                        {/* Crisis Mode Toggle */}
                        <button 
                            onClick={() => setIsCrisisMode(!isCrisisMode)}
                            className={`px-5 py-3 rounded-xl text-[9px] font-bold uppercase tracking-[2px] flex items-center gap-2 transition-all shadow-md active:scale-95 ${isCrisisMode ? 'bg-red-600 text-white shadow-red-500/30 animate-pulse' : 'bg-card border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/50'}`}
                        >
                            <ShieldAlert size={12} />
                            {isCrisisMode ? 'Crisis Active' : 'Crisis Protocol'}
                        </button>

                        <button 
                            onClick={handleAutoResolve}
                            disabled={resolving}
                            className="px-5 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-[2px] flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {resolving ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            Smart Assignment
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div 
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* AI Automation Alerts Bar */}
                            {/* Regional Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Regional Voters', value: summary.total_voters, icon: Users, color: 'text-indigo-500' },
                                    { label: 'Pending Action', value: summary.pending_grievances, icon: AlertTriangle, color: 'text-rose-500' },
                                    { label: 'Resolved Today', value: summary.resolved_today, icon: CheckCircle2, color: 'text-emerald-500' },
                                    { label: 'Health Index', value: summary.avg_sentiment, icon: Activity, color: 'text-indigo-400' }
                                ].map((item, i) => (
                                    <div key={i} className="bg-card border border-border p-5 rounded-[2rem] shadow-sm group hover:border-emerald-500/20 transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`size-8 rounded-xl bg-muted flex items-center justify-center ${item.color}`}>
                                                <item.icon size={14} />
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-[2px] text-muted-foreground">{item.label}</p>
                                        </div>
                                        <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase">{item.value}</h3>
                                    </div>
                                ))}
                            </div>

                            {/* Sentiment Intelligence Chart */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                                        <BrainCircuit size={120} className="text-indigo-500" />
                                    </div>
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[3px] mb-1">Sentiment Intelligence</p>
                                                <h3 className="text-2xl font-display font-bold text-foreground tracking-tight uppercase">Regional Pulse Trend</h3>
                                            </div>
                                            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                                                Live Analytics
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 min-h-[250px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={sentimentData}>
                                                    <defs>
                                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis 
                                                        dataKey="time" 
                                                        stroke="rgba(255,255,255,0.1)" 
                                                        fontSize={10} 
                                                        fontWeight={700}
                                                        tickLine={false}
                                                        axisLine={false}
                                                    />
                                                    <YAxis hide domain={[0, 100]} />
                                                    <ChartTooltip 
                                                        contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px' }}
                                                        itemStyle={{ color: '#fff', fontWeight: 800 }}
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="score" 
                                                        stroke="#6366f1" 
                                                        strokeWidth={3}
                                                        fillOpacity={1} 
                                                        fill="url(#colorScore)" 
                                                        animationDuration={2000}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#6366f1] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/30">
                                    {/* Abstract BG Pattern */}
                                    <div className="absolute top-0 right-0 p-10 opacity-10">
                                        <Zap size={140} className="text-white" />
                                    </div>
                                    
                                    <div className="relative z-10 flex flex-col h-full">
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-10">AI Insights</h2>
                                        
                                        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 mb-8">
                                            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[4px] mb-4">Strategic Pulse</p>
                                            <p className="text-xl font-bold text-white leading-relaxed italic">
                                                "Water Infrastructure focus recommended for Sector 9. 12% improvement potential detected."
                                            </p>
                                        </div>

                                        <div className="flex gap-3 mt-auto">
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        const msg = "TACTICAL DIRECTIVE: Prioritize all Water Infrastructure related grievances in Sector 9 immediately for 12% efficiency gain.";
                                                        await managerBroadcast({ message: msg });
                                                        toast.success("Strategic Directive mobilized to all field units.");
                                                    } catch (e) { toast.error("Command sync failed."); }
                                                }}
                                                className="flex-1 py-5 bg-white text-[#6366f1] rounded-2xl text-[10px] font-black uppercase tracking-[3px] hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center"
                                            >
                                                Quick Action
                                            </button>
                                            <button className="size-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center hover:bg-white/20 transition-all">
                                                <ChevronRight size={24} className="rotate-[-45deg]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {alerts.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles size={16} className="text-emerald-500" />
                                        <h3 className="text-[10px] font-bold uppercase tracking-[4px] text-muted-foreground">High Priority Notifications</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {alerts.map((alert) => (
                                            <div 
                                                key={alert.id}
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
                                                    <p className="text-[10px] font-bold uppercase tracking-tight mb-0.5">{alert.title}</p>
                                                    <p className="text-[9px] font-medium leading-tight opacity-60">{alert.message}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Search and Filters */}
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="relative group w-full max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Search booth area..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl font-display font-bold text-xs tracking-tight text-foreground focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50 outline-none transition-all placeholder:text-muted-foreground/30"
                                    />
                                </div>
                                {!performance.length && (
                                    <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2">
                                        <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Demo State Active</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
                                <div className="lg:col-span-9 space-y-6 min-w-0">
                                    {/* Booth Overview Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredBooths.map((booth) => (
                                            <BoothCard 
                                                key={booth.id} 
                                                booth={booth} 
                                                onClick={() => setSelectedBooth(booth)} 
                                                isCrisisMode={isCrisisMode}
                                                onDeploy={handleDeployResources}
                                            />
                                        ))}
                                        
                                        <div className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-6 opacity-20 hover:opacity-100 transition-opacity cursor-help bg-muted">
                                            <div className="size-10 rounded-full border-2 border-border flex items-center justify-center mb-3">
                                                <Layers size={16} className="text-muted-foreground" />
                                            </div>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest text-center">New Sector Scan...</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-3">
                                    <div className="bg-card border border-border rounded-2xl p-6 h-full shadow-sm flex flex-col">
                                        <div className="flex items-center gap-2 mb-6">
                                            <Activity size={16} className="text-emerald-500" />
                                            <h3 className="text-[10px] font-bold uppercase tracking-[3px] text-foreground">Operational Pulse</h3>
                                        </div>
                                        <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                            {pulseLogs.map((log, i) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    key={i} 
                                                    className="group relative pl-4 border-l-2 border-border py-1"
                                                >
                                                    <div className={`absolute -left-[5px] top-2.5 size-2 rounded-full border-2 border-card ${
                                                        log.type === 'success' ? 'bg-emerald-500' : 
                                                        log.type === 'warning' ? 'bg-rose-500' : 'bg-indigo-500'
                                                    }`} />
                                                    <p className="text-[10px] font-bold text-foreground leading-tight group-hover:text-emerald-500 transition-colors">{log.msg}</p>
                                                    <p className="text-[8px] font-medium text-muted-foreground uppercase mt-1">{log.time}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'performance' && (
                        <motion.div 
                            key="performance"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* Regional Scoreboard Header */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                <div className="lg:col-span-1 bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Regional Health</p>
                                        <h3 className="text-4xl font-display font-bold mb-2">{rankings.regional_health}%</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-tight">Optimal Zone</p>
                                        </div>
                                    </div>
                                    <Activity className="absolute -bottom-4 -right-4 size-24 opacity-20" />
                                </div>
                                <div className="lg:col-span-1 bg-card border border-border rounded-[2.5rem] p-6 shadow-sm">
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Efficiency Gain</p>
                                    <h3 className="text-3xl font-display font-bold text-emerald-500">{rankings.efficiency_gain}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mt-1">vs Last Quarter</p>
                                </div>
                                <div className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] p-6 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Regional Efficiency Map</p>
                                        <div className="flex gap-2 mt-3">
                                            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
                                                <div key={i} className={`size-3 rounded-md shadow-sm transition-all hover:scale-125 cursor-help ${i % 3 === 0 ? 'bg-emerald-500' : i % 5 === 0 ? 'bg-amber-500' : 'bg-indigo-500/40'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-[10px] font-black text-foreground uppercase tracking-[2px]">High Precision</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-8">
                                    <div className="bg-card border border-border rounded-[3rem] shadow-sm overflow-hidden">
                                        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-muted/20">
                                            <div className="flex items-center gap-3">
                                                <Target size={18} className="text-indigo-500" />
                                                <h3 className="text-sm font-bold text-foreground uppercase tracking-[3px]">Sector Elite Rankings</h3>
                                            </div>
                                            <button className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hover:underline">Full Report</button>
                                        </div>
                                        <div className="p-2">
                                            {(rankings.sectors || []).map((sector, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-6 hover:bg-muted/50 rounded-[2rem] transition-all group">
                                                    <div className="flex items-center gap-6">
                                                        <span className="text-2xl font-display font-black text-muted-foreground/20 group-hover:text-indigo-500/40 transition-colors">0{idx + 1}</span>
                                                        <div>
                                                            <h4 className="text-lg font-display font-bold text-foreground uppercase tracking-tight">{sector.name}</h4>
                                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${sector.status === 'Elite' ? 'bg-emerald-500 text-white' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                                                {sector.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-12">
                                                        <div className="text-center">
                                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Growth</p>
                                                            <p className="text-sm font-black text-emerald-500">{sector.trend}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Perf Score</p>
                                                            <p className="text-xl font-display font-black text-foreground">{sector.score}%</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-card border border-border rounded-[3rem] p-8 shadow-sm">
                                        <h3 className="text-sm font-bold text-foreground uppercase tracking-[3px] mb-8">Agent Leaderboard</h3>
                                        <div className="space-y-8">
                                            {(rankings.agents || []).map((agent, i) => (
                                                <div key={i} className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="size-12 rounded-2xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center font-display font-black text-xs shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                            {agent.avatar}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-foreground group-hover:text-indigo-500 transition-colors">{agent.name}</p>
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{agent.resolved} Issues Fixed</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-black text-foreground">★ {agent.rating}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-amber-500 rounded-[2.5rem] p-8 text-black relative overflow-hidden shadow-xl shadow-amber-500/20">
                                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-[3px] mb-1">Action Required</p>
                                        <h4 className="text-xl font-display font-bold mb-4 uppercase tracking-tight italic">Lagging Sector Detected</h4>
                                        <p className="text-xs text-black/60 leading-relaxed mb-6">
                                            Sector 14 has fallen below 65% efficiency. Field response time has increased by 14 minutes.
                                        </p>
                                        <button className="w-full py-4 bg-black text-white rounded-2xl text-[9px] font-black uppercase tracking-[2px] hover:bg-black/80 transition-all active:scale-95">
                                            Reassign Resources
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'campaign' && (
                        <motion.div 
                            key="campaign"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {(oversight && oversight.length > 0) ? oversight.map((booth) => (
                                <div 
                                    key={booth.booth_id} 
                                    onClick={() => handleViewCampaign(booth)}
                                    className="bg-card border border-border rounded-2xl p-6 shadow-sm group hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="px-2 py-1 bg-indigo-500 text-white text-[8px] font-bold uppercase rounded-lg">View Logs</div>
                                    </div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Sector Campaign</p>
                                            <h4 className="text-xl font-display font-bold text-foreground uppercase tracking-tight">{booth.booth_name}</h4>
                                        </div>
                                        <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                                            <Target size={18} />
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 bg-muted rounded-xl border border-border">
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1 text-center">Total Reach</p>
                                            <p className="text-lg font-black text-foreground text-center">{booth.outreach_total}</p>
                                        </div>
                                        <div className="p-4 bg-muted rounded-xl border border-border">
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1 text-center">Success Rate</p>
                                            <p className="text-lg font-black text-emerald-500 text-center">{booth.success_rate}%</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-1.5">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Positive Sentiment Impact</span>
                                                <span className="text-[9px] font-bold text-foreground">{booth.sentiment_positive} Voters</span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(booth.sentiment_positive / (booth.outreach_total || 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center bg-card border border-border border-dashed rounded-[3rem] w-full">
                                    <div className="size-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center mb-6">
                                        <Target size={32} className="text-indigo-500/40" />
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground uppercase tracking-[4px] mb-2">No Active Outreach Detected</h3>
                                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-8">Campaign intelligence is currently in standby mode.</p>
                                    <button 
                                        onClick={() => loadBooths(true)}
                                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[9px] font-bold uppercase tracking-[2px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                                    >
                                        Initiate Sector Sync
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'intelligence' && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-[calc(100vh-180px)] border border-border rounded-3xl overflow-hidden shadow-2xl relative bg-[#020617]"
                        >
                            <IntelligenceGraph 
                                boothId={boothId || 17} 
                                perspective="social" 
                                booths={booths}
                                onBoothChange={(val) => setBoothId(val)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Campaign Drill-Down Modal */}
                <AnimatePresence>
                    {selectedCampaign && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                            onClick={() => setSelectedCampaign(null)}
                        >
                            <motion.div 
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-4xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                            >
                                <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
                                    <div>
                                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[3px] mb-1">Operational Drill-Down</p>
                                        <h2 className="text-3xl font-display font-bold text-foreground tracking-tight uppercase">{selectedCampaign.booth_name} Logs</h2>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedCampaign(null)}
                                        className="size-12 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                    {loadingLogs ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <RefreshCw size={40} className="text-indigo-500 animate-spin" />
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Retrieving Secure Logs...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {campaignLogs.length > 0 ? campaignLogs.map((log, i) => (
                                                <div key={i} className="p-6 bg-muted/50 rounded-2xl border border-border hover:border-indigo-500/30 transition-all group">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${log.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                {log.sentiment}
                                                            </div>
                                                            <p className="text-sm font-bold text-foreground">{log.voter}</p>
                                                        </div>
                                                        <p className="text-[10px] font-medium text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 italic">"{log.summary}"</p>
                                                    <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles size={12} className="text-indigo-500" />
                                                            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">{log.type}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle2 size={12} className="text-emerald-500" />
                                                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{log.status}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                                    <Target size={40} className="mb-4" />
                                                    <p className="text-[10px] font-bold uppercase tracking-[2px]">No logs detected for this sector</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
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

    {/* Global Broadcast Modal */}
            <AnimatePresence>
                {isBroadcasting && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md"
                        onClick={() => setIsBroadcasting(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-xl bg-card border border-border rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 text-center">
                                <div className="size-20 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-500/40">
                                    <Send size={32} />
                                </div>
                                <h2 className="text-3xl font-display font-bold text-foreground tracking-tight uppercase mb-2">Regional Broadcast</h2>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">Send strategic directive to all field units</p>
                                
                                <textarea 
                                    placeholder="Enter global directive message..."
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    className="w-full h-40 p-6 bg-muted border border-border rounded-2xl text-sm font-medium text-foreground placeholder:text-muted-foreground/30 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none mb-8 italic"
                                />

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setIsBroadcasting(false)}
                                        className="flex-1 py-4 rounded-2xl border border-border text-[10px] font-black uppercase tracking-[2px] hover:bg-muted transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleBroadcast}
                                        disabled={sendingBroadcast || !broadcastMessage}
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50"
                                    >
                                        {sendingBroadcast ? 'Broadcasting...' : 'Execute Broadcast'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Optimization Intelligence Modal */}
            <AnimatePresence>
                {showOptimizationModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-background/95 backdrop-blur-xl"
                        onClick={() => !isOptimizing && setShowOptimizationModal(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 30 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl bg-card border border-border rounded-[3.5rem] shadow-2xl overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 p-8">
                                <button 
                                    onClick={() => setShowOptimizationModal(false)}
                                    disabled={isOptimizing}
                                    className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-0"
                                >
                                    <X size={20} className="text-muted-foreground" />
                                </button>
                            </div>

                            <div className="p-12">
                                <div className="flex items-center gap-6 mb-12">
                                    <div className="size-16 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30">
                                        <BrainCircuit size={32} />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black text-foreground tracking-tighter uppercase leading-none mb-2">Tactical Engine</h2>
                                        <div className="flex items-center gap-2">
                                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[4px]">Regional Calibration Active</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-12 min-h-[300px]">
                                    {optimizationLogs.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/30">
                                            <RefreshCw className="animate-spin mb-4" size={32} />
                                            <p className="text-[10px] font-black uppercase tracking-[4px]">Initializing Strategic Pipeline...</p>
                                        </div>
                                    )}
                                    {optimizationLogs.map((log, i) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`p-5 rounded-2xl border flex items-start gap-4 ${
                                                log.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-muted/50 border-border'
                                            }`}
                                        >
                                            <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                log.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                                            }`}>
                                                {log.type === 'success' ? <CheckCircle2 size={14} /> : <Zap size={14} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[11px] font-bold tracking-tight leading-relaxed">{log.msg}</p>
                                                <p className="text-[8px] font-black opacity-30 uppercase mt-1">{log.time}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <button 
                                    onClick={() => setShowOptimizationModal(false)}
                                    disabled={isOptimizing}
                                    className="w-full py-5 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-[4px] hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
                                >
                                    {isOptimizing ? 'Optimization in Progress...' : 'Acknowledge Calibration'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

