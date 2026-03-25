import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVoters, updateVoter, getCalls, createCall, createGrievance } from '../../api';
import { 
  Phone, PhoneOff, PhoneMissed, UserCircle, ArrowUpCircle, ArrowDownCircle, 
  MinusCircle, AlertTriangle, CheckCircle, Search, RefreshCw, BarChart3,
  Users, Calendar, ChevronRight, X, PhoneCall, MessageSquare
} from 'lucide-react';

const SENTIMENT_STYLES = {
  positive: { 
    bg: 'bg-emerald-500/10', 
    text: 'text-emerald-500', 
    border: 'border-emerald-500/20',
    icon: ArrowUpCircle 
  },
  neutral: { 
    bg: 'bg-primary/10', 
    text: 'text-primary', 
    border: 'border-primary/20',
    icon: MinusCircle 
  },
  negative: { 
    bg: 'bg-rose-500/10', 
    text: 'text-rose-500', 
    border: 'border-rose-500/20',
    icon: ArrowDownCircle 
  },
};

const CALL_STATUS_ICONS = { 
  answered: Phone, 
  no_answer: PhoneMissed, 
  pending: PhoneOff 
};

export default function PannaDashboard({ currentUser, boothId }) {
  const [voters, setVoters] = useState([]);
  const [calls, setCalls] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('voters');
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
      setVoters(v);
      setCalls(c);
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
    <div data-testid="panna-dashboard" className="animate-fade-up">
      {/* Analytics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Voters', value: stats.total, icon: Users, color: 'text-primary' },
          { label: 'Positive Bias', value: stats.positive, icon: ArrowUpCircle, color: 'text-emerald-600' },
          { label: 'Calls (7D)', value: stats.callsThisWeek, icon: PhoneCall, color: 'text-saffron' },
          { label: 'Response Rate', value: `${stats.responseRate}%`, icon: BarChart3, color: 'text-purple-600' },
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

      {/* Navigation & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
        <div className="flex p-1 rounded-xl bg-white border border-gold/10 shadow-sm">
          {['voters', 'calls'].map(t => (
            <button key={t} data-testid={`panna-tab-${t}`}
              onClick={() => setTab(t)}
              className={`px-8 py-2.5 rounded-lg text-[10px] font-mono font-black uppercase tracking-[0.2em] transition-all ${
                tab === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-navy/40 hover:text-navy'
              }`}>
              {t} {t === 'voters' ? `(${voters.length})` : `(${calls.length})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" />
            <input data-testid="voter-search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Operational Search..."
              className="pl-12 pr-6 py-3 rounded-xl bg-white border border-gold/20 text-[10px] font-mono font-bold uppercase tracking-widest text-navy focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none w-[280px] transition-all placeholder:text-navy/20" />
          </div>
          
          <button onClick={loadData} data-testid="panna-refresh" 
            className="p-3 rounded-xl bg-white border border-gold/10 text-primary hover:bg-gold/5 transition-all active:scale-95 shadow-md">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {tab === 'voters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-navy/40 font-mono text-[10px] uppercase tracking-[0.3em]">Decoding Field Intel...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-20 bg-white border border-dashed border-gold/20 rounded-2xl text-center shadow-sm">
              <p className="text-navy/20 font-mono text-[10px] uppercase tracking-[0.3em]">No personnel records found in this sector</p>
            </div>
          ) : filtered.slice(0, 50).map((voter, idx) => {
            const s = SENTIMENT_STYLES[voter.sentiment] || SENTIMENT_STYLES.neutral;
            const SIcon = s.icon;
            return (
              <motion.div key={voter.id} data-testid={`voter-card-${voter.id}`}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className="bg-white p-6 rounded-2xl border border-gold/10 hover:border-primary/30 transition-all group shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/5 to-transparent pointer-events-none" />
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-gold/5 border border-gold/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <UserCircle size={28} className="text-primary/40 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-serif font-black text-lg text-navy group-hover:text-primary transition-colors">{voter.name}</h4>
                      <p className="text-[10px] font-mono font-bold text-navy/40 uppercase tracking-widest">{voter.phone} | {voter.segment}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${s.bg} ${s.border} ${s.text}`}>
                    <SIcon size={14} />
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest">{voter.sentiment}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-6 border-t border-gold/10 relative z-10">
                  <div className="flex gap-1">
                    {['positive', 'neutral', 'negative'].map(sent => (
                      <button key={sent} data-testid={`sentiment-${sent}-${voter.id}`}
                        onClick={() => handleSentimentUpdate(voter.id, sent)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase tracking-tighter transition-all border ${
                          voter.sentiment === sent
                            ? 'bg-primary border-primary text-white'
                            : 'bg-gold/5 border-gold/10 text-navy/30 hover:bg-gold/10 hover:text-navy'
                        }`}>
                        {sent.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  
                  <div className="ml-auto flex gap-2">
                    <button data-testid={`call-voter-${voter.id}`}
                      onClick={() => setCallModal(voter)}
                      className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                      <Phone size={16} />
                    </button>
                    <button data-testid={`report-issue-${voter.id}`}
                      onClick={() => setGrievanceModal(voter)}
                      className="p-3 rounded-xl bg-saffron/10 border border-saffron/20 text-saffron hover:bg-saffron hover:text-white transition-all">
                      <AlertTriangle size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {tab === 'calls' && (
        <div className="space-y-4">
          {calls.length === 0 ? (
            <div className="py-20 bg-white border border-dashed border-gold/20 rounded-2xl text-center shadow-sm">
              <p className="text-navy/20 font-mono text-[10px] uppercase tracking-[0.3em]">No field communications logged</p>
            </div>
          ) : calls.map((call, idx) => {
            const CIcon = CALL_STATUS_ICONS[call.status] || Phone;
            const s = SENTIMENT_STYLES[call.sentiment] || SENTIMENT_STYLES.neutral;
            return (
              <motion.div key={call.id} data-testid={`call-entry-${call.id}`}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                className="bg-white p-5 rounded-2xl border border-gold/10 flex items-center gap-6 group hover:border-primary/20 transition-all shadow-sm">
                <div className={`size-12 rounded-xl flex items-center justify-center bg-gold/5 border border-gold/10 shadow-inner ${call.status === 'answered' ? 'text-emerald-500' : 'text-rose-500'}`}>
                   <CIcon size={20} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-serif font-black text-navy">{call.voter_name}</h4>
                    <span className="text-[10px] font-mono text-navy/20">{new Date(call.created_at).toLocaleTimeString()} · {new Date(call.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-mono font-black uppercase tracking-widest ${call.status === 'answered' ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                      {call.status.replace('_', ' ')}
                    </span>
                    {call.sentiment && (
                      <span className={`text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1 ${s.text}`}>
                        <s.icon size={10} /> {call.sentiment}
                      </span>
                    )}
                  </div>
                  {call.notes && <p className="mt-3 text-[11px] text-navy/60 bg-gold/5 p-3 rounded-xl border border-gold/10 italic">"{call.notes}"</p>}
                </div>
                
                <ChevronRight size={16} className="text-navy/10 group-hover:text-primary transition-colors" />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Call Modal */}
      <AnimatePresence>
        {callModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCallModal(null)} className="absolute inset-0 bg-navy/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-3xl w-full max-w-lg border border-gold/20 relative z-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-serif font-black text-navy uppercase tracking-tight">Log Intelligence</h3>
                  <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.2em]">{callModal.name} · {callModal.phone}</p>
                </div>
                <button onClick={() => setCallModal(null)} className="p-2 rounded-xl bg-gold/10 text-navy/40 hover:text-navy transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest mb-3 block">Operational Status</label>
                  <div className="flex gap-2">
                    {['answered', 'no_answer'].map(s => (
                      <button key={s} data-testid={`call-status-${s}`}
                        onClick={() => setCallStatus(s)}
                        className={`flex-1 py-4 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition-all border ${
                          callStatus === s ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-gold/5 border-gold/10 text-navy/40 hover:bg-gold/10'
                        }`}>{s.replace('_', ' ')}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest mb-3 block">Field Notes</label>
                  <textarea data-testid="call-notes-input" value={callNotes} onChange={e => setCallNotes(e.target.value)}
                    rows={4} placeholder="Operational findings and observations..."
                    className="w-full p-4 rounded-xl bg-gold/5 border border-gold/10 text-navy font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none placeholder:text-navy/20" />
                </div>

                <div className="flex gap-4 pt-4">
                  <button data-testid="call-cancel-btn" onClick={() => { setCallModal(null); setCallNotes(''); }}
                    className="flex-1 py-4 rounded-xl border border-gold/10 text-[10px] font-mono font-black uppercase tracking-widest text-navy/40 hover:bg-gold/5 transition-all">
                    Abort
                  </button>
                  <button data-testid="call-submit-btn" onClick={handleLogCall} disabled={submitting}
                    className="flex-[2] py-4 rounded-xl bg-primary text-white text-[10px] font-mono font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-primary/20 transition-all disabled:opacity-50">
                    {submitting ? 'Transmitting...' : 'Commit to Matrix'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grievance Modal */}
      <AnimatePresence>
        {grievanceModal && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setGrievanceModal(null)} className="absolute inset-0 bg-navy/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-3xl w-full max-w-lg border border-gold/20 relative z-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8 text-saffron">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-saffron/10 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif font-black text-navy uppercase tracking-tight">Vector Inefficiency</h3>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-saffron">Case File: {grievanceModal.name}</p>
                  </div>
                </div>
                <button onClick={() => setGrievanceModal(null)} className="p-2 rounded-xl bg-gold/10 text-navy/40 hover:text-navy transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest mb-3 block">Inefficiency Category</label>
                  <div className="relative group">
                    <select data-testid="grievance-category-select" value={grievanceCat} onChange={e => setGrievanceCat(e.target.value)}
                      className="w-full appearance-none p-4 rounded-xl bg-gold/5 border border-gold/10 text-xs text-navy font-mono font-bold uppercase tracking-widest focus:ring-2 focus:ring-saffron/20 outline-none cursor-pointer">
                      <option value="">Matrix Optimization (AI)</option>
                      {['infrastructure', 'utilities', 'healthcare', 'security', 'logistics', 'education'].map(cat => (
                        <option key={cat} value={cat}>{`${cat}`}</option>
                      ))}
                    </select>
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-saffron/40" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono font-black text-navy/40 uppercase tracking-widest mb-3 block">Inefficiency Description</label>
                  <textarea data-testid="grievance-desc-input" value={grievanceDesc} onChange={e => setGrievanceDesc(e.target.value)}
                    rows={4} placeholder="Detail the operational breakdown..."
                    className="w-full p-4 rounded-xl bg-gold/5 border border-gold/10 text-navy font-medium focus:ring-2 focus:ring-saffron/20 outline-none resize-none placeholder:text-navy/20" />
                </div>

                <div className="flex gap-4 pt-4">
                  <button data-testid="grievance-cancel-btn" onClick={() => { setGrievanceModal(null); setGrievanceDesc(''); }}
                    className="flex-1 py-4 rounded-xl border border-gold/10 text-[10px] font-mono font-black uppercase tracking-widest text-navy/40 hover:bg-gold/5 transition-all">
                    Abort
                  </button>
                  <button data-testid="grievance-submit-btn" onClick={handleCreateGrievance} disabled={submitting || !grievanceDesc.trim()}
                    className="flex-[2] py-4 rounded-xl bg-saffron text-white text-[10px] font-mono font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-saffron/20 transition-all disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Register Inefficiency'}
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
