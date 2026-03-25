import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGrievances, updateGrievance, getUsersByRole } from '../../api';
import { 
  AlertCircle, CheckCircle2, Clock, UserPlus, RefreshCw, 
  ChevronRight, Filter, Search, X, ShieldAlert, BadgeCheck,
  TrendingDown, TrendingUp, Zap, Clock4, Calendar, UserCircle
} from 'lucide-react';

const STATUS_CONFIG = {
  submitted: { 
    label: 'New Dispatch', 
    bg: 'bg-saffron/10', 
    text: 'text-saffron', 
    border: 'border-saffron/20',
    icon: ShieldAlert 
  },
  assigned: { 
    label: 'Assigned', 
    bg: 'bg-blue-500/10', 
    text: 'text-blue-500', 
    border: 'border-blue-500/20',
    icon: UserPlus 
  },
  in_progress: { 
    label: 'Active', 
    bg: 'bg-primary/10', 
    text: 'text-primary', 
    border: 'border-primary/20',
    icon: Clock 
  },
  resolved: { 
    label: 'Neutralized', 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-500', 
    border: 'border-emerald-500/20',
    icon: BadgeCheck 
  },
};

const CATEGORY_STYLES = {
  water: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  road: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  electricity: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  sanitation: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  healthcare: 'bg-rose-400/10 text-rose-400 border-rose-400/20',
  education: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
  other: 'bg-slate-400/10 text-slate-400 border-slate-400/20'
};

