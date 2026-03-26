import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Fingerprint, ArrowRight, ShieldCheck, Verified } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const roleKey = searchParams.get('role') || 'citizen';
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const isCitizen = roleKey === 'citizen';

    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulated Auth for Demo
        setTimeout(() => {
            setLoading(false);
            navigate(`/${roleKey}`);
        }, 1500);
    };

    return (
        <div className={`min-h-screen w-full flex overflow-hidden font-body ${
            isCitizen ? 'bg-stone-50' : 'bg-stone-950 text-white'
        }`}>
            {/* Left Panel - Hero/Context (Desktop Only) */}
            <div className={`hidden lg:flex flex-[0.4] flex-col justify-center p-16 relative overflow-hidden border-r ${
                isCitizen ? 'bg-emerald-600 text-white' : 'bg-stone-900 border-white/5'
            }`}>
                <div className="relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest mb-8 border border-white/10"
                    >
                        <ShieldCheck size={14} /> Secure Access Protocol
                    </motion.div>
                    
                    <h1 className="text-5xl font-display font-bold leading-tight mb-4">
                        {isCitizen ? 'Citizen Identity' : 'Operational Command'} <br />
                        <span className={isCitizen ? 'text-emerald-100' : 'text-emerald-500'}>BoothIQ Central</span>
                    </h1>
                    
                    <p className={`text-lg mb-12 max-w-sm ${isCitizen ? 'text-emerald-50 text-opacity-80' : 'text-stone-400 font-light'}`}>
                        {isCitizen 
                            ? 'Login to securely lodge grievances and track community development in real-time.' 
                            : 'Access mission-critical field reconnaissance and tactical deployment tools.'}
                    </p>

                    <div className="space-y-6">
                        {[
                            { icon: Fingerprint, text: 'Biometric Verification Enabled' },
                            { icon: Lock, text: '256-bit AES Encryption' },
                            { icon: Verified, text: 'Certified Compliance Node' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 opacity-70">
                                <item.icon size={20} className={isCitizen ? 'text-white' : 'text-emerald-500'} />
                                <span className="text-sm font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-grid-pattern" />
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10 text-center lg:text-left">
                        <div className="lg:hidden animate-bounce inline-flex size-14 rounded-2xl bg-emerald-600 text-white items-center justify-center shadow-xl shadow-emerald-500/20 mb-6">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className={`text-3xl font-display font-bold mb-2 ${isCitizen ? 'text-stone-900' : 'text-white'}`}>
                            Welcome Back
                        </h2>
                        <p className={`text-stone-500 ${isCitizen ? 'text-stone-400' : 'text-stone-500'}`}>
                            Please enter your credentials to authenticate.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isCitizen ? 'text-stone-600' : 'text-stone-400'}`}>
                                Email Address
                            </label>
                            <div className="relative group">
                                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isCitizen ? 'text-stone-400 group-focus-within:text-emerald-600' : 'text-stone-600 group-focus-within:text-emerald-500'}`} size={20} />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your-name@booth-iq.com"
                                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border transition-all outline-none text-sm font-medium ${
                                        isCitizen 
                                        ? 'bg-white border-stone-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50' 
                                        : 'bg-stone-900 border-white/5 focus:border-emerald-500 text-white placeholder:text-stone-700'
                                    }`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-widest pl-1 ${isCitizen ? 'text-stone-600' : 'text-stone-400'}`}>
                                Access Key
                            </label>
                            <div className="relative group">
                                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isCitizen ? 'text-stone-400 group-focus-within:text-emerald-600' : 'text-stone-600 group-focus-within:text-emerald-500'}`} size={20} />
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border transition-all outline-none text-sm font-medium ${
                                        isCitizen 
                                        ? 'bg-white border-stone-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50' 
                                        : 'bg-stone-900 border-white/5 focus:border-emerald-500 text-white placeholder:text-stone-700'
                                    }`}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg ${
                                isCitizen 
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20' 
                                : 'bg-emerald-500 text-stone-950 hover:bg-emerald-400 shadow-emerald-500/10'
                            }`}
                        >
                            {loading ? (
                                <div className="size-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            ) : (
                                <>
                                    <span>{isCitizen ? 'Authenticate Access' : 'Initialize Command'}</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className={`text-xs font-medium ${isCitizen ? 'text-stone-400' : 'text-stone-600'}`}>
                            Protected by Advanced Encryption Standard (AES-256).
                        </p>
                    </div>

                    {!isCitizen && (
                        <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-2 gap-4 opacity-50">
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">System Node</h4>
                                <p className="text-xs font-mono">ASIA-SOUTH-1A</p>
                            </div>
                            <div className="text-right">
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Status</h4>
                                <p className="text-xs font-mono text-emerald-500">READY</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
