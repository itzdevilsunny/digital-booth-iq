import { useState, useEffect, useCallback } from 'react';
import { createGrievance, getGrievances } from '../../api';
import { 
  Send, Clock, CheckCircle2, AlertCircle, RefreshCw, 
  User, MapPin, ChevronRight, Activity, Calendar, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
  submitted: { label: 'Registered', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  assigned: { label: 'Deployed', icon: User, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  in_progress: { label: 'Active', icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
};

export default function CitizenDashboard({ currentUser, boothId }) {
  const [tab, setTab] = useState('dashboard');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [voterName, setVoterName] = useState('');
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const safeBoothId = parseInt(boothId) || 17;

  const fetchData = useCallback(async () => {
    if (!safeBoothId) return;
    setLoading(true);
    try {
      const data = await getGrievances({ booth_id: safeBoothId });
      setGrievances(data || []);
    } catch (e) { console.error("Sync error:", e); }
    setLoading(false);
  }, [safeBoothId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const result = await createGrievance({
        description,
        category: category || 'General',
        voter_name: voterName || currentUser?.name || `Citizen-${safeBoothId}`,
        booth_id: safeBoothId
      });
      setSubmitted(result);
      setDescription('');
      setCategory('');
      fetchData();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f0ece3] bg-grid-pattern pb-24">
      <header className="glass-panel sticky top-0 z-40 border-b border-[#c9a84c]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl shadow-lg">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-navy tracking-tight">Citizen Portal</h1>
                <p className="text-[9px] uppercase tracking-[0.2em] text-primary font-bold">Booth #{safeBoothId} Services</p>
              </div>
            </div>
            <button onClick={fetchData} className="p-2 hover:bg-black/5 rounded-full transition-colors relative">
               <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <main className="page-container p-4">
        <div className="flex p-1 bg-white/50 rounded-2xl border border-gold/10 mb-8 max-w-sm">
          {[
            { id: 'dashboard', label: 'Monitor', icon: Clock },
            { id: 'report', label: 'Report', icon: Send },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition-all ${
                tab === t.id ? 'bg-primary text-white shadow-lg' : 'text-navy/40 hover:text-navy'
              }`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'dashboard' ? (
          <div className="space-y-6">
            <div className="dashboard-grid">
              <div className="glass-panel p-5 rounded-2xl">
                <p className="text-[10px] font-mono font-black uppercase tracking-widest text-navy/40 mb-1">Your Submissions</p>
                <p className="text-2xl font-serif font-black text-navy">{grievances.length}</p>
              </div>
              <div className="glass-panel p-5 rounded-2xl">
                <p className="text-[10px] font-mono font-black uppercase tracking-widest text-navy/40 mb-1">Active Resolution</p>
                <p className="text-2xl font-serif font-black text-primary">{grievances.filter(g => g.status !== 'resolved').length}</p>
              </div>
            </div>

            <h3 className="text-xl font-serif font-black text-navy mt-10 mb-4">Registry Feed</h3>
            <div className="space-y-4">
              {grievances.length === 0 ? (
                <div className="py-20 text-center glass-panel rounded-3xl border-dashed">
                  <p className="text-[10px] font-mono font-black uppercase tracking-widest text-navy/20">No reports found for this sector</p>
                </div>
              ) : grievances.map((g, idx) => {
                const config = STATUS_CONFIG[g.status] || STATUS_CONFIG.submitted;
                return (
                  <motion.div key={g.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    className="glass-panel p-5 rounded-2xl flex items-center gap-5 group hover:border-primary/40 transition-all">
                    <div className={`p-4 rounded-xl ${config.bg} ${config.color} shrink-0`}>
                      <config.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 bg-white border border-gold/10 rounded-md">
                           #{g.id}
                         </span>
                         <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${config.bg} ${config.color}`}>
                           {config.label}
                         </span>
                      </div>
                      <h4 className="text-base font-serif font-bold text-navy truncate">{g.description}</h4>
                      <p className="text-[9px] font-mono font-bold text-navy/40 uppercase tracking-wider flex items-center gap-4">
                        <span className="flex items-center gap-1"><MapPin size={10} /> Sector {g.booth_id}</span>
                        <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(g.created_at || Date.now()).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <ChevronRight size={18} className="text-navy/20 group-hover:text-primary transition-colors hidden sm:block" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-8 rounded-3xl bg-white/70">
              <div className="text-center mb-10">
                <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Send size={28} className="text-primary" />
                </div>
                <h2 className="text-3xl font-serif font-black text-navy mb-2">Report Incident</h2>
                <p className="text-sm text-navy/50 font-medium tracking-tight">Direct line to Booth Command and Field Staff</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-mono font-black uppercase text-primary mb-3 block">Sector Category</label>
                  <div className="flex flex-wrap gap-2">
                    {['Water', 'Electricity', 'Infrastructure', 'Medical', 'Other'].map(cat => (
                      <button key={cat} onClick={() => setCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-mono font-black uppercase tracking-tight transition-all border ${
                          category === cat ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-gold/10 text-navy/40 hover:border-primary/40'
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-black uppercase text-primary mb-3 block">Operational Detail</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide precise location and incident parameters..."
                    className="w-full p-4 bg-white rounded-2xl border-2 border-gold/10 focus:border-primary outline-none text-sm font-medium transition-all h-32 resize-none" />
                </div>

                <button onClick={handleSubmit} disabled={!description || submitting}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-mono font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                  {submitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <><Send size={18} /> Transmit Report</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      <AnimatePresence>
        {submitted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-navy/40 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-10 max-w-sm w-full text-center border-t-8 border-emerald-500 shadow-2xl">
              <div className="size-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-serif font-black text-navy mb-2 uppercase tracking-tight">Mission Logged</h3>
              <p className="text-sm text-navy/50 font-medium mb-8 leading-relaxed">Report successfully recorded in Central Command. Personnel deployment initiated.</p>
              <button onClick={() => { setSubmitted(null); setTab('dashboard'); }}
                className="w-full py-4 bg-navy text-white rounded-2xl font-mono font-black uppercase tracking-widest shadow-lg hover:bg-emerald-600 transition-all">
                Dismiss Portal
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
