import { useState, useEffect, useCallback } from 'react';
import { createGrievance, getGrievances, getAnalytics, getUsersByRole, getSchemes, applyForScheme, getApplications, getVoterServices } from '../../api';
import { 
  Send, RefreshCw, User, MapPin, ChevronRight, 
  Calendar, CheckCircle2, Clock, Activity, AlertCircle,
  FileText, Search, PlusCircle, ExternalLink, Info, BadgeCheck
} from 'lucide-react';
import NotificationBell from '../ui/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-components (Ported from Booth IQ) ---

const QuickStats = ({ stats, loading, boothId }) => {
  const statItems = [
    { value: boothId || "—", label: "BOOTH ID", icon: "hub", color: "var(--gold)" },
    { value: loading ? "…" : String(stats?.pending_issues || 0), label: "OPEN GRIEVANCES", icon: "emergency_home", color: "#d64045" },
    { value: loading ? "…" : String(stats?.total_calls || 0), label: "TOTAL CALLS", icon: "call", color: "var(--gold)" },
    { value: loading ? "…" : String(stats?.resolved_issues || 0), label: "RESOLVED", icon: "verified_user", color: "#10b981" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-10">
      {statItems.map((s, i) => (
        <motion.div 
          key={s.label} 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: i * 0.1 }}
          className="bg-white shadow-sm border border-slate-200 rounded p-4 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
          <div className="flex justify-between items-start">
            <div>
              <p className="font-mono text-[10px] tracking-[2px] uppercase text-slate-700/60 mb-2">{s.label}</p>
              <p className="font-serif text-2xl font-bold text-slate-700 leading-none">{s.value}</p>
            </div>
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: s.color + "18", border: `1px solid ${s.color}30` }}>
              <span className="material-symbols-outlined text-sm text-[#1e293b]">{s.icon}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const AIGovernanceFeed = ({ insights, loading }) => {
  return (
    <div className="bg-white shadow-sm border border-slate-200 rounded p-8 relative overflow-hidden group mb-10">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-transparent" />
      <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
        <span className="material-symbols-outlined text-9xl text-navy">account_balance</span>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-[10px] tracking-[2.5px] uppercase text-slate-700/60">Official Governance Report</span>
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
        </div>
        
        <h3 className="font-serif text-2xl font-bold text-slate-700 mb-4 tracking-tight uppercase">Institutional Operations Analysis</h3>
        
        {loading ? (
          <div className="space-y-3 py-2">
            <div className="h-3 bg-slate-50 rounded-sm w-full animate-pulse" />
            <div className="h-3 bg-slate-50 rounded-sm w-3/4 animate-pulse" />
          </div>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {insights?.[0] || "Institutional analysis confirms that targeted infrastructure interventions have achieved measurable improvements in localized service delivery."}
          </p>
        )}
        
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <p className="font-mono text-[10px] tracking-[2.5px] uppercase text-slate-700/60">VERIFIED SOURCE</p>
            <span className="material-symbols-outlined text-emerald-500 text-sm">verified_user</span>
          </div>
          <p className="font-mono text-[10px] tracking-[1px] text-slate-500">BOOTH_ENCRYPTED_PROTOCOL_V1</p>
        </div>
      </div>
    </div>
  );
};

const YourBoothTeam = ({ workers, admin }) => {
  const team = admin ? [admin, ...workers] : workers;
  
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-serif text-lg font-bold text-slate-700 uppercase tracking-tight">Support Personnel</h3>
        <p className="font-mono text-[10px] tracking-[2.5px] uppercase text-slate-700/60">Verification Officers</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {team.length === 0 ? (
          <div className="col-span-full bg-slate-50 rounded border border-dashed border-slate-200 p-8 text-center text-slate-400">
             <p className="font-mono text-[10px] uppercase tracking-widest">Awaiting Officer Assignment</p>
          </div>
        ) : team.slice(0, 4).map((w, i) => (
          <div key={w.id || i} className="bg-white rounded border border-slate-200 p-4 shadow-sm flex items-center gap-4 transition-all hover:border-[#c9a84c]/30 group">
            <div className="size-10 rounded bg-[#1e293b] flex items-center justify-center text-[#c9a84c] text-sm font-serif font-black shadow-sm shrink-0">
              {w.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-700 text-sm tracking-tight truncate uppercase">{w.name || 'Booth Officer'}</h4>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest leading-none">{w.role?.replace(/_/g, ' ') || 'Personnel'}</p>
                <div className="size-1 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="size-8 rounded bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100 group-hover:bg-[#1e293b] group-hover:text-[#c9a84c] transition-all">
              <span className="material-symbols-outlined text-sm font-bold">call</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const BoothHealthScore = ({ stats, boothId }) => {
  const resolutionRate = stats?.total_issues > 0 ? Math.round((stats.resolved_issues / stats.total_issues) * 100) : 0;
  
  const bars = [
    { label: "SERVICE DELIVERY INDEX", value: resolutionRate, color: "var(--gold)" },
    { label: "INSTITUTIONAL PRECISION", value: resolutionRate > 0 ? 92 : 0, color: "var(--navy)" },
    { label: "SCHEME SATURATION RATE", value: resolutionRate > 0 ? 72 : 0, color: "#10b981" },
  ];

  return (
    <div className="bg-white shadow-sm border border-slate-200 rounded p-8 relative overflow-hidden h-full">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#c9a84c] to-transparent" />
      <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
        <span className="material-symbols-outlined text-9xl text-[#1e293b]">analytics</span>
      </div>
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h3 className="font-serif text-xl font-bold text-slate-700 uppercase tracking-tight">Performance Metrics</h3>
          <p className="font-mono text-[10px] tracking-[2.5px] uppercase text-slate-700/60 mt-1">Operational Sector #{boothId}</p>
        </div>
        <div className="size-10 rounded flex items-center justify-center bg-slate-50 text-navy border border-slate-100">
          <span className="material-symbols-outlined text-sm">monitoring</span>
        </div>
      </div>
      
      <div className="space-y-6 relative z-10">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex justify-between font-mono text-[9px] tracking-[1.5px] uppercase mb-2">
              <span className="text-slate-600 underline decoration-slate-200 decoration-dotted underline-offset-4">{b.label}</span>
              <span className="text-slate-700 font-bold">{b.value}%</span>
            </div>
            <div className="h-[4px] bg-slate-50 rounded-sm overflow-hidden border border-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${b.value}%` }}
                transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                className="h-full rounded-sm"
                style={{ backgroundColor: b.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---

export default function CitizenDashboard({ currentUser, boothId }) {
  const [tab, setTab] = useState('dashboard');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [grievances, setGrievances] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [voterServices, setVoterServices] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [applying, setApplying] = useState(null);

  const safeBoothId = parseInt(boothId) || 17;

  const fetchData = useCallback(async () => {
    if (!safeBoothId) return;
    setLoading(true);
    try {
      const [gData, aData, wData, admData, sData, appData, vsData] = await Promise.all([
        getGrievances({ booth_id: safeBoothId }),
        getAnalytics(safeBoothId),
        getUsersByRole('worker'),
        getUsersByRole('admin'),
        getSchemes(),
        currentUser?.id ? getApplications(currentUser.id) : Promise.resolve([]),
        getVoterServices()
      ]);
      
      setGrievances(gData || []);
      setAnalytics(aData);
      setWorkers(wData?.filter(w => w.booth_id === safeBoothId) || []);
      setAdmin(admData?.find(a => a.booth_id === safeBoothId) || null);
      setSchemes(sData || []);
      setApplications(appData || []);
      setVoterServices(vsData || []);
    } catch (e) { 
      console.error("Sync error:", e); 
    }
    setLoading(false);
  }, [safeBoothId, currentUser?.id]);

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
        voter_name: currentUser?.name || `Citizen-${safeBoothId}`,
        booth_id: safeBoothId
      });
      setSubmitted(result);
      setDescription('');
      setCategory('');
      fetchData();
    } catch (e) { console.error(e); }
    setSubmitting(false);
    };

    const handleApplyScheme = async (schemeId) => {
      if (!currentUser?.id) return;
      const scheme = schemes.find(s => s.id === schemeId);
      setApplying(schemeId);
      try {
        await applyForScheme({
          voter_id: currentUser.id,
          scheme_id: schemeId,
          booth_id: safeBoothId
        });
        fetchData();
        
        // After successful application, provide choice to go to official portal
        if (scheme?.official_link && scheme.official_link !== '#') {
          if (window.confirm(`Application logged in BoothIQ. Would you like to complete the final steps on the official ${scheme.name} portal?`)) {
            window.open(scheme.official_link, '_blank');
          }
        }
      } catch (e) {
        console.error("Application error:", e);
      }
      setApplying(null);
    };

    const STATUS_CONFIG = {
    submitted: { label: 'Registered', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100 border-amber-200' },
    assigned: { label: 'Personnel Deployed', icon: User, color: 'text-blue-600', bg: 'bg-blue-100 border-blue-200' },
    in_progress: { label: 'Active Intervention', icon: Activity, color: 'text-[#c9a84c]', bg: 'bg-orange-50 border-orange-200' },
    resolved: { label: 'Mission Accomplished', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 border-emerald-200' },
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] bg-grid-slate-100/[0.1] relative">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-black text-slate-900 tracking-tight leading-none mb-1">Citizen Portal</h1>
            <p className="font-mono text-[10px] tracking-[3px] uppercase text-slate-500">Authorized Access: {currentUser?.name || "Citizen"}</p>
          </div>
          <div className="flex items-center gap-4">
             <NotificationBell />
             <button onClick={fetchData} className="size-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-primary transition-all">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
             </button>
             <div className="bg-white px-4 py-2 rounded border border-slate-200 shadow-sm flex items-center gap-3">
                <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="font-mono text-[10px] font-bold text-slate-700 tracking-tighter">BOOTH #{safeBoothId} ONLINE</span>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Main Content Areas */}
          <div className="lg:col-span-8 space-y-10">
            {tab === 'dashboard' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <AIGovernanceFeed insights={analytics?.insights} loading={loading} />
                
                <YourBoothTeam workers={workers} admin={admin} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <BoothHealthScore stats={analytics} boothId={safeBoothId} />
                  
                  {/* Milestone Tracker (Static for now) */}
                  <div className="bg-white shadow-sm border border-slate-200 rounded p-8 relative overflow-hidden h-full">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-transparent" />
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                      <span className="material-symbols-outlined text-9xl text-navy">architecture</span>
                    </div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-slate-700 uppercase tracking-tight">Milestone Tracker</h3>
                        <p className="font-mono text-[10px] tracking-[2.5px] uppercase text-slate-700/60 mt-1">Infrastructure Verification</p>
                      </div>
                      <div className="size-10 rounded flex items-center justify-center bg-slate-50 text-navy border border-slate-100">
                        <span className="material-symbols-outlined text-sm">verified</span>
                      </div>
                    </div>
                    <div className="space-y-5 relative z-10">
                      {[
                        { label: "Community Lighting", progress: 85, status: "Active" },
                        { label: "Water Filtration Unit", progress: 100, status: "Completed" },
                        { label: "Sector Road Renovation", progress: 40, status: "In Progress" },
                      ].map((p, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[10px] font-bold text-slate-700 uppercase tracking-tight">{p.label}</span>
                            <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-widest border ${p.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                              {p.status}
                            </span>
                          </div>
                          <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} className={`h-full ${p.status === 'Completed' ? 'bg-emerald-500' : 'bg-primary'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Registry Feed */}
                <div className="mt-16">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif text-2xl font-bold text-slate-900 tracking-tight uppercase">Registry Feed</h3>
                    <p className="font-mono text-[10px] tracking-[2.5px] uppercase text-slate-500">{grievances.length} INCIDENTS LOGGED</p>
                  </div>
                  <div className="space-y-4">
                    {grievances.length === 0 ? (
                      <div className="py-20 text-center border border-dashed border-slate-200 rounded-2xl">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">No active incidents detected in this sector</p>
                      </div>
                    ) : grievances.map((g, idx) => {
                      const config = STATUS_CONFIG[g.status] || STATUS_CONFIG.submitted;
                      return (
                        <motion.div key={g.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                          className="bg-white border border-slate-200 p-5 rounded-xl flex items-center gap-5 group hover:border-primary/40 transition-all shadow-sm">
                          <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                            <config.icon size={22} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                               <span className="text-[10px] font-mono font-bold uppercase tracking-tight px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-500">
                                 REF: #{g.id}
                               </span>
                               <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                                 {config.label}
                               </span>
                            </div>
                            <h4 className="text-base font-bold text-slate-900 truncate uppercase tracking-tight mb-1">{g.description}</h4>
                            <div className="flex items-center gap-4">
                               <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <MapPin size={12} className="text-primary" /> SECTOR {g.booth_id}
                               </p>
                               <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Calendar size={12} className="text-primary" /> {new Date(g.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                               </p>
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-slate-200 group-hover:text-primary transition-colors" />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : tab === 'report' ? (
              <div className="max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-200 p-10 rounded-2xl shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-primary" />
                  <div className="text-center mb-10">
                    <div className="size-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-6 shadow-sm">
                      <Send size={28} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-serif font-black text-slate-900 mb-2 uppercase tracking-tight">Report Incident</h2>
                    <p className="text-sm text-slate-500 font-medium tracking-tight">Direct institutional uplink to Booth Command and Field Staff</p>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-mono font-black uppercase text-primary mb-4 block tracking-widest underline decoration-2 underline-offset-4">Sector Category</label>
                      <div className="flex flex-wrap gap-2">
                        {['Water', 'Road', 'Electricity', 'Sanitation', 'Healthcare', 'Other'].map(cat => (
                          <button key={cat} onClick={() => setCategory(cat)}
                            className={`px-5 py-2.5 rounded border text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
                              category === cat ? 'bg-navy border-navy text-primary shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-primary/40'
                            }`}>
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono font-black uppercase text-primary mb-4 block tracking-widest underline decoration-2 underline-offset-4">Operational Detail</label>
                      <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide precise location coordinates and incident parameters..."
                        className="w-full p-5 bg-slate-50 rounded-xl border border-slate-200 focus:border-primary outline-none text-sm font-medium transition-all h-40 resize-none font-sans" />
                    </div>

                    <button onClick={handleSubmit} disabled={!description || submitting}
                      className="w-full py-5 bg-navy text-primary rounded-xl font-mono font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4">
                      {submitting ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <><Send size={18} /> TRANSMIT TO COMMAND</>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            ) : tab === 'voter-services' ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div>
                  <h2 className="text-3xl font-serif font-black text-slate-900 uppercase tracking-tight">Voter Services</h2>
                  <p className="text-sm text-slate-500 font-medium">Official documentation and certification portal</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {voterServices.map((s) => (
                    <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-primary/40 transition-all group">
                      <div className="size-12 rounded-xl bg-slate-50 flex items-center justify-center text-navy mb-6 group-hover:bg-navy group-hover:text-primary transition-all">
                        <span className="material-symbols-outlined">{s.icon}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-2">{s.name}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">{s.desc}</p>
                      <p className="text-[10px] text-slate-400 italic mb-6">{s.more_info}</p>
                      
                      <button 
                        onClick={() => s.official_link !== '#' && window.open(s.official_link, '_blank')}
                        className={`text-[10px] font-mono font-black uppercase tracking-widest flex items-center gap-2 hover:underline ${s.official_link === '#' ? 'text-slate-300 cursor-not-allowed' : 'text-primary'}`}
                      >
                        {s.official_link === '#' ? 'Service Pending' : 'Initialize Protocol'} <ExternalLink size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-serif font-black text-slate-900 uppercase tracking-tight">Government Schemes</h2>
                    <p className="text-sm text-slate-500 font-medium">Verified welfare programs and institutional support</p>
                  </div>
                  <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                    <BadgeCheck className="text-emerald-600" size={18} />
                    <span className="text-[10px] font-mono font-black text-emerald-700 uppercase tracking-widest">Citizen Eligibility Active</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {schemes.map((scheme) => {
                    const isApplied = applications.some(a => a.scheme_id === scheme.id);
                    return (
                      <div key={scheme.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-primary/40 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                          <FileText size={60} className="text-navy" />
                        </div>
                        <div className="flex items-start justify-between mb-6">
                          <span className="px-3 py-1 bg-slate-50 border border-slate-100 rounded text-[9px] font-mono font-black text-slate-500 uppercase tracking-widest">
                            {scheme.category}
                          </span>
                          {isApplied && (
                            <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded text-[9px] font-mono font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                              <CheckCircle2 size={10} /> Applied
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">{scheme.name}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">{scheme.desc}</p>
                        
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                          <button 
                            onClick={() => handleApplyScheme(scheme.id)}
                            disabled={isApplied || applying === scheme.id}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                              isApplied ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-navy text-primary hover:bg-slate-800 active:scale-[0.98]'
                            }`}
                          >
                            {applying === scheme.id ? <RefreshCw className="animate-spin" size={14} /> : isApplied ? 'Registered' : <PlusCircle size={14} />}
                            {isApplied ? 'Application Logged' : 'Initialize Application'}
                          </button>
                          <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:text-primary transition-all border border-slate-100">
                            <Info size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {applications.length > 0 && (
                  <div className="mt-16">
                    <h3 className="font-serif text-2xl font-bold text-slate-900 tracking-tight uppercase mb-6">Active Applications</h3>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 font-mono text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <tr>
                            <th className="px-6 py-4">Reference</th>
                            <th className="px-6 py-4">Scheme</th>
                            <th className="px-6 py-4">Applied Date</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {applications.map((app) => (
                            <tr key={app.id} className="text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-mono text-[10px] text-slate-400">#{app.id.slice(0, 8)}</td>
                              <td className="px-6 py-4 font-bold uppercase tracking-tight">{schemes.find(s => s.id === app.scheme_id)?.name}</td>
                              <td className="px-6 py-4">{new Date(app.applied_at).toLocaleDateString()}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-md font-mono text-[9px] font-black uppercase tracking-widest">
                                  {app.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Sidebar / Quick Actions */}
          <div className="lg:col-span-4 space-y-10">
            <QuickStats stats={analytics} loading={loading} boothId={safeBoothId} />
            
            <div className="bg-white rounded border border-slate-200 p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.02]">
                    <span className="material-symbols-outlined text-8xl text-navy">terminal</span>
                </div>
                <h3 className="font-serif text-lg font-bold text-slate-700 uppercase tracking-tight mb-8">Service Terminals</h3>
                <div className="grid grid-cols-1 gap-4 relative z-10">
                    {[
                        { label: "Executive Monitor", id: 'dashboard', icon: "monitoring" },
                        { label: "Incident Reporter", id: 'report', icon: "report_problem" },
                        { label: "Voter Services", id: 'voter-services', icon: "assignment" },
                        { label: "Verified Schemes", id: 'schemes', icon: "description" },
                    ].map((a) => (
                        <button
                            key={a.label}
                            onClick={() => setTab(a.id)}
                            className={`flex items-center gap-4 p-4 rounded border transition-all hover:bg-navy hover:text-primary group ${tab === a.id ? 'bg-navy border-navy text-primary' : 'bg-slate-50 border-slate-100 text-slate-700'}`}
                        >
                            <div className="size-10 rounded bg-white/10 flex items-center justify-center group-hover:bg-primary/20">
                                <span className="material-symbols-outlined text-xl">{a.icon}</span>
                            </div>
                            <span className="font-mono text-[10px] font-bold uppercase tracking-widest">{a.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Upcoming Events (Static Port) */}
            <div className="animate-fade-up">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="font-serif text-lg font-bold text-slate-700 uppercase tracking-tight">Outreach Schedule</h3>
                    <p className="font-mono text-[10px] tracking-[2.5px] uppercase text-slate-700/60">Institutional Agenda</p>
                </div>
                <div className="space-y-4">
                    {[
                        { name: "Public Grievance Meet", date: "28 MAR", icon: "campaign", type: "High Priority" },
                        { name: "Scheme Awareness Drive", date: "02 APR", icon: "event", type: "Community" }
                    ].map((e, i) => (
                        <div key={i} className="bg-white rounded border border-slate-200 p-4 shadow-sm flex items-center gap-4 transition-all cursor-pointer hover:border-primary/30 group">
                            <div className="shrink-0 text-center bg-slate-50 rounded p-2 w-14 group-hover:bg-navy transition-colors border border-slate-100">
                                <p className="text-[10px] font-mono font-bold text-slate-500 uppercase leading-none mb-1 group-hover:text-slate-300">{e.date.split(' ')[1]}</p>
                                <p className="text-lg font-serif font-black text-navy leading-tight group-hover:text-primary">{e.date.split(' ')[0]}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm text-slate-700 truncate group-hover:text-slate-900 transition-colors uppercase tracking-tight">{e.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest leading-none">SECTOR #{safeBoothId}</p>
                                    <div className="size-1 rounded-full bg-emerald-500" />
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-slate-200 text-sm group-hover:text-primary">arrow_forward</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {submitted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-10 max-w-sm w-full text-center border-t-8 border-[#10b981] shadow-2xl">
              <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-serif font-black text-slate-900 mb-2 uppercase tracking-tight">Mission Logged</h3>
              <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">Report successfully recorded in Central Command. Personnel deployment sequence initiated.</p>
              <button onClick={() => { setSubmitted(null); setTab('dashboard'); }}
                className="w-full py-4 bg-navy text-primary rounded-xl font-mono font-black uppercase tracking-widest shadow-lg hover:brightness-110 transition-all">
                DISMISS PROTOCOL
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
