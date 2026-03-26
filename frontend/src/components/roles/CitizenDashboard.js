import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  createGrievance, getGrievances, getAnalytics, getUsersByRole, 
  getSchemes, applyForScheme, getApplications, getVoterServices, 
  getVoterProfile 
} from '../../api';
import { 
  Send, RefreshCw, User, MapPin, ChevronRight,
  Calendar, CheckCircle2, Activity, AlertCircle,
  FileText, ExternalLink, BadgeCheck,
  Briefcase, Phone, MessageSquare, Shield, Info,
  Fingerprint, Target, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatbot from './AIChatbot';
import { translations, languages } from '../../translations';

// --- Simple Sub-components ---

const LanguageSelector = ({ currentLanguage, onLanguageChange }) => (
    <div className="flex items-center gap-2 bg-muted p-1 rounded-2xl border border-border shadow-sm">
        {languages.map((lang) => (
            <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                    currentLanguage === lang.code 
                    ? 'bg-foreground text-background shadow-lg' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
                {lang.native}
            </button>
        ))}
    </div>
);

const StatCard = ({ label, value, icon: Icon, color, delay, t }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        className="bg-card p-6 rounded-3xl border border-border hover:border-emerald-300 hover:shadow-lg transition-all group relative overflow-hidden shadow-sm"
    >
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon size={48} />
        </div>
        <div className="flex flex-col gap-1">
            <p className="text-[10px] font-bold uppercase tracking-[2px] text-muted-foreground">{label}</p>
            <h3 className="text-3xl font-black text-foreground tracking-tighter">{value}</h3>
        </div>
        <div className="mt-4 flex items-center gap-2">
            <div className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{t('live')}</span>
        </div>
    </motion.div>
);

const InsightsBanner = ({ insights, loading, t }) => (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-card p-8 md:p-12 text-foreground border border-border shadow-xl shadow-foreground/5 group">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                    <span className="px-4 py-1 bg-emerald-500/10 rounded-full text-[10px] font-bold uppercase tracking-[2px] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {t('aiInsights')}
                    </span>
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-4 leading-[0.9] tracking-tighter text-foreground">
                    {t('overviewTitle').split(' ').slice(0, 2).join(' ')} <br />{t('overviewTitle').split(' ').slice(2).join(' ')}
                </h2>
                {loading ? (
                    <div className="space-y-3 opacity-20">
                        <div className="h-2 bg-border rounded w-full animate-pulse" />
                        <div className="h-2 bg-border rounded w-3/4 animate-pulse" />
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm md:text-lg leading-relaxed max-w-xl font-medium">
                        {insights?.[0] || t('overviewDesc')}
                    </p>
                )}
            </div>
            
            <div className="shrink-0 flex items-center gap-5 bg-muted p-8 rounded-[2rem] border border-border shadow-sm">
                <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[3px] text-muted-foreground font-bold mb-1">Source</p>
                    <p className="text-sm font-mono font-black text-foreground">BoothIQ AI</p>
                </div>
                <div className="size-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center border border-emerald-500 shadow-xl">
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
                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border transition-all gap-4 group hover:scale-[1.02] active:scale-95 ${
                    activeTab === item.id 
                    ? 'bg-foreground border-border text-background shadow-2xl shadow-foreground/20' 
                    : 'bg-card border-border text-muted-foreground hover:border-emerald-300 hover:shadow-md shadow-sm'
                }`}
            >
                <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${
                    activeTab === item.id ? 'bg-background/10' : 'bg-muted group-hover:bg-emerald-50'
                }`}>
                    <item.icon size={24} strokeWidth={2.5} className={activeTab === item.id ? 'text-background' : 'text-muted-foreground group-hover:text-emerald-500'} />
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
    
    const getTabFromPath = (path) => {
        if (path.includes('/report')) return 'report';
        if (path.includes('/voter-services')) return 'voter-services';
        if (path.includes('/schemes')) return 'schemes';
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
            const [gData, aData, wData, admData, sData, appData, vsData, vpData] = await Promise.all([
                getGrievances({ booth_id: safeBoothId }),
                getAnalytics(safeBoothId),
                getUsersByRole('worker'),
                getUsersByRole('admin'),
                getSchemes(),
                currentUser?.id ? getApplications(currentUser.id) : Promise.resolve([]),
                getVoterServices(),
                currentUser?.id ? getVoterProfile(currentUser.id).catch(() => null) : Promise.resolve(null)
            ]);
            
            setGrievances(gData || []);
            setAnalytics(aData);
            setWorkers(wData?.filter(w => w.booth_id === safeBoothId) || []);
            setAdmin(admData?.find(a => a.booth_id === safeBoothId) || null);
            setSchemes(sData || []);
            setApplications(appData || []);
            setVoterServices(vsData || []);
            setVoterProfile(vpData);
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
        } catch (error) {
            console.error('Submission Error:', error);
            const detail = error.response?.data?.detail || error.message;
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
        { id: 'dashboard', label: t('monitorTab'), icon: Activity },
        { id: 'report', label: t('reportTab'), icon: AlertCircle },
        { id: 'voter-services', label: t('servicesTab'), icon: Briefcase },
        { id: 'schemes', label: t('schemesTab'), icon: FileText },
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border">
                <div>
                    <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">{t('portalTitle')}</h1>
                    <p className="text-muted-foreground text-sm mt-1 uppercase tracking-widest font-bold">{t('boothLabel')} #{safeBoothId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
                    <button onClick={fetchData} className="px-5 py-2.5 rounded-full bg-muted text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-2 border border-border">
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('refresh')}</span>
                    </button>
                    <div className="hidden lg:flex items-center gap-3 bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-100 shadow-sm">
                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-700 tracking-tighter uppercase whitespace-nowrap">{t('online')}</span>
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
                            <InsightsBanner insights={analytics?.insights} loading={loading} t={t} />
                            
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
                                                    className={`bg-card p-5 rounded-3xl border border-border transition-all shadow-sm group hover:border-emerald-500/30 hover:shadow-md cursor-pointer ${isExpanded ? 'ring-2 ring-emerald-500/20' : ''}`}
                                                    onClick={() => setExpandedId(isExpanded ? null : g.id)}
                                                >
                                                    <div className="flex items-center gap-6">
                                                        <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${config.bg} ${config.color}`}>
                                                            <config.icon size={28} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                 <div className={`size-1.5 rounded-full ${config.dot}`} />
                                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${config.color}`}>
                                                                    {config.label}
                                                                </span>
                                                                <span className="text-[10px] font-mono text-muted-foreground/60 ml-2">ID: #{g.id}</span>
                                                            </div>
                                                            <h4 className="text-lg font-bold text-foreground truncate tracking-tight">{g.description}</h4>
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
                            <div className="bg-card text-foreground rounded-[3rem] p-10 border border-border shadow-xl relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-6 mb-10">
                                        <div className="size-20 rounded-[2rem] bg-foreground flex items-center justify-center text-emerald-500 shadow-2xl shadow-foreground/10 border border-border group-hover:scale-110 transition-transform">
                                            <Send size={36} />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black text-foreground tracking-tighter leading-none mb-2">
                                                {t('reportTitle').split(' ').slice(0, 2).join(' ')}<br />{t('reportTitle').split(' ').slice(2).join(' ')}
                                            </h2>
                                            <p className="text-[10px] uppercase tracking-[3px] text-muted-foreground font-bold">{t('portalTitle')}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-[4px] text-foreground pl-1">{t('categoryLabel')}</label>
                                            <div className="flex flex-wrap gap-2.5">
                                                {['Infrastructure', 'Health', 'Security', 'Sanitation', 'Utility'].map(cat => (
                                                    <button 
                                                        key={cat}
                                                        onClick={() => setCategory(cat)}
                                                        className={`px-6 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-[2px] border transition-all ${
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

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-[4px] text-foreground pl-1">{t('descriptionLabel')}</label>
                                            <textarea 
                                                value={description}
                                                onChange={(e) => {
                                                    setDescription(e.target.value);
                                                    if (error) setError(null);
                                                }}
                                                placeholder={t('descTooltip')}
                                                className="w-full bg-muted border border-border rounded-[2rem] p-8 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all text-sm font-medium h-44 resize-none placeholder:text-muted-foreground/40 text-foreground"
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
                                            className="w-full py-5 bg-foreground text-background rounded-[1.5rem] font-black uppercase tracking-[4px] flex items-center justify-center gap-4 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-xl shadow-foreground/10"
                                        >
                                            {submitting ? <RefreshCw className="animate-spin" size={24} /> : <><span>{t('submitBtn')}</span> <ChevronRight size={24} /></>}
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
                                        className="bg-card p-10 rounded-[3rem] border border-border hover:border-emerald-500/30 hover:shadow-lg transition-all group shadow-sm"
                                    >
                                        <div className="size-20 rounded-[2rem] bg-foreground flex items-center justify-center text-emerald-500 mb-10 group-hover:scale-110 transition-transform shadow-xl shadow-foreground/10">
                                            <span className="material-symbols-outlined text-4xl italic">{s.icon}</span>
                                        </div>
                                        <h3 className="text-3xl font-black text-foreground mb-4 tracking-tighter leading-tight">{s.name}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed mb-10 font-medium">{s.desc}</p>
                                        <button 
                                            onClick={() => s.official_link !== '#' && window.open(s.official_link, '_blank')}
                                            className={`px-8 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-[3px] flex items-center gap-3 transition-all ${
                                                s.official_link === '#' 
                                                ? 'bg-muted border-border text-muted-foreground cursor-not-allowed' 
                                                : 'bg-foreground border-transparent text-background hover:opacity-90 shadow-lg shadow-foreground/10 active:scale-95'
                                            }`}
                                        >
                                            {s.official_link === '#' ? t('comingSoon') : t('openPortal')} <ExternalLink size={16} />
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
                                            className="bg-card p-10 rounded-[3rem] border border-border hover:border-emerald-500/30 hover:shadow-lg transition-all group flex flex-col justify-between shadow-sm"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-10">
                                                    <span className="px-5 py-2 bg-muted rounded-full text-[10px] font-black uppercase tracking-[2px] text-muted-foreground border border-border">
                                                        {scheme.category}
                                                    </span>
                                                    {isApplied && (
                                                        <span className="px-5 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[2px] flex items-center gap-2 border border-emerald-100 dark:border-emerald-900/30">
                                                            <CheckCircle2 size={14} className="text-emerald-500" /> {t('applied')}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-2xl font-black text-foreground transition-colors mb-4 tracking-tighter leading-tight group-hover:text-emerald-600">{scheme.name}</h3>
                                                <p className="text-muted-foreground text-sm leading-relaxed mb-10 font-medium">{scheme.desc}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 pt-8 border-t border-border">
                                                <button 
                                                    onClick={() => handleApplyScheme(scheme.id)}
                                                    disabled={isApplied || applying === scheme.id}
                                                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 transition-all ${
                                                        isApplied 
                                                        ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border' 
                                                        : 'bg-foreground text-background hover:opacity-90 shadow-xl shadow-foreground/10'
                                                    }`}
                                                >
                                                    {applying === scheme.id ? <RefreshCw className="animate-spin" size={18} /> : isApplied ? <BadgeCheck size={20} /> : <ChevronRight size={20} />}
                                                    {isApplied ? t('alreadyApplied') : t('applyNow')}
                                                </button>
                                                <button className="size-12 rounded-2xl bg-muted text-muted-foreground hover:text-foreground hover:bg-emerald-500/5 transition-all border border-border flex items-center justify-center">
                                                    <Info size={20} />
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
                <div className="lg:col-span-4 space-y-6">
                    {/* Voter Intelligence Profile */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-card text-foreground rounded-[3rem] p-8 shadow-2xl shadow-foreground/5 relative overflow-hidden group border border-border"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                            <Fingerprint size={80} />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="size-16 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-500/20 text-white">
                                    {currentUser?.name?.[0] || 'C'}
                                </div>
                                <div>
                                    <h3 className="font-black text-xl tracking-tighter leading-none mb-1 text-foreground">{currentUser?.name || 'Citizen'}</h3>
                                    <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-[3px]">Voter Registry Verified</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-muted rounded-2xl p-4 border border-border">
                                    <p className="text-[8px] uppercase font-black text-muted-foreground tracking-[2px] mb-1">{t('influence')}</p>
                                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{voterProfile?.influence_score?.toFixed(1) || '4.2'}</p>
                                </div>
                                <div className="bg-muted rounded-2xl p-4 border border-border">
                                    <p className="text-[8px] uppercase font-black text-muted-foreground tracking-[2px] mb-1">{t('sentiment')}</p>
                                    <p className={`text-xl font-black uppercase tracking-tighter ${
                                        voterProfile?.sentiment === 'negative' ? 'text-rose-500' : 
                                        voterProfile?.sentiment === 'positive' ? 'text-emerald-500' : 'text-amber-500'
                                    }`}>
                                        {voterProfile?.sentiment || 'Neutral'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-bold py-3 border-b border-border">
                                    <span className="text-muted-foreground uppercase tracking-[2px]">{t('voterId')}</span>
                                    <span className="text-foreground font-mono">{currentUser?.id || 'V1001'}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold py-3 border-b border-border">
                                    <span className="text-muted-foreground uppercase tracking-[2px]">Contact</span>
                                    <div className="flex flex-col items-end gap-1">
                                        <a href={`tel:${voterProfile?.phone || ''}`} className="text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors lowercase">{voterProfile?.phone || '9876543210'}</a>
                                        <a href={`mailto:${voterProfile?.email || ''}`} className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors lowercase tracking-normal font-medium">{voterProfile?.email || 'voter@example.com'}</a>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold py-3 border-b border-border">
                                    <span className="text-muted-foreground uppercase tracking-[2px]">{t('boothAccess')}</span>
                                    <span className="text-foreground font-mono">#{safeBoothId}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-bold py-3">
                                    <span className="text-muted-foreground uppercase tracking-[2px]">{t('status')}</span>
                                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {t('active')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Support Team */}
                    <div className="bg-card text-foreground rounded-[3rem] p-8 shadow-xl shadow-foreground/5 relative overflow-hidden group border border-border">
                        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                        <div className="relative z-10">
                            <h3 className="text-lg font-black mb-8 flex items-center gap-3 tracking-tighter text-foreground">
                                <Shield size={20} strokeWidth={3} className="text-emerald-600" /> {t('supportTeam')}
                            </h3>
                            <div className="space-y-4">
                                {admin && (
                                    <div className="bg-muted p-4 rounded-2xl border border-border flex items-center gap-4 group/item hover:bg-emerald-500/5 transition-all">
                                        <div className="size-12 rounded-2xl bg-foreground text-emerald-500 flex items-center justify-center font-black text-xl shadow-lg border border-border">
                                            {admin.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm tracking-tight leading-none mb-1 text-foreground">{admin.name}</p>
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-[2px]">Administrator</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-2">
                                            <a href={`mailto:${admin.email || 'admin@boothiq.ai'}`} className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-emerald-500 transition-all">
                                                <Mail size={14} />
                                            </a>
                                            <a href={`tel:${admin.phone || ''}`} className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-emerald-500 transition-all">
                                                <Phone size={14} />
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {workers.slice(0, 3).map((w) => (
                                    <div key={w.id} className="bg-card p-4 rounded-2xl border border-border flex items-center gap-4 group/item hover:bg-muted transition-all">
                                        <div className="size-10 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center font-black text-lg border border-border group-hover/item:bg-foreground group-hover/item:text-emerald-500 transition-all">
                                            {w.name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm tracking-tight leading-none mb-1 text-foreground transition-colors">{w.name}</p>
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-[2px]">Field Worker</p>
                                        </div>
                                        <div className="ml-auto flex items-center gap-2">
                                            <a href={`mailto:${w.email || 'worker@boothiq.ai'}`} className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-emerald-500 transition-all">
                                                <Mail size={14} />
                                            </a>
                                            <a href={`tel:${w.phone || ''}`} className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-emerald-500 transition-all">
                                                <Phone size={14} />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Performance */}
                    <div className="bg-card p-8 rounded-[3rem] border border-border group shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-foreground tracking-tighter">{t('pulseTitle')}</h3>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[2px] mt-1">{t('pulseRealtime')}</p>
                            </div>
                            <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-900/30">
                                <Activity size={20} />
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            {[
                                { label: t('successRate'), value: 94, color: "#10b981" },
                                { label: t('schemeCoverage'), value: 78, color: "#10b981" },
                                { label: t('satisfaction'), value: 88, color: "#10b981" }
                            ].map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[3px]">
                                        <span className="text-muted-foreground">{stat.label}</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">{stat.value}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
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
