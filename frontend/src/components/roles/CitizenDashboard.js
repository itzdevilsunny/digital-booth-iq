import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createGrievance, getGrievances, getAnalytics, getUsersByRole, getSchemes, applyForScheme, getApplications, getVoterServices } from '../../api';
import { 
  Send, RefreshCw, User, MapPin, ChevronRight,
  Calendar, CheckCircle2, Activity, AlertCircle,
  FileText, ExternalLink, BadgeCheck,
  Briefcase, Phone, MessageSquare, Shield, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatbot from './AIChatbot';

// --- Simple Sub-components ---

const StatCard = ({ label, value, icon: Icon, color, delay }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all group relative overflow-hidden"
    >
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon size={48} />
        </div>
        <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-white/40">{label}</p>
            <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
        </div>
        <div className="mt-4 flex items-center gap-2">
            <div className={`size-1.5 rounded-full animate-pulse`} style={{ backgroundColor: color }} />
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">Status: Matrix Active</span>
        </div>
    </motion.div>
);

const InsightsBanner = ({ insights, loading }) => (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald-600 p-8 md:p-12 text-white shadow-2xl shadow-emerald-600/20 group">
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                    <span className="px-4 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-[2px] text-white border border-white/20">
                        AI Matrix Synthesis
                    </span>
                    <div className="size-1.5 rounded-full bg-white animate-pulse" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-4 leading-[0.9] tracking-tighter">
                    Booth Efficiency <br />Optimization
                </h2>
                {loading ? (
                    <div className="space-y-3 opacity-20">
                        <div className="h-2 bg-white rounded w-full animate-pulse" />
                        <div className="h-2 bg-white rounded w-3/4 animate-pulse" />
                    </div>
                ) : (
                    <p className="text-emerald-50 text-sm md:text-lg leading-relaxed max-w-xl font-medium">
                        {insights?.[0] || "Synthesizing local intelligence... Matrix performance is within nominal parameters."}
                    </p>
                )}
            </div>
            
            <div className="shrink-0 flex items-center gap-5 bg-black/10 p-8 rounded-[2rem] border border-white/10 backdrop-blur-xl">
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[3px] text-emerald-200 font-bold mb-1">Source</p>
                    <p className="text-sm font-mono font-black">BIQ_CORE_v2</p>
                </div>
                <div className="size-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center border border-white/20 shadow-xl">
                    <Shield size={28} />
                </div>
            </div>
        </div>
    </div>
);

const ServiceGrid = ({ items, onSelect, activeTab }) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((item) => (
            <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex flex-col items-center justify-center p-8 rounded-[2rem] border transition-all gap-5 group hover:scale-[1.02] active:scale-95 ${
                    activeTab === item.id 
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-2xl shadow-emerald-500/20' 
                    : 'bg-white/5 border-white/5 text-stone-400 hover:border-emerald-500/30 shadow-sm'
                }`}
            >
                <div className={`size-14 rounded-2xl flex items-center justify-center transition-all ${
                    activeTab === item.id ? 'bg-white/10' : 'bg-white/5 group-hover:bg-emerald-500/10'
                }`}>
                    <item.icon size={28} strokeWidth={2.5} className={activeTab === item.id ? 'text-white' : 'text-stone-500 group-hover:text-emerald-400'} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[2px] text-center">{item.label}</span>
            </button>
        ))}
    </div>
);

// --- Main Component ---

export default function CitizenDashboard({ currentUser, boothId }) {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Map URL paths to tab states
    const getTabFromPath = (path) => {
        if (path.includes('/report')) return 'report';
        if (path.includes('/voter-services')) return 'voter-services';
        if (path.includes('/schemes')) return 'schemes';
        return 'dashboard';
    };

    const [tab, setTab] = useState(getTabFromPath(location.pathname));

    // Update tab when location changes (from sidebar)
    useEffect(() => {
        setTab(getTabFromPath(location.pathname));
    }, [location.pathname]);

    // Update URL when tab changes (from internal grid)
    const handleTabChange = (newTab) => {
        setTab(newTab);
        if (newTab === 'dashboard') navigate('/citizen');
        else navigate(`/citizen/${newTab}`);
    };

    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [grievances, setGrievances] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [schemes, setSchemes] = useState([]);
    const [voterServices, setVoterServices] = useState([]);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(null);
    const [applying, setApplying] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [admin, setAdmin] = useState(null);

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
        const scheme = schemes.find(s => s.id === schemeId);
        setApplying(schemeId);
        try {
            await applyForScheme({
                voter_id: currentUser.id || 'dummy-citizen',
                scheme_id: schemeId,
                booth_id: safeBoothId
            });
            fetchData();
            if (scheme?.official_link && scheme.official_link !== '#') {
                window.open(scheme.official_link, '_blank');
            }
        } catch (e) { console.error(e); }
        setApplying(null);
    };

    const tabs = [
        { id: 'dashboard', label: 'Monitor', icon: Activity },
        { id: 'report', label: 'Report', icon: AlertCircle },
        { id: 'voter-services', label: 'Services', icon: Briefcase },
        { id: 'schemes', label: 'Schemes', icon: FileText },
    ];

    const STATUS_CONFIG = {
        submitted: { label: 'Received', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', dot: 'bg-amber-500' },
        assigned: { label: 'Assigned', icon: User, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', dot: 'bg-blue-500' },
        in_progress: { label: 'Working on it', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', dot: 'bg-emerald-500' },
        resolved: { label: 'Fixed', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-200', dot: 'bg-emerald-600' },
    };

    return (
        <div className="space-y-8 animate-fade-in relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white tracking-tight uppercase">Public Portal</h1>
                    <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Booth #{safeBoothId}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={fetchData} className="px-5 py-2.5 rounded-full bg-white/5 text-white/40 hover:text-emerald-500 hover:bg-white/10 transition-all flex items-center gap-2 border border-white/5">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Refresh Feed</span>
                    </button>
                    <div className="hidden lg:flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/5 shadow-sm">
                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-white tracking-tighter uppercase whitespace-nowrap">Online</span>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <ServiceGrid items={tabs} onSelect={handleTabChange} activeTab={tab} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main View Area */}
                <div className="lg:col-span-8 space-y-8">
                    {tab === 'dashboard' ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                            <InsightsBanner insights={analytics?.insights} loading={loading} />
                            
                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label="ID" value={`#${safeBoothId}`} icon={Shield} color="#10b981" delay={0.1} />
                                <StatCard label="Pending" value={analytics?.pending_issues || 0} icon={AlertCircle} color="#ea580c" delay={0.2} />
                                <StatCard label="Fixed" value={analytics?.resolved_issues || 0} icon={CheckCircle2} color="#059669" delay={0.3} />
                                <StatCard label="Online" value="99.9%" icon={Activity} color="#6366f1" delay={0.4} />
                            </div>

                            {/* Activity Feed */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display font-bold text-2xl text-white tracking-tight uppercase">Recent Problems</h3>
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-white/20">
                                        LIVE LIST
                                    </span>
                                </div>
                                
                                <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                    {grievances.length === 0 ? (
                                        <div className="p-16 text-center border-2 border-dashed border-stone-200 rounded-[2rem] bg-stone-50/50">
                                            <p className="text-stone-400 font-display text-lg italic">Everything looks good. No issues found.</p>
                                        </div>
                                    ) : (
                                        grievances.map((g, idx) => {
                                            const config = STATUS_CONFIG[g.status] || STATUS_CONFIG.submitted;
                                            const isExpanded = expandedId === g.id;
                                            return (
                                                <motion.div 
                                                    key={g.id} 
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={`glass-panel p-5 rounded-3xl border border-white/5 transition-all shadow-sm group hover:border-emerald-500/30 cursor-pointer ${isExpanded ? 'ring-2 ring-emerald-500/20' : ''}`}
                                                    onClick={() => setExpandedId(isExpanded ? null : g.id)}
                                                >
                                                    <div className="flex items-center gap-6">
                                                        <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${config.bg} ${config.color} shadow-stone-100`}>
                                                            <config.icon size={28} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className={`size-1.5 rounded-full ${config.dot}`} />
                                                                 <span className={`text-[10px] font-bold uppercase tracking-widest ${config.color}`}>
                                                                    {config.label}
                                                                </span>
                                                                <span className="text-[10px] font-mono text-white/20 ml-2">ID: #{g.id}</span>
                                                            </div>
                                                            <h4 className="text-lg font-bold text-white truncate tracking-tight">{g.description}</h4>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                                                                    <Calendar size={12} className="text-emerald-600" /> {new Date(g.created_at || Date.now()).toLocaleDateString()}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                                                                    <MapPin size={12} className="text-emerald-600" /> Area {g.booth_id}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={20} className={`text-white/20 group-hover:text-emerald-600 transition-all hidden sm:block ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </div>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                 <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Assigned Personnel</p>
                                                                            <p className="text-sm font-bold text-white flex items-center gap-2">
                                                                                <User size={14} className="text-emerald-600" /> {g.assigned_worker || 'Awaiting assignment'}
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                                                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Resolution Protocol</p>
                                                                            <p className="text-sm font-bold text-white flex items-center gap-2">
                                                                                <CheckCircle2 size={14} className="text-emerald-600" /> {g.status === 'resolved' ? 'Operational Success' : 'Matrix Intervention Pending'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    {g.resolution_note && (
                                                                        <div className="p-4 bg-emerald-50/10 rounded-2xl border border-emerald-500/20">
                                                                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Field Intelligence Note</p>
                                                                            <p className="text-sm text-emerald-50/70 font-medium italic">"{g.resolution_note}"</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : tab === 'report' ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-xl">
                            <div className="bg-white/5 backdrop-blur-3xl text-white rounded-[3rem] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-6 mb-10">
                                        <div className="size-20 rounded-[2rem] bg-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 border border-white/10 group-hover:scale-110 transition-transform">
                                            <Send size={36} />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">REPORT<br/>ANOMALY</h2>
                                            <p className="text-[10px] uppercase tracking-[3px] text-stone-500 font-bold">Matrix Intervention Pipeline</p>
                                        </div>
                                    </div>

                                    <div className="space-y-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-[4px] text-emerald-500 pl-1">Anomaly Category</label>
                                            <div className="flex flex-wrap gap-2.5">
                                                {['Infrastructure', 'Health', 'Security', 'Sanitation', 'Utility'].map(cat => (
                                                    <button 
                                                        key={cat}
                                                        onClick={() => setCategory(cat)}
                                                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-[2px] border transition-all ${
                                                            category === cat 
                                                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                                            : 'bg-white/5 border-white/5 text-stone-500 hover:text-white hover:bg-white/10'
                                                        }`}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-[4px] text-emerald-500 pl-1">Detailed Description</label>
                                            <textarea 
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Explain the local anomaly in detail..."
                                                className="w-full bg-black/20 border border-white/5 rounded-[2rem] p-8 outline-none focus:border-emerald-500/50 transition-all text-sm font-medium h-56 resize-none placeholder:text-stone-800 text-white"
                                            />
                                        </div>

                                        <button 
                                            onClick={handleSubmit} 
                                            disabled={!description || submitting}
                                            className="w-full py-6 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-[4px] flex items-center justify-center gap-4 transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 shadow-2xl shadow-emerald-500/20 border border-white/10"
                                        >
                                            {submitting ? <RefreshCw className="animate-spin" size={24} /> : <><span>INITIALIZE REPORT</span> <ChevronRight size={24} /></>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : tab === 'voter-services' ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {voterServices.map((s, idx) => (
                                    <motion.div 
                                        key={s.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 hover:border-emerald-500/30 transition-all group shadow-2xl"
                                    >
                                        <div className="size-20 rounded-[2rem] bg-emerald-600 flex items-center justify-center text-white mb-10 group-hover:scale-110 transition-transform shadow-2xl shadow-emerald-500/20 border border-white/10">
                                            <span className="material-symbols-outlined text-4xl italic">{s.icon}</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-white mb-4 tracking-tighter leading-tight uppercase">{s.name}</h3>
                                        <p className="text-stone-500 text-sm leading-relaxed mb-10 font-medium">{s.desc}</p>
                                        <button 
                                            onClick={() => s.official_link !== '#' && window.open(s.official_link, '_blank')}
                                            className={`px-8 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-[3px] flex items-center gap-3 transition-all ${
                                                s.official_link === '#' 
                                                ? 'bg-white/5 border-white/5 text-stone-700 cursor-not-allowed' 
                                                : 'bg-emerald-600 border-white/10 text-white hover:bg-emerald-500 shadow-xl shadow-emerald-500/20 active:scale-95'
                                            }`}
                                        >
                                            {s.official_link === '#' ? 'MATRIX_OFFLINE' : 'INITIALIZE PORTAL'} <ExternalLink size={16} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {schemes.map((scheme, idx) => {
                                    const isApplied = applications.some(a => a.scheme_id === scheme.id);
                                    return (
                                        <motion.div 
                                            key={scheme.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 hover:border-emerald-500/30 transition-all group flex flex-col justify-between shadow-2xl"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-10">
                                                    <span className="px-5 py-2 bg-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-[2px] text-emerald-400 border border-emerald-500/20">
                                                        {scheme.category}
                                                    </span>
                                                    {isApplied && (
                                                        <span className="px-5 py-2 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-[2px] flex items-center gap-2 border border-white/20">
                                                            <CheckCircle2 size={14} className="text-emerald-500" /> MATRIX_VERIFIED
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-3xl font-black text-white group-hover:text-emerald-500 transition-colors mb-4 tracking-tighter leading-tight uppercase">{scheme.name}</h3>
                                                <p className="text-stone-500 text-sm leading-relaxed mb-10 font-medium">{scheme.desc}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 pt-10 border-t border-white/5">
                                                <button 
                                                    onClick={() => handleApplyScheme(scheme.id)}
                                                    disabled={isApplied || applying === scheme.id}
                                                    className={`flex-1 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 transition-all ${
                                                        isApplied 
                                                        ? 'bg-black/20 text-stone-700 cursor-not-allowed border border-white/5' 
                                                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-2xl shadow-emerald-500/20 border border-white/10'
                                                    }`}
                                                >
                                                    {applying === scheme.id ? <RefreshCw className="animate-spin" size={18} /> : isApplied ? <BadgeCheck size={20} /> : <ChevronRight size={20} />}
                                                    {isApplied ? 'SECURE_ACCESS_GRANTED' : 'INITIALIZE APPLICATION'}
                                                </button>
                                                <button className="size-14 rounded-2xl bg-white/5 text-stone-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all border border-white/5 flex items-center justify-center shadow-2xl">
                                                    <Info size={24} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Support Team */}
                    <div className="bg-emerald-600 text-white rounded-[3rem] p-10 shadow-2xl shadow-emerald-600/20 relative overflow-hidden group border border-white/10">
                        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-10 flex items-center gap-4 tracking-tighter uppercase">
                                <Shield size={24} strokeWidth={3} /> Support Matrix
                            </h3>
                            <div className="space-y-5">
                                {admin && (
                                    <div className="bg-white/10 p-5 rounded-2xl border border-white/10 flex items-center gap-5 group/item hover:bg-white/20 transition-all cursor-pointer">
                                        <div className="size-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center font-black text-2xl shadow-2xl border border-white/20">
                                            {admin.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-base tracking-tight leading-none mb-1 uppercase">{admin.name}</p>
                                            <p className="text-[9px] uppercase font-bold text-emerald-200 tracking-[2px]">Matrix Administrator</p>
                                        </div>
                                        <div className="ml-auto size-11 rounded-full bg-white/10 flex items-center justify-center group-hover/item:bg-white group-hover/item:text-emerald-600 transition-all border border-white/10">
                                            <Phone size={18} />
                                        </div>
                                    </div>
                                )}
                                {workers.slice(0, 3).map((w) => (
                                    <div key={w.id} className="bg-black/10 p-5 rounded-2xl border border-white/5 flex items-center gap-5 group/item hover:bg-white/10 transition-all cursor-pointer">
                                        <div className="size-12 rounded-2xl bg-white/10 text-white flex items-center justify-center font-black text-xl border border-white/10 shadow-lg">
                                            {w.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-base tracking-tight leading-none mb-1 text-emerald-50 uppercase">{w.name}</p>
                                            <p className="text-[9px] uppercase font-bold text-emerald-400/60 tracking-[2px]">Field Node</p>
                                        </div>
                                        <div className="ml-auto size-11 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover/item:bg-white group-hover/item:text-emerald-600 transition-all border border-white/5">
                                            <MessageSquare size={18} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Performance */}
                    <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 group shadow-2xl">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tighter uppercase">Matrix Pulse</h3>
                                <p className="text-[10px] uppercase font-bold text-white/20 tracking-[2px] mt-1">Real-time Stability</p>
                            </div>
                            <div className="size-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                <Activity size={24} />
                            </div>
                        </div>
                        
                        <div className="space-y-10">
                            {[
                                { label: "Success Rate", value: 94, color: "#10b981" },
                                { label: "Scheme Coverage", value: 78, color: "#10b981" },
                                { label: "Voter Satisfaction", value: 88, color: "#10b981" }
                            ].map((stat, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[3px]">
                                        <span className="text-white/40">{stat.label}</span>
                                        <span className="text-emerald-500">{stat.value}%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.value}%` }}
                                            transition={{ duration: 1.5, delay: i * 0.1, ease: "circOut" }}
                                            className="h-full rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                            style={{ backgroundColor: stat.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-10 text-center bg-white/5 rounded-[3rem] border border-stone-900 border-dashed">
                        <p className="text-stone-700 text-[10px] font-black uppercase tracking-[4px]">
                            Last Matrix Sync: {new Date().toLocaleTimeString()}
                        </p>
                        <p className="text-[9px] text-stone-800 font-mono mt-3">ENCRYPTION: AES-256-GCM // SYSTEM: BIQ_CLOUD</p>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {submitted && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#0c0c0c]/80 backdrop-blur-2xl"
                            onClick={() => setSubmitted(null)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, y: 40, opacity: 0 }} 
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 40, opacity: 0 }}
                            className="bg-[#1a1a1a] rounded-[3rem] p-12 max-w-sm w-full text-center relative z-10 shadow-[0_0_100px_rgba(16,185,129,0.1)] border border-white/10"
                        >
                            <div className="size-28 rounded-3xl bg-emerald-600/10 flex items-center justify-center mx-auto mb-10 border border-emerald-500/20 shadow-2xl">
                                <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                                    <BadgeCheck size={56} className="text-emerald-500" strokeWidth={2.5} />
                                </motion.div>
                            </div>
                            <h3 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase leading-none">MATRIX<br/>CONFIRMED</h3>
                            <p className="text-stone-500 text-sm mb-12 leading-relaxed font-medium uppercase tracking-tighter">Your report is now indexed in the intelligence stream. A field node will intervene shortly.</p>
                            <button 
                                onClick={() => { setSubmitted(null); handleTabChange('dashboard'); }}
                                className="w-full py-6 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[4px] hover:bg-emerald-500 transition-all active:scale-95 shadow-2xl shadow-emerald-500/20 border border-white/10"
                            >
                                ACKNOWLEDGE
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AIChatbot currentUser={currentUser} boothId={safeBoothId} />
        </div>
    );
}
