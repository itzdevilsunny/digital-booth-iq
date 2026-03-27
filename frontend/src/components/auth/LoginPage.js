import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Fingerprint, ShieldCheck,
    Verified, Cpu, Radio,
    ChevronRight, Key, UserCheck, ShieldClose,
    Users, ChevronDown, AlertCircle
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { getVoters, getUsers } from '../../api';

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useUser();
    const [searchParams] = useSearchParams();
    const roleKey = searchParams.get('role') || 'citizen';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [demoUsers, setDemoUsers] = useState([]);
    const [selectedDemoUser, setSelectedDemoUser] = useState(null);
    const [showSelector, setShowSelector] = useState(false);

    useEffect(() => {
        const fetchDemoData = async () => {
            try {
                if (roleKey === 'citizen') {
                    const voters = await getVoters(17);
                    setDemoUsers(voters.slice(0, 10)); // Top 10 for demo
                } else {
                    const users = await getUsers();
                    const filtered = users.filter(u => u.role === roleKey);
                    setDemoUsers(filtered.length > 0 ? filtered : [{ id: `dummy-${roleKey}`, name: `Demo ${roleKey}`, role: roleKey }]);
                }
            } catch (e) {
                console.error('Demo data fetch error:', e);
                setDemoUsers([{ id: `dummy-${roleKey}`, name: `Demo ${roleKey}`, role: roleKey }]);
            }
        };
        fetchDemoData();
    }, [roleKey]);

    const handleLogin = (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Security: Always ensure role is present in the payload
        const userToLogin = selectedDemoUser 
            ? { ...selectedDemoUser, role: roleKey } 
            : {
                id: email || `dummy-${roleKey}`,
                name: email.split('@')[0] || `Demo ${roleKey}`,
                role: roleKey,
                email: email || `${roleKey}@boothiq.ai`,
                password: password // Include password if entered
            };

        // Async Auth - Handle real token generation
        (async () => {
            try {
                await login(userToLogin);
                setLoading(false);
                setShowSuccess(true);
                setTimeout(() => {
                    navigate(`/${roleKey}`);
                }, 800);
            } catch (err) {
                console.error("Login failed:", err);
                setLoading(false);
                
                // Enhanced Error Handling for [object Object] issues
                let errorMsg = "Login failed. Please check credentials.";
                if (err.response?.data?.detail) {
                    errorMsg = typeof err.response.data.detail === 'string' 
                        ? err.response.data.detail 
                        : JSON.stringify(err.response.data.detail);
                } else if (err.message) {
                    errorMsg = err.message;
                }
                
                setError(errorMsg);
            }
        })();
    };

    const handleDemoSelect = (user) => {
        setSelectedDemoUser(user);
        setEmail(user.email || user.id);
        setShowSelector(false);
    };

    return (
        <div className="min-h-screen w-full flex overflow-hidden font-display bg-[#0c0c0c] text-white selection:bg-emerald-500/30 selection:text-white">
            {/* Left Panel - High Fidelity Hero Section */}
            <div className="hidden lg:flex flex-[0.45] flex-col justify-between p-16 relative overflow-hidden bg-[#0c0c0c]/50 border-r border-white/5">
                {/* Background Textures */}
                <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]" />
                    <div className="size-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                </div>

                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4 mb-20 group cursor-pointer"
                        onClick={() => navigate('/')}
                    >
                        <div className="size-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:bg-white group-hover:text-black transition-all">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <p className="text-xl font-black tracking-tight leading-none uppercase">BoothIQ</p>
                            <p className="text-[10px] font-bold uppercase tracking-[4px] opacity-40">Management Portal</p>
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-6xl font-black leading-[0.9] tracking-tighter mb-8 text-balance uppercase"
                    >
                        SECURE <br />
                        <span className="text-emerald-500">Login</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg mb-12 max-w-sm font-medium leading-relaxed text-white/40 uppercase tracking-tight italic"
                    >
                        Access booth management tools and voter insights in real-time.
                    </motion.p>
                </div>

                <div className="relative z-10">
                    <div className="space-y-8">
                        {[
                            { icon: Fingerprint, text: 'Secure Login Active', sub: 'AES-256 Encryption' },
                            { icon: Radio, text: 'Network Connected', sub: 'Verified Connection' },
                            { icon: Verified, text: 'BoothIQ Management System', sub: 'Compliance Verified' }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + (i * 0.1) }}
                                className="flex items-center gap-5 group cursor-default"
                            >
                                <div className="size-10 rounded-xl flex items-center justify-center transition-all shadow-sm bg-white/5 border border-white/5 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black group-hover:scale-110 duration-500">
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold tracking-tight uppercase">{item.text}</p>
                                    <p className="text-[10px] uppercase font-bold tracking-widest opacity-30">{item.sub}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center justify-between text-[10px] font-bold uppercase tracking-[4px] opacity-20">
                    <span>Version 5.2</span>
                    <span>© 2026 BoothIQ Platform</span>
                </div>
            </div>

            {/* Right Panel - Form Interface */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative bg-[#0c0c0c]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.02),transparent)] pointer-events-none" />
                
                <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-emerald-500 rotate-12">
                    <Cpu size={400} strokeWidth={1} />
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
                            <div className="size-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl text-emerald-500 backdrop-blur-xl group cursor-pointer hover:border-emerald-500/50 transition-colors duration-500">
                                <UserCheck size={40} className="group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <div className="absolute -top-2 -right-2 size-6 rounded-full bg-emerald-500 border-4 border-[#0c0c0c] shadow-lg animate-pulse" />
                        </motion.div>
                        
                        <h2 className="text-4xl font-black tracking-tighter mb-2 text-white uppercase">
                            User Login
                        </h2>
                        <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.3em]">
                            Logging into <span className="text-emerald-500">{roleKey.replace('_', ' ')}</span> dashboard.
                        </p>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3"
                        >
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {/* Demo Selector */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between px-2 mb-3">
                            <label className="text-[10px] font-bold uppercase tracking-[4px] text-emerald-500/60">
                                Demo {roleKey.replace('_', ' ')} Selector
                            </label>
                        </div>
                        <div className="relative">
                            <button 
                                type="button"
                                onClick={() => setShowSelector(!showSelector)}
                                className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3">
                                    <Users size={18} className="text-white/20 group-hover:text-emerald-500 transition-colors" />
                                    <span className="text-sm font-bold uppercase tracking-wider text-white/80">
                                        {selectedDemoUser ? selectedDemoUser.name : `Select a ${roleKey.replace('_', ' ')} for demo`}
                                    </span>
                                </div>
                                <ChevronDown size={18} className={`text-white/20 transition-transform duration-300 ${showSelector ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showSelector && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute z-50 top-full mt-2 w-full max-h-60 overflow-y-auto bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-2 scrollbar-hide"
                                    >
                                        {demoUsers.map((user) => (
                                            <button
                                                key={user.id}
                                                type="button"
                                                onClick={() => handleDemoSelect(user)}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-emerald-500/10 transition-colors text-left group"
                                            >
                                                <div>
                                                    <p className="text-sm font-bold text-white uppercase tracking-tight">{user.name}</p>
                                                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{user.id}</p>
                                                </div>
                                                {selectedDemoUser?.id === user.id && <ShieldCheck size={16} className="text-emerald-500" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <p className="mt-3 px-2 text-[9px] font-bold text-white/20 uppercase tracking-widest leading-relaxed">
                            Pick any {roleKey.replace('_', ' ')} to see their specific profile and data.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[10px] font-bold uppercase tracking-[4px] text-white/40">
                                    User ID / Email
                                </label>
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-300 text-white/20 group-focus-within:text-emerald-500" size={20} />
                                <input 
                                    type="text" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter identifier"
                                    className="w-full pl-16 pr-6 py-6 rounded-[2rem] border bg-white/5 border-white/5 focus:border-emerald-500/50 text-white placeholder:text-white/10 focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none font-bold text-sm tracking-widest uppercase"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[10px] font-bold uppercase tracking-[4px] text-white/40">
                                    Password
                                </label>
                            </div>
                            <div className="relative group">
                                <Key className="absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-300 text-white/20 group-focus-within:text-emerald-500" size={20} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter secure password"
                                    className="w-full pl-16 pr-6 py-6 rounded-[2rem] border bg-white/5 border-white/5 focus:border-emerald-500/50 text-white placeholder:text-white/10 focus:ring-8 focus:ring-emerald-500/5 transition-all outline-none font-bold text-sm tracking-widest uppercase"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit"
                                disabled={loading || showSuccess}
                                className="w-full py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[5px] flex items-center justify-center gap-4 transition-all transform active:scale-[0.98] shadow-2xl relative overflow-hidden group bg-emerald-600 text-white hover:bg-white hover:text-black border border-white/5"
                            >
                                <AnimatePresence mode="wait">
                                    {showSuccess ? (
                                        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="flex items-center gap-2">
                                            <ShieldCheck size={20} />
                                            <span>Login Successful</span>
                                        </motion.div>
                                    ) : loading ? (
                                        <div className="size-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-4 group-hover:translate-x-1 transition-transform duration-500">
                                            <span>Login Now</span>
                                            <ChevronRight size={20} />
                                        </div>
                                    )}
                                </AnimatePresence>
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </form>

                    <div className="mt-16 flex items-center justify-center gap-10 py-10 border-t border-white/5">
                        <div className="flex items-center gap-3 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-crosshair">
                            <Radio size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-[3px]">System Security</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-crosshair">
                            <ShieldClose size={14} className="text-rose-500" />
                            <span className="text-[10px] font-black uppercase tracking-[3px]">Security Status</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;

