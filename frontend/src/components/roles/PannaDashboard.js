import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getVoters, updateVoter, getCalls, createCall, createGrievance } from '../../api';
import { 
  Phone, PhoneOff, PhoneMissed, UserCircle, ArrowUpCircle, ArrowDownCircle, 
  MinusCircle, AlertTriangle, CheckCircle, Search, RefreshCw, BarChart3,
  Users, Calendar, ChevronRight, X, PhoneCall, MessageSquare,
  Activity, Zap, Shield, Info, ArrowRight, UserPlus, PhoneForwarded
} from 'lucide-react';

const SENTIMENT_STYLES = {
    positive: { label: 'STRONG_SUPPORT', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ArrowUpCircle },
    neutral: { label: 'UNDECIDED_UNIT', color: 'text-stone-600', bg: 'bg-white/5', border: 'border-white/5', icon: MinusCircle },
    negative: { label: 'RISK_FACTOR', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: ArrowDownCircle },
};

const CALL_STATUS_ICONS = { 
    answered: PhoneCall, 
    no_answer: PhoneMissed, 
    pending: PhoneOff 
};

export default function PannaDashboard({ currentUser, boothId }) {
    const location = useLocation();
    const navigate = useNavigate();

    const getTabFromPath = (path) => {
        if (path.includes('/voters')) return 'voters';
        if (path.includes('/calls')) return 'calls';
        return 'voters';
    };

    const [voters, setVoters] = useState([]);
    const [calls, setCalls] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState(getTabFromPath(location.pathname));

    useEffect(() => {
        setTab(getTabFromPath(location.pathname));
    }, [location.pathname]);

    const handleTabChange = (newTab) => {
        setTab(newTab);
        navigate(`/panna/${newTab}`);
    };
    const [callModal, setCallModal] = useState(null);
    const [grievanceModal, setGrievanceModal] = useState(null);
    const [callNotes, setCallNotes] = useState('');
    const [callStatus, setCallStatus] = useState('answered');
    const [grievanceDesc, setGrievanceDesc] = useState('');
    const [grievanceCat, setGrievanceCat] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [v, c] = await Promise.all([getVoters(boothId), getCalls(boothId)]);
            setVoters(v || []);
            setCalls(c || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [boothId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSentimentUpdate = async (voterId, sentiment) => {
        try {
            await updateVoter({ id: voterId, sentiment });
            setVoters(prev => prev.map(v => v.id === voterId ? { ...v, sentiment } : v));
        } catch (e) { console.error(e); }
    };

    const handleLogCall = async () => {
        if (!callModal) return;
        setSubmitting(true);
        try {
            await createCall({
                voter_id: callModal.id,
                voter_name: callModal.name,
                status: callStatus,
                notes: callNotes,
                booth_id: boothId
            });
            setCallModal(null);
            setCallNotes('');
            setCallStatus('answered');
            loadData();
        } catch (e) { console.error(e); }
        setSubmitting(false);
    };

    const handleCreateGrievance = async () => {
        if (!grievanceModal || !grievanceDesc.trim()) return;
        setSubmitting(true);
        try {
            await createGrievance({
                voter_id: grievanceModal.id,
                voter_name: grievanceModal.name,
                description: grievanceDesc,
                category: grievanceCat || undefined,
                booth_id: boothId
            });
            setGrievanceModal(null);
            setGrievanceDesc('');
            setGrievanceCat('');
        } catch (e) { console.error(e); }
        setSubmitting(false);
    };

    const filtered = voters.filter(v =>
        v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.phone.includes(search)
    );

    const stats = {
        total: voters.length,
        positive: voters.filter(v => v.sentiment === 'positive').length,
        callsThisWeek: calls.filter(c => new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
        responseRate: calls.length > 0 ? Math.round((calls.filter(c => c.status === 'answered').length / calls.length) * 100) : 0
    };

    return (
        <div className="space-y-10 animate-fade-in relative z-10">
            {/* Header / Context */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="px-4 py-1.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-[3px] flex items-center gap-2 shadow-2xl shadow-emerald-500/20">
                            <Activity size={12} strokeWidth={3} /> FIELD_INTELLIGENCE
                        </div>
                        <div className="px-4 py-1.5 rounded-full bg-white/5 text-stone-500 text-[10px] font-black uppercase tracking-[3px] border border-white/5">
                            SECTOR_CONTROL: {boothId}
                        </div>
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">PANNA_STRATEGY_HUB</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={loadData} className="px-8 py-4 rounded-2xl bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3 border border-white/5 group">
                        <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
                        <span className="text-[10px] font-black uppercase tracking-[4px]">UPDATE_REGISTRY</span>
                    </button>
                </div>
            </div>

            {/* Tactical Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'ASSIGNED_VOTERS', val: stats.total, icon: Users, color: 'text-white' },
                    { label: 'STRONG_SUPPORT', val: stats.positive, icon: ArrowUpCircle, color: 'text-emerald-500' },
                    { label: 'COMMUNICATIONS', val: stats.callsThisWeek, icon: PhoneForwarded, color: 'text-amber-500' },
                    { label: 'ENGAGEMENT_RATE', val: `${stats.responseRate}%`, icon: BarChart3, color: 'text-indigo-500' }
                ].map((s, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#1a1a1a] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                            <s.icon size={80} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[3px] text-stone-600 mb-4">{s.label}</p>
                        <h3 className={`text-4xl font-black tracking-tighter leading-none ${s.color}`}>{s.val}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Tactical Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 py-4">
                <div className="flex items-center gap-3 p-2 bg-white/5 rounded-3xl border border-white/5 w-fit">
                    {['voters', 'calls'].map(t => (
                        <button 
                            key={t} 
                            onClick={() => handleTabChange(t)}
                            className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[3px] transition-all ${
                                tab === t 
                                    ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-600/20' 
                                    : 'text-stone-500 hover:text-stone-300'
                            }`}
                        >
                            {t.toUpperCase()} {t === 'voters' ? `[${voters.length}]` : `[${calls.length}]`}
                        </button>
                    ))}
                </div>

                <div className="relative group w-full sm:w-auto">
                    <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-700 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        placeholder="SEARCH_REGISTRY..."
                        className="pl-16 pr-8 py-5 rounded-2xl bg-white/5 border border-white/5 text-sm font-black text-white focus:border-emerald-500/50 outline-none w-full sm:w-[400px] transition-all placeholder:text-stone-800 placeholder:font-black placeholder:uppercase placeholder:tracking-[4px] placeholder:text-[10px] uppercase tracking-tighter" 
                    />
                </div>
            </div>

            {/* Interactive Registry */}
            {tab === 'voters' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {loading ? (
                        <div className="col-span-full p-32 text-center bg-[#1a1a1a] rounded-[4rem] border border-white/5 border-dashed">
                            <RefreshCw className="w-16 h-16 text-emerald-500/20 animate-spin mx-auto mb-8" />
                            <p className="text-[11px] font-black uppercase tracking-[5px] text-stone-600">DOWNLOADING_TACTICAL_DATA...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full p-24 text-center bg-[#1a1a1a] rounded-[4rem] border border-white/5">
                            <div className="size-24 rounded-[3rem] bg-white/5 flex items-center justify-center mx-auto mb-10 border border-white/5">
                                <Users className="text-stone-700" size={48} />
                            </div>
                            <h4 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">REGISTRY_EMPTY</h4>
                            <p className="text-stone-600 text-sm font-bold uppercase tracking-widest max-w-sm mx-auto">No localized records match your tactical search parameters. Verify SECTOR_ID configuration.</p>
                        </div>
                    ) : (
                        filtered.map((v, idx) => {
                            const s = SENTIMENT_STYLES[v.sentiment] || SENTIMENT_STYLES.neutral;
                            const SIcon = s.icon;
                            return (
                                <motion.div 
                                    key={v.id} 
                                    initial={{ opacity: 0, y: 30 }} 
                                    animate={{ opacity: 1, y: 0 }} 
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-[#1a1a1a] p-10 rounded-[3.5rem] border border-white/5 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between mb-10">
                                        <div className="flex items-center gap-6">
                                            <div className="size-20 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-700">
                                                <UserCircle size={40} className="text-stone-600 group-hover:text-emerald-400 transition-colors" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-3xl text-white tracking-tighter uppercase leading-none group-hover:text-emerald-400 transition-colors">{v.name}</h4>
                                                <p className="text-[10px] font-black text-stone-600 uppercase tracking-[4px] mt-4">{v.phone} · {v.segment}</p>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-3 px-5 py-2 rounded-full border ${s.bg} ${s.border} ${s.color}`}>
                                            <SIcon size={14} strokeWidth={3} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-10 border-t border-white/5">
                                        <div className="flex bg-black/40 p-1.5 rounded-2xl w-fit border border-white/5">
                                            {['positive', 'neutral', 'negative'].map(sent => (
                                                <button 
                                                    key={sent} 
                                                    onClick={() => handleSentimentUpdate(v.id, sent)}
                                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[2px] transition-all ${
                                                        v.sentiment === sent
                                                            ? 'bg-white text-black shadow-2xl'
                                                            : 'text-stone-600 hover:text-stone-400'
                                                    }`}
                                                >
                                                    {sent.slice(0, 3)}
                                                </button>
                                            ))}
                                        </div>
                                        
                                        <div className="ml-auto flex gap-4">
                                            <button 
                                                onClick={() => setCallModal(v)}
                                                className="size-14 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-2xl active:scale-95 border border-white/10"
                                            >
                                                <Phone size={24} />
                                            </button>
                                            <button 
                                                onClick={() => setGrievanceModal(v)}
                                                className="size-14 rounded-2xl bg-white/5 text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-2xl active:scale-95"
                                            >
                                                <AlertTriangle size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}

            {tab === 'calls' && (
                <div className="space-y-4">
                    {calls.length === 0 ? (
                        <div className="p-20 text-center glass-panel rounded-[3rem] bg-stone-50/20 border-stone-100">
                            <div className="size-20 rounded-full bg-white flex items-center justify-center mx-auto mb-8 shadow-sm">
                                <PhoneOff className="text-stone-200" size={40} />
                            </div>
                            <h4 className="text-2xl font-display font-bold text-stone-900 mb-2">No Comms Traffic</h4>
                            <p className="text-stone-400 text-sm max-w-sm mx-auto">No field communications have been registered for this sector. Initiate outbound engagement to populate log.</p>
                        </div>
                    ) : (
                        calls.map((c, idx) => {
                            const CIcon = CALL_STATUS_ICONS[c.status] || Phone;
                            const s = SENTIMENT_STYLES[c.sentiment] || SENTIMENT_STYLES.neutral;
                            const isAnswered = c.status === 'answered';
                            return (
                                <motion.div 
                                    key={c.id} 
                                    initial={{ opacity: 0, x: -10 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    transition={{ delay: idx * 0.05 }}
                                    className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border border-stone-200/50 flex flex-col sm:flex-row sm:items-center gap-8 group hover:border-emerald-500/30 transition-all shadow-sm"
                                >
                                    <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${isAnswered ? 'bg-emerald-500/10 text-emerald-600 shadow-emerald-200/20' : 'bg-rose-500/10 text-rose-600 shadow-rose-200/20'}`}>
                                        <CIcon size={28} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-display font-bold text-xl text-stone-900 group-hover:text-emerald-700">{c.voter_name}</h4>
                                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(c.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isAnswered ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                {c.status.replace('_', ' ')}
                                            </span>
                                            {c.sentiment && (
                                                <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${s.color}`}>
                                                    <s.icon size={12} /> {c.sentiment}
                                                </span>
                                            )}
                                        </div>
                                        {c.notes && (
                                            <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 text-sm font-medium text-stone-600 italic leading-relaxed">
                                                "{c.notes}"
                                            </div>
                                        )}
                                    </div>
                                    
                                    <ChevronRight size={20} className="text-stone-200 group-hover:text-emerald-600 transition-colors hidden sm:block" />
                                </motion.div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Modals Layer */}
            {createPortal(
                <AnimatePresence>
                    {(callModal || grievanceModal) && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                onClick={() => { setCallModal(null); setGrievanceModal(null); }}
                                className="absolute inset-0 bg-stone-950/70 backdrop-blur-xl" 
                            />
                            
                            <motion.div 
                                initial={{ y: '100%', opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                exit={{ y: '100%', opacity: 0 }}
                                className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden"
                            >
                                <div className="p-10">
                                    {callModal && (
                                        <div className="space-y-8">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-widest border border-emerald-200 mb-4 inline-block">
                                                        Intelligence Log
                                                    </div>
                                                    <h4 className="text-3xl font-display font-bold text-stone-900 tracking-tight">Post-Call Briefing</h4>
                                                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mt-1">{callModal.name} · {callModal.phone}</p>
                                                </div>
                                                <button onClick={() => setCallModal(null)} className="size-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-900">
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold uppercase tracking-[4px] text-stone-400 pl-1">Operational Outcome</label>
                                                    <div className="flex gap-2">
                                                        {['answered', 'no_answer'].map(s => (
                                                            <button 
                                                                key={s} 
                                                                onClick={() => setCallStatus(s)}
                                                                className={`flex-1 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                                                    callStatus === s 
                                                                        ? 'bg-stone-900 border-stone-900 text-white shadow-xl shadow-stone-200' 
                                                                        : 'bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-400'
                                                                }`}
                                                            >
                                                                {s.replace('_', ' ')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold uppercase tracking-[4px] text-stone-400 pl-1">Field Observations</label>
                                                    <textarea 
                                                        value={callNotes} 
                                                        onChange={e => setCallNotes(e.target.value)}
                                                        placeholder="Log technical findings and voter disposition..."
                                                        className="w-full p-6 bg-stone-50 rounded-[2rem] border border-stone-200 focus:border-emerald-600 outline-none text-sm font-medium resize-none h-32 placeholder:text-stone-300" 
                                                    />
                                                </div>

                                                <button 
                                                    onClick={handleLogCall} 
                                                    disabled={submitting}
                                                    className="w-full py-5 bg-stone-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-2xl hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                                >
                                                    {submitting ? <RefreshCw className="size-5 animate-spin" /> : <><PhoneCall size={18} /> Transmit Intel</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {grievanceModal && (
                                        <div className="space-y-8">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
                                                        <AlertTriangle size={28} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-3xl font-display font-bold text-stone-900 tracking-tight">Report Vulnerability</h4>
                                                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mt-1">Vector Identification: {grievanceModal.name}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setGrievanceModal(null)} className="size-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-900">
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold uppercase tracking-[4px] text-stone-400 pl-1">Vector Category</label>
                                                    <div className="relative">
                                                        <select 
                                                            value={grievanceCat} 
                                                            onChange={e => setGrievanceCat(e.target.value)}
                                                            className="w-full p-5 bg-stone-50 rounded-[1.5rem] border border-stone-200 focus:border-stone-900 outline-none text-sm font-bold transition-all appearance-none cursor-pointer pr-12"
                                                        >
                                                            <option value="">Matrix Optimization (AI)</option>
                                                            {['infrastructure', 'utilities', 'healthcare', 'security', 'logistics', 'education'].map(cat => (
                                                                <option key={cat} value={cat}>{cat}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                                            <ChevronRight size={20} className="rotate-90" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold uppercase tracking-[4px] text-stone-400 pl-1">Situation Briefing</label>
                                                    <textarea 
                                                        value={grievanceDesc} 
                                                        onChange={e => setGrievanceDesc(e.target.value)}
                                                        placeholder="Detail the localized infrastructure or security failure..."
                                                        className="w-full p-6 bg-stone-50 rounded-[2rem] border border-stone-200 focus:border-rose-600 outline-none text-sm font-medium resize-none h-32 placeholder:text-stone-300" 
                                                    />
                                                </div>

                                                <button 
                                                    onClick={handleCreateGrievance} 
                                                    disabled={submitting || !grievanceDesc.trim()}
                                                    className="w-full py-5 bg-stone-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-2xl hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                                >
                                                    {submitting ? <RefreshCw className="size-5 animate-spin" /> : <><Shield size={18} /> Register Vulnerability</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
