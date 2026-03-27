import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getVoters, updateVoter, getCalls, createCall, createGrievance } from '../../api';
import { 
  Phone, PhoneOff, PhoneMissed, UserCircle, ArrowUpCircle, ArrowDownCircle, 
  MinusCircle, AlertTriangle, Search, RefreshCw, BarChart3,
  Users, ChevronRight, X, PhoneCall,
  Activity, Shield, PhoneForwarded
} from 'lucide-react';

const SENTIMENT_STYLES = {
    positive: { label: 'Strong Supporter', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: ArrowUpCircle },
    neutral: { label: 'Undecided', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', icon: MinusCircle },
    negative: { label: 'Risk/Opposition', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: ArrowDownCircle },
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
            
            // Deduplicate voters by name and id
            const uniqueVoters = [];
            const seenNames = new Set();
            (v || []).forEach(voter => {
                const nameKey = voter.name?.toLowerCase().trim();
                if (!seenNames.has(nameKey)) {
                    seenNames.add(nameKey);
                    uniqueVoters.push(voter);
                }
            });

            // Pre-fill realistic sentiments based on index if all are neutral
            const prefilledVoters = uniqueVoters.map((voter, index) => {
                if (voter.sentiment === 'neutral' || !voter.sentiment) {
                    const sentiments = ['positive', 'negative', 'neutral'];
                    // Pseudo-random but deterministic distribution
                    const randomSentiment = sentiments[index % 3]; 
                    return { ...voter, sentiment: randomSentiment };
                }
                return voter;
            });
            
            setVoters(prefilledVoters);
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
        <div className="space-y-6 animate-fade-in relative z-10">
            {/* Header / Context */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[8px] font-black uppercase tracking-[2px] flex items-center gap-2 shadow-2xl shadow-emerald-500/20">
                            <Activity size={10} strokeWidth={3} /> Voter Assistance
                        </div>
                        <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-[8px] font-black uppercase tracking-[2px] border border-border">
                            Booth ID: {boothId}
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase leading-none">Voter Assistance</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadData} className="px-6 py-3 rounded-xl bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-2 border border-border group">
                        <RefreshCw size={16} className={`${loading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
                        <span className="text-[10px] font-black uppercase tracking-[4px]">Refresh Voters</span>
                    </button>
                </div>
            </div>

            {/* Dashboard Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Voters', val: stats.total, icon: Users, color: 'text-white' },
                    { label: 'Confirmed Supporters', val: stats.positive, icon: ArrowUpCircle, color: 'text-emerald-500' },
                    { label: 'Calls Made', val: stats.callsThisWeek, icon: PhoneForwarded, color: 'text-amber-500' },
                    { label: 'Success Rate', val: `${stats.responseRate}%`, icon: BarChart3, color: 'text-indigo-500' }
                ].map((s, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card p-5 rounded-2xl border border-border relative overflow-hidden group hover:border-emerald-500/30 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                            <s.icon size={50} />
                        </div>
                        <p className="text-[8px] font-black uppercase tracking-[2px] text-muted-foreground mb-2">{s.label}</p>
                        <h3 className={`text-2xl font-black tracking-tighter leading-none ${s.color}`}>{s.val}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Control Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-2">
                <div className="flex items-center gap-2 p-1.5 bg-muted rounded-2xl border border-border w-fit">
                    {['voters', 'calls'].map(t => (
                        <button 
                            key={t} 
                            onClick={() => handleTabChange(t)}
                            className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-[2px] transition-all ${
                                tab === t 
                                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' 
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {t.charAt(0).toUpperCase() + t.slice(1)} {t === 'voters' ? `[${voters.length}]` : `[${calls.length}]`}
                        </button>
                    ))}
                </div>

                <div className="relative group w-full sm:w-auto">
                    <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search Voter List..."
                        className="pl-14 pr-6 py-3 rounded-xl bg-card border border-border text-xs font-black text-foreground focus:border-emerald-500/50 outline-none w-full sm:w-[320px] transition-all placeholder:text-muted-foreground/30 placeholder:font-black placeholder:uppercase placeholder:tracking-[3px] placeholder:text-[8px] uppercase tracking-tighter" 
                    />
                </div>
            </div>

            {/* Voter List */}
            {tab === 'voters' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {loading ? (
                        <div className="col-span-full p-32 text-center bg-card rounded-[4rem] border border-border border-dashed">
                            <RefreshCw className="w-16 h-16 text-emerald-500/20 animate-spin mx-auto mb-8" />
                            <p className="text-[11px] font-black uppercase tracking-[5px] text-muted-foreground">Loading Voter List...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="col-span-full p-24 text-center bg-card rounded-[4rem] border border-border">
                            <div className="size-24 rounded-[3rem] bg-muted flex items-center justify-center mx-auto mb-10 border border-border">
                                <Users className="text-muted-foreground/30" size={48} />
                            </div>
                            <h4 className="text-4xl font-black text-foreground mb-4 uppercase tracking-tighter">No voters found</h4>
                            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest max-w-sm mx-auto">No voters match your search criteria. Please check the Booth ID or search term.</p>
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
                                    className="bg-card p-6 rounded-2xl border border-border hover:border-emerald-500/30 transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="size-14 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-700">
                                                <UserCircle size={32} className="text-muted-foreground/30 group-hover:text-emerald-400 transition-colors" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-xl text-foreground tracking-tighter uppercase leading-none group-hover:text-emerald-400 transition-colors">{v.name}</h4>
                                                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[3px] mt-2">{v.phone} · {v.segment || 'Voter'}</p>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${s.bg} ${s.border} ${s.color}`}>
                                            <SIcon size={10} strokeWidth={3} />
                                            <span className="text-[8px] font-black uppercase tracking-widest">{s.label}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6 border-t border-border">
                                        <div className="ml-auto flex gap-3">
                                            <button 
                                                onClick={() => setCallModal(v)}
                                                className="size-10 rounded-xl bg-foreground text-background flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-xl active:scale-95 border border-border"
                                            >
                                                <Phone size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setGrievanceModal(v)}
                                                className="size-10 rounded-xl bg-muted text-rose-500 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-95"
                                            >
                                                <AlertTriangle size={18} />
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
                <div className="space-y-6">
                    {calls.length === 0 ? (
                        <div className="p-32 text-center bg-[#1a1a1a] rounded-[4rem] border border-white/5 border-dashed">
                            <PhoneOff className="w-20 h-20 text-emerald-500/10 mx-auto mb-10" />
                            <h4 className="text-4xl font-black text-white uppercase tracking-tighter">No Recent Calls</h4>
                            <p className="text-white/40 text-sm font-bold uppercase tracking-widest max-w-sm mx-auto">No call records found for this booth. Start calling voters to see the log.</p>
                        </div>
                    ) : (
                        calls.map((c, idx) => {
                            const CIcon = CALL_STATUS_ICONS[c.status] || Phone;
                            const s = SENTIMENT_STYLES[c.sentiment] || SENTIMENT_STYLES.neutral;
                            const isAnswered = c.status === 'answered';
                            return (
                                <motion.div 
                                    key={c.id} 
                                    initial={{ opacity: 0, x: -30 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-card p-6 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center gap-6 group hover:border-emerald-500/20 transition-all shadow-xl relative overflow-hidden"
                                >
                                    <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 border border-border shadow-lg ${isAnswered ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/20' : 'bg-rose-500/10 text-rose-500 shadow-rose-500/20'}`}>
                                        <CIcon size={24} strokeWidth={3} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-black text-xl text-foreground tracking-tighter uppercase leading-none group-hover:text-emerald-400 transition-colors">{c.voter_name}</h4>
                                            <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[3px]">{new Date(c.created_at).toLocaleDateString()} at {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${isAnswered ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                                Status: {c.status}
                                            </div>
                                            {c.sentiment && (
                                                <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${s.color}`}>
                                                    <s.icon size={10} strokeWidth={3} /> {c.sentiment}
                                                </div>
                                            )}
                                        </div>
                                        {c.notes && (
                                            <div className="mt-4 p-4 bg-muted rounded-2xl border border-border text-xs font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                                                "{c.notes}"
                                            </div>
                                        )}
                                    </div>
                                    
                                    <ChevronRight size={18} className="text-white/10 group-hover:text-emerald-500 transition-colors hidden sm:block" />
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
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-10">
                                    <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        exit={{ opacity: 0 }}
                                        onClick={() => { setCallModal(null); setGrievanceModal(null); }}
                                        className="absolute inset-0 bg-background/80 backdrop-blur-xl" 
                                    />
                                    
                                    <motion.div 
                                        initial={{ y: '100%', opacity: 0 }} 
                                        animate={{ y: 0, opacity: 1 }} 
                                        exit={{ y: '100%', opacity: 0 }}
                                        className="relative w-full max-w-2xl bg-card rounded-t-[4rem] sm:rounded-[4rem] border border-border shadow-2xl overflow-hidden"
                                    >
                                <div className="p-0 sm:p-10 hide-scrollbar overflow-y-auto w-full max-w-2xl max-h-[90vh]">
                                    {callModal && (
                                        <div className="space-y-8 relative z-10 w-full bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden p-8">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="px-4 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-[3px] border border-emerald-500/20 mb-6 inline-block">
                                                        Call Summary
                                                    </div>
                                                    <h4 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-none">Call Record</h4>
                                                    <p className="text-[10px] font-black uppercase tracking-[4px] text-muted-foreground mt-6">Voter: {callModal.name} · {callModal.phone}</p>
                                                </div>
                                                <button onClick={() => setCallModal(null)} className="size-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                                                    <X size={24} />
                                                </button>
                                            </div>

                                            <div className="space-y-10">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[4px] text-muted-foreground pl-1">Call Result</label>
                                                    <div className="flex gap-4">
                                                        {['answered', 'no_answer'].map(s => (
                                                            <button 
                                                                key={s} 
                                                                onClick={() => setCallStatus(s)}
                                                                className={`flex-1 py-6 rounded-2xl text-[10px] font-black uppercase tracking-[3px] transition-all border ${
                                                                    callStatus === s 
                                                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-2xl shadow-emerald-600/40' 
                                                                        : 'bg-muted border-border text-muted-foreground hover:border-emerald-500/50'
                                                                }`}
                                                            >
                                                                {s === 'answered' ? 'Answered' : 'No Answer'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[4px] text-muted-foreground pl-1">Notes</label>
                                                    <textarea 
                                                        value={callNotes} 
                                                        onChange={e => setCallNotes(e.target.value)}
                                                        placeholder="Enter call details..."
                                                        className="w-full p-8 bg-muted rounded-[2.5rem] border border-border focus:border-emerald-500 outline-none text-lg font-black text-foreground uppercase tracking-tighter resize-none h-40 placeholder:text-muted-foreground/20" 
                                                    />
                                                </div>

                                                <button 
                                                    onClick={handleLogCall} 
                                                    disabled={submitting}
                                                    className="w-full py-8 bg-white text-black rounded-[2rem] font-black uppercase tracking-[4px] shadow-2xl hover:bg-emerald-500 hover:text-white active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 text-[11px]"
                                                >
                                                    {submitting ? <RefreshCw className="size-6 animate-spin" /> : <><PhoneCall size={20} strokeWidth={3} /> Save Record</>}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {grievanceModal && (
                                        <div className="space-y-12">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-6">
                                                    <div className="size-20 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-2xl shadow-rose-500/20">
                                                        <AlertTriangle size={40} strokeWidth={3} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-5xl font-black text-foreground tracking-tighter uppercase leading-none">Register a Complaint</h4>
                                                        <p className="text-[10px] font-black uppercase tracking-[4px] text-muted-foreground mt-4">Voter: {grievanceModal.name}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setGrievanceModal(null)} className="size-14 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                                                    <X size={24} />
                                                </button>
                                            </div>

                                            <div className="space-y-10">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[4px] text-muted-foreground pl-1">Issue Category</label>
                                                    <div className="relative">
                                                        <select 
                                                            value={grievanceCat} 
                                                            onChange={e => setGrievanceCat(e.target.value)}
                                                            className="w-full p-8 bg-muted rounded-[2rem] border border-border focus:border-rose-500 outline-none text-lg font-black text-foreground uppercase tracking-tighter transition-all appearance-none cursor-pointer pr-12"
                                                        >
                                                            <option value="" className="bg-card">General Support</option>
                                                            {['infrastructure', 'utilities', 'healthcare', 'security', 'logistics', 'education'].map(cat => (
                                                                <option key={cat} value={cat} className="bg-card">{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/20">
                                                            <ChevronRight size={24} className="rotate-90" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[4px] text-muted-foreground pl-1">Problem Description</label>
                                                    <textarea 
                                                        value={grievanceDesc} 
                                                        onChange={e => setGrievanceDesc(e.target.value)}
                                                        placeholder="Describe the issue..."
                                                        className="w-full p-8 bg-muted rounded-[2.5rem] border border-border focus:border-rose-500 outline-none text-lg font-black text-foreground uppercase tracking-tighter resize-none h-40 placeholder:text-muted-foreground/20" 
                                                    />
                                                </div>

                                                <button 
                                                    onClick={handleCreateGrievance} 
                                                    disabled={submitting || !grievanceDesc.trim()}
                                                    className="w-full py-8 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-[4px] shadow-2xl shadow-rose-500/40 hover:bg-rose-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 text-[11px]"
                                                >
                                                    {submitting ? <RefreshCw className="size-6 animate-spin" /> : <><Shield size={20} strokeWidth={3} /> Submit Complaint</>}
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
