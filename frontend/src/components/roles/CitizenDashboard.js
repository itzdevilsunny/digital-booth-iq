import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  createGrievance, getGrievances, getAnalytics, getUsersByRole, 
  getSchemes, applyForScheme, getApplications, getVoterServices, 
  getVoterProfile, getBulletins 
} from '../../api';
import { 
  Send, RefreshCw, User, MapPin, ChevronRight,
  Calendar, CheckCircle2, Activity, AlertCircle,
  FileText, ExternalLink, BadgeCheck,
  Briefcase, Phone, MessageSquare, Shield, Info,
  Fingerprint, Target, Mail, TrendingUp, Sparkles,
  Droplets, BookOpen, Map as MapIcon, Sun, Image as ImageIcon,
  ThumbsUp, ThumbsDown, MessageCircle, Bell, Globe, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatbot from './AIChatbot';
import { translations, languages } from '../../translations';

// --- Simple Sub-components ---

const LanguageSelector = ({ currentLanguage, onLanguageChange }) => (
    <div className="relative group">
        <select
            value={currentLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="appearance-none bg-muted border border-border text-xs font-bold text-foreground rounded-full pl-4 pr-10 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm cursor-pointer hover:border-emerald-500/50 transition-all uppercase tracking-widest"
        >
            {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-background text-foreground font-sans">
                    {lang.native} ({lang.label})
                </option>
            ))}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-emerald-500 transition-colors" />
            </svg>
        </div>
    </div>
);

const StatCard = ({ label, value, icon: Icon, color, delay, t }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="bg-card p-4 rounded-xl border border-border hover:border-emerald-300 hover:shadow-lg transition-all group relative overflow-hidden shadow-sm"
    >
        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon size={32} />
        </div>
        <div className="flex flex-col gap-0.5">
            <p className="text-[9px] font-bold uppercase tracking-[1px] text-muted-foreground">{label}</p>
            <h3 className="text-xl font-black text-foreground tracking-tighter">{value}</h3>
        </div>
        <div className="mt-2 flex items-center gap-2">
            <div className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">{t('live')}</span>
        </div>
    </motion.div>
);

