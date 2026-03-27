import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { getGrievances, updateGrievance } from '../../api';
import { 
  CheckCircle2, RefreshCw, 
  ChevronRight, Clock, ShieldAlert,
  Zap, BadgeCheck, ClipboardList, Send, MapPin,
  Shield, Activity, X, Image as ImageIcon, Sparkles, Film
} from 'lucide-react';

const STATUS_CONFIG = {
    submitted: { label: 'New Issue', icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    assigned: { label: 'Task Assigned', icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    in_progress: { label: 'Working on it', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400/30' },
    resolved: { label: 'Issue Resolved', icon: BadgeCheck, color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-border/10' },
};

const TaskCard = ({ task, onStart, onResolve, delay }) => {
    const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.assigned;
    const isResolved = task.status === 'resolved';

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            className={`bg-card backdrop-blur-3xl p-3 rounded-2xl border border-border transition-all flex flex-col md:flex-row md:items-center gap-3 group hover:border-emerald-500/30 shadow-md ${
                isResolved ? 'opacity-40 grayscale' : ''
            }`}
        >
            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-border/20 ${config.bg} ${config.color}`}>
                <config.icon size={20} strokeWidth={2.5} />
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border ${config.bg} ${config.color} ${config.border}`}>
                        {config.label}
                    </span>
                    <span className="text-[8px] font-mono font-bold text-muted-foreground/40 tracking-widest">#{task.id}</span>
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1 truncate group-hover:text-emerald-500 transition-colors uppercase tracking-tight leading-tight">
                    {task.description}
                </h4>

                {/* AI Vision & Media Quick View */}
                {(task.ai_vision_details || (task.attachments && task.attachments.length > 0)) && (
                    <div className="flex flex-col gap-2 my-2 p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                        {task.attachments && task.attachments.length > 0 && (
                            <div className="flex gap-1.5">
                                {task.attachments.map((url, i) => (
                                    <div key={i} className="size-10 rounded-lg border border-border overflow-hidden bg-muted">
                                        {url.match(/\.(mp4|webm|ogg)$/) ? (
                                            <div className="w-full h-full flex items-center justify-center text-emerald-500">
                                                <Film size={14} />
                                            </div>
                                        ) : (
                                            <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        {task.ai_vision_details && (
                            <div className="flex items-start gap-2">
                                <Sparkles size={10} className="text-emerald-500 mt-0.5 shrink-0" />
                                <p className="text-[9px] font-bold text-muted-foreground/80 leading-tight uppercase italic">
                                    {task.ai_vision_details.length > 100 ? task.ai_vision_details.substring(0, 100) + '...' : task.ai_vision_details}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><MapPin size={12} className="text-emerald-500" /> Booth {task.booth_id}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-emerald-500" /> at {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>

            {!isResolved && (
                <div className="w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 md:pl-3 border-border">
                    {task.status === 'assigned' ? (
                        <button 
                            onClick={() => onStart(task.id)}
                            className="w-full md:w-32 py-2 bg-emerald-600 text-white rounded-lg font-bold uppercase tracking-wider text-[9px] hover:bg-emerald-500 transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1.5 border border-white/10"
                        >
                            <span>START TASK</span> <ChevronRight size={12} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => onResolve(task)}
                            className="w-full md:w-32 py-2 bg-emerald-600 text-white rounded-lg font-bold uppercase tracking-wider text-[9px] hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-1.5 border border-white/10"
                        >
                            <span>COMPLETE</span> <CheckCircle2 size={12} />
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default function WorkerDashboard({ currentUser }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolveModal, setResolveModal] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');
    const [afterImages, setAfterImages] = useState([]);
    const [uploadingAfter, setUploadingAfter] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleAfterImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        
        setUploadingAfter(true);
        try {
            // Mock upload for now, similar to CitizenDashboard logic
            const newUrls = files.map(f => URL.createObjectURL(f));
            setAfterImages(prev => [...prev, ...newUrls]);
        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to upload evidence.");
        }
        setUploadingAfter(false);
    };

    const loadData = useCallback(async () => {
        if (!currentUser?.id) return;
        setLoading(true);
        setError(null);
        try {
            // Use Promise.allSettled to prevent total failure if one endpoint fails
            const results = await Promise.allSettled([
                getGrievances({ assigned_to: String(currentUser.id) })
            ]);
            
            const [gRes] = results;
            
            if (gRes.status === 'fulfilled') {
                setTasks(gRes.value || []);
            } else {
                console.error("Task fetch failed:", gRes.reason);
                // Gracefully handle backend errors by showing an empty list or specific message
                setTasks([]);
                setError("System failed to sync your tasks. Please refresh.");
            }
        } catch (e) { 
            console.error("Dashboard sync error:", e);
            setTasks([]);
            setError("A connection error occurred.");
        }
        setLoading(false);
    }, [currentUser?.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleStartWork = async (taskId) => {
        setError(null);
        try {
            await updateGrievance({ id: String(taskId), status: 'in_progress' });
            loadData();
        } catch (e) { 
            console.error(e);
            const detail = e.response?.data?.detail || "Action failed.";
            setError(`Start Task Error: ${detail}`);
        }
    };

    const handleResolve = async () => {
        if (!resolveModal) return;
        setSubmitting(true);
        setError(null);
        try {
            await updateGrievance({
                id: String(resolveModal.id),
                status: 'resolved',
                resolution_note: resolutionNote || 'Issue resolved and verified.',
                after_images: afterImages // New field for Impact Showcase
            });
            setResolveModal(null);
            setResolutionNote('');
            setAfterImages([]);
            loadData();
        } catch (e) { 
            console.error(e);
            const detail = e.response?.data?.detail || "Update failed.";
            setError(`Resolution Error: ${detail}`);
        }
        setSubmitting(false);
    };

    const activeTasks = tasks.filter(t => t.status !== 'resolved');
    const completedTasks = tasks.filter(t => t.status === 'resolved');

    return (
        <div className="space-y-6 animate-fade-in relative z-10 px-4 sm:px-0">
            {/* Header Info - Compact */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight uppercase leading-none">Field Officer Dashboard</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
                            <p className="text-emerald-500 text-[9px] font-bold uppercase tracking-widest">Status: Active</p>
                        </div>
                        <div className="size-1 rounded-full bg-muted-foreground/20" />
                        <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-widest">User: {currentUser?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={loadData} 
                        className="p-2 rounded-lg bg-card text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-all border border-border shadow-sm group active:scale-95"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                    </button>
                    <div className="px-3 py-1.5 bg-emerald-600/10 border border-emerald-500/20 rounded-lg">
                        <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider">Latency</p>
                        <p className="text-sm font-bold text-foreground leading-none">24ms</p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Pending Tasks', val: activeTasks.length, icon: Zap, color: '#10b981' },
                    { label: 'Completed Tasks', val: completedTasks.length, icon: BadgeCheck, color: '#10b981' },
                    { label: 'System Status', val: 'Online', icon: Shield, color: '#10b981' },
                    { label: 'Efficiency', val: '98%', icon: Activity, color: '#10b981' }
                ].map((s, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-card p-3 rounded-2xl border border-border shadow-sm flex items-center justify-between group hover:border-emerald-500/30 transition-all"
                    >
                        <div>
                            <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 transition-colors">{s.label}</p>
                            <p className="text-xl font-bold text-foreground tracking-tight group-hover:text-emerald-500 transition-colors uppercase leading-none">{s.val}</p>
                        </div>
                        <div className="size-8 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <s.icon size={14} strokeWidth={2.5} />
                        </div>
                    </motion.div>
                ))}
            </div>

            {error && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500"
                >
                    <ShieldAlert size={18} />
                    <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                </motion.div>
            )}

            {/* Tasks Area */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                            <Send size={16} strokeWidth={3} />
                        </div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight uppercase">Tasks</h3>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 rounded-md text-[8px] font-bold text-emerald-400 border border-emerald-500/20 tracking-wider">
                        Internal
                    </span>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="p-10 text-center bg-card rounded-2xl border border-border border-dashed">
                             <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
                             <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading...</p>
                        </div>
                    ) : activeTasks.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-10 text-center bg-emerald-600/5 rounded-2xl border border-emerald-500/10 border-dashed"
                        >
                             <div className="size-12 rounded-xl bg-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-600/20 border border-white/10">
                                <Shield className="text-white" size={24} strokeWidth={2.5} />
                             </div>
                             <h4 className="text-xl font-bold text-foreground mb-1 tracking-tight uppercase leading-none">No pending tasks</h4>
                             <p className="text-muted-foreground text-[9px] max-w-xs mx-auto uppercase tracking-wider font-medium leading-normal">System clear. All reported issues have been addressed.</p>
                        </motion.div>
                    ) : (
                        activeTasks.map((task, idx) => (
                            <TaskCard 
                                key={task.id} 
                                task={task} 
                                onStart={handleStartWork} 
                                onResolve={setResolveModal} 
                                delay={idx * 0.05} 
                            />
                        ))
                    )}

                    {completedTasks.length > 0 && (
                        <div className="pt-12 space-y-4">
                            <div className="flex items-center gap-3 px-1">
                                <div className="h-px flex-1 bg-border" />
                                <h4 className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">Completed Tasks</h4>
                                <div className="h-px flex-1 bg-border" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {completedTasks.map((task, idx) => (
                                    <TaskCard key={task.id} task={task} delay={idx * 0.05} />
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
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                onClick={() => setResolveModal(null)}
                                className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
                            />
                            
                            <motion.div 
                                initial={{ y: '100%', opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }} 
                                exit={{ y: '100%', opacity: 0 }}
                                className="relative w-full max-w-xl bg-card rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden border border-border"
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-5">
                                        <div>
                                            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-[8px] font-bold uppercase tracking-wider border border-emerald-500/20 mb-3 inline-block">
                                                Task Resolution
                                            </div>
                                            <h4 className="text-xl font-bold text-foreground tracking-tight uppercase leading-none">Submit Resolution</h4>
                                            <p className="text-[8px] font-mono font-bold uppercase tracking-widest text-muted-foreground mt-1.5">Task #: {resolveModal.id}</p>
                                        </div>
                                        <button onClick={() => setResolveModal(null)} className="size-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all border border-border">
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 bg-muted/50 rounded-xl border border-border relative overflow-hidden">
                                            <div className="absolute top-3 right-3 text-emerald-500/10">
                                                <ClipboardList size={32} />
                                            </div>
                                            <p className="text-[7px] font-bold uppercase text-muted-foreground/60 tracking-wider mb-1">Issue Description</p>
                                            <p className="text-sm font-bold text-foreground/80 leading-snug uppercase tracking-tight pr-6">{resolveModal.description}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[8px] font-bold uppercase tracking-widest text-emerald-500 pl-1">Resolution Details</label>
                                            <textarea 
                                                value={resolutionNote} 
                                                onChange={(e) => setResolutionNote(e.target.value)}
                                                placeholder="Briefly describe how you resolved this issue..."
                                                className="w-full p-3 bg-card rounded-xl border border-border focus:border-emerald-500/50 outline-none text-foreground text-sm transition-all h-24 resize-none placeholder:text-muted-foreground/30 uppercase tracking-tight" 
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[8px] font-bold uppercase tracking-widest text-emerald-500 pl-1">Impact Evidence (After Images)</label>
                                            <div className="flex flex-wrap gap-2">
                                                {afterImages.map((url, idx) => (
                                                    <div key={idx} className="relative size-16 rounded-xl border border-border overflow-hidden bg-muted group/img shadow-sm">
                                                        <img src={url} alt="After" className="w-full h-full object-cover" />
                                                        <button 
                                                            onClick={() => setAfterImages(prev => prev.filter(u => u !== url))}
                                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {afterImages.length < 4 && (
                                                    <label className="size-16 rounded-xl border-2 border-dashed border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all">
                                                        <input type="file" multiple accept="image/*" onChange={handleAfterImageUpload} className="hidden" />
                                                        {uploadingAfter ? <RefreshCw className="animate-spin text-emerald-500" size={14} /> : <ImageIcon size={14} className="text-muted-foreground" />}
                                                        <span className="text-[8px] font-black text-muted-foreground uppercase">Upload</span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleResolve} 
                                            disabled={submitting}
                                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest shadow-md shadow-emerald-600/20 hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-white/10 text-[10px]"
                                        >
                                            {submitting ? (
                                                <RefreshCw className="size-4 animate-spin" />
                                            ) : (
                                                <><BadgeCheck size={16} strokeWidth={2.5} /> Confirm</>
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
