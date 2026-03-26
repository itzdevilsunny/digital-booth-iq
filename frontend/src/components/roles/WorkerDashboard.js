import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { getGrievances, updateGrievance, getUsersByRole } from '../../api';
import { 
  Wrench, CheckCircle2, Clock, AlertCircle, RefreshCw, 
  ChevronRight, Calendar, UserCircle, X, ShieldAlert,
  Zap, BadgeCheck, ClipboardList, Send, MapPin, Users
} from 'lucide-react';
import NotificationBell from '../ui/NotificationBell';

const STATUS_CONFIG = {
  submitted: { label: 'Awaiting Orders', bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', icon: ShieldAlert },
  assigned: { label: 'Deployed', bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', icon: ClipboardList },
  in_progress: { label: 'Active Mission', bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', icon: Zap },
  resolved: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', icon: BadgeCheck },
};

export default function WorkerDashboard({ currentUser: initialUser }) {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [allWorkers, setAllWorkers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolveModal, setResolveModal] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const [gData, wData] = await Promise.all([
        getGrievances({ assigned_to: String(currentUser.id) }),
        getUsersByRole('worker')
      ]);
      setTasks(gData || []);
      setAllWorkers(wData || []);
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
        resolution_note: resolutionNote || 'Mission completed by field personnel'
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
    <div className="min-h-screen bg-[#f0ece3] bg-grid-pattern pb-24">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-40 border-b border-[#c9a84c]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                <Wrench size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-navy tracking-tight">Field Unit</h1>
                <div className="flex items-center gap-2">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#c9a84c] font-bold">Operator: {currentUser?.name || 'Unit-Alpha'}</p>
                  {allWorkers.length > 1 && (
                    <select 
                      onChange={(e) => {
                        const newWorker = allWorkers.find(w => w.id === e.target.value);
                        if (newWorker) setCurrentUser(newWorker);
                      }}
                      value={currentUser?.id}
                      className="text-[8px] bg-black/5 border-none rounded px-1 py-0.5 font-bold text-navy/40 focus:ring-0 cursor-pointer hover:bg-black/10 transition-colors"
                    >
                      {allWorkers.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button onClick={loadData} className="p-2 hover:bg-black/5 rounded-full transition-colors relative">
                 <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="page-container p-4">
        {/* Quick Stats Grid */}
        <div className="dashboard-grid mb-8">
          {[
            { label: 'Active Missions', val: pending.length, icon: Zap, color: 'text-primary' },
            { label: 'Neutralized', val: resolved.length, icon: BadgeCheck, color: 'text-emerald-500' },
            { label: 'Sector Status', val: 'Green', icon: ShieldAlert, color: 'text-blue-500' },
            { label: 'Efficiency', val: '98%', icon: Send, color: 'text-navy/40' }
          ].map((s, i) => (
             <div key={i} className="glass-panel p-5 rounded-2xl flex items-center justify-between">
               <div>
                 <p className="text-[9px] font-mono font-black uppercase tracking-widest text-navy/40 mb-1">{s.label}</p>
                 <p className={`text-2xl font-serif font-black ${s.color}`}>{s.val}</p>
               </div>
               <s.icon size={18} className={`${s.color} opacity-40`} />
             </div>
          ))}
        </div>

        <h3 className="text-xl font-serif font-black text-navy mb-6">Current Objectives</h3>
        
        <div className="space-y-4">
          {loading ? (
             <div className="py-20 text-center glass-panel rounded-3xl">
               <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
               <p className="text-[10px] font-mono font-black uppercase tracking-widest text-[#c9a84c]">Awaiting Registry Sync...</p>
             </div>
          ) : tasks.length === 0 ? (
             <div className="py-20 text-center glass-panel rounded-3xl border-dashed">
               <p className="text-[10px] font-mono font-black uppercase tracking-widest text-navy/20">Operational Sector is Clear</p>
             </div>
          ) : (
            <>
              {pending.map((task, idx) => {
                const config = STATUS_CONFIG[task.status] || STATUS_CONFIG.assigned;
                return (
                  <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    className="glass-panel p-5 md:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 group hover:border-primary/40 transition-all">
                    <div className={`p-4 rounded-xl ${config.bg} ${config.text} shrink-0`}>
                      <config.icon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                         <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-mono font-black uppercase tracking-widest ${config.bg} ${config.text} ${config.border}`}>
                           {config.label}
                         </span>
                         <span className="text-[8px] font-mono font-bold text-navy/30">#ID-{task.id}</span>
                      </div>
                      <h4 className="text-lg font-serif font-bold text-navy truncate mb-1">{task.description}</h4>
                      <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono font-bold text-navy/40 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><MapPin size={10} /> Sector {task.booth_id}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> Recieved: {new Date(task.created_at || Date.now()).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <div className="w-full md:w-auto flex flex-col gap-2">
                      {task.status === 'assigned' ? (
                        <button onClick={() => handleStartWork(task.id)}
                          className="w-full px-6 py-3 bg-navy text-white rounded-xl text-[10px] font-mono font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95">
                          Acknowledge & Start
                        </button>
                      ) : (
                        <button onClick={() => setResolveModal(task)}
                          className="w-full px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-mono font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg active:scale-95">
                          Finalize Mission
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {resolved.length > 0 && (
                <div className="mt-12">
                   <h4 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-navy/30 mb-6 px-2">Neutralized Targets</h4>
                   <div className="space-y-3 opacity-60 grayscale hover:grayscale-0 transition-all">
                     {resolved.map((task) => (
                        <div key={task.id} className="glass-panel p-4 rounded-xl flex items-center gap-4 border-emerald-500/20">
                          <BadgeCheck size={18} className="text-emerald-500" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-navy line-clamp-1">{task.description}</p>
                            <p className="text-[8px] font-mono font-bold uppercase text-navy/40">Resolved at {new Date(task.updated_at || Date.now()).toLocaleTimeString()}</p>
                          </div>
                        </div>
                     ))}
                   </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Resolution Portal */}
      {createPortal(
        <AnimatePresence>
          {resolveModal && (
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setResolveModal(null)}
                className="absolute inset-0 bg-navy/40 backdrop-blur-sm" />
              
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="relative w-full max-w-lg bg-[#f0ece3] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border-t sm:border border-[#c9a84c]/20">
                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-serif font-black text-navy mb-1 uppercase tracking-tight">Post-Mission Logs</h4>
                      <p className="text-[10px] font-mono font-black uppercase tracking-widest text-[#c9a84c]">Mission ID: #{resolveModal.id}</p>
                    </div>
                    <button onClick={() => setResolveModal(null)} className="p-2 hover:bg-black/5 rounded-full">
                      <X size={20} className="text-navy/40" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-white/50 rounded-2xl border border-gold/10">
                      <p className="text-[9px] font-mono font-black uppercase text-navy/40 mb-2">Objective Context</p>
                      <p className="text-sm font-serif font-bold text-navy">{resolveModal.description}</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-black uppercase text-[#c9a84c] mb-3 block">Resolution Registry Note</label>
                      <textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)}
                        placeholder="Detail the operational outcome..."
                        className="w-full p-4 bg-white rounded-2xl border-2 border-gold/10 focus:border-primary outline-none text-sm font-bold transition-all h-24 resize-none" />
                    </div>

                    <button onClick={handleResolve} disabled={submitting}
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-mono font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                      {submitting ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <><BadgeCheck size={18} /> Transmit Mission Success</>
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
