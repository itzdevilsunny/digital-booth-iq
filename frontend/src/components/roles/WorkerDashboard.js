import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGrievances, updateGrievance } from '../../api';
import { 
  Wrench, CheckCircle2, Clock, AlertCircle, RefreshCw, 
  ChevronRight, Calendar, UserCircle, X, ShieldAlert,
  Zap, BadgeCheck, ClipboardList, Send
} from 'lucide-react';

const STATUS_CONFIG = {
  submitted: { 
    label: 'Awaiting Orders', 
    bg: 'bg-saffron/10', 
    text: 'text-saffron', 
    border: 'border-saffron/20',
    icon: ShieldAlert 
  },
  assigned: { 
    label: 'Deployment Ready', 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-500', 
    border: 'border-blue-500/20',
    icon: ClipboardList 
  },
  in_progress: { 
    label: 'Active Mission', 
    bg: 'bg-primary/10', 
    text: 'text-primary', 
    border: 'border-primary/20',
    icon: Zap 
  },
  resolved: { 
    label: 'Mission Accomplished', 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-500', 
    border: 'border-emerald-500/20',
    icon: BadgeCheck 
  },
};

export default function WorkerDashboard({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGrievances({ assigned_to: currentUser.id });
      setTasks(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [currentUser.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStartWork = async (taskId) => {
    try {
      await updateGrievance({ id: taskId, status: 'in_progress' });
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    setSubmitting(true);
    try {
      await updateGrievance({
        id: resolveModal.id,
        status: 'resolved',
        resolution_note: resolutionNote || 'Mission completed by field operator'
      });
      setResolveModal(null);
      setResolutionNote('');
      loadData();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const pending = tasks.filter(t => t.status !== 'resolved');
  const resolved = tasks.filter(t => t.status === 'resolved');

  return (
    <div data-testid="worker-dashboard" className="p-0">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Missions', value: pending.length, icon: Zap, color: 'text-primary' },
          { label: 'Neutralized', value: resolved.length, icon: BadgeCheck, color: 'text-emerald-600' },
          { label: 'Total Operations', value: tasks.length, icon: Wrench, color: 'text-navy/40' },
          { label: 'Efficiency Index', value: '98%', icon: Send, color: 'text-saffron' },
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gold/10 relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-gold/5 to-transparent" />
            <div className="flex items-center gap-3 mb-2">
              <s.icon size={16} className={s.color} />
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-navy/40">{s.label}</span>
            </div>
            <p className="text-2xl font-serif font-black text-navy">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gold/10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gold/10 border border-gold/10 flex items-center justify-center text-primary">
            <ClipboardList size={18} />
          </div>
          <h3 className="text-xl font-serif font-black text-navy uppercase tracking-tighter">Mission Briefing</h3>
        </div>
        <button onClick={loadData} data-testid="worker-refresh" 
          className="p-3 rounded-xl bg-white border border-gold/10 text-primary hover:bg-gold/5 transition-all active:scale-95 shadow-md">
          <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Operation List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-navy/40 font-mono text-[10px] uppercase tracking-[0.3em]">Synchronizing Registry...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-20 bg-white border border-dashed border-gold/20 rounded-2xl text-center shadow-sm">
            <Wrench size={40} className="mx-auto mb-4 text-navy/10" />
            <p className="text-navy/20 font-mono text-[10px] uppercase tracking-[0.3em]">No active mission parameters found</p>
          </div>
        ) : tasks.map((task, idx) => {
          const s = STATUS_CONFIG[task.status] || STATUS_CONFIG.assigned;
          const SIcon = s.icon;
          
          return (
            <motion.div key={task.id} data-testid={`worker-task-${task.id}`}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="bg-white p-6 rounded-2xl border border-gold/10 hover:border-primary/20 transition-all group shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/5 to-transparent pointer-events-none" />
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="px-3 py-1 rounded-lg bg-gold/5 border border-gold/10 text-[9px] font-mono font-black uppercase tracking-widest text-navy/60">
                      {task.category || 'GENERAL'}
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${s.bg} ${s.border} ${s.text}`}>
                      <SIcon size={12} />
                      <span className="text-[9px] font-mono font-black uppercase tracking-widest">{s.label}</span>
                    </div>
                  </div>

                  <p className="text-navy font-serif text-lg leading-relaxed mb-4 group-hover:text-primary transition-colors">
                    {task.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-navy/30">
                    <span className="flex items-center gap-1.5"><RefreshCw size={10} /> OP_ID: #{task.id}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={10} /> {new Date(task.created_at).toLocaleDateString()}</span>
                    {task.resolution_note && (
                      <>
                        <div className="h-3 w-px bg-gold/20 hidden md:block" />
                        <span className="flex items-center gap-1.5 text-emerald-600/60">
                          <CheckCircle2 size={10} /> REPORT: {task.resolution_note}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-end md:items-center gap-3">
                  {task.status !== 'resolved' && (
                    <div className="flex gap-2">
                      {task.status === 'assigned' && (
                        <button data-testid={`start-work-${task.id}`} onClick={() => handleStartWork(task.id)}
                          className="px-6 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-mono font-black uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center gap-3 shadow-lg shadow-blue-500/5">
                          <Zap size={14} /> Begin Tech
                        </button>
                      )}
                      <button data-testid={`resolve-btn-${task.id}`} onClick={() => setResolveModal(task)}
                        className="px-6 py-3 rounded-xl bg-primary text-white text-[10px] font-mono font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/10 transition-all flex items-center gap-3">
                        <CheckCircle2 size={14} /> Neutralize
                      </button>
                    </div>
                  )}
                  {task.status === 'resolved' && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                      <BadgeCheck size={20} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Resolve Modal */}
      <AnimatePresence>
        {resolveModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setResolveModal(null)} className="absolute inset-0 bg-navy/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-3xl w-full max-w-lg border border-gold/20 relative z-10 shadow-2xl">
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-serif font-black text-navy uppercase tracking-tight">Neutralization Log</h3>
                  <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.2em]">MISSION #{resolveModal.id.substr(-8).toUpperCase()}</p>
                </div>
                <button onClick={() => setResolveModal(null)} className="p-2 rounded-xl bg-gold/10 text-navy/40 hover:text-navy transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest mb-3 block">Field Report Details</label>
                  <textarea data-testid="resolution-note-input" value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                    rows={4} placeholder="Document operational actions taken..."
                    className="w-full p-4 rounded-xl bg-gold/5 border border-gold/10 text-xs text-navy font-mono font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none resize-none placeholder:text-navy/20" />
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setResolveModal(null)}
                    className="flex-1 py-4 rounded-xl border border-gold/10 text-[10px] font-mono font-black uppercase tracking-widest text-navy/40 hover:bg-gold/5 transition-all">
                    Cancel Log
                  </button>
                  <button data-testid="resolve-confirm-btn" onClick={handleResolve} disabled={submitting}
                    className="flex-[2] py-4 rounded-xl bg-primary text-white text-[10px] font-mono font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                    {submitting ? 'Transmitting...' : 'Commit Neutralized'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
