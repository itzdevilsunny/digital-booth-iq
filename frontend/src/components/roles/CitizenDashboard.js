import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  createGrievance, getGrievances, getAnalytics, getUsersByRole, 
  getSchemes, applyForScheme, getApplications, getVoterServices, 
  getVoterProfile, getBulletins, uploadFile
} from '../../api';
import { 
  Send, RefreshCw, User, MapPin, ChevronRight,
  Calendar, CheckCircle2, Activity, AlertCircle,
  FileText, ExternalLink, BadgeCheck,
  Briefcase, Phone, MessageSquare, Shield, Info, LayoutDashboard,
  Fingerprint, Target, Mail, TrendingUp, Sparkles,
  Droplets, BookOpen, Map as MapIcon, Sun, Image as ImageIcon,
  ThumbsUp, ThumbsDown, MessageCircle, Bell, Globe, ShieldAlert, ShieldCheck,
  Upload, X, Film, Loader2, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatbot from './AIChatbot';
import { translations, languages } from '../../translations';
import NotificationBell from '../ui/NotificationBell';

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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        className="bg-card/40 p-5 rounded-2xl border border-border/50 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group relative overflow-hidden backdrop-blur-sm shadow-sm"
    >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-all group-hover:scale-110">
            <Icon size={40} strokeWidth={1.5} />
        </div>
        <div className="relative z-10 flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground/70">{label}</p>
            <h3 className="text-2xl font-black text-foreground tracking-tighter tabular-nums">{value}</h3>
        </div>
        <div className="mt-3 flex items-center gap-2">
            <div className="size-2 rounded-full animate-pulse shadow-sm shadow-current" style={{ backgroundColor: color }} />
            <span className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest">{t('live')}</span>
        </div>
    </motion.div>
);

const InsightsBanner = ({ insights, loading, t }) => (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-card to-muted/30 p-6 md:p-8 border border-border/60 shadow-2xl shadow-emerald-500/5 group">
        <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32 animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                    <span className="px-4 py-1.5 bg-emerald-500/10 rounded-full text-[10px] font-black uppercase tracking-[2px] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {t('aiInsights')}
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{t('liveSync')}</span>
                    </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-4 leading-none tracking-tighter text-foreground text-balance">
                    {t('overviewTitle')}
                </h2>
                {loading ? (
                    <div className="space-y-3 opacity-30">
                        <div className="h-2 bg-foreground/20 rounded-full w-full animate-pulse" />
                        <div className="h-2 bg-foreground/20 rounded-full w-4/5 animate-pulse" />
                        <div className="h-2 bg-foreground/20 rounded-full w-2/3 animate-pulse" />
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl font-medium antialiased">
                        {insights?.[0]?.message || t('overviewDesc')}
                    </p>
                )}
            </div>
            
            <div className="shrink-0 flex items-center gap-5 bg-card/60 backdrop-blur-md p-5 rounded-2xl border border-border shadow-xl group-hover:border-emerald-500/30 transition-colors">
                <div className="text-right">
                    <p className="text-[9px] uppercase tracking-[3px] text-muted-foreground font-black mb-1">Source</p>
                    <p className="text-sm font-mono font-black text-foreground tracking-widest text-emerald-500">BOOTH-IQ</p>
                </div>
                <div className="size-14 rounded-2xl bg-foreground text-background flex items-center justify-center border border-border shadow-2xl group-hover:scale-105 transition-transform duration-500">
                    <Shield size={24} strokeWidth={2.5} />
                </div>
            </div>
        </div>
    </div>
);

