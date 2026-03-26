import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { getGrievances, updateGrievance, getUsersByRole } from '../../api';
import { 
  Wrench, CheckCircle2, Clock, AlertCircle, RefreshCw, 
  ChevronRight, Calendar, UserCircle, X, ShieldAlert,
  Zap, BadgeCheck, ClipboardList, Send, MapPin, Users,
  ArrowRight, Shield, Activity
} from 'lucide-react';

const STATUS_CONFIG = {
    submitted: { label: 'NEW_ANOMALY', icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    assigned: { label: 'MISSION_QUEUED', icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    in_progress: { label: 'ACTIVE_INTERVENTION', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30' },
    resolved: { label: 'MISSION_SUCCESS', icon: BadgeCheck, color: 'text-stone-600', bg: 'bg-white/5', border: 'border-white/5' },
};

const MissionCard = ({ task, onStart, onResolve, delay }) => {
    const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.assigned;
    const isResolved = task.status === 'resolved';

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className={`bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 transition-all flex flex-col md:flex-row md:items-center gap-8 group hover:border-emerald-500/30 shadow-2xl ${
                isResolved ? 'opacity-40 grayscale' : ''
            }`}
        >
            <div className={`size-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl border border-white/10 ${config.bg} ${config.color}`}>
                <config.icon size={40} strokeWidth={2.5} />
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4 mb-3">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[2px] border ${config.bg} ${config.color} ${config.border}`}>
                        {config.label}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-stone-600 tracking-widest">NODE_ID: #{task.id}</span>
                </div>
                <h4 className="text-3xl font-black text-white mb-4 truncate group-hover:text-emerald-500 transition-colors uppercase tracking-tighter leading-tight">
                    {task.description}
                </h4>
                <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-stone-500 uppercase tracking-[3px]">
                    <span className="flex items-center gap-2"><MapPin size={16} className="text-emerald-500" /> SECTOR_{task.booth_id}</span>
                    <span className="flex items-center gap-2"><Clock size={16} className="text-emerald-500" /> SYNC_{new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            {!isResolved && (
                <div className="w-full md:w-auto pt-8 md:pt-0 border-t md:border-t-0 md:pl-8 border-white/5">
                    {task.status === 'assigned' ? (
                        <button 
                            onClick={() => onStart(task.id)}
                            className="w-full md:w-56 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[4px] text-[10px] hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3 border border-white/10"
                        >
                            <span>ENGAGE MISSION</span> <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => onResolve(task)}
                            className="w-full md:w-56 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[4px] text-[10px] hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3 border border-white/10"
                        >
                            <span>CONFIRM SOLVE</span> <CheckCircle2 size={18} />
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default function WorkerDashboard({ currentUser: initialUser }) {
    const [currentUser, setCurrentUser] = useState(initialUser);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolveModal, setResolveModal] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        if (!currentUser?.id) return;
        setLoading(true);
        try {
            const gData = await getGrievances({ assigned_to: String(currentUser.id) });
            setTasks(gData || []);
        } catch (e) { console.error(e); }
        setLoading(false);
    }, [currentUser?.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleStartWork = async (taskId) => {
        try {
            await updateGrievance({ id: String(taskId), status: 'in_progress' });
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleResolve = async () => {
        if (!resolveModal) return;
        setSubmitting(true);
        try {
            await updateGrievance({
                id: String(resolveModal.id),
                status: 'resolved',
                resolution_note: resolutionNote || 'Mission verified by field unit.'
            });
            setResolveModal(null);
            setResolutionNote('');
            loadData();
        } catch (e) { console.error(e); }
        setSubmitting(false);
    };

    const activeMissions = tasks.filter(t => t.status !== 'resolved');
    const completedMissions = tasks.filter(t => t.status === 'resolved');

    return (
        <div className="space-y-12 animate-fade-in relative z-10 px-4 sm:px-0">
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pb-8 border-b border-white/5">
                <div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">FIELD_UNIT<br/>OPERATIONS</h1>
                    <div className="flex items-center gap-4 mt-6">
                        <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[3px]">ACTIVE_ENCRYPTED_SYNC</p>
                        </div>
                        <div className="size-1 rounded-full bg-stone-800" />
                        <p className="text-stone-500 text-[10px] font-black uppercase tracking-[3px]">OFFICER_{currentUser?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={loadData} 
                        className="p-4 rounded-2xl bg-white/5 text-stone-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all border border-white/5 shadow-2xl group active:scale-95"
                    >
                        <RefreshCw size={24} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                    <div className="px-6 py-4 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[2px]">FIELD_LATENCY</p>
                        <p className="text-xl font-black text-white">24ms</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Pending Missions', val: activeMissions.length, icon: Zap, color: '#10b981' },
                    { label: 'Finalized Nodes', val: completedMissions.length, icon: BadgeCheck, color: '#10b981' },
                    { label: 'Combat Status', val: 'Tactical', icon: Shield, color: '#10b981' },
                    { label: 'Field Efficiency', val: '98%', icon: Activity, color: '#10b981' }
                ].map((s, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 shadow-2xl flex items-center justify-between group hover:border-emerald-500/30 transition-all"
                    >
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[3px] text-stone-600 mb-2 group-hover:text-stone-400 transition-colors">{s.label}</p>
                            <p className="text-4xl font-black text-white tracking-tighter group-hover:text-emerald-500 transition-colors uppercase">{s.val}</p>
                        </div>
                        <div className="size-14 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <s.icon size={28} strokeWidth={2.5} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Tasks Area */}
            <div className="space-y-10">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
                            <Send size={20} strokeWidth={3} />
                        </div>
                        <h3 className="text-3xl font-black text-white tracking-tighter uppercase">MISSION_QUEUE</h3>
                    </div>
                    <span className="px-5 py-2 bg-emerald-500/10 rounded-full text-[10px] font-black text-emerald-400 border border-emerald-500/20 tracking-[3px]">
                        LEVEL_4_SECURITY
                    </span>
                </div>

                <div className="space-y-6">
                    {loading ? (
                        <div className="p-32 text-center bg-white/5 backdrop-blur-3xl rounded-[4rem] border border-white/5 border-dashed">
                             <RefreshCw className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]" />
                             <p className="text-[12px] font-black uppercase tracking-[5px] text-stone-600 animate-pulse">Synchronizing Intelligence Stream...</p>
                        </div>
                    ) : activeMissions.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-32 text-center bg-emerald-600/5 backdrop-blur-3xl rounded-[4rem] border border-emerald-500/10 border-dashed"
                        >
                             <div className="size-24 rounded-[2rem] bg-emerald-600 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20 border border-white/10">
                                <Shield className="text-white" size={48} strokeWidth={2.5} />
                             </div>
                             <h4 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase leading-none">ALL_TARGETS_NEUTRALIZED</h4>
                             <p className="text-stone-500 text-sm max-w-sm mx-auto uppercase tracking-tighter font-medium leading-relaxed">The sector is currently stabilized. All reported anomalies have been resolved and indexed.</p>
                        </motion.div>
                    ) : (
                        activeMissions.map((task, idx) => (
                            <MissionCard 
                                key={task.id} 
                                task={task} 
                                onStart={handleStartWork} 
                                onResolve={setResolveModal} 
                                delay={idx * 0.05} 
                            />
                        ))
                    )}

                    {completedMissions.length > 0 && (
                        <div className="mt-24 space-y-8">
                            <div className="flex items-center gap-4 px-2">
                                <div className="h-px flex-1 bg-white/5" />
                                <h4 className="text-[10px] font-black uppercase tracking-[5px] text-stone-700">HISTORICAL_LOGS</h4>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {completedMissions.map((task, idx) => (
                                    <MissionCard key={task.id} task={task} delay={idx * 0.05} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Resolution Modal */}
            {createPortal(
                <AnimatePresence>
                    {resolveModal && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                onClick={() => setResolveModal(null)}
                                className="absolute inset-0 bg-[#0c0c0c]/80 backdrop-blur-2xl" 
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
                                            <div className="px-5 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[3px] border border-emerald-500/20 mb-6 inline-block">
                                                MISSION_DEBRIEF
                                            </div>
                                            <h4 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">MISSION_OUTCOME</h4>
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-[3px] text-stone-600 mt-3">TARGET_LOG: #{resolveModal.id}</p>
                                        </div>
                                        <button onClick={() => setResolveModal(null)} className="size-14 rounded-2xl bg-white/5 flex items-center justify-center text-stone-500 hover:text-white transition-all border border-white/5">
                                            <X size={28} />
                                        </button>
                                    </div>

                                    <div className="space-y-10">
                                        <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                                            <div className="absolute top-6 right-6 text-emerald-500/10">
                                                <ClipboardList size={64} />
                                            </div>
                                            <p className="text-[10px] font-black uppercase text-stone-600 tracking-[3px] mb-4">OBJECTIVE_PARAMETERS</p>
                                            <p className="text-xl font-black text-stone-400 leading-tight uppercase tracking-tighter pr-12">{resolveModal.description}</p>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[5px] text-emerald-500 pl-2">RESOLUTION_REGISTRY</label>
                                            <textarea 
                                                value={resolutionNote} 
                                                onChange={(e) => setResolutionNote(e.target.value)}
                                                placeholder="Detail technical outcome and field measures..."
                                                className="w-full p-8 bg-white/5 rounded-[2.5rem] border border-white/5 focus:border-emerald-500/50 outline-none text-white text-lg font-medium transition-all h-40 resize-none placeholder:text-stone-800 uppercase tracking-tighter" 
                                            />
                                        </div>

                                        <button 
                                            onClick={handleResolve} 
                                            disabled={submitting}
                                            className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[5px] shadow-2xl shadow-emerald-600/20 hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 border border-white/10"
                                        >
                                            {submitting ? (
                                                <RefreshCw className="size-6 animate-spin" />
                                            ) : (
                                                <><BadgeCheck size={24} strokeWidth={3} /> TRANSMIT_MISSION_SUCCESS</>
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
