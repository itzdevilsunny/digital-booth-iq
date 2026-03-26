import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getBoothsSummary, analyzeBooth, sendTargetedUpdate,
  getVoters, getManagerAlerts, managerAutoResolve
} from '../../api';
import { 
  Globe, Activity, LayoutDashboard, Search, 
  AlertTriangle, CheckCircle2, Users, Target,
  Zap, Send, ShieldAlert, BarChart3,
  ChevronRight, ArrowRight, Filter, MessageSquare,
  PieChart, MapPin, RefreshCw, Layers, BrainCircuit,
  Maximize2, MoreHorizontal, Sparkles
} from 'lucide-react';

const BoothCard = ({ booth, onClick }) => (
    <motion.div 
        layoutId={booth.id}
        onClick={onClick}
        className="glass-panel group p-6 rounded-[2.5rem] border border-stone-200/60 transition-all cursor-pointer bg-white relative overflow-hidden hover:shadow-2xl hover:shadow-stone-200/50"
    >
        <div className="flex items-start justify-between mb-8">
            <div className={`size-12 rounded-2xl flex items-center justify-center shadow-sm ${booth.status === 'critical' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                {booth.status === 'critical' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">Node ID</p>
                <p className="text-xl font-display font-bold text-stone-900">SEC_{booth.booth_number}</p>
            </div>
        </div>

        <h3 className="text-2xl font-display font-bold text-stone-900 mb-1 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{booth.name}</h3>
        <div className="flex items-center gap-2 mb-8">
            <MapPin size={10} className="text-stone-300" />
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sector Deployment Area</p>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8 py-6 border-y border-stone-50">
            <div>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Impact</p>
                <p className="text-sm font-display font-bold text-stone-900">{booth.turnout}%</p>
            </div>
            <div>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Anomalies</p>
                <p className="text-sm font-display font-bold text-rose-500">{booth.issue_count}</p>
            </div>
            <div>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">Bias</p>
                <p className={`text-sm font-display font-bold ${booth.sentiment_score > 70 ? 'text-emerald-600' : 'text-stone-400'}`}>
                    {booth.sentiment_score}%
                </p>
            </div>
        </div>

        <div className="flex items-center justify-between text-stone-400 group-hover:text-emerald-600 transition-colors">
            <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`size-1 rounded-full ${i === 1 ? 'bg-emerald-500' : 'bg-stone-200'}`} />
                ))}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest">Control Interface</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    </motion.div>
);

export default function CityManagerDashboard({ currentUser }) {
    const [booths, setBooths] = useState([]);
    const [selectedBooth, setSelectedBooth] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [resolving, setResolving] = useState(false);
    
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
            const [bData, aData] = await Promise.all([
                getBoothsSummary(),
                getManagerAlerts()
            ]);
            setBooths(bData || []);
            setAlerts(aData || []);
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
                alert(`AI Automation: Successfully auto-assigned ${res.assigned_count} grievances to available field units.`);
                loadBooths();
            } else {
                alert("AI Automation: No unassigned grievances detected in the matrix.");
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
            <div className="space-y-12 animate-fade-in relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-stone-200/60">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-10 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-lg">
                                <Globe size={20} />
                            </div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[4px]">Regional Command Centre</p>
                        </div>
                        <h1 className="text-5xl font-display font-bold text-stone-900 tracking-tighter">City Intelligence</h1>
                        <p className="text-stone-400 text-xs font-medium mt-1 uppercase tracking-widest">Sector Overseer: {currentUser?.city_id || 'CAPITAL_NCR'}</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <button 
                            onClick={handleAutoResolve}
                            disabled={resolving}
                            className="px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[2px] flex items-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {resolving ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            AI Auto-Assign
                        </button>
                        <div className="relative group w-full md:w-80">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="SEARCH OPERATIONAL SECTOR..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-14 pr-8 py-4 bg-white border border-stone-200/60 rounded-[2rem] font-display font-bold text-sm tracking-tight focus:ring-4 focus:ring-stone-100 focus:border-stone-900 outline-none transition-all placeholder:text-stone-300"
                            />
                        </div>
                    </div>
                </div>

                {/* AI Automation Alerts Bar */}
                {alerts.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-emerald-500" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[4px] text-stone-400">AI Predictive Alerts</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {alerts.map((alert) => (
                                <motion.div 
                                    key={alert.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-5 rounded-3xl border flex items-start gap-4 shadow-sm ${
                                        alert.type === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-900' : 
                                        alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-900' : 
                                        'bg-emerald-50 border-emerald-100 text-emerald-900'
                                    }`}
                                >
                                    <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                                        alert.type === 'critical' ? 'bg-rose-500 text-white' : 
                                        alert.type === 'warning' ? 'bg-amber-500 text-white' : 
                                        'bg-emerald-500 text-white'
                                    }`}>
                                        <Zap size={14} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-tight mb-1">{alert.title}</p>
                                        <p className="text-[10px] font-medium leading-relaxed opacity-80">{alert.message}</p>
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
                    <div className="border-2 border-dashed border-stone-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 opacity-40 hover:opacity-100 transition-opacity cursor-help">
                        <div className="size-12 rounded-full border-2 border-stone-200 flex items-center justify-center mb-4">
                            <Layers size={20} className="text-stone-300" />
                        </div>
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest text-center">Awaiting Sector Integration...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Selected Booth Detail View (Strategic Intervention)
    return (
        <div className="animate-fade-in space-y-8 relative z-10">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-stone-200/60">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => {
                            setSelectedBooth(null);
                            setAnalysisResult(null);
                        }}
                        className="size-12 rounded-2xl bg-white border border-stone-200 text-stone-400 hover:text-stone-900 hover:bg-stone-50 transition-all active:scale-95 flex items-center justify-center shadow-sm"
                    >
                        <Globe size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active Analysis</p>
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <h2 className="text-4xl font-display font-bold text-stone-900 tracking-tight uppercase">{selectedBooth.name}</h2>
                    </div>
                </div>
                
                <button 
                    onClick={() => handleAnalyze(selectedBooth.id)}
                    disabled={analyzing}
                    className={`px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-3 transition-all ${analyzing ? 'bg-stone-100 text-stone-400' : 'bg-stone-900 text-white shadow-2xl shadow-stone-900/40 hover:scale-105 active:scale-95'}`}
                >
                    {analyzing ? <RefreshCw className="animate-spin" size={16} /> : <BrainCircuit size={16} />}
                    {analyzing ? 'Processing Matrix...' : 'Deep Sync Analysis'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Tactical Intelligence Report */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="glass-panel p-8 rounded-[3rem] border border-stone-200/50 shadow-sm relative overflow-hidden bg-white">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="size-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                                <ShieldAlert size={20} />
                            </div>
                            <h3 className="text-xl font-display font-bold text-stone-900 tracking-tight">Intelligence Feed</h3>
                        </div>

                        <AnimatePresence mode="wait">
                            {analysisResult ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.98 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    exit={{ opacity: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="p-6 rounded-[2rem] bg-stone-50 border border-stone-100 font-medium leading-relaxed italic text-stone-600 relative">
                                        <div className="absolute -top-3 -left-3 size-8 rounded-full bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                                            <Sparkles size={14} className="text-emerald-500" />
                                        </div>
                                        "{analysisResult.recommendation}"
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-5 rounded-3xl bg-white border border-stone-100 shadow-sm">
                                            <p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest mb-2 text-center">Top Sector Concern</p>
                                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider text-center">{analysisResult.top_priority}</p>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-white border border-stone-100 shadow-sm">
                                            <p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest mb-2 text-center">Affected Targetry</p>
                                            <p className="text-xs font-bold text-stone-900 uppercase tracking-wider text-center">{analysisResult.affected_count} Nodes</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="py-20 text-center space-y-6 border-2 border-dashed border-stone-50 rounded-[2.5rem]">
                                    <BarChart3 size={48} className="mx-auto text-stone-100" />
                                    <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[4px] max-w-[180px] mx-auto">
                                        Initialize Synaptic Sweep to Begin Detection.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="glass-panel p-8 rounded-[3rem] border border-stone-200/50 shadow-sm bg-stone-900 text-white">
                        <div className="flex items-center gap-3 mb-10">
                            <Activity size={20} className="text-emerald-500" />
                            <h3 className="text-xl font-display font-bold tracking-tight">Voter Index</h3>
                        </div>
                        <div className="space-y-8">
                            {[
                                { label: 'Outreach Velocity', value: '84%', trend: '+4%', color: 'text-emerald-500' },
                                { label: 'Issue Resolution', value: 'L-04', trend: 'OPTIMAL', color: 'text-stone-400' },
                                { label: 'Engagement Coeff.', value: 'A++', trend: 'ELITE', color: 'text-white' }
                            ].map((stat, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest group-hover:text-stone-300 transition-colors">{stat.label}</span>
                                    <div className="text-right">
                                        <p className="text-xl font-display font-bold leading-none">{stat.value}</p>
                                        <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${stat.color}`}>{stat.trend}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Voter Segmentation Interface */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="glass-panel p-8 rounded-[3rem] border border-stone-200/50 shadow-sm bg-white flex flex-col h-[700px]">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-stone-400" />
                                <h3 className="text-xl font-display font-bold text-stone-900 tracking-tight">Segmentation Matrix</h3>
                            </div>
                            <div className="flex gap-3">
                                <select 
                                    className="px-4 py-2 bg-stone-50 border border-stone-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    value={voterFilter.sentiment}
                                    onChange={(e) => setVoterFilter(prev => ({ ...prev, sentiment: e.target.value }))}
                                >
                                    <option value="">All Sentiment</option>
                                    <option value="positive">Positive Bias</option>
                                    <option value="neutral">Neutral Alignment</option>
                                    <option value="negative">Negative Variance</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
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
                                        className={`p-6 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${selectedVoters.includes(voter.id) ? 'bg-stone-900 border-stone-900 text-white shadow-xl translate-x-1' : 'bg-white border-stone-100 hover:border-emerald-500/30'}`}
                                    >
                                        <div className="flex items-center justify-between relative z-10">
                                            <div>
                                                <h4 className={`text-lg font-display font-bold leading-none mb-1 ${selectedVoters.includes(voter.id) ? 'text-white' : 'text-stone-900 group-hover:text-emerald-600'}`}>
                                                    {voter.name}
                                                </h4>
                                                <div className="flex items-center gap-3">
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${selectedVoters.includes(voter.id) ? 'text-stone-500' : 'text-stone-400'}`}>
                                                        {voter.segment || 'CITIZEN_ALPHA'}
                                                    </p>
                                                    <div className={`size-1 rounded-full ${voter.sentiment === 'positive' ? 'bg-emerald-500' : voter.sentiment === 'negative' ? 'bg-rose-500' : 'bg-stone-200'}`} />
                                                    <p className={`text-[9px] font-bold uppercase tracking-widest ${voter.sentiment === 'positive' ? 'text-emerald-500' : voter.sentiment === 'negative' ? 'text-rose-500' : 'text-stone-300'}`}>
                                                        {voter.sentiment}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${selectedVoters.includes(voter.id) ? 'bg-emerald-600 text-white animate-fade-in' : 'bg-stone-50 text-stone-200 opacity-40 group-hover:opacity-100'}`}>
                                                {selectedVoters.includes(voter.id) ? <CheckCircle2 size={18} /> : <Target size={18} />}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-stone-50 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[4px]">Target Queue Length</p>
                            <div className="px-5 py-2 rounded-full bg-stone-900 text-white text-xs font-display font-bold">
                                {selectedVoters.length} Targets Synchronized
                            </div>
                        </div>
                    </div>
                </div>

                {/* Engagement Action Panel */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="glass-panel p-8 rounded-[3rem] border border-stone-200/50 shadow-sm bg-white sticky top-12">
                        <div className="flex items-center gap-3 mb-10">
                            <Target size={20} className="text-emerald-600" />
                            <h3 className="text-xl font-display font-bold text-stone-900 tracking-tight">Intervention</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 block">Message Payload</label>
                                <textarea 
                                    placeholder="TRANSMIT STRATEGIC OVERRIDE MESSAGE..."
                                    value={updateMessage}
                                    onChange={(e) => setUpdateMessage(e.target.value)}
                                    className="w-full h-48 p-6 bg-stone-50 border border-stone-100 rounded-[2rem] text-sm font-medium text-stone-900 placeholder:text-stone-300 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 outline-none transition-all resize-none italic"
                                />
                            </div>
                            
                            <button 
                                onClick={handleSendUpdate}
                                disabled={sendingUpdate || selectedVoters.length === 0}
                                className={`w-full py-5 rounded-[2rem] text-[10px] font-bold uppercase tracking-[4px] flex items-center justify-center gap-3 transition-all ${sendingUpdate || selectedVoters.length === 0 ? 'bg-stone-100 text-stone-300' : 'bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'}`}
                            >
                                {sendingUpdate ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                                {sendingUpdate ? 'Transmitting...' : 'Execute Broadcast'}
                            </button>

                            <div className="space-y-3 pt-6">
                                <p className="text-[9px] font-bold text-stone-300 uppercase tracking-widest mb-2 px-2">Secondary Directives</p>
                                {[
                                    { label: 'Strategic Deployment', icon: Layers },
                                    { label: 'Escalate Priority', icon: ShieldAlert }
                                ].map((action, i) => (
                                    <button key={i} className="w-full p-4 rounded-2xl border border-stone-100 flex items-center justify-between text-stone-400 hover:bg-stone-50 hover:text-stone-900 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <action.icon size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{action.label}</span>
                                        </div>
                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
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
