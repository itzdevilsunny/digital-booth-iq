import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { getGrievances, updateGrievance, getUsersByRole } from '../../api';
import { 
  Shield, Users, AlertCircle, CheckCircle, Clock, 
  MapPin, User, Search, Filter, RefreshCw, X,
  ChevronRight, Activity, TrendingUp, Info
} from 'lucide-react';

const STATUS_CONFIG = {
  submitted: { label: 'Awaiting Deployment', bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20', icon: AlertCircle },
  assigned: { label: 'Assigned', bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20', icon: Clock },
  in_progress: { label: 'Active Mission', bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', icon: Activity },
  resolved: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', icon: CheckCircle },
};

const CATEGORY_STYLES = {
  Water: 'bg-blue-50 border-blue-200 text-blue-700',
  Electricity: 'bg-amber-50 border-amber-200 text-amber-700',
  Infrastructure: 'bg-slate-50 border-slate-200 text-slate-700',
  Medical: 'bg-rose-50 border-rose-200 text-rose-700',
  other: 'bg-gray-50 border-gray-200 text-gray-700'
};

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
    } catch (e) {
      console.error('Core sync failed:', e);
    }
    setLoading(false);
  }, [safeBoothId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAssign = async () => {
    if (!assignModal || !selectedWorker) return;
    setSubmitting(true);
    try {
      const worker = workers.find(w => w.id.toString() === selectedWorker.toString());
      // CRITICAL: Explicitly cast ID to string to prevent 422 errors
      await updateGrievance({
        id: String(assignModal.id),
        status: 'assigned',
        assigned_to: String(selectedWorker),
        assigned_worker: worker?.name || 'Assigned Personnel'
      });
      setAssignModal(null);
      setSelectedWorker('');
      loadData();
    } catch (e) {
      console.error('Deployment failed:', e);
    }
    setSubmitting(false);
  };

  const filtered = grievances.filter(g => {
    if (filter === 'all') return true;
    if (filter === 'open') return g.status === 'submitted';
    return g.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#f0ece3] bg-grid-pattern pb-24">
      {/* Universal Header */}
      <header className="glass-panel sticky top-0 z-[50] border-b border-[#c9a84c]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-navy rounded-xl shadow-lg shadow-navy/20">
                <Shield size={20} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-navy tracking-tight">Intelligence Unit</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-[#c9a84c] font-bold">Sector {safeBoothId} Command Center</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <button onClick={loadData} className="p-2 hover:bg-black/5 rounded-full transition-colors relative">
                 <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
               </button>
               <div className="h-8 w-px bg-gold/20" />
               <div className="flex items-center gap-2">
                 <div className="text-right hidden sm:block">
                   <p className="text-xs font-bold text-navy">Booth Adhyaksh</p>
                   <p className="text-[9px] text-[#c9a84c] font-black uppercase">Active Duty</p>
                 </div>
                 <div className="size-10 rounded-full bg-white border border-gold/20 flex items-center justify-center font-serif font-black text-navy shadow-sm">
                   BA
                 </div>
               </div>
            </div>
          </div>
        </div>
      </header>

      <main className="page-container mt-8 px-4">
        {/* Metric Overview */}
        <div className="dashboard-grid mb-10">
          {[
            { label: 'Deployment Pending', value: grievances.filter(g => g.status === 'submitted').length, icon: AlertCircle, color: 'text-amber-500' },
            { label: 'Active Missions', value: grievances.filter(g => g.status === 'assigned' || g.status === 'in_progress').length, icon: Activity, color: 'text-primary' },
            { label: 'Neutralized', value: grievances.filter(g => g.status === 'resolved').length, icon: CheckCircle, color: 'text-emerald-500' },
            { label: 'Personnel Ready', value: workers.length, icon: Users, color: 'text-blue-500' }
          ].map((m, i) => (
            <div key={i} className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <m.icon size={48} />
              </div>
              <p className="text-[10px] font-mono font-black uppercase tracking-widest text-navy/40 mb-2">{m.label}</p>
              <p className={`text-4xl font-serif font-black ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Tactical Filter Bar */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 scrollbar-hide">
           <div className="flex items-center gap-2 min-w-max">
             {['all', 'open', 'assigned', 'resolved'].map(f => (
               <button key={f} onClick={() => setFilter(f)}
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition-all border ${
                   filter === f ? 'bg-navy border-navy text-white shadow-xl' : 'bg-white/50 border-gold/10 text-navy/40 hover:border-[#c9a84c]'
                 }`}>
                 {f === 'open' ? 'Awaiting deployment' : f}
               </button>
             ))}
           </div>
        </div>

        {/* Mission Registry List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center glass-panel rounded-3xl">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-[10px] font-mono font-black uppercase tracking-widest text-[#c9a84c]">Syncing Field Data...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center glass-panel rounded-3xl border-dashed">
              <p className="text-[10px] font-mono font-black uppercase tracking-widest text-navy/20">Sector registry is currently clear</p>
            </div>
          ) : filtered.map((grievance, idx) => {
            const config = STATUS_CONFIG[grievance.status] || STATUS_CONFIG.submitted;
            const isSubmitted = grievance.status === 'submitted';
            
            return (
              <motion.div key={grievance.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                className="glass-panel p-5 md:p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 group hover:border-primary/40 transition-all">
                <div className={`p-4 rounded-2xl ${config.bg} ${config.text} shrink-0`}>
                  <config.icon size={24} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-mono font-black uppercase tracking-widest ${CATEGORY_STYLES[grievance.category] || CATEGORY_STYLES.other}`}>
                      {grievance.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-mono font-black uppercase tracking-widest ${config.bg} ${config.text} ${config.border}`}>
                      {config.label}
                    </span>
                  </div>
                  <h4 className="text-lg font-serif font-bold text-navy mb-1 truncate group-hover:text-primary transition-colors">
                    {grievance.description}
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono font-bold text-navy/40 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><User size={10} /> {grievance.voter_name}</span>
                    <span className="flex items-center gap-1"><MapPin size={10} /> Booth #{grievance.booth_id}</span>
                    {grievance.assigned_worker && (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold"><CheckCircle size={10} /> Staff: {grievance.assigned_worker}</span>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-auto flex justify-end">
                  {isSubmitted ? (
                    <button onClick={() => setAssignModal(grievance)}
                      className="w-full md:w-auto px-6 py-3 bg-navy text-white rounded-xl text-[10px] font-mono font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95 flex items-center gap-2">
                      <Shield size={14} /> Deploy Staff
                    </button>
                  ) : (
                    <div className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center gap-2 text-[10px] font-mono font-black uppercase font-bold border border-emerald-500/20">
                      <CheckCircle size={14} /> Operational
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Deployment Portal */}
      {createPortal(
        <AnimatePresence>
          {assignModal && (
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setAssignModal(null)}
                className="absolute inset-0 bg-navy/40 backdrop-blur-sm" />
              
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative w-full max-w-lg bg-[#f0ece3] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border-t sm:border border-[#c9a84c]/20">
                <div className="p-6 md:p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-serif font-black text-navy mb-1 uppercase tracking-tight">Deploy Personnel</h4>
                      <p className="text-[10px] font-mono font-black uppercase tracking-widest text-[#c9a84c]">Mission ID: #{assignModal.id}</p>
                    </div>
                    <button onClick={() => setAssignModal(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                      <X size={20} className="text-navy/40" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 bg-white/50 rounded-2xl border border-gold/10">
                      <p className="text-[9px] font-mono font-black uppercase text-navy/40 mb-2">Selected Incident</p>
                      <p className="text-sm font-serif font-bold text-navy leading-relaxed">{assignModal.description}</p>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-black uppercase text-[#c9a84c] mb-3 block">Deployment Target</label>
                      <select value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}
                        className="w-full p-4 bg-white rounded-2xl border-2 border-gold/10 focus:border-primary outline-none text-sm font-bold transition-all appearance-none cursor-pointer">
                        <option value="">Select Field Staff...</option>
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>{w.name} (Unit ID: {w.id})</option>
                        ))}
                      </select>
                    </div>

                    <button onClick={handleAssign} disabled={!selectedWorker || submitting}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-mono font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                      {submitting ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <><Shield size={18} /> Transmit Deployment Order</>
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
