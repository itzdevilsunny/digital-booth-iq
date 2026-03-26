import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, Lock, Fingerprint, ArrowRight, ShieldCheck, 
    Verified, Globe, Cpu, Zap, Radio, 
    ChevronRight, Key, UserCheck, ShieldClose
} from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roleKey = searchParams.get('role') || 'citizen';
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const isCitizen = roleKey === 'citizen';

    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulated Auth for Demo - Instant entry as requested
        setTimeout(() => {
            setLoading(false);
            setShowSuccess(true);
            setTimeout(() => {
                navigate(`/${roleKey}`);
            }, 800);
        }, 1200);
    };

    return (
        <div className={`min-h-screen w-full flex overflow-hidden font-display selection:bg-emerald-100 selection:text-emerald-900 ${
            isCitizen ? 'bg-stone-50' : 'bg-[#0a0a0a] text-white'
        }`}>
            {/* Left Panel - High Fidelity Hero Section */}
            <div className={`hidden lg:flex flex-[0.45] flex-col justify-between p-16 relative overflow-hidden ${
                isCitizen ? 'bg-emerald-600 text-white shadow-2xl z-20' : 'bg-stone-900/50 border-r border-white/5'
            }`}>
                {/* Background Textures */}
                <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
                    <div className="size-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                </div>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 mb-16"
                    >
                        <div className="size-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg">
                            <ShieldCheck size={28} className={isCitizen ? 'text-white' : 'text-emerald-500'} />
                        </div>
                        <div>
                            <p className="text-xl font-black tracking-tight leading-none">BoothIQ</p>
                            <p className="text-[10px] font-bold uppercase tracking-[4px] opacity-60">Intelligence Hub</p>
                        </div>
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-6xl font-bold leading-[0.9] tracking-tighter mb-8 text-balance"
                    >
                        TRUSTED <br />
                        <span className={isCitizen ? 'text-white/50' : 'text-emerald-500'}>GOVERNANCE</span>
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`text-lg mb-12 max-w-sm font-medium leading-relaxed ${isCitizen ? 'text-white/70' : 'text-stone-400'}`}
                    >
                        {isCitizen 
                            ? 'Lodge grievances, track community evolution, and engage with your sector representatives securely.' 
                            : 'Access mission-critical field reconnaissance and tactical deployment tools for real-time sector control.'}
                    </motion.p>
                </div>

                <div className="relative z-10">
                    <div className="space-y-8">
                        {[
                            { icon: Fingerprint, text: 'Biometric Handshake Active', sub: 'AES-256 Protocol' },
                            { icon: Radio, text: 'Encrypted Node Connection', sub: 'Lat: 1.2ms / Secure' },
                            { icon: Verified, text: 'E-Sarthi Governance Node', sub: 'V4.0 Compliance' }
                        ].map((item, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                className="flex items-center gap-5 group cursor-default"
                            >
                                <div className={`size-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${isCitizen ? 'bg-white text-emerald-600' : 'bg-stone-800 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-stone-900'}`}>
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold tracking-tight">{item.text}</p>
                                    <p className={`text-[10px] uppercase font-bold tracking-widest opacity-40`}>{item.sub}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center justify-between text-[10px] font-bold uppercase tracking-[4px] opacity-40">
                    <span>Alpha_Build_v5.0</span>
                    <span>© 2026 BoothIQ System</span>
                </div>
            </div>

            {/* Right Panel - Stunning Form Interface */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                <div className={`absolute top-0 right-0 p-12 opacity-5 ${isCitizen ? 'text-stone-200' : 'text-stone-800'}`}>
                    <Cpu size={300} strokeWidth={1} />
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="mb-14 text-center">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="inline-flex relative mb-8"
                        >
                            <div className={`size-20 rounded-3xl flex items-center justify-center shadow-2xl ${isCitizen ? 'bg-white border border-stone-100 text-emerald-600 shadow-emerald-500/10' : 'bg-stone-900 border border-white/5 text-emerald-500'}`}>
                                <UserCheck size={40} />
                            </div>
                            <div className="absolute -top-2 -right-2 size-6 rounded-full bg-emerald-500 border-4 border-white dark:border-[#0a0a0a] shadow-lg animate-pulse" />
                        </motion.div>
                        
                        <h2 className={`text-4xl font-bold tracking-tighter mb-2 ${isCitizen ? 'text-stone-900' : 'text-white'}`}>
                            Access Request
                        </h2>
                        <p className={`text-sm font-medium ${isCitizen ? 'text-stone-400' : 'text-stone-600'}`}>
                            Synchronize with the {isCitizen ? 'Citizen Hub' : 'Tactical Admin'} core.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-2">
                                <label className={`text-[10px] font-bold uppercase tracking-[3px] ${isCitizen ? 'text-stone-400' : 'text-stone-600'}`}>
                                    Strategic Identifier
                                </label>
                            </div>
                            <div className="relative group">
                                <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${isCitizen ? 'text-stone-300 group-focus-within:text-emerald-600' : 'text-stone-700 group-focus-within:text-emerald-500'}`} size={20} />
                                <input 
                                    type="text" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter identifier (or leave blank)"
                                    className={`w-full pl-14 pr-6 py-5 rounded-[2rem] border transition-all outline-none font-medium shadow-sm active:scale-[0.99] ${
                                        isCitizen 
                                        ? 'bg-white border-stone-100 focus:border-emerald-600 focus:ring-8 focus:ring-emerald-500/5 text-stone-900 placeholder:text-stone-200' 
                                        : 'bg-[#111111] border-white/5 focus:border-emerald-500/50 text-white placeholder:text-stone-800 focus:ring-8 focus:ring-emerald-500/5'
                                    }`}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-2">
                                <label className={`text-[10px] font-bold uppercase tracking-[3px] ${isCitizen ? 'text-stone-400' : 'text-stone-600'}`}>
                                    Access Key
                                </label>
                            </div>
                            <div className="relative group">
                                <Key className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${isCitizen ? 'text-stone-300 group-focus-within:text-emerald-600' : 'text-stone-700 group-focus-within:text-emerald-500'}`} size={20} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter key (any works)"
                                    className={`w-full pl-14 pr-6 py-5 rounded-[2rem] border transition-all outline-none font-medium shadow-sm active:scale-[0.99] ${
                                        isCitizen 
                                        ? 'bg-white border-stone-100 focus:border-emerald-600 focus:ring-8 focus:ring-emerald-500/5 text-stone-900 placeholder:text-stone-200' 
                                        : 'bg-[#111111] border-white/5 focus:border-emerald-500/50 text-white placeholder:text-stone-800 focus:ring-8 focus:ring-emerald-500/5'
                                    }`}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit"
                                disabled={loading || showSuccess}
                                className={`w-full py-5 rounded-[2rem] font-bold text-sm uppercase tracking-[4px] flex items-center justify-center gap-3 transition-all transform active:scale-[0.97] shadow-2xl relative overflow-hidden group ${
                                    isCitizen 
                                    ? 'bg-emerald-600 text-white hover:bg-stone-900 shadow-emerald-500/20' 
                                    : 'bg-emerald-500 text-stone-950 hover:bg-white shadow-emerald-500/5'
                                }`}
                            >
                                <AnimatePresence mode="wait">
                                    {showSuccess ? (
                                        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-2">
                                            <ShieldCheck size={20} />
                                            <span>BYPASS SUCCESS</span>
                                        </motion.div>
                                    ) : loading ? (
                                        <div className="size-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-3 group-hover:translate-x-1 transition-transform">
                                            <span>INITIALIZE HUB</span>
                                            <ArrowRight size={18} />
                                        </div>
                                    )}
                                </AnimatePresence>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-16 flex items-center justify-center gap-8 py-8 border-t border-stone-100/50">
                        <div className="flex items-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                            <Radio size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Global Sec.</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-crosshair">
                            <ShieldClose size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Threat Matrix</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
