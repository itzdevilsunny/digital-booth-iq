import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { getGrievances, updateGrievance, getUsersByRole } from '../../api';
import { 
  Shield, Users, AlertCircle, CheckCircle, Clock, 
  MapPin, User, Search, Filter, RefreshCw, X,
  ChevronRight, Activity, TrendingUp, Info,
  ArrowUpRight, LayoutDashboard, Database, 
  Zap, MoreHorizontal
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
        className="glass-panel p-6 rounded-[2rem] border border-stone-200/60 shadow-sm relative overflow-hidden group"
    >
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon size={64} />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
                <div className={`size-8 rounded-full flex items-center justify-center bg-stone-100 text-stone-400 group-hover:text-stone-900 transition-colors`}>
                    <Icon size={16} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-stone-400">{label}</p>
            </div>
            <div className="flex items-end justify-between">
                <h3 className={`text-4xl font-display font-bold text-stone-900 tracking-tight`}>{value}</h3>
                {trend && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <TrendingUp size={10} /> {trend}
                    </div>
                )}
            </div>
        </div>
    </motion.div>
);

export default function AdminDashboard({ boothId }) {
    const [grievances, setGrievances] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assignModal, setAssignModal] = useState(null);
    const [selectedWorker, setSelectedWorker] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('all');

    const safeBoothId = boothId || 17;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [gData, wData] = await Promise.all([
                getGrievances({ booth_id: safeBoothId }),
                getUsersByRole('worker')
            ]);
            setGrievances(gData || []);
            setWorkers(wData || []);
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-stone-200/60">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="px-2.5 py-0.5 rounded-full bg-stone-900 text-white text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-stone-900/10">
                            <Shield size={10} /> Dashboard
                        </div>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Booth {safeBoothId} Status</p>
                    </div>
                    <h1 className="text-4xl font-display font-bold text-stone-900 tracking-tight">Booth Overview</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={loadData} className="px-5 py-2.5 rounded-full bg-white text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-2 border border-stone-200/50 shadow-sm">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Refresh List</span>
                    </button>
                </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard 
                    label="Open Problems" 
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
                    label="Staff Available" 
                    value={workers.length} 
                    icon={Users} 
                    color="#3b82f6"
                    delay={0.4}
                />
            </div>

            {/* Tactical Control Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl w-fit">
                    {['all', 'open', 'assigned', 'resolved'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[2px] transition-all ${
                                filter === f 
                                    ? 'bg-white text-stone-900 shadow-xl shadow-stone-200 border border-stone-200' 
                                    : 'text-stone-400 hover:text-stone-600'
                            }`}
                        >
                            {f === 'open' ? 'New Problems' : f}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <div className="px-4 py-2.5 rounded-full bg-stone-50 border border-stone-100 text-stone-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <Database size={12} /> Live Data
                    </div>
                </div>
            </div>

            {/* Data Feed */}
            <div className="space-y-4">
                {loading ? (
                    <div className="p-32 text-center glass-panel rounded-[3rem] bg-stone-50/50 border-dashed">
                        <RefreshCw className="w-12 h-12 text-stone-300 animate-spin mx-auto mb-6" />
                        <p className="text-[11px] font-bold uppercase tracking-[4px] text-stone-400">Loading Information...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-20 text-center glass-panel rounded-[3rem] bg-stone-50/20 border-stone-100">
                        <div className="size-20 rounded-full bg-white flex items-center justify-center mx-auto mb-8 shadow-sm">
                            <LayoutDashboard className="text-stone-200" size={40} />
                        </div>
                        <h4 className="text-2xl font-display font-bold text-stone-900 mb-2">Everything is Good</h4>
                        <p className="text-stone-400 text-sm max-w-sm mx-auto">No problems reported in this area. Status is normal.</p>
                    </div>
                ) : (
                    filtered.map((g, idx) => {
                        const config = STATUS_CONFIG[g.status] || STATUS_CONFIG.submitted;
                        const isAwaiting = g.status === 'submitted';

                        return (
                            <motion.div 
                                key={g.id} 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }} 
                                transition={{ delay: idx * 0.05 }}
                                className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border border-stone-200/50 group hover:border-emerald-500/30 transition-all flex flex-col md:flex-row md:items-center gap-8 shadow-sm"
                            >
                                <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${config.bg} ${config.color} shadow-${config.color.split('-')[1]}-200/20`}>
                                    <config.icon size={28} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-500 text-[9px] font-bold uppercase tracking-[2px] border border-stone-200">
                                            ID: #{g.id}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[2px] border ${config.bg} ${config.color} ${config.border}`}>
                                            {config.label}
                                        </span>
                                    </div>
                                    <h4 className="text-2xl font-display font-bold text-stone-900 mb-3 truncate group-hover:text-stone-700">
                                        {g.description}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-2"><User size={12} className="text-stone-300" /> {g.voter_name}</span>
                                        <span className="flex items-center gap-2"><MapPin size={12} className="text-stone-300" /> Area {g.booth_id}</span>
                                        {g.assigned_worker && (
                                            <span className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                                <Zap size={10} /> Person: {g.assigned_worker}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full md:w-auto md:pl-8 border-t md:border-t-0 md:border-l border-stone-100 pt-6 md:pt-0">
                                    {isAwaiting ? (
                                        <button 
                                            onClick={() => setAssignModal(g)}
                                            className="w-full md:w-56 py-4 bg-stone-900 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-600 transition-all shadow-xl shadow-stone-900/10 active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            <Shield size={16} /> Assign to Staff
                                        </button>
                                    ) : (
                                        <div className="w-full md:w-56 py-4 bg-stone-50 border border-stone-200 text-stone-400 rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3">
                                            <CheckCircle size={16} /> Assigned
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

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
                                className="absolute inset-0 bg-stone-950/70 backdrop-blur-xl" 
                            />
                            
                            <motion.div 
                                initial={{ y: '100%', opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                exit={{ y: '100%', opacity: 0 }}
                                className="relative w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden"
                            >
                                <div className="p-10">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <div className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-[9px] font-bold uppercase tracking-widest border border-stone-200 mb-4 inline-block">
                                                Tactical Authorization
                                            </div>
                                            <h4 className="text-3xl font-display font-bold text-stone-900 tracking-tight">Personnel Deployment</h4>
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400 mt-1">INCIDENT_REF: #{assignModal.id}</p>
                                        </div>
                                        <button onClick={() => setAssignModal(null)} className="size-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100 relative">
                                            <div className="absolute top-4 right-4 text-emerald-600/10">
                                                <Info size={48} />
                                            </div>
                                            <p className="text-[10px] font-bold uppercase text-stone-400 tracking-widest mb-3">Field Report</p>
                                            <p className="text-base font-medium text-stone-700 leading-relaxed pr-8">{assignModal.description}</p>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] font-bold uppercase tracking-[4px] text-stone-400 pl-1">Target Personnel</label>
                                            <div className="relative">
                                                <select 
                                                    value={selectedWorker} 
                                                    onChange={(e) => setSelectedWorker(e.target.value)}
                                                    className="w-full p-5 bg-stone-50 rounded-[1.5rem] border border-stone-200 focus:border-stone-900 outline-none text-sm font-bold transition-all appearance-none cursor-pointer pr-12"
                                                >
                                                    <option value="">Choose Deployment Unit...</option>
                                                    {workers.map(w => (
                                                        <option key={w.id} value={w.id}>{w.name} (ID: {w.id})</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                                    <ChevronRight size={20} className="rotate-90" />
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleAssign} 
                                            disabled={!selectedWorker || submitting}
                                            className="w-full py-5 bg-stone-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-2xl hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                        >
                                            {submitting ? (
                                                <RefreshCw className="size-5 animate-spin" />
                                            ) : (
                                                <><Shield size={20} /> Authorize Order</>
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
