import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { getGrievances, updateGrievance, getUsersByRole, getVoters } from '../../api';
import {
    Users,
    ChevronRight,
    MapPin,
    Activity,
    CheckCircle,
    Clock,
    TrendingUp,
    AlertCircle,
    LayoutDashboard,
    X,
    Shield,
    RefreshCw,
    User,
    Zap,
    Info
} from 'lucide-react';

const STATUS_CONFIG = {
    submitted: { label: 'Open', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    assigned: { label: 'Assigned', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    in_progress: { label: 'Working', icon: Activity, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    resolved: { label: 'Resolved', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
};

const MetricCard = ({ label, value, icon: Icon, color, trend, delay }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="bg-[#1a1a1a] p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all"
    >
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
            <Icon size={120} />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-2xl flex items-center justify-center bg-white/5 text-white/40 group-hover:text-emerald-400 transition-colors border border-white/5">
                    <Icon size={18} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[3px] text-white/20">{label}</p>
            </div>
            <div className="flex items-end justify-between">
                <h3 className="text-5xl font-black text-white tracking-tighter leading-none">{value}</h3>
                {trend && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                        <TrendingUp size={10} strokeWidth={3} /> {trend}
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

export default function AdminDashboard({ currentUser, boothId }) {
    const location = useLocation();
    const navigate = useNavigate();

    const getTabFromPath = (path) => {
        if (path.includes('/voters')) return 'voters';
        return 'dashboard';
    };

    const [grievances, setGrievances] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [tab, setTab] = useState(getTabFromPath(location.pathname));
    const [assignModal, setAssignModal] = useState(null);
    const [selectedWorker, setSelectedWorker] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('all');
    const [expandedId, setExpandedId] = useState(null);

    const safeBoothId = boothId || 17;

    useEffect(() => {
        setTab(getTabFromPath(location.pathname));
    }, [location.pathname]);

    const handleTabChange = (newTab) => {
        setTab(newTab);
        if (newTab === 'dashboard') navigate('/admin');
        else navigate(`/admin/${newTab}`);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [gData, wData, vData] = await Promise.all([
                getGrievances({ booth_id: safeBoothId }),
                getUsersByRole('worker'),
                getVoters(safeBoothId)
            ]);
            setGrievances(gData || []);
            setWorkers(wData || []);
            setVoters(vData || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [safeBoothId]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAssign = async () => {
        if (!assignModal || !selectedWorker) return;
        setSubmitting(true);
        try {
            const worker = workers.find(w => w.id.toString() === selectedWorker.toString());
            await updateGrievance({
                id: String(assignModal.id),
                status: 'assigned',
                assigned_to: String(selectedWorker),
                assigned_worker: worker?.name || 'Assigned Personnel'
            });
            setAssignModal(null);
            setSelectedWorker('');
            loadData();
        } catch (e) { console.error(e); }
        setSubmitting(false);
    };

    const filtered = grievances.filter(g => {
        if (filter === 'all') return true;
        if (filter === 'open') return g.status === 'submitted';
        return g.status === filter;
    });

    return (
        <div className="space-y-10 animate-fade-in relative z-10">
            {/* Header / Sub-nav */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <button 
                            onClick={() => handleTabChange('dashboard')}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[3px] flex items-center gap-2 transition-all ${
                                tab === 'dashboard' ? 'bg-emerald-500 text-black shadow-2xl' : 'bg-white/5 text-white/40 hover:text-white'
                            }`}
                        >
                            <Shield size={12} strokeWidth={3} /> Admin Dashboard
                        </button>
                        <button 
                            onClick={() => handleTabChange('voters')}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[3px] flex items-center gap-2 transition-all ${
                                tab === 'voters' ? 'bg-emerald-500 text-black shadow-2xl' : 'bg-white/5 text-white/40 hover:text-white'
                            }`}
                        >
                            <Users size={12} strokeWidth={3} /> Voter List
                        </button>
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
                        {tab === 'voters' ? 'Voter Database' : 'Admin Overview'}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={loadData} className="px-8 py-4 rounded-2xl bg-white/5 text-stone-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3 border border-white/5 group">
                        <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-500`} />
                        <span className="text-[10px] font-black uppercase tracking-[4px]">Refresh</span>
                    </button>
                </div>
            </div>

            {tab === 'dashboard' ? (
                <>
                    {/* Metric Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    label="Open Complaints" 
                    value={grievances.filter(g => g.status === 'submitted').length} 
                    icon={AlertCircle} 
                    color="#f59e0b"
                    trend="+2 new"
                    delay={0.1}
                />
                <MetricCard 
                    label="Assigned" 
                    value={grievances.filter(g => g.status === 'assigned' || g.status === 'in_progress').length} 
                    icon={Activity} 
                    color="#c9a84c"
                    delay={0.2}
                />
                <MetricCard 
                    label="Resolved" 
                    value={grievances.filter(g => g.status === 'resolved').length} 
                    icon={CheckCircle} 
                    color="#10b981"
                    delay={0.3}
                />
                <MetricCard 
                    label="Workers Online" 
                    value={workers.length} 
                    icon={Users} 
                    color="#3b82f6"
                    delay={0.4}
                />
            </div>

            {/* Tactical Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 py-4">
                <div className="flex items-center gap-3 p-2 bg-white/5 rounded-3xl border border-white/5 w-fit">
                    {['all', 'open', 'assigned', 'resolved'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f)}
                            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[3px] transition-all ${
                                filter === f 
                                    ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-600/20' 
                                    : 'text-white/40 hover:text-white'
                            }`}
                        >
                            {f === 'open' ? 'Recent Complaints' : f}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="px-6 py-3 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[4px] flex items-center gap-3">
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live Sync
                    </div>
                </div>
            </div>

            {/* Data Feed */}
            <div className="max-h-[700px] overflow-y-auto pr-2 custom-scrollbar space-y-6">
                {loading ? (
                    <div className="p-32 text-center bg-[#1a1a1a] rounded-[4rem] border border-white/5 border-dashed">
                        <RefreshCw className="w-16 h-16 text-emerald-500/20 animate-spin mx-auto mb-8" />
                        <p className="text-[11px] font-black uppercase tracking-[5px] text-white/20">Loading data...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-24 text-center bg-[#1a1a1a] rounded-[4rem] border border-white/5">
                        <div className="size-24 rounded-[2.5rem] bg-white/5 flex items-center justify-center mx-auto mb-10 border border-white/5">
                            <LayoutDashboard className="text-stone-700" size={48} />
                        </div>
                        <h4 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">All Clear</h4>
                        <p className="text-stone-600 text-sm font-bold uppercase tracking-widest max-w-sm mx-auto">No issues reported in this booth. Status: Normal.</p>
                    </div>
                ) : (
                    filtered.map((g, idx) => {
                        const config = STATUS_CONFIG[g.status] || STATUS_CONFIG.submitted;
                        const isAwaiting = g.status === 'submitted';
                        const isExpanded = expandedId === g.id;

                        return (
                            <motion.div 
                                key={g.id} 
                                initial={{ opacity: 0, y: 20 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                transition={{ delay: idx * 0.05 }}
                                className={`bg-[#1a1a1a] p-10 rounded-[3.5rem] border border-white/5 group hover:border-emerald-500/30 transition-all cursor-pointer ${isExpanded ? 'ring-2 ring-emerald-500/20' : ''}`}
                                onClick={() => setExpandedId(isExpanded ? null : g.id)}
                            >
                                <div className="flex flex-col xl:flex-row xl:items-center gap-10 relative overflow-hidden">
                                    <div className={`size-20 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl ${config.bg} ${config.color} border border-white/5`}>
                                        <config.icon size={36} strokeWidth={2.5} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-4 mb-6">
                                            <span className="px-5 py-1.5 rounded-full bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[3px] border border-white/5">
                                                Complaint ID: #{g.id}
                                            </span>
                                            <span className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[3px] border ${config.bg} ${config.color} ${config.border}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                        <h4 className="text-3xl font-black text-white mb-6 uppercase tracking-tighter leading-tight group-hover:text-emerald-400 transition-colors">
                                            {g.description}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-8 text-[10px] font-black text-white/20 uppercase tracking-[4px]">
                                            <span className="flex items-center gap-3"><User size={14} className="text-white/20" /> {g.voter_name}</span>
                                            <span className="flex items-center gap-3"><MapPin size={14} className="text-white/20" /> Booth {g.booth_id}</span>
                                            {g.assigned_worker && (
                                                <span className="flex items-center gap-3 text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-2xl border border-emerald-500/20">
                                                    <Zap size={12} strokeWidth={3} /> Officer: {g.assigned_worker}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-full xl:w-auto xl:pl-12 border-t xl:border-t-0 xl:border-l border-white/5 pt-10 xl:pt-0" onClick={e => e.stopPropagation()}>
                                        {isAwaiting ? (
                                            <button 
                                                onClick={() => setAssignModal(g)}
                                                className="w-full xl:w-72 py-6 bg-white text-black rounded-2xl font-black uppercase tracking-[4px] text-[11px] hover:bg-emerald-500 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4"
                                            >
                                                <Shield size={20} strokeWidth={3} /> Assign Officer
                                            </button>
                                        ) : (
                                            <div className="w-full xl:w-72 py-6 bg-white/5 border border-white/5 text-stone-500 rounded-2xl font-black uppercase tracking-[4px] text-[11px] flex items-center justify-center gap-4">
                                                <CheckCircle size={20} /> Work in progress
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <ChevronRight size={24} className={`text-stone-700 transition-all ${isExpanded ? 'rotate-90 text-emerald-500' : ''}`} />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-10 mt-10 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8">
                                                <div className="p-6 bg-black/20 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px] mb-3">Assigned to</p>
                                                    <p className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                                        <User size={18} className="text-emerald-500" /> {g.assigned_worker || 'Not Assigned'}
                                                    </p>
                                                </div>
                                                <div className="p-6 bg-black/20 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px] mb-3">Reported at</p>
                                                    <p className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                                        <Clock size={18} className="text-emerald-500" /> {new Date(g.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="p-6 bg-black/20 rounded-3xl border border-white/5">
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[3px] mb-3">Status</p>
                                                    <p className="text-lg font-black text-emerald-500 uppercase tracking-tighter flex items-center gap-3">
                                                        <Shield size={18} /> {g.status}
                                                    </p>
                                                </div>
                                                {g.resolution_note && (
                                                    <div className="md:col-span-3 p-8 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10">
                                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[4px] mb-4">Officer Note</p>
                                                        <p className="text-xl font-black text-stone-300 leading-tight uppercase tracking-tighter italic">"{g.resolution_note}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>
                </>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {voters.map((v, i) => (
                            <motion.div 
                                key={v.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.02 }}
                                className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-white/5 group hover:border-emerald-500/30 transition-all relative overflow-hidden"
                            >
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center text-stone-600 group-hover:text-emerald-500 transition-colors border border-white/5">
                                        <User size={28} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-2xl font-black text-white truncate tracking-tighter uppercase leading-none mb-2">{v.name}</h4>
                                        <p className="text-[10px] font-black text-stone-600 uppercase tracking-[3px]">UID: {v.id}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[2px]">
                                        <span className="text-stone-700">Voter Sentiment</span>
                                        <span className={
                                            v.sentiment === 'positive' ? 'text-emerald-500' : 
                                            v.sentiment === 'negative' ? 'text-rose-500' : 'text-stone-500'
                                        }>{v.sentiment || 'Neutral'}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${
                                            v.sentiment === 'positive' ? 'bg-emerald-500 w-full' : 
                                            v.sentiment === 'negative' ? 'bg-rose-500 w-full' : 'bg-stone-700 w-1/2'
                                        }`} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                                    <span className="px-4 py-1.5 rounded-full bg-white/5 text-stone-600 text-[9px] font-black uppercase tracking-[2px] border border-white/5">
                                        {v.segment || 'General'}
                                    </span>
                                    <span className="px-4 py-1.5 rounded-full bg-white/5 text-stone-600 text-[9px] font-black uppercase tracking-[2px] border border-white/5">
                                        {v.phone || 'No Contact'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Deployment Modal */}
            {createPortal(
                <AnimatePresence>
                    {assignModal && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                onClick={() => setAssignModal(null)}
                                className="absolute inset-0 bg-[#0c0c0c]/90 backdrop-blur-3xl" 
                            />
                            
                            <motion.div 
                                initial={{ y: '100%', opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                exit={{ y: '100%', opacity: 0 }}
                                className="relative w-full max-w-2xl bg-[#1a1a1a] rounded-t-[4rem] sm:rounded-[4rem] shadow-2xl overflow-hidden border border-white/10"
                            >
                                <div className="p-12">
                                    <div className="flex justify-between items-start mb-12">
                                        <div>
                                            <div className="px-5 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[4px] border border-emerald-500/20 mb-6 inline-block">
                                                Assign Task
                                            </div>
                                            <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Select Officer</h4>
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-[3px] text-stone-600 mt-3">Issue #: {assignModal.id}</p>
                                        </div>
                                        <button onClick={() => setAssignModal(null)} className="size-14 rounded-2xl bg-white/5 flex items-center justify-center text-stone-500 hover:text-white transition-all border border-white/5">
                                            <X size={28} />
                                        </button>
                                    </div>

                                    <div className="space-y-10">
                                        <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                                            <div className="absolute top-6 right-6 text-emerald-500/5">
                                                <Info size={64} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-stone-600 tracking-[3px] mb-4">Complaint Details</p>
                                            <p className="text-xl font-black text-stone-400 leading-tight uppercase tracking-tighter pr-12">{assignModal.description}</p>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[5px] text-emerald-500 pl-2">Select Officer</label>
                                            <div className="relative">
                                                <select 
                                                    value={selectedWorker} 
                                                    onChange={(e) => setSelectedWorker(e.target.value)}
                                                    className="w-full p-6 bg-white/5 rounded-2xl border border-white/5 focus:border-emerald-500/50 outline-none text-white text-lg font-black uppercase tracking-tighter appearance-none cursor-pointer pr-16"
                                                >
                                                    <option value="" className="bg-[#1a1a1a]">Select an officer...</option>
                                                    {workers.map(w => (
                                                        <option key={w.id} value={w.id} className="bg-[#1a1a1a]">{w.name} (ID: {w.id})</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
                                                    <ChevronRight size={24} className="rotate-90" strokeWidth={3} />
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleAssign} 
                                            disabled={!selectedWorker || submitting}
                                            className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[5px] shadow-2xl shadow-emerald-600/20 hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 border border-white/10"
                                        >
                                            {submitting ? (
                                                <RefreshCw className="size-6 animate-spin" />
                                            ) : (
                                                <><Shield size={24} strokeWidth={3} /> Confirm Assignment</>
                                            )}
                                        </button>
                                    </div>
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