export default function AdminDashboard({ currentUser, boothId }) {
  const [grievances, setGrievances] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [assignModal, setAssignModal] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [g, w] = await Promise.all([
        getGrievances({ booth_id: boothId }),
        getUsersByRole('worker')
      ]);
      setGrievances(g);
      setWorkers(w);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [boothId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAssign = async () => {
    if (!assignModal || !selectedWorker) return;
    setSubmitting(true);
    try {
      await updateGrievance({
        id: assignModal.id,
        assigned_worker: selectedWorker,
        status: 'assigned'
      });
      setAssignModal(null);
      setSelectedWorker('');
      loadData();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const filtered = filter === 'all' ? grievances : grievances.filter(g => g.status === filter);

  const stats = {
    new: grievances.filter(g => g.status === 'submitted').length,
    active: grievances.filter(g => ['assigned', 'in_progress'].includes(g.status)).length,
    resolved: grievances.filter(g => g.status === 'resolved').length,
    avgSLA: grievances.length > 0 ? '4.2h' : '0h' // Simulated SLA
  };

  return (
    <div data-testid="admin-dashboard" className="p-0"> {/* Removed overlay-breaking animation */}
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Unassigned', value: stats.new, icon: ShieldAlert, color: 'text-saffron', filter: 'submitted' },
          { label: 'In Mission', value: stats.active, icon: Zap, color: 'text-primary', filter: 'in_progress' },
          { label: 'Completed', value: stats.resolved, icon: BadgeCheck, color: 'text-emerald-600', filter: 'resolved' },
          { label: 'Mean SLA', value: stats.avgSLA, icon: Clock4, color: 'text-purple-600', filter: 'all' },
        ].map((s, idx) => (
          <button key={idx} onClick={() => setFilter(s.filter === filter ? 'all' : s.filter)}
            className={`glass-panel p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
              filter === s.filter ? 'border-primary ring-1 ring-primary/20' : 'border-gold/10 hover:border-gold/30'
            }`}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-gold/5 to-transparent" />
            <div className="flex items-center gap-3 mb-2">
              <s.icon size={16} className={s.color} />
              <span className="text-[10px] font-mono font-black uppercase tracking-[0.2em] text-navy/40">{s.label}</span>
            </div>
            <p className="text-2xl font-serif font-black text-navy">{s.value}</p>
          </button>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8 pb-6 border-b border-gold/10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Filter size={18} />
          </div>
          <h3 className="text-xl font-serif font-black text-navy">
            Operational Feed <span className="text-primary opacity-60 ml-2 font-mono text-sm tracking-tighter">/ {filter.toUpperCase()}</span>
          </h3>
        </div>
 
        <div className="flex items-center gap-4">
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} 
              className="text-[10px] font-mono font-black uppercase tracking-widest text-primary hover:text-navy transition-colors">
              Reset Filters
            </button>
          )}
          <button onClick={loadData} data-testid="admin-refresh" 
            className="p-3 rounded-xl bg-white/60 border border-gold/10 text-primary hover:bg-white transition-all active:scale-95 shadow-md">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Mission List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-navy/40 font-mono text-[10px] uppercase tracking-[0.3em]">Synchronizing Registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 glass-panel rounded-2xl border-dashed border-gold/10 text-center">
            <p className="text-navy/20 font-mono text-[10px] uppercase tracking-[0.3em]">Sector registry is currently clear</p>
          </div>
        ) : filtered.map((grievance, idx) => {
          const s = STATUS_CONFIG[grievance.status] || STATUS_CONFIG.submitted;
          const SIcon = s.icon;
          const catStyle = CATEGORY_STYLES[grievance.category] || CATEGORY_STYLES.other;
          
          return (
            <motion.div key={grievance.id} data-testid={`grievance-card-${grievance.id}`}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
              className="glass-panel p-6 rounded-2xl border border-gold/10 hover:border-primary/30 transition-all group flex flex-col md:flex-row gap-6">
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <div className={`px-3 py-1 rounded-lg border text-[9px] font-mono font-black uppercase tracking-widest ${catStyle}`}>
                    {grievance.category || 'UNDEFINED'}
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${s.bg} ${s.border} ${s.text}`}>
                    <SIcon size={12} />
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest">{s.label}</span>
                  </div>
                  {grievance.sentiment && (
                    <div className={`px-2 py-0.5 rounded-md text-[8px] font-mono font-bold uppercase tracking-tighter ${
                      grievance.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-600' :
                      grievance.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-black/5 text-navy/40'
                    }`}>
                      {grievance.sentiment} Analysis
                    </div>
                  )}
                </div>
 
                <p className="text-navy font-serif text-lg leading-relaxed mb-4 group-hover:text-primary transition-colors">
                  {grievance.description}
                </p>
 
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-navy/40">
                  <span className="flex items-center gap-1.5"><RefreshCw size={10} /> ID: #{grievance.id}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={10} /> {new Date(grievance.created_at).toLocaleDateString()}</span>
                  <div className="h-3 w-px bg-gold/20 hidden md:block" />
                  <span className="flex items-center gap-1.5 flex-1">
                    <UserCircle size={10} className="text-primary/60" />
                    {grievance.assigned_worker ? (
                      <span className="text-emerald-600 font-black">Worker Assigned: {grievance.assigned_worker}</span>
                    ) : (
                      <span className="text-saffron font-black">Awaiting Deployment</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex md:flex-col justify-end gap-3 pt-4 md:pt-0">
                {grievance.status !== 'resolved' && (
                  <button data-testid={`assign-btn-${grievance.id}`}
                    onClick={() => { console.log('Deploy clicked', grievance); setAssignModal(grievance); setSelectedWorker(''); }}
                    className="px-6 py-3 rounded-xl bg-primary text-white text-[10px] font-mono font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/10 transition-all flex items-center justify-center gap-3">
                    <UserPlus size={14} /> {grievance.assigned_worker ? 'Reassign' : 'Deploy'}
                  </button>
                )}
                <button className="p-3 rounded-xl bg-white/60 border border-gold/10 text-navy/40 hover:text-navy transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAssignModal(null)} className="absolute inset-0 bg-navy/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel p-8 rounded-3xl w-full max-w-lg border border-gold/20 relative z-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-serif font-black text-navy">Personnel Deployment</h3>
                  <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.2em]">Record #{assignModal.id}</p>
                </div>
                <button onClick={() => setAssignModal(null)} className="p-2 rounded-xl bg-black/5 text-navy/40 hover:text-navy transition-colors">
                  <X size={20} />
                </button>
              </div>
 
              <div className="bg-gold/5 border border-gold/10 p-4 rounded-xl mb-8 italic text-navy/60 text-xs">
                "{assignModal.description?.slice(0, 100)}..."
              </div>
 
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest mb-3 block">Operational Operator</label>
                  <div className="relative group">
                    <select data-testid="worker-select" value={selectedWorker} onChange={e => setSelectedWorker(e.target.value)}
                      className="w-full appearance-none p-4 rounded-xl bg-white border border-gold/10 text-xs text-navy font-mono font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer">
                      <option value="">Awaiting Selection...</option>
                      {workers.map(w => (
                        <option key={w.id} value={w.id}>{`${w.name} (Booth ${w.booth_id})`}</option>
                      ))}
                    </select>
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-primary/40" />
                  </div>
                </div>
 
                <div className="flex gap-4 pt-4">
                  <button data-testid="assign-cancel-btn" onClick={() => setAssignModal(null)}
                    className="flex-1 py-4 rounded-xl border border-gold/10 text-[10px] font-mono font-black uppercase tracking-widest text-navy/40 hover:bg-black/5 transition-all">
                    Abort
                  </button>
                  <button data-testid="assign-confirm-btn" onClick={handleAssign} disabled={!selectedWorker || submitting}
                    className="flex-[2] py-4 rounded-xl bg-primary text-white text-[10px] font-mono font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                    {submitting ? 'Transmitting...' : 'Commit Assignment'}
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