const ServiceGrid = ({ items, onSelect, activeTab }) => (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-5">
        {items.map((item) => (
            <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex items-center lg:flex-col lg:justify-center p-4 rounded-2xl border transition-all duration-300 gap-4 group relative overflow-hidden ${
                    activeTab === item.id 
                    ? 'bg-foreground border-transparent text-background shadow-2xl shadow-foreground/20 scale-[1.02]' 
                    : 'bg-card/40 border-border/50 text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-foreground active:scale-95 backdrop-blur-sm'
                }`}
            >
                {activeTab === item.id && (
                    <motion.div layoutId="nav-bg" className="absolute inset-0 bg-foreground -z-10" />
                )}
                <div className={`size-11 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                    activeTab === item.id ? 'bg-background/10' : 'bg-muted/80 group-hover:bg-emerald-500/10'
                }`}>
                    <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} className={activeTab === item.id ? 'text-background' : 'text-muted-foreground group-hover:text-emerald-500'} />
                </div>
                <div className="flex flex-col lg:items-center">
                    <span className="text-[10px] font-black uppercase tracking-[1.5px] leading-none mb-1">{item.label}</span>
                    <span className={`text-[8px] font-bold uppercase tracking-widest opacity-40 hidden lg:block ${activeTab === item.id ? 'text-background' : 'text-foreground'}`}>
                        {item.id === activeTab ? 'Active' : 'Select'}
                    </span>
                </div>
            </button>
        ))}
    </div>
);

    // --- Main Component ---
    const ServiceTabs = ({ activeTab, onSelect, t }) => {
        const tabs = [
            { id: 'dashboard', label: t('monitorTab') || 'Monitor', icon: Activity },
            { id: 'report', label: t('reportTab') || 'Report', icon: AlertCircle },
            { id: 'voter-services', label: t('servicesTab') || 'Services', icon: Briefcase },
            { id: 'schemes', label: t('schemesTab') || 'Schemes', icon: FileText },
            { id: 'profile', label: 'Profile', icon: User },
        ];

        return (
            <div className="flex items-center gap-1 p-1 bg-muted/50 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm overflow-x-auto scrollbar-hide no-scrollbar">
                {tabs.map((tabItem) => {
                    const active = activeTab === tabItem.id;
                    const Icon = tabItem.icon;
                    return (
                        <button
                            key={tabItem.id}
                            onClick={() => onSelect(tabItem.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[1px] transition-all duration-500 whitespace-nowrap group ${
                                active 
                                ? 'bg-foreground text-background shadow-xl shadow-foreground/10' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                        >
                            <Icon size={14} className={`transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                            {tabItem.label}
                        </button>
                    );
                })}
            </div>
        );
    };

    const VoterProfileSidebar = ({ user, analytics, t, loading, isFullView = false }) => (
        <motion.div 
            initial={{ opacity: 0, x: isFullView ? 0 : 20, y: isFullView ? 20 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            className={`${isFullView ? 'w-full' : 'w-full lg:w-96'} space-y-8`}
        >
            {/* Citizen Profile Card - Premium Glassmorphism */}
            <div className="bg-card/40 backdrop-blur-3xl rounded-[2.5rem] border border-border/60 p-10 shadow-2xl shadow-black/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                    <User size={120} />
                </div>
                
                <div className="relative z-10 text-center">
                    <div className="relative inline-block mb-8">
                        <div className="size-32 rounded-3xl bg-emerald-500 overflow-hidden shadow-2xl shadow-emerald-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'C')}&background=10b981&color=fff&size=128&bold=true`} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 size-10 rounded-2xl bg-foreground text-background flex items-center justify-center border-4 border-card shadow-lg">
                            <Shield size={16} strokeWidth={3} />
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-black text-foreground tracking-tighter mb-1 uppercase">{user?.name || 'Citizen'}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-emerald-500 mb-8">{t('verifiedVoter')}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/40 p-4 rounded-2xl border border-border/50 text-left group/stat hover:bg-emerald-500/5 transition-colors">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Voter ID</p>
                            <p className="text-xs font-mono font-black text-foreground tracking-widest truncate">#{user?.voter_id?.slice(-8).toUpperCase() || 'OFFLINE'}</p>
                        </div>
                        <div className="bg-muted/40 p-4 rounded-2xl border border-border/50 text-left group/stat hover:bg-emerald-500/5 transition-colors">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Booth</p>
                            <p className="text-xs font-black text-foreground tracking-tighter flex items-center gap-2">
                                <MapPin size={10} className="text-emerald-500" /> #{user?.booth_id || 17}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Trust Score & Impact */}
            <div className="bg-foreground rounded-[2.5rem] p-8 text-background relative overflow-hidden shadow-2xl shadow-foreground/20 group">
                <div className="absolute inset-0 bg-grid-pattern opacity-10" />
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <h4 className="text-[10px] font-black uppercase tracking-[3px] opacity-60">Civic Trust Score</h4>
                        <div className="size-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    
                    <div className="flex items-end gap-3 mb-6">
                        <span className="text-6xl font-black tracking-tighter leading-none">98</span>
                        <span className="text-xl font-black opacity-40 pb-1">/100</span>
                    </div>
                    
                    <div className="w-full h-1.5 bg-background/20 rounded-full overflow-hidden mb-8">
                        <motion.div initial={{ width: 0 }} animate={{ width: '98%' }} transition={{ duration: 1.5, ease: "circOut" }} className="h-full bg-emerald-500 rounded-full" />
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-background/10">
                        <div className="flex items-center justify-between group/row">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Reports Filed</span>
                            <span className="text-sm font-black tabular-nums">{analytics?.pending_issues + analytics?.resolved_issues || 0}</span>
                        </div>
                        <div className="flex items-center justify-between group/row">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Community Impact</span>
                            <span className="text-sm font-black tabular-nums text-emerald-500">+{(analytics?.resolved_issues || 0) * 10}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Emergency */}
            <div className="bg-rose-500/5 rounded-[2.5rem] border border-rose-500/20 p-8 group hover:bg-rose-500/10 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                    <div className="size-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                        <ShieldAlert size={20} />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[2px] text-rose-500">Emergency Protocol</h4>
                        <p className="text-[8px] font-bold text-rose-500/60 uppercase tracking-widest leading-none">Direct Connection</p>
                    </div>
                </div>
                <button className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-[3px] text-[10px] shadow-xl shadow-rose-500/20 active:scale-95 transition-all">
                    Panic Report System
                </button>
            </div>
        </motion.div>
    );

export default function CitizenDashboard({ currentUser, boothId }) {
        const location = useLocation();
        const navigate = useNavigate();
        
        const getTabFromPath = (path) => {
            if (path.includes('/report')) return 'report';
            if (path.includes('/voter-services')) return 'voter-services';
            if (path.includes('/schemes')) return 'schemes';
            if (path.includes('/development')) return 'development';
            if (path.includes('/profile')) return 'profile';
            return 'dashboard';
        };

        const [tab, setTab] = useState(getTabFromPath(location.pathname));

        useEffect(() => {
            setTab(getTabFromPath(location.pathname));
        }, [location.pathname]);

        const handleTabChange = (newTab) => {
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
    
    // Media Upload State
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [aiVisionAnalysis, setAiVisionAnalysis] = useState(null);
    const [userFeedback, setUserFeedback] = useState({});
    const [verifications, setVerifications] = useState({});

    const handleFeedback = (id, type) => {
        setUserFeedback(prev => ({ ...prev, [id]: type }));
    };

    const handleVerify = (id) => {
        setVerifications(prev => ({ ...prev, [id]: true }));
    };

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
                getUsersByRole('worker'),
                getUsersByRole('admin'),
                getSchemes(),
                currentUser?.id ? getApplications(currentUser.id) : Promise.resolve([]),
                getVoterServices(),
                currentUser?.id ? getVoterProfile(currentUser.id).catch(() => null) : Promise.resolve(null),
                getBulletins()
            ]);
            
            const [gRes, wRes, admRes, sRes, appRes, vsRes, vpRes, bRes] = results;

            setGrievances(gRes.status === 'fulfilled' ? gRes.value || [] : []);
            setWorkers(wRes.status === 'fulfilled' ? wRes.value?.filter(w => w.booth_id === safeBoothId) || [] : []);
            setAdmin(admRes.status === 'fulfilled' ? admRes.value?.find(a => a.booth_id === safeBoothId) || null : null);
            setSchemes(sRes.status === 'fulfilled' ? sRes.value || [] : []);
            setApplications(appRes.status === 'fulfilled' ? appRes.value || [] : []);
            setVoterServices(vsRes.status === 'fulfilled' ? vsRes.value || [] : []);
            setVoterProfile(vpRes.status === 'fulfilled' && vpRes.value ? vpRes.value : currentUser);
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

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setUploading(true);
        const uploadedUrls = [];
        let combinedAiAnalysis = "";

        try {
            for (const file of files) {
                const res = await uploadFile(file);
                uploadedUrls.push(res.url);
                if (res.ai_details) {
                    combinedAiAnalysis += (combinedAiAnalysis ? "\n" : "") + res.ai_details;
                }
            }
            setSelectedFiles(prev => [...prev, ...uploadedUrls]);
            if (combinedAiAnalysis) {
                setAiVisionAnalysis(prev => (prev ? `${prev}\n${combinedAiAnalysis}` : combinedAiAnalysis));
            }
        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to upload media. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const removeFile = (url) => {
        setSelectedFiles(prev => prev.filter(f => f !== url));
    };

    const handleSubmit = async () => {
        if (!description.trim()) return;
        setSubmitting(true);
        try {
            const result = await createGrievance({
                description,
                category: category || 'General',
                voter_id: currentUser?.id || 'anonymous',
                voter_name: currentUser?.name || `Citizen-${safeBoothId}`,
                booth_id: safeBoothId,
                attachments: selectedFiles,
                ai_vision_details: aiVisionAnalysis
            });
            
            // Optimistic update to UI
            setGrievances(prev => [result, ...prev]);
            
            setSubmitted(result);
            setDescription('');
            setCategory('');
            setSelectedFiles([]);
            setAiVisionAnalysis(null);
            
            // Re-sync after a short delay to ensure backend has finished processing
            // Increased to 3s to allow for background sync between Supabase/Mongo
            setTimeout(fetchData, 3000);
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

    const STATUS_CONFIG = {
        submitted: { label: t('applied'), icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30', dot: 'bg-amber-500' },
        assigned: { label: 'Assigned', icon: User, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30', dot: 'bg-blue-500' },
        in_progress: { label: 'Working on it', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30', dot: 'bg-emerald-500' },
        resolved: { label: t('statFixed'), icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-900/40', dot: 'bg-emerald-600' },
    };

    return (
        <>
            <div className="relative flex flex-col lg:flex-row gap-8">
                {/* Main Content Area */}
            <div className="flex-1 space-y-8 min-w-0">
                {/* Pro Top Navigation & Welcome Bar */}
                <div className="sticky top-0 z-30 space-y-4 pt-1 pb-4 bg-background/95 backdrop-blur-3xl -mx-2 px-2 transition-all duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-500 shrink-0">
                                <Sparkles size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-foreground tracking-tighter leading-none mb-1">
                                    {t('welcome')}, <span className="text-emerald-500">{currentUser?.name?.split(' ')[0] || 'Citizen'}</span>
                                </h1>
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] font-black uppercase tracking-[2px] text-muted-foreground">{t('portalActive')}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <NotificationBell />
                            <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
                            <div className="hidden sm:flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full shadow-sm whitespace-nowrap">
                                <MapPin size={12} className="text-emerald-500" />
                                <span className="text-[10px] font-black text-foreground uppercase tracking-wider">Booth #{safeBoothId}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <ServiceTabs activeTab={tab} onSelect={handleTabChange} t={t} />
                        
                        {/* Summary Stats Row - Sleek Inline Version */}
                        <div className="flex flex-1 items-center gap-3 overflow-x-auto no-scrollbar scrollbar-hide py-1">
                            <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl border border-border/50 group whitespace-nowrap hover:border-emerald-500/30 transition-colors">
                                <div className="size-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{grievances.length} {t('issues')}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl border border-border/50 group whitespace-nowrap hover:border-amber-500/30 transition-colors">
                                <div className="size-1.5 rounded-full bg-amber-500" />
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{schemes.length} {t('schemes')}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl border border-border/50 group whitespace-nowrap hover:border-blue-500/30 transition-colors">
                                <div className="size-1.5 rounded-full bg-blue-500" />
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{bulletins.length} {t('updates')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {tab === 'dashboard' ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                            {/* Insights and Bulletins */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <InsightsBanner insights={analytics?.insights} loading={loading} t={t} />
                                </div>
                                
                                {/* Live Government Bulletin Board */}
                                <div className="bg-card/40 backdrop-blur-md border border-border/60 rounded-[2rem] p-6 shadow-2xl shadow-black/5 relative overflow-hidden flex flex-col group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                        <Bell size={100} />
                                    </div>
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="size-2 rounded-full bg-rose-500 animate-ping" />
                                            <h3 className="text-[11px] font-black uppercase tracking-[4px] text-foreground">
                                                {t('bulletinTitle') || 'Updates'}
                                            </h3>
                                        </div>
                                        <span className="px-2 py-0.5 bg-muted rounded-md text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{bulletins.length} Active</span>
                                    </div>

                                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[220px] scrollbar-hide pr-1 relative z-10">
                                        {bulletins.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-10 scale-90">
                                                <Bell size={32} className="mb-4 text-muted-foreground" />
                                                <p className="text-[10px] font-black uppercase tracking-[4px]">No active alerts</p>
                                            </div>
                                        ) : (
                                            bulletins.map((b, i) => (
                                                <motion.div 
                                                    key={b.id || i}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className={`p-4 rounded-xl border flex gap-4 group cursor-default transition-all duration-300 ${
                                                        b.priority === 'CRITICAL' 
                                                        ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40 shadow-sm' 
                                                        : 'bg-muted/40 border-border/50 hover:border-emerald-500/30'
                                                    }`}
                                                >
                                                    <div className={`shrink-0 size-10 rounded-xl flex items-center justify-center border shadow-sm ${
                                                        b.priority === 'CRITICAL' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-muted border-border text-muted-foreground'
                                                    }`}>
                                                        {b.priority === 'CRITICAL' ? <ShieldAlert size={18} /> : <Info size={18} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-black uppercase tracking-tight text-foreground truncate mb-1">{b.title}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed line-clamp-2">{b.message}</p>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                                </div>
                            </div>
                            
                            {/* Stats */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-1">
                                <StatCard label={t('boothLabel') + " ID"} value={`#${safeBoothId}`} icon={Shield} color="#10b981" delay={0.1} t={t} />
                                <StatCard label={t('statPending')} value={analytics?.pending_issues || 0} icon={AlertCircle} color="#f59e0b" delay={0.2} t={t} />
                                <StatCard label={t('statFixed')} value={analytics?.resolved_issues || 0} icon={CheckCircle2} color="#10b981" delay={0.3} t={t} />
                                <StatCard label={t('statUptime')} value="99.9%" icon={Activity} color="#3b82f6" delay={0.4} t={t} />
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
                                                                    <Calendar size={12} className="text-emerald-500" /> {new Date(g.created_at || Date.now()).toLocaleDateString()} at {new Date(g.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                                                    {g.after_images && g.after_images.length > 0 && (
                                        <div className="mt-6 p-6 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10">
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[3px] mb-4 flex items-center gap-2">
                                                <ShieldCheck size={14} /> Impact Evidence (After Images)
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                {g.after_images.map((img, i) => (
                                                    <div key={i} className="aspect-video rounded-3xl overflow-hidden border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                                                        <img src={img} alt="Resolution" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {g.resolution_note && (
                                                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                                                            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">{t('resolutionNote') || 'Resolution Note'}</p>
                                                                            <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium italic">"{g.resolution_note}"</p>
                                                                        </div>
                                                                    )}

                                                                    {/* Visual Evidence / Attachments */}
                                                                    {(g.attachments?.length > 0 || g.photo_url) && (
                                                                        <div className="space-y-3">
                                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Visual Evidence</p>
                                                                            <div className="flex flex-wrap gap-3">
                                                                                {(g.attachments || (g.photo_url ? [g.photo_url] : [])).map((url, i) => (
                                                                                    <motion.div 
                                                                                        key={i}
                                                                                        whileHover={{ scale: 1.05 }}
                                                                                        className="size-24 rounded-xl border border-border overflow-hidden bg-muted shadow-sm cursor-zoom-in"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            window.open(url, '_blank');
                                                                                        }}
                                                                                    >
                                                                                        {url.match(/\.(mp4|webm|ogg)$/) ? (
                                                                                            <div className="w-full h-full flex items-center justify-center text-emerald-500 bg-emerald-500/5">
                                                                                                <Film size={20} />
                                                                                            </div>
                                                                                        ) : (
                                                                                            <img src={url} alt="Grievance evidence" className="w-full h-full object-cover" />
                                                                                        )}
                                                                                    </motion.div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {g.ai_vision_details && (
                                                                        <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <Sparkles size={12} className="text-indigo-500" />
                                                                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">AI Vision Analysis</p>
                                                                            </div>
                                                                            <p className="text-[11px] text-muted-foreground italic leading-relaxed">"{g.ai_vision_details}"</p>
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
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-2xl mx-auto">
                            <div className="bg-card rounded-[2.5rem] p-8 border border-border shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:rotate-12 transition-transform duration-1000">
                                    <Send size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-5 mb-10">
                                        <div className="size-16 rounded-2xl bg-foreground flex items-center justify-center text-emerald-500 shadow-2xl shadow-foreground/20 border border-white/10 group-hover:scale-105 transition-transform duration-500">
                                            <Send size={32} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-foreground tracking-tighter leading-none mb-2">
                                                {t('reportTitle')}
                                            </h2>
                                            <p className="text-[10px] uppercase tracking-[3px] text-muted-foreground font-black opacity-60">{t('portalTitle')}</p>
                                        </div>
                                    </div>

                                        {submitted ? (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="p-10 text-center space-y-6"
                                            >
                                                <div className="size-24 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                                                    <CheckCircle2 size={48} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-2">Report Submitted</h3>
                                                    <p className="text-xs text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">
                                                        Your report has been securely logged with ID <span className="text-foreground font-black">#{submitted.id}</span>. Our AI is currently routing it to the nearest field officer.
                                                    </p>
                                                </div>
                                                <button 
                                                    onClick={() => setSubmitted(null)}
                                                    className="px-8 py-3 bg-foreground text-background rounded-xl font-black uppercase tracking-[3px] text-[10px] hover:opacity-90 transition-all active:scale-95"
                                                >
                                                    Submit Another Report
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <div className="space-y-8">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[2.5px] text-foreground/70 ml-1">
                                                        {t('categoryLabel')}
                                                    </label>
                                                    <div className="flex flex-wrap gap-3">
                                                        {['Infrastructure', 'Health', 'Security', 'Sanitation', 'Utility'].map(cat => (
                                                            <button 
                                                                key={cat}
                                                                onClick={() => setCategory(cat)}
                                                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[1.5px] border transition-all duration-300 ${
                                                                    category === cat 
                                                                    ? 'bg-foreground border-foreground text-background shadow-xl shadow-foreground/20 scale-[1.02]' 
                                                                    : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:border-emerald-500/50 hover:bg-emerald-500/5'
                                                                }`}
                                                            >
                                                                {t('categories')?.[cat] || cat}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[2.5px] text-foreground/70 ml-1">
                                                        {t('descriptionLabel')}
                                                    </label>
                                                    <div className="relative group/textarea">
                                                        <textarea 
                                                            value={description}
                                                            onChange={(e) => {
                                                                setDescription(e.target.value);
                                                                if (error) setError(null);
                                                            }}
                                                            placeholder={t('descTooltip')}
                                                            className="w-full bg-muted/30 border border-border rounded-2xl p-6 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-medium h-40 resize-none placeholder:text-muted-foreground/30 text-foreground"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Media Upload */}
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black uppercase tracking-[2.5px] text-foreground/70 ml-1">Visual Evidence</label>
                                                    <div className="grid grid-cols-4 gap-4">
                                                        <AnimatePresence>
                                                            {selectedFiles.map((url, i) => (
                                                                <motion.div 
                                                                    key={url}
                                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                    className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-muted group/file shadow-sm"
                                                                >
                                                                    {url.match(/\.(mp4|webm|ogg)$/) ? (
                                                                        <div className="w-full h-full flex items-center justify-center text-emerald-500 bg-emerald-500/5">
                                                                            <Film size={24} />
                                                                        </div>
                                                                    ) : (
                                                                        <img src={url} alt="Upload" className="w-full h-full object-cover transition-transform duration-500 group-hover/file:scale-110" />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <button 
                                                                            onClick={() => removeFile(url)}
                                                                            className="p-2 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                                                                        >
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </AnimatePresence>
                                                        {selectedFiles.length < 4 && (
                                                            <label className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-emerald-500/50 hover:bg-emerald-500/5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group/upload">
                                                                <input type="file" multiple accept="image/*,video/*" onChange={handleFileSelect} className="hidden" disabled={uploading} />
                                                                {uploading ? (
                                                                    <Loader2 size={24} className="text-emerald-500 animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover/upload:bg-emerald-500/10 group-hover/upload:text-emerald-500 transition-all">
                                                                            <Upload size={24} />
                                                                        </div>
                                                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider group-hover/upload:text-emerald-500 transition-colors">Upload</span>
                                                                    </>
                                                                )}
                                                            </label>
                                                        )}
                                                    </div>
                                                    
                                                    {aiVisionAnalysis && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl shadow-inner relative overflow-hidden"
                                                        >
                                                            <div className="absolute top-0 right-0 p-4 opacity-5"><Sparkles size={40} /></div>
                                                            <div className="flex items-center gap-3 mb-2 relative z-10">
                                                                <div className="size-6 rounded-full bg-emerald-500 flex items-center justify-center text-background">
                                                                    <Sparkles size={12} />
                                                                </div>
                                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">AI Vision Insight</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground leading-relaxed font-medium relative z-10 italic">
                                                                "{aiVisionAnalysis}"
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </div>

                                                {error && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, scale: 0.95 }} 
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-500"
                                                    >
                                                        <AlertCircle size={20} />
                                                        <p className="text-[11px] font-black uppercase tracking-wider">{error}</p>
                                                    </motion.div>
                                                )}

                                                <button 
                                                    onClick={handleSubmit} 
                                                    disabled={!description || submitting}
                                                    className="w-full py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-[4px] text-[11px] flex items-center justify-center gap-4 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-2xl shadow-foreground/10 group/button"
                                                >
                                                    {submitting ? (
                                                        <RefreshCw className="animate-spin" size={20} />
                                                    ) : (
                                                        <>
                                                            <span>{t('submitReport') || 'Submit Report'}</span> 
                                                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase flex items-center gap-4">
                                    <div className="size-1 bg-emerald-500 rounded-full" />
                                    Government Schemes
                                </h3>
                                <div className="flex items-center gap-2 bg-muted px-4 py-1.5 rounded-full border border-border">
                                    <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Live Catalog</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {schemes.map((scheme, idx) => {
                                    const isApplied = applications.some(a => a.scheme_id === scheme.id);
                                    return (
                                        <motion.div 
                                            key={scheme.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-card p-8 rounded-[2.5rem] border border-border hover:border-emerald-500/30 transition-all duration-500 group flex flex-col justify-between shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] -rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                                <BadgeCheck size={100} />
                                            </div>

                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-6">
                                                    <span className="px-4 py-1.5 bg-muted rounded-full text-[10px] font-black uppercase tracking-[2px] text-muted-foreground border border-border">
                                                        {scheme.category}
                                                    </span>
                                                    {isApplied && (
                                                        <motion.span 
                                                            initial={{ scale: 0.8 }}
                                                            animate={{ scale: 1 }}
                                                            className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-[2px] flex items-center gap-2 border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                                                        >
                                                            <BadgeCheck size={14} /> {t('applied')}
                                                        </motion.span>
                                                    )}
                                                </div>
                                                <h3 className="text-2xl font-black text-foreground transition-colors mb-4 tracking-tighter leading-tight group-hover:text-emerald-500">{scheme.name}</h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed mb-8 font-medium italic opacity-80 group-hover:opacity-100 transition-opacity">"{scheme.desc}"</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 pt-8 border-t border-border relative z-10">
                                                <button 
                                                    onClick={() => handleApplyScheme(scheme.id)}
                                                    disabled={isApplied || applying === scheme.id}
                                                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] flex items-center justify-center gap-3 transition-all duration-500 ${
                                                        isApplied 
                                                        ? 'bg-muted text-muted-foreground cursor-not-allowed border border-border' 
                                                        : 'bg-foreground text-background hover:bg-emerald-600 hover:text-white shadow-xl shadow-foreground/10 active:scale-95'
                                                    }`}
                                                >
                                                    {applying === scheme.id ? <RefreshCw className="animate-spin" size={16} /> : isApplied ? <CheckCircle2 size={18} /> : <ChevronRight size={18} />}
                                                    {isApplied ? t('alreadyApplied') : t('applyNow')}
                                                </button>
                                                <button className="size-14 rounded-2xl bg-muted text-muted-foreground hover:text-foreground hover:bg-emerald-500 transition-all border border-border flex items-center justify-center group/info">
                                                    <Info size={20} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ) : tab === 'development' ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                            {/* AI Progress Analysis Header */}
                            <div className="bg-card rounded-[2.5rem] border border-border p-8 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-50" />
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                                    <Sparkles size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="size-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-background shadow-xl shadow-emerald-500/20">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-foreground tracking-tighter uppercase">{t('aiProgressAnalysis') || 'AI Progress Analysis'}</h3>
                                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('realtimeManifestoSync') || 'Real-time Manifesto Sync'}</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed font-medium bg-muted/30 p-5 rounded-2xl border border-border/50 backdrop-blur-sm">
                                        Based on the <span className="text-foreground font-black">2024 Manifesto Analysis</span>, Booth #{safeBoothId} has achieved a <span className="text-emerald-500 font-black">68% completion rate</span>. Our NLP engines identified <span className="text-foreground font-medium">positive sentiment</span> regarding health infrastructure, while road connectivity remains a high-priority citizen demand.
                                    </p>
                                </div>
                            </div>

                            {/* Manifesto Tracker */}
                            <div className="space-y-8">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase flex items-center gap-4">
                                        <div className="size-1 bg-emerald-500 rounded-full" />
                                        Manifesto Tracker
                                    </h3>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Election Cycle 2024-29</span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { title: "24/7 Water Supply", progress: 90, status: "Near Completion", icon: Droplets, color: "emerald" },
                                        { title: "Smart Classrooms", progress: 100, status: "Completed", icon: BookOpen, color: "emerald" },
                                        { title: "Pothole-free Roads", progress: 60, status: "In Progress", icon: MapPin, color: "amber" },
                                        { title: "Solar Street Lights", progress: 100, status: "Completed", icon: Sun, color: "emerald" },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-card p-6 rounded-[2rem] border border-border hover:border-emerald-500/30 transition-all duration-500 group shadow-sm hover:shadow-xl hover:shadow-emerald-500/5">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`size-12 rounded-xl bg-${item.color}-500/10 text-${item.color}-500 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                        <item.icon size={22} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-foreground tracking-tight">{item.title}</h4>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest text-${item.color}-500`}>{item.status}</span>
                                                    </div>
                                                </div>
                                                <span className="text-xl font-black text-foreground/20 group-hover:text-emerald-500/20 transition-colors">{item.progress}%</span>
                                            </div>
                                            
                                            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-6">
                                                <motion.div 
                                                    initial={{ width: 0 }} 
                                                    animate={{ width: `${item.progress}%` }} 
                                                    transition={{ duration: 1.5, delay: i * 0.1, ease: "circOut" }} 
                                                    className={`h-full bg-${item.color}-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]`} 
                                                />
                                            </div>
                                            
                                            <div className="flex items-center gap-2 pt-5 border-t border-border">
                                                {userFeedback[`manifesto-${i}`] ? (
                                                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 py-2 rounded-xl bg-emerald-500/10 text-[9px] font-black uppercase tracking-widest text-emerald-600 text-center border border-emerald-500/20">
                                                        Feedback Received
                                                    </motion.div>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => handleFeedback(`manifesto-${i}`)}
                                                            className="flex-1 py-2 rounded-xl bg-muted text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-emerald-500 hover:text-white transition-all"
                                                        >
                                                            Agree
                                                        </button>
                                                        <button 
                                                            onClick={() => handleFeedback(`manifesto-${i}`)}
                                                            className="flex-1 py-2 rounded-xl bg-muted text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-rose-500 hover:text-white transition-all"
                                                        >
                                                            Disagree
                                                        </button>
                                                    </>
                                                )}
                                                <button className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background transition-all"><MessageCircle size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Before vs After Showcase */}
                            <div className="space-y-8">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase flex items-center gap-4">
                                        <div className="size-1 bg-emerald-500 rounded-full" />
                                        Impact Showcase
                                    </h3>
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Visual Verification</span>
                                </div>

                                <div className="space-y-10">
                                    {[
                                        // Merge resolved grievances that have after_images with mock showcase items
                                        ...grievances.filter(g => g.status === 'resolved' && g.after_images?.length > 0).map(g => ({
                                            id: `real-${g.id}`,
                                            title: g.description,
                                            before: "Initial report uploaded by citizen.",
                                            after: g.resolution_note,
                                            imgBefore: g.photo_url || (g.attachments?.[0]),
                                            imgAfter: g.after_images[0]
                                        })),
                                        { 
                                            id: "impact-0",
                                            title: "Sector 17 Community Clinic", 
                                            before: "Basic first aid, limited hours, no specialized care.", 
                                            after: "24/7 emergency, maternity ward, and telemedicine integration.", 
                                            imgBefore: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=500&h=300", 
                                            imgAfter: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&q=80&w=500&h=300" 
                                        },
                                        { 
                                            id: "impact-1",
                                            title: "Main Arterial Road", 
                                            before: "Frequent waterlogging, severe potholes, no pedestrian walkway.", 
                                            after: "New drainage system, asphalt paving, and solar-lit sidewalks.", 
                                            imgBefore: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=500&h=300", 
                                            imgAfter: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=500&h=300" 
                                        }
                                    ].map((item, i) => (
                                        <div key={item.id} className="bg-card rounded-[2.5rem] border border-border overflow-hidden group shadow-sm hover:shadow-2xl transition-all duration-700">
                                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                                                <h4 className="text-lg font-black text-foreground uppercase tracking-tight">{item.title}</h4>
                                                <div className="flex items-center gap-3">
                                                    {/* Voting Section */}
                                                    <div className="flex items-center gap-1.5 border-r border-border pr-3">
                                                        {userFeedback[item.id] ? (
                                                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${userFeedback[item.id] === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {userFeedback[item.id] === 'up' ? 'Voted Up' : 'Voted Down'}
                                                                </span>
                                                            </motion.div>
                                                        ) : (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleFeedback(item.id, 'up')}
                                                                    className="size-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-emerald-500 hover:border-emerald-500/30 transition-all shadow-sm"
                                                                >
                                                                    <ThumbsUp size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleFeedback(item.id, 'down')}
                                                                    className="size-9 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 transition-all shadow-sm"
                                                                >
                                                                    <ThumbsDown size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Verification Section */}
                                                    <div className="pl-1">
                                                        {verifications[item.id] ? (
                                                            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                                                <BadgeCheck size={14} className="text-emerald-500" />
                                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Verified</span>
                                                            </motion.div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleVerify(item.id)}
                                                                className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                                                            >
                                                                <Check size={12} strokeWidth={3} /> Verify Work
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                                                <div className="p-8 relative">
                                                    <div className="absolute top-10 right-10 bg-rose-500/90 text-white text-[10px] font-black uppercase tracking-[2px] px-4 py-1.5 rounded-full backdrop-blur-md z-10 shadow-lg">Legacy</div>
                                                    <div className="aspect-video rounded-3xl overflow-hidden mb-6 border border-border relative grayscale-[40%] group-hover:grayscale-0 transition-all duration-700">
                                                        <img src={item.imgBefore} alt="Before" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/10" />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed italic border-l-2 border-rose-500/30 pl-4">"{item.before}"</p>
                                                </div>
                                                <div className="p-8 relative bg-emerald-500/[0.02]">
                                                    <div className="absolute top-10 right-10 bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-[2px] px-4 py-1.5 rounded-full backdrop-blur-md z-10 shadow-lg">Upgraded</div>
                                                    <div className="aspect-video rounded-3xl overflow-hidden mb-6 border border-emerald-500/20 relative shadow-2xl shadow-emerald-500/10">
                                                        <img src={item.imgAfter} alt="After" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                                    </div>
                                                    <p className="text-sm text-foreground font-bold leading-relaxed border-l-2 border-emerald-500/50 pl-4">{item.after}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : tab === 'profile' ? (
                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="max-w-4xl mx-auto">
                                <VoterProfileSidebar 
                                    user={currentUser} 
                                    analytics={analytics} 
                                    t={t} 
                                    loading={loading}
                                    isFullView={true}
                                />
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                {/* Footer Insight for Citizen */}
                <div className="p-8 text-center bg-card/30 backdrop-blur-md rounded-[2.5rem] border border-border/40 group hover:bg-card/50 transition-all duration-500">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[4px]">
                            {t('secureConnection') || 'Verified Booth Connection'}
                        </p>
                    </div>
                    <p className="text-[9px] text-muted-foreground/60 font-medium">
                        {t('lastSync')}: {new Date().toLocaleTimeString()} • {t('encrypted')}
                    </p>
                </div>
            </div>

            {/* Desktop Sidebar (Only on main dashboard view to reduce clutter) */}
            <div className={`hidden lg:block ${tab !== 'dashboard' ? 'hidden' : ''}`}>
                <VoterProfileSidebar 
                    user={currentUser} 
                    analytics={analytics} 
                    t={t} 
                    loading={loading}
                />
            </div>
        </div>

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
        </>
    );
}
