import { useState, useEffect, useCallback } from 'react';
import { createGrievance, getGrievances, getAnalytics, getUsersByRole } from '../../api';
import { 
  Send, Search, Clock, CheckCircle2, AlertCircle, RefreshCw, FileText, 
  User, Phone, MapPin, Tag, ChevronRight, Bot, ShieldCheck, 
  Construction, LayoutDashboard, ScrollText, Map as MapIcon, 
  Activity, ExternalLink, Mail, ArrowRight, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_STYLES = {
  submitted: { label: 'Registered', icon: AlertCircle, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  assigned: { label: 'Assigned', icon: User, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
  in_progress: { label: 'Processing', icon: Clock, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
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
  const [analytics, setAnalytics] = useState(null);
  const [team, setTeam] = useState([]);

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [grievanceData, analyticsData, workers, adhyakshs] = await Promise.all([
        getGrievances({ booth_id: boothId }),
        getAnalytics(boothId),
        getUsersByRole('worker'),
        getUsersByRole('booth-adhyaksh')
      ]);
      setGrievances(grievanceData);
      setAnalytics(analyticsData);
      // Filter team by boothId if available in user object
      const boothWorkers = workers.filter(w => w.booth_id === boothId || !w.booth_id);
      const boothAdhyaksh = adhyakshs.filter(a => a.booth_id === boothId || !a.booth_id);
      setTeam([...boothAdhyaksh, ...boothWorkers].slice(0, 4));
    } catch (e) { console.error("Error fetching citizen data:", e); }
    setLoading(false);
  }, [boothId]);

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
        voter_name: voterName || currentUser?.name || 'Authorized Citizen',
        booth_id: boothId
      });
      setSubmitted(result);
      setDescription('');
      setCategory('');
      setVoterName('');
      fetchData(); // Refresh list after submission
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const QuickStats = () => {
    const activeGrievances = grievances.filter(g => g.status !== 'resolved').length;
    const stats = [
      { label: 'Electoral Unit', value: boothId || 'B-001', icon: MapPin, color: 'text-primary' },
      { label: 'Pending Cases', value: activeGrievances, icon: AlertCircle, color: 'text-saffron' },
      { label: 'Active Schemes', value: 12, icon: ScrollText, color: 'text-primary' },
      { label: 'Infra Projects', value: 4, icon: Construction, color: 'text-green-400' },
    ];

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white border border-gold/10 rounded-xl p-5 relative overflow-hidden group shadow-sm">
            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${s.color.replace('text', 'from')} to-transparent opacity-30`} />
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-navy/40 mb-2">{s.label}</p>
                <p className="text-2xl font-serif font-black text-navy">{s.value}</p>
              </div>
              <s.icon className={`${s.color} opacity-40 group-hover:opacity-100 transition-opacity`} size={18} />
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const AILayer = () => (
    <div className="bg-white border border-gold/10 rounded-2xl p-8 mb-10 relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
        <Bot size={150} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-primary font-bold">Official Governance Insight</span>
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-navy mb-4 tracking-tight">Institutional Operations Analysis</h3>
        <p className="text-sm text-navy/70 leading-relaxed max-w-3xl">
          Deployment telemetry indicates that infrastructure initiatives within Sector {boothId || 'B-001'} have achieved a 15% optimization in service delivery precision. Authorized resource allocation remains focused on high-priority sanitation and power-grid stabilization.
        </p>
        <div className="mt-8 pt-6 border-t border-gold/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={16} className="text-emerald-500" />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-navy/40">Verified Institutional Source</p>
          </div>
          <p className="font-mono text-[9px] text-navy/20 tracking-widest uppercase">Protocol: BTQ_SECURE_V3</p>
        </div>
      </div>
    </div>
  );

  return (
    <div data-testid="citizen-dashboard" className="animate-fade-up max-w-7xl mx-auto px-4 lg:px-0">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-gold/10 pb-8">
        <div>
          <h1 className="text-4xl font-serif font-bold text-navy tracking-tight mb-2">Citizen Portal</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Authorized Access: {(currentUser?.name || "Authorized Citizen").toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-4 bg-white/60 p-4 rounded-xl border border-gold/10 shadow-sm">
          <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Star className="text-primary" size={18} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-mono uppercase tracking-widest text-navy/40 leading-none mb-1">Sector Credentials</p>
            <p className="text-sm font-bold font-mono text-navy">EPIC-{boothId || 'UNA'}-5502</p>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex flex-wrap gap-2 mb-10">
        {[
          { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { key: 'submit', label: 'File Report', icon: Send },
          { key: 'track', label: 'Tracking', icon: Search },
          { key: 'schemes', label: 'My Schemes', icon: ScrollText },
          { key: 'updates', label: 'Area Updates', icon: MapIcon },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-6 py-3 rounded-xl text-xs font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-3 border ${
              tab === t.key 
                ? 'bg-primary text-white border-primary font-black shadow-[0_4px_15px_rgba(201,168,76,0.3)]' 
                : 'bg-white/40 text-navy/50 border-gold/10 hover:bg-white hover:text-navy shadow-sm'
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'dashboard' && (
          <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <AILayer />
                <QuickStats />
                
                {/* Team Section */}
                <div className="mb-10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif text-xl font-bold text-navy uppercase tracking-tight italic">Support Personnel</h3>
                    <div className="h-px flex-1 mx-6 bg-gradient-to-r from-gold/20 to-transparent" />
                    <p className="font-mono text-[9px] uppercase tracking-widest text-navy/30">Sector Response Unit</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {team.length > 0 ? team.map(member => (
                      <div key={member.id} className="bg-white border border-gold/10 rounded-xl p-4 flex items-center gap-4 hover:border-primary/40 transition-colors group shadow-sm">
                        <div className="size-12 rounded bg-gold/10 border border-gold/10 flex items-center justify-center text-primary font-serif font-black group-hover:bg-primary group-hover:text-white transition-all">
                          {member.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-navy text-sm uppercase tracking-tight truncate">{member.name}</p>
                          <p className="font-mono text-[9px] text-navy/40 uppercase tracking-widest mt-0.5">{member.role?.replace('-', ' ') || 'Personnel'}</p>
                        </div>
                        <a href={`tel:${member.phone || '#'}`} className="size-9 rounded-lg bg-gold/5 border border-gold/10 flex items-center justify-center text-navy/60 hover:bg-primary hover:text-white transition-all active:scale-90">
                          <Phone size={14} />
                        </a>
                      </div>
                    )) : (
                      <div className="col-span-2 text-center py-10 bg-white border border-dashed border-gold/20 rounded-xl">
                        <p className="text-[10px] font-mono text-navy/30 uppercase tracking-[0.3em]">Personnel Assignment Pending</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Health Score */}
                  <div className="bg-white border border-gold/10 rounded-2xl p-7 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02]">
                      <Activity size={80} />
                    </div>
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h4 className="font-serif font-bold text-navy uppercase tracking-tight">Performance Metrics</h4>
                        <p className="font-mono text-[10px] tracking-widest text-navy/30 mt-1 uppercase">Institutional Precision</p>
                      </div>
                      <div className="size-10 rounded bg-gold/10 border border-gold/10 flex items-center justify-center text-primary">
                        <Activity size={16} />
                      </div>
                    </div>
                    <div className="space-y-6">
                      {[
                        { label: 'Service Delivery Index', value: 85, color: '#c9a84c' },
                        { label: 'Resolution Accuracy', value: 92, color: '#10b981' },
                        { label: 'Resource Saturation', value: 74, color: '#3B82F6' },
                      ].map(m => (
                        <div key={m.label}>
                          <div className="flex justify-between text-[10px] font-mono uppercase tracking-widest mb-2">
                            <span className="text-navy/40">{m.label}</span>
                            <span className="text-navy font-bold">{m.value}%</span>
                          </div>
                          <div className="h-1 bg-gold/10 rounded-full overflow-hidden border border-gold/5">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 1.5 }}
                              className="h-full" style={{ backgroundColor: m.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestone Tracker */}
                  <div className="bg-white border border-gold/10 rounded-2xl p-7 shadow-sm">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h4 className="font-serif font-bold text-navy uppercase tracking-tight">Milestone Tracker</h4>
                        <p className="font-mono text-[10px] tracking-widest text-navy/30 mt-1 uppercase">Infra Verification</p>
                      </div>
                      <div className="size-10 rounded bg-gold/10 border border-gold/10 flex items-center justify-center text-emerald-600">
                        <Construction size={16} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {[
                        { title: 'Main Road Stabilization', status: 'Completed', date: 'Mar 12', icon: Construction },
                        { title: 'Ward 4 Smart Lighting', status: 'In Transit', date: 'Mar 25', icon: Activity },
                        { title: 'Sector Water Filtration', status: 'Active', date: 'Apr 02', icon: RefreshCw },
                      ].map((p, i) => (
                        <div key={p.title} className="flex items-center gap-4 p-3 rounded-lg bg-gold/5 border border-gold/5 hover:bg-gold/10 transition-all">
                          <div className="size-8 rounded bg-white border border-gold/10 flex items-center justify-center text-navy/40">
                            <p.icon size={12} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono font-bold text-navy uppercase truncate">{p.title}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[8px] font-mono text-navy/40 uppercase tracking-widest italic">{p.status}</span>
                              <div className="size-1 rounded-full bg-navy/10" />
                              <span className="text-[8px] font-mono text-navy/40 uppercase tracking-widest">{p.date}</span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-navy/10" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar: Terminals */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-gold/10 rounded-2xl p-7 relative overflow-hidden h-full shadow-sm">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                    <ShieldCheck size={120} />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-navy uppercase tracking-tight mb-8">Service Terminals</h3>
                  <div className="space-y-3 relative z-10">
                    {[
                      { label: 'File Grievance', desc: 'Secure report entry protocol', icon: Send, tab: 'submit' },
                      { label: 'Track Inquiries', desc: 'Case fulfillment monitor', icon: Search, tab: 'track' },
                      { label: 'My Entitlements', desc: 'Verify scheme eligibility', icon: ScrollText, tab: 'schemes' },
                      { label: 'Zonal Map', desc: 'Infrastructure geospatial data', icon: MapIcon, tab: 'updates' },
                    ].map(a => (
                      <button key={a.label} onClick={() => setTab(a.tab)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-gold/10 bg-gold/5 hover:bg-white hover:shadow-md hover:border-primary/30 transition-all group text-left">
                        <div className="size-10 rounded bg-white shadow-sm flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                          <a.icon size={18} />
                        </div>
                        <div>
                          <p className="font-mono text-[10px] font-bold text-navy uppercase tracking-widest">{a.label}</p>
                          <p className="text-[9px] text-navy/40 uppercase tracking-tighter mt-0.5">{a.desc}</p>
                        </div>
                        <ArrowRight size={14} className="ml-auto text-navy/20 group-hover:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                  
                  {/* Emergency Contact */}
                  <div className="mt-8 p-6 rounded-xl bg-saffron/10 border border-saffron/20 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <AlertCircle size={40} />
                    </div>
                    <p className="font-serif font-black text-saffron uppercase italic text-lg tracking-tight mb-1">Emergency Protocol</p>
                    <p className="text-[10px] font-mono text-saffron/80 uppercase tracking-widest mb-4">Direct Civilian Assistance</p>
                    <a href="tel:112" className="flex items-center gap-3 text-navy font-mono font-black text-2xl group-hover:tracking-widest transition-all">
                      <Phone size={24} className="text-saffron" /> 112
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {tab === 'submit' && (
          <motion.div key="submit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="max-w-2xl bg-white border border-gold/10 rounded-2xl p-8 relative overflow-hidden group mx-auto shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-saffron to-transparent opacity-50" />
              
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div key="success" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    data-testid="submit-success" className="text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <CheckCircle2 size={40} className="text-primary" />
                    </div>
                    <h3 className="font-serif font-bold text-3xl text-navy mb-4">Grievance Logged</h3>
                    <div className="bg-gold/5 rounded-lg p-6 mb-8 border border-gold/10 inline-block min-w-[300px] shadow-inner text-left">
                      <p className="text-primary font-mono text-xs uppercase tracking-[0.2em] mb-2 opacity-60">Filing Sequence</p>
                      <p className="text-2xl font-mono font-bold text-navy tracking-widest mb-4 border-b border-gold/10 pb-4">BTQ-{String(submitted.id).slice(0,8).toUpperCase()}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-navy/40 mb-1">Sector Unit</p>
                          <p className="text-xs font-bold font-mono text-navy/90">{boothId}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-navy/40 mb-1">Category</p>
                          <p className="text-xs font-bold font-mono text-saffron uppercase tracking-widest">{submitted.category}</p>
                        </div>
                      </div>
                    </div>
                    <br />
                    <button data-testid="submit-another-btn" onClick={() => setSubmitted(null)}
                      className="px-8 py-3 rounded-xl border border-gold/10 bg-gold/5 text-navy/60 text-sm font-bold hover:bg-gold/10 hover:border-primary/40 transition-all shadow-sm">
                      File New Report
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div>
                      <h3 className="font-serif font-bold text-2xl text-navy mb-2 italic">Operational Report</h3>
                      <p className="text-navy/50 text-sm">Submit your documentation for localized infrastructure resolution.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-navy/40 mb-3 block italic font-bold">Reporter Designation</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
                            <input data-testid="citizen-name-input" value={voterName} onChange={e => setVoterName(e.target.value)}
                              placeholder="Your Name (Optional)"
                              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gold/5 border border-gold/10 text-navy text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all shadow-sm" />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-navy/40 mb-3 block italic font-bold">Problem Classification</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['Water', 'Road', 'Power', 'Health', 'Waste', 'General'].map(c => (
                              <button key={c} onClick={() => setCategory(c)}
                                className={`p-3 rounded-xl border text-[10px] font-mono uppercase tracking-widest transition-all ${
                                  category === c
                                    ? 'bg-primary border-primary text-white font-black shadow-md'
                                    : 'bg-white/40 border-gold/10 text-navy/40 hover:border-gold/30 hover:bg-white shadow-sm'
                                }`}>
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-[0.2em] text-navy/40 mb-3 block italic font-bold">Situation Narrative *</label>
                          <textarea data-testid="citizen-description-input" value={description} onChange={e => setDescription(e.target.value)}
                            rows={6} placeholder="Provide precise details of the observed discrepancy..."
                            className="w-full p-4 rounded-xl bg-gold/5 border border-gold/10 text-navy text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none resize-none transition-all placeholder:text-navy/20 shadow-sm" />
                        </div>
                      </div>
                    </div>

                    <button data-testid="citizen-submit-btn" onClick={handleSubmit} disabled={submitting || !description.trim()}
                      className="w-full py-4 rounded-xl bg-primary text-white text-sm font-black uppercase tracking-[0.3em] shadow-md hover:bg-gold-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                      <Send size={18} /> {submitting ? 'TRANSMITTING...' : 'INITIALIZE PROTOCOL'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {tab === 'track' && (
          <motion.div key="track" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-serif font-bold text-2xl text-navy tracking-tight italic">Active Inquiries</h3>
                <p className="text-navy/40 text-xs font-mono uppercase tracking-widest mt-1">Found {grievances.length} documented cases</p>
              </div>
              <button onClick={fetchData} data-testid="citizen-refresh" 
                className="p-3 rounded-xl bg-white border border-gold/10 text-navy/60 hover:text-primary hover:border-primary/40 transition-all shadow-md active:scale-95">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="grid gap-6">
              {loading ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-navy/30 font-mono text-[10px] uppercase tracking-widest italic">Accessing Secure Archives...</p>
                </div>
              ) : grievances.length === 0 ? (
                <div className="text-center py-24 bg-white border border-dashed border-gold/20 rounded-2xl flex flex-col items-center shadow-sm">
                  <div className="size-16 rounded-full bg-gold/5 flex items-center justify-center mb-6 text-navy/10">
                    <FileText size={40} />
                  </div>
                  <p className="text-navy/40 font-mono text-xs uppercase tracking-[0.3em] italic">No localized data available</p>
                </div>
              ) : grievances.map((g, idx) => {
                const s = STATUS_STYLES[g.status] || STATUS_STYLES.submitted;
                const SIcon = s.icon;
                const progress = g.status === 'resolved' ? 100 : g.status === 'in_progress' ? 66 : g.status === 'assigned' ? 33 : 10;
                
                return (
                  <motion.div key={g.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                    data-testid={`citizen-grievance-${g.id}`}
                    className="bg-white border border-gold/10 rounded-2xl p-6 hover:border-primary/30 transition-all group relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/5 to-transparent pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-[10px] font-bold text-navy/40 tracking-tighter uppercase px-2 py-1 rounded bg-gold/5 border border-gold/10 text-xs">BTQ-{String(g.id).slice(0,8).toUpperCase()}</span>
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono tracking-widest uppercase font-black"
                            style={{ borderColor: s.border, color: s.color, backgroundColor: s.bg }}>
                            <SIcon size={10} /> {s.label}
                          </div>
                          <span className="px-3 py-1 rounded bg-gold/5 border border-gold/10 text-[10px] font-mono tracking-[0.2em] text-saffron uppercase font-bold">{g.category}</span>
                        </div>
                        
                        <p className="text-navy/90 text-sm leading-relaxed font-medium italic">" {g.description} "</p>
                        
                        <div className="flex items-center gap-6 pt-2">
                          <div className="flex items-center gap-2 text-navy/40">
                            <Clock size={12} className="text-primary/40" />
                            <span className="text-[10px] font-mono uppercase tracking-widest">{new Date(g.created_at).toLocaleDateString()}</span>
                          </div>
                          {g.assigned_worker && (
                            <div className="flex items-center gap-2 text-navy/40 px-3 py-1 bg-gold/5 rounded-lg border border-gold/10">
                              <User size={12} className="text-primary/40" />
                              <span className="text-[10px] font-mono uppercase tracking-widest">Handler: {g.assigned_worker}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-full md:w-48 space-y-3">
                        <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.2em] text-navy/40 font-bold">
                          <span>Fulfillment</span>
                          <span className="text-primary">{progress}%</span>
                        </div>
                        <div className="h-1 bg-gold/10 rounded-full overflow-hidden border border-gold/5">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }}
                            className="h-full bg-gradient-to-r from-primary via-gold to-saffron" />
                        </div>
                        {g.resolution_note && (
                          <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-emerald-400 leading-relaxed font-mono italic">
                            REPLY: {g.resolution_note}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {tab === 'schemes' && (
          <motion.div key="schemes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center bg-white border border-dashed border-gold/20 rounded-2xl shadow-sm">
            <ScrollText size={48} className="mx-auto mb-6 text-navy/10" />
            <p className="text-navy font-mono text-lg uppercase tracking-[0.3em] font-black italic">Entitlement Database</p>
            <p className="text-navy/30 font-mono text-xs uppercase tracking-widest mt-2 italic">Institutional verification required for access</p>
          </motion.div>
        )}

        {tab === 'updates' && (
          <motion.div key="updates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center bg-white border border-dashed border-gold/20 rounded-2xl shadow-sm">
            <MapIcon size={48} className="mx-auto mb-6 text-navy/10" />
            <p className="text-navy font-mono text-lg uppercase tracking-[0.3em] font-black italic">Geospatial Intelligence</p>
            <p className="text-navy/30 font-mono text-xs uppercase tracking-widest mt-2 italic">Rendering sector-specific structural data...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