const InsightsBanner = ({ insights, loading, t }) => (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-card p-5 md:p-6 text-foreground border border-border shadow-xl shadow-foreground/5 group">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full -mr-24 -mt-24" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-0.5 bg-emerald-500/10 rounded-full text-[9px] font-bold uppercase tracking-[1px] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {t('aiInsights')}
                    </span>
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black mb-2 leading-[0.9] tracking-tighter text-foreground">
                    {t('overviewTitle')}
                </h2>
                {loading ? (
                    <div className="space-y-2 opacity-20">
                        <div className="h-1.5 bg-border rounded w-full animate-pulse" />
                        <div className="h-1.5 bg-border rounded w-3/4 animate-pulse" />
                    </div>
                ) : (
                    <p className="text-muted-foreground text-xs md:text-sm leading-relaxed max-w-xl font-medium">
                        {insights?.[0]?.message || t('overviewDesc')}
                    </p>
                )}
            </div>
            
            <div className="shrink-0 flex items-center gap-4 bg-muted p-4 rounded-[1rem] border border-border shadow-sm">
                <div className="text-right">
                    <p className="text-[8px] uppercase tracking-[2px] text-muted-foreground font-bold">Source</p>
                    <p className="text-xs font-mono font-black text-foreground">BoothIQ</p>
                </div>
                <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center border border-emerald-500 shadow-xl">
                    <Shield size={18} />
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
                className={`flex flex-col items-center justify-center p-4 rounded-[1rem] border transition-all gap-4 group hover:scale-[1.02] active:scale-95 ${
                    activeTab === item.id 
                    ? 'bg-foreground border-border text-background shadow-2xl shadow-foreground/20' 
                    : 'bg-card border-border text-muted-foreground hover:border-emerald-300 hover:shadow-md shadow-sm'
                }`}
            >
                <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${
                    activeTab === item.id ? 'bg-background/10' : 'bg-muted group-hover:bg-emerald-50'
                }`}>
                    <item.icon size={20} strokeWidth={2.5} className={activeTab === item.id ? 'text-background' : 'text-muted-foreground group-hover:text-emerald-500'} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[1px] text-center">{item.label}</span>
            </button>
        ))}
    </div>
);

// --- Main Component ---

export default function CitizenDashboard({ currentUser, boothId }) {
    const location = useLocation();
    const navigate = useNavigate();
    
    const getTabFromPath = (path) => {
        if (path.includes('/report')) return 'report';
        if (path.includes('/voter-services')) return 'voter-services';
        if (path.includes('/schemes')) return 'schemes';
        if (path.includes('/development')) return 'development';
        return 'dashboard';
    };

    const [tab, setTab] = useState(getTabFromPath(location.pathname));

    useEffect(() => {
        setTab(getTabFromPath(location.pathname));
    }, [location.pathname]);

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
    const [bulletins, setBulletins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(null);
    const [applying, setApplying] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [voterProfile, setVoterProfile] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [admin, setAdmin] = useState(null);
    const [error, setError] = useState(null);
    const [language, setLanguage] = useState(localStorage.getItem('portalLanguage') || 'en');

    const t = (key) => {
        if (!translations[language]) return key;
        return translations[language][key] || key;
    };

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        localStorage.setItem('portalLanguage', newLang);
    };

    const safeBoothId = parseInt(boothId) || 17;

    const fetchData = useCallback(async () => {
        if (!safeBoothId) return;
        setLoading(true);
        try {
            const results = await Promise.allSettled([
                getGrievances({ booth_id: safeBoothId, voter_id: currentUser?.id }),
                getAnalytics(safeBoothId),
                getUsersByRole('worker'),
                getUsersByRole('admin'),
                getSchemes(),
                currentUser?.id ? getApplications(currentUser.id) : Promise.resolve([]),
                getVoterServices(),
                currentUser?.id ? getVoterProfile(currentUser.id).catch(() => null) : Promise.resolve(null),
                getBulletins()
            ]);
            
            const [gRes, aRes, wRes, admRes, sRes, appRes, vsRes, vpRes, bRes] = results;

            setGrievances(gRes.status === 'fulfilled' ? gRes.value || [] : []);
            setAnalytics(aRes.status === 'fulfilled' ? aRes.value : null);
            setWorkers(wRes.status === 'fulfilled' ? wRes.value?.filter(w => w.booth_id === safeBoothId) || [] : []);
            setAdmin(admRes.status === 'fulfilled' ? admRes.value?.find(a => a.booth_id === safeBoothId) || null : null);
            setSchemes(sRes.status === 'fulfilled' ? sRes.value || [] : []);
            setApplications(appRes.status === 'fulfilled' ? appRes.value || [] : []);
            setVoterServices(vsRes.status === 'fulfilled' ? vsRes.value || [] : []);
            setVoterProfile(vpRes.status === 'fulfilled' ? vpRes.value : null);
            setBulletins(bRes.status === 'fulfilled' ? bRes.value || [] : []);

            if (results.some(r => r.status === 'rejected')) {
                console.error("Some sync calls failed:", results.filter(r => r.status === 'rejected'));
            }
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
                voter_id: currentUser?.id || 'anonymous',
                voter_name: currentUser?.name || `Citizen-${safeBoothId}`,
                booth_id: safeBoothId
            });
            setSubmitted(result);
            setDescription('');
            setCategory('');
            fetchData();
        } catch (err) {
            console.error('Submission Error:', err);
            const detail = err.response?.data?.detail || err.message;
            setError(`System Alert: ${detail}`);
        }
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
        { id: 'dashboard', label: t('monitorTab') || 'Monitor', icon: Activity },
        { id: 'report', label: t('reportTab') || 'Report', icon: AlertCircle },
        { id: 'voter-services', label: t('servicesTab') || 'Services', icon: Briefcase },
        { id: 'schemes', label: t('schemesTab') || 'Schemes', icon: FileText },
        { id: 'development', label: t('developmentTab') || 'Development', icon: TrendingUp },
    ];

    const STATUS_CONFIG = {
        submitted: { label: t('applied'), icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30', dot: 'bg-amber-500' },
        assigned: { label: 'Assigned', icon: User, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30', dot: 'bg-blue-500' },
        in_progress: { label: 'Working on it', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30', dot: 'bg-emerald-500' },
        resolved: { label: t('statFixed'), icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-900/40', dot: 'bg-emerald-600' },
    };

    return (
        <div className="space-y-8 animate-fade-in relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-border">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">{t('portalTitle')}</h1>
                    <p className="text-muted-foreground text-[10px] mt-0.5 uppercase tracking-widest font-bold">{t('boothLabel')} #{safeBoothId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
                    <button onClick={fetchData} className="px-4 py-2 rounded-full bg-muted text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-2 border border-border">
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{t('refresh')}</span>
                    </button>
                    <div className="hidden lg:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
                        <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-700 tracking-tighter uppercase whitespace-nowrap">{t('online')}</span>
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
                            {/* Insights and Bulletins */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <InsightsBanner insights={analytics?.insights} loading={loading} t={t} />
                    </div>
                    
                    {/* Live Government Bulletin Board */}
                    <div className="bg-card border border-border rounded-[1.5rem] p-5 shadow-xl relative overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-rose-500 animate-ping" />
                                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-foreground flex items-center gap-2">
                                    <Globe size={14} className="text-emerald-500" /> Public Bulletin
                                </h3>
                            </div>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">{bulletins.length} Active</span>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto max-h-[180px] scrollbar-hide pr-1">
                            {bulletins.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-8">
                                    <Bell size={24} className="mb-2" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest">No active alerts</p>
                                </div>
                            ) : (
                                bulletins.map((b, i) => (
                                    <motion.div 
                                        key={b.id || i}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={`p-3 rounded-xl border flex gap-3 group cursor-default transition-all ${
                                            b.priority === 'CRITICAL' 
                                            ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40' 
                                            : 'bg-muted/30 border-border hover:border-emerald-500/30'
                                        }`}
                                    >
                                        <div className={`shrink-0 size-8 rounded-lg flex items-center justify-center ${
                                            b.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                            {b.alert_type === 'EPIDEMIC' ? <ShieldAlert size={16} /> : <Bell size={16} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                                                    b.level === 'CENTRAL' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'
                                                }`}>{b.level}</span>
                                                <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">{b.alert_type}</span>
                                            </div>
                                            <p className="text-[10px] font-black text-foreground uppercase truncate tracking-tight">{b.title}</p>
                                            <p className="text-[9px] text-muted-foreground leading-tight line-clamp-2 mt-1">{b.message}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                            <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">Real-time Govt Sync</p>
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="size-4 rounded-full border-2 border-card bg-muted flex items-center justify-center overflow-hidden">
                                        <div className="size-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/40" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                            
                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label={t('boothLabel') + " ID"} value={`#${safeBoothId}`} icon={Shield} color="#10b981" delay={0.1} t={t} />
                                <StatCard label={t('statPending')} value={analytics?.pending_issues || 0} icon={AlertCircle} color="#ea580c" delay={0.2} t={t} />
                                <StatCard label={t('statFixed')} value={analytics?.resolved_issues || 0} icon={CheckCircle2} color="#059669" delay={0.3} t={t} />
                                <StatCard label={t('statUptime')} value="99.9%" icon={Activity} color="#6366f1" delay={0.4} t={t} />
                            </div>

                            {/* Activity Feed */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display font-bold text-2xl text-foreground tracking-tight">{t('recentReports')}</h3>
                                    <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold text-muted-foreground">
                                        {t('live')}
                                    </span>
                                </div>
                                
                                <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                    {grievances.length === 0 ? (
                                        <div className="p-16 text-center border-2 border-dashed border-border rounded-[2rem] bg-muted">
                                            <p className="text-muted-foreground font-display text-lg italic">{t('noIssues')}</p>
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
                                                    className={`bg-card p-3 rounded-xl border border-border transition-all shadow-sm group hover:border-emerald-500/30 hover:shadow-md cursor-pointer ${isExpanded ? 'ring-2 ring-emerald-500/20' : ''}`}
                                                    onClick={() => setExpandedId(isExpanded ? null : g.id)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${config.bg} ${config.color}`}>
                                                            <config.icon size={20} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                 <div className={`size-1.5 rounded-full ${config.dot}`} />
                                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${config.color}`}>
                                                                    {config.label}
                                                                </span>
                                                                <span className="text-[9px] font-mono text-muted-foreground/60 ml-2">#{g.id}</span>
                                                            </div>
                                                            <h4 className="text-base font-bold text-foreground truncate tracking-tight">{g.description}</h4>
                                                            <div className="flex items-center gap-4 mt-2">
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                                    <Calendar size={12} className="text-emerald-500" /> {new Date(g.created_at || Date.now()).toLocaleDateString()}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                                                    <MapPin size={12} className="text-emerald-500" /> {t('boothLabel')} {g.booth_id}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight size={20} className={`text-muted-foreground group-hover:text-emerald-500 transition-all hidden sm:block ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </div>

                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="pt-6 mt-6 border-t border-border space-y-4">
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                        <div className="p-4 bg-muted rounded-2xl border border-border">
                                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('assignedPersonnel') || 'Assigned Personnel'}</p>
                                                                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                                                                <User size={14} className="text-emerald-500" /> {g.assigned_worker || (t('awaitingAssignment') || 'Awaiting assignment')}
                                                                            </p>
                                                                        </div>
                                                                        <div className="p-4 bg-muted rounded-2xl border border-border">
                                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('status')}</p>
                                                                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                                                                <CheckCircle2 size={14} className="text-emerald-500" /> {g.status === 'resolved' ? (t('resolved') || 'Resolved ✓') : (t('inProgress') || 'In Progress')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    {g.resolution_note && (
                                                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                                                            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">{t('resolutionNote') || 'Resolution Note'}</p>
                                                                            <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium italic">"{g.resolution_note}"</p>
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
                            <div className="bg-card text-foreground rounded-[1.5rem] p-5 border border-border shadow-xl relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="size-12 rounded-[1rem] bg-foreground flex items-center justify-center text-emerald-500 shadow-2xl shadow-foreground/10 border border-border group-hover:scale-110 transition-transform">
                                            <Send size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-foreground tracking-tighter leading-none mb-1">
                                                {t('reportTitle')}
                                            </h2>
                                            <p className="text-[8px] uppercase tracking-[2px] text-muted-foreground font-bold">{t('portalTitle')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-bold uppercase tracking-[2px] text-foreground pl-1">{t('categoryLabel')}</label>
                                            <div className="flex flex-wrap gap-2">
                                                {['Infrastructure', 'Health', 'Security', 'Sanitation', 'Utility'].map(cat => (
                                                    <button 
                                                        key={cat}
                                                        onClick={() => setCategory(cat)}
                                                        className={`px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-[1px] border transition-all ${
                                                            category === cat 
                                                            ? 'bg-foreground border-border text-background shadow-lg shadow-foreground/10' 
                                                            : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/50 hover:bg-emerald-500/5'
                                                        }`}
                                                    >
                                                        {t('categories')?.[cat] || cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[9px] font-bold uppercase tracking-[2px] text-foreground pl-1">{t('descriptionLabel')}</label>
                                            <textarea 
                                                value={description}
                                                onChange={(e) => {
                                                    setDescription(e.target.value);
                                                    if (error) setError(null);
                                                }}
                                                placeholder={t('descTooltip')}
                                                className="w-full bg-muted border border-border rounded-[1rem] p-4 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all text-xs font-medium h-32 resize-none placeholder:text-muted-foreground/40 text-foreground"
                                            />
                                        </div>

                                        {error && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10 }} 
                                                animate={{ opacity: 1, y: 0 }}
                                                className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400"
                                            >
                                                <AlertCircle size={18} />
                                                <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
                                            </motion.div>
                                        )}

                                        <button 
                                            onClick={handleSubmit} 
                                            disabled={!description || submitting}
                                            className="w-full py-3.5 bg-foreground text-background rounded-xl font-black uppercase tracking-[3px] text-xs flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-xl shadow-foreground/10"
                                        >
                                            {submitting ? <RefreshCw className="animate-spin" size={18} /> : <><span>{t('submitBtn')}</span> <ChevronRight size={18} /></>}
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
                                        className="bg-card p-5 rounded-[1.5rem] border border-border hover:border-emerald-500/30 hover:shadow-lg transition-all group shadow-sm"
                                    >
                                        <div className="size-12 rounded-xl bg-foreground text-emerald-500 mb-4 group-hover:scale-110 transition-transform shadow-xl shadow-foreground/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-xl italic">{s.icon}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-foreground mb-2 tracking-tighter leading-tight">{s.name}</h3>
                                        <p className="text-muted-foreground text-xs leading-relaxed mb-4 font-medium">{s.desc}</p>
                                        <button 
                                            onClick={() => s.official_link !== '#' && window.open(s.official_link, '_blank')}
                                            className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-[2px] flex items-center gap-2 transition-all ${
                                                s.official_link === '#' 
                                                ? 'bg-muted border-border text-muted-foreground cursor-not-allowed' 
                                                : 'bg-foreground border-transparent text-background hover:opacity-90 shadow-lg shadow-foreground/10 active:scale-95'
                                            }`}
                                        >
                                            {s.official_link === '#' ? t('comingSoon') : t('openPortal')} <ExternalLink size={12} />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : tab === 'schemes' ? (
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
                                            className="bg-card p-5 rounded-[1.5rem] border border-border hover:border-emerald-500/30 hover:shadow-lg transition-all group flex flex-col justify-between shadow-sm"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="px-3 py-1 bg-muted rounded-full text-[9px] font-black uppercase tracking-[1px] text-muted-foreground border border-border">
                                                        {scheme.category}
                                                    </span>
                                                    {isApplied && (
                                                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-[1px] flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900/30">
                                                            <CheckCircle2 size={12} className="text-emerald-500" /> {t('applied')}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-black text-foreground transition-colors mb-2 tracking-tighter leading-tight group-hover:text-emerald-600">{scheme.name}</h3>
                                                <p className="text-muted-foreground text-xs leading-relaxed mb-4 font-medium">{scheme.desc}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 pt-4 border-t border-border">
                                                <button 
                                                    onClick={() => handleApplyScheme(scheme.id)}
                                                    disabled={isApplied || applying === scheme.id}
                                                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[2px] flex items-center justify-center gap-2 transition-all ${
                                                        isApplied 
                                                        ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border' 
                                                        : 'bg-foreground text-background hover:opacity-90 shadow-xl shadow-foreground/10'
                                                    }`}
                                                >
                                                    {applying === scheme.id ? <RefreshCw className="animate-spin" size={14} /> : isApplied ? <BadgeCheck size={16} /> : <ChevronRight size={16} />}
                                                    {isApplied ? t('alreadyApplied') : t('applyNow')}
                                                </button>
                                                <button className="size-9 rounded-xl bg-muted text-muted-foreground hover:text-foreground hover:bg-emerald-500/5 transition-all border border-border flex items-center justify-center">
                                                    <Info size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : tab === 'development' ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                            {/* AI Insight Header */}
                            <div className="bg-gradient-to-br from-emerald-900/20 to-background p-6 rounded-[2rem] border border-emerald-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={80} /></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="size-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500"><Sparkles size={16} /></div>
                                        <h3 className="text-lg font-black text-emerald-500 uppercase tracking-widest">AI Progress Analysis</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                        Based on the 2024 Manifesto, Booth #{safeBoothId} has seen a <strong className="text-foreground">68% completion rate</strong> of promised projects. Recent sentiment analysis indicates high satisfaction with the new community clinic, while road infrastructure remains a priority for upcoming quarters.
                                    </p>
                                </div>
                            </div>

                            {/* Manifesto Tracker */}
                            <div>
                                <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase mb-6 flex items-center gap-3">
                                    <Target className="text-emerald-500" /> Manifesto Tracker
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { title: "24/7 Water Supply", progress: 90, status: "Near Completion", icon: Droplets },
                                        { title: "Smart Classrooms", progress: 100, status: "Completed", icon: BookOpen },
                                        { title: "Pothole-free Roads", progress: 60, status: "In Progress", icon: MapIcon },
                                        { title: "Solar Street Lights", progress: 100, status: "Completed", icon: Sun },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-card p-5 rounded-2xl border border-border hover:border-emerald-500/30 transition-all group">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-muted rounded-lg text-emerald-500 group-hover:scale-110 transition-transform"><item.icon size={16} /></div>
                                                    <h4 className="font-bold text-foreground">{item.title}</h4>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">{item.status}</span>
                                            </div>
                                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${item.progress}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-full bg-emerald-500 rounded-full" />
                                            </div>
                                            <div className="flex items-center gap-4 pt-3 border-t border-border">
                                                <button 
                                                    onClick={() => alert(`Sentiment logged: Positive reaction to ${item.title}. AI Knowledge Graph updated.`)}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-emerald-500 transition-colors uppercase tracking-widest"
                                                >
                                                    <ThumbsUp size={12} /> Agree
                                                </button>
                                                <button 
                                                    onClick={() => alert(`Sentiment logged: Negative reaction to ${item.title}. AI Knowledge Graph updated.`)}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-rose-500 transition-colors uppercase tracking-widest"
                                                >
                                                    <ThumbsDown size={12} /> Disagree
                                                </button>
                                                <button 
                                                    onClick={() => alert(`Comment section opened for ${item.title}. NLP will analyze text for sentiment.`)}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground hover:text-blue-500 transition-colors uppercase tracking-widest ml-auto"
                                                >
                                                    <MessageCircle size={12} /> Comment
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Before vs After */}
                            <div>
                                <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase mb-6 flex items-center gap-3">
                                    <ImageIcon className="text-emerald-500" /> Before vs After
                                </h3>
                                <div className="space-y-6">
                                    {[
                                        { title: "Sector 17 Community Clinic", before: "Basic first aid, limited hours, no specialized care.", after: "24/7 emergency, maternity ward, and telemedicine integration.", imgBefore: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=500&h=300", imgAfter: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=500&h=300" },
                                        { title: "Main Arterial Road", before: "Frequent waterlogging, severe potholes, no pedestrian walkway.", after: "New drainage system, asphalt paving, and solar-lit sidewalks.", imgBefore: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=500&h=300", imgAfter: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=500&h=300" }
                                    ].map((item, i) => (
                                        <div key={i} className="bg-card rounded-[2rem] border border-border overflow-hidden group">
                                            <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                                                <h4 className="text-lg font-black text-foreground uppercase tracking-tight">{item.title}</h4>
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => alert(`Sentiment logged: Positive reaction to ${item.title}. AI Knowledge Graph updated.`)}
                                                        className="size-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/30 transition-all"
                                                    >
                                                        <ThumbsUp size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => alert(`Sentiment logged: Negative reaction to ${item.title}. AI Knowledge Graph updated.`)}
                                                        className="size-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 transition-all"
                                                    >
                                                        <ThumbsDown size={12} />
                                                    </button>
                                                    <button 
                                                        onClick={() => alert(`Comment section opened for ${item.title}. NLP will analyze text for sentiment.`)}
                                                        className="size-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-blue-500 hover:border-blue-500/30 transition-all"
                                                    >
                                                        <MessageCircle size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                                                <div className="p-5 relative overflow-hidden">
                                                    <div className="absolute top-8 right-8 bg-rose-500/90 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md z-10">Before</div>
                                                    <div className="h-48 rounded-xl overflow-hidden mb-4 relative group-hover:opacity-80 transition-opacity">
                                                        <div className="absolute inset-0 bg-black/20 z-0" />
                                                        <img src={item.imgBefore} alt="Before" className="w-full h-full object-cover grayscale-[50%]" />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground font-medium">{item.before}</p>
                                                </div>
                                                <div className="p-5 relative overflow-hidden">
                                                    <div className="absolute top-8 right-8 bg-emerald-500/90 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md z-10">After</div>
                                                    <div className="h-48 rounded-xl overflow-hidden mb-4 relative">
                                                        <img src={item.imgAfter} alt="After" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                    </div>
                                                    <p className="text-sm text-foreground font-medium">{item.after}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : null}
                </div>

                {/* Voter Profile */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Voter Profile */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card text-foreground rounded-[1.5rem] p-5 shadow-2xl shadow-foreground/5 relative overflow-hidden group border border-border"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                            <Fingerprint size={80} />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-lg shadow-lg shadow-emerald-500/20 text-white">
                                    {currentUser?.name?.[0] || 'C'}
                                </div>
                                <div>
                                    <h3 className="font-black text-lg tracking-tighter leading-none mb-1 text-foreground">{currentUser?.name || 'Citizen'}</h3>
                                    <p className="text-[8px] uppercase font-bold text-emerald-500 tracking-[2px]">Verified</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-muted rounded-xl p-3 border border-border">
                                    <p className="text-[7px] uppercase font-black text-muted-foreground tracking-[1px] mb-0.5">{t('influence')}</p>
                                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{voterProfile?.influence_score?.toFixed(1) || '4.2'}</p>
                                </div>
                                <div className="bg-muted rounded-xl p-3 border border-border">
                                    <p className="text-[7px] uppercase font-black text-muted-foreground tracking-[1px] mb-0.5">{t('sentiment')}</p>
                                    <p className={`text-lg font-black uppercase tracking-tighter ${
                                        voterProfile?.sentiment === 'negative' ? 'text-rose-500' : 
                                        voterProfile?.sentiment === 'positive' ? 'text-emerald-500' : 'text-amber-500'
                                    }`}>
                                        {voterProfile?.sentiment || 'Neutral'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-[9px] font-bold py-2.5 border-b border-border">
                                    <span className="text-muted-foreground uppercase tracking-[1px]">{t('voterId')}</span>
                                    <span className="text-foreground font-mono">{currentUser?.id || 'V1001'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-bold py-2.5 border-b border-border">
                                    <span className="text-muted-foreground uppercase tracking-[1px]">Contact</span>
                                    <div className="flex flex-col items-end">
                                        <a href={`tel:${voterProfile?.phone || ''}`} className="text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors lowercase">{voterProfile?.phone || '9876543210'}</a>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-bold py-2.5 border-b border-border">
                                    <span className="text-muted-foreground uppercase tracking-[1px]">{t('boothAccess')}</span>
                                    <span className="text-foreground font-mono">#{safeBoothId}</span>
                                </div>
                                <div className="flex items-center justify-between text-[9px] font-bold py-2.5">
                                    <span className="text-muted-foreground uppercase tracking-[1px]">{t('status')}</span>
                                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                        <div className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                                        {t('active')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Support Team */}
                    <div className="bg-card text-foreground rounded-[1.5rem] p-5 shadow-xl shadow-foreground/5 relative overflow-hidden group border border-border">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                        <div className="relative z-10">
                            <h3 className="text-base font-black mb-6 flex items-center gap-3 tracking-tighter text-foreground">
                                <Shield size={16} strokeWidth={3} className="text-emerald-600" /> {t('supportTeam')}
                            </h3>
                            <div className="space-y-4">
                                {admin && (
                                    <div className="bg-muted p-3 rounded-xl border border-border flex items-center gap-3 group/item hover:bg-emerald-500/5 transition-all">
                                        <div className="size-10 rounded-xl bg-foreground text-emerald-500 flex items-center justify-center font-black text-lg shadow-lg border border-border">
                                            {admin.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm tracking-tight leading-none mb-1 text-foreground">{admin.name}</p>
                                            <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-[1px]">Administrator</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <a href={`mailto:hackopscrew@gmail.com`} className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-emerald-500 transition-all">
                                                <Mail size={12} />
                                            </a>
                                            <a href={`tel:+917974185707`} className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-emerald-500 transition-all">
                                                <Phone size={12} />
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {workers.slice(0, 3).map((w) => (
                                    <div key={w.id} className="bg-card p-3 rounded-xl border border-border flex items-center gap-3 group/item hover:bg-muted transition-all">
                                        <div className="size-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-black text-base border border-border group-hover/item:bg-foreground group-hover/item:text-emerald-500 transition-all">
                                            {w.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm tracking-tight leading-none mb-1 text-foreground transition-colors">{w.name}</p>
                                            <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-[1px]">Field Worker</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-1.5">
                                            <a href={`mailto:hackopscrew@gmail.com`} className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-emerald-500 transition-all">
                                                <Mail size={12} />
                                            </a>
                                            <a href={`tel:+917974185707`} className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-emerald-500 transition-all">
                                                <Phone size={12} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Performance */}
                    <div className="bg-card p-5 rounded-[2rem] border border-border group shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-sm font-black text-foreground tracking-tighter">{t('pulseTitle')}</h3>
                                <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-[2px] mt-0.5">{t('pulseRealtime')}</p>
                            </div>
                            <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-900/30">
                                <Activity size={16} />
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { label: t('successRate'), value: 94, color: "#10b981" },
                                { label: t('schemeCoverage'), value: 78, color: "#10b981" },
                                { label: t('satisfaction'), value: 88, color: "#10b981" }
                            ].map((stat, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[8px] font-black uppercase tracking-[2px]">
                                        <span className="text-muted-foreground">{stat.label}</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">{stat.value}%</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${stat.value}%` }}
                                            transition={{ duration: 1.5, delay: i * 0.1, ease: "circOut" }}
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: stat.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 text-center bg-muted rounded-[2rem] border border-border border-dashed">
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[3px]">
                            {t('lastSync')}: {new Date().toLocaleTimeString()}
                        </p>
                        <p className="text-[9px] text-muted-foreground/60 font-mono mt-2">BoothIQ Cloud • Encrypted</p>
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
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                            onClick={() => setSubmitted(null)}
                        />
                        <motion.div 
                            initial={{ scale: 0.9, y: 40, opacity: 0 }} 
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 40, opacity: 0 }}
                            className="bg-card rounded-[3rem] p-12 max-w-sm w-full text-center relative z-10 shadow-[0_20px_80px_rgba(0,0,0,0.2)] border border-border"
                        >
                            <div className="size-28 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-10 border border-emerald-100 dark:border-emerald-900/30 shadow-lg">
                                <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                                    <BadgeCheck size={56} className="text-emerald-500" strokeWidth={2.5} />
                                </motion.div>
                            </div>
                            <h3 className="text-4xl font-black text-foreground mb-4 tracking-tighter leading-none">
                                {t('reportSubmitted').split(' ').slice(0, 1).join(' ')}<br />{t('reportSubmitted').split(' ').slice(1).join(' ')}
                            </h3>
                            <p className="text-muted-foreground text-sm mb-10 leading-relaxed font-medium">{t('reportReceived')}</p>
                            <button 
                                onClick={() => { setSubmitted(null); handleTabChange('dashboard'); }}
                                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[4px] hover:bg-emerald-500 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                            >
                                {t('okGotIt')}
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AIChatbot currentUser={currentUser} boothId={safeBoothId} />
        </div>
    );
}
