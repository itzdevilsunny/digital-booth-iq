import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ShieldCheck, Users, Briefcase, UserCheck, 
    BarChart3, Globe, Zap, 
    ChevronRight, ArrowLeft
} from 'lucide-react';

const RoleCard = ({ id, title, desc, icon: Icon, onClick, delay, special, badge }) => (
    <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay }}
        onClick={onClick}
        className={`group p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] duration-300 flex flex-col justify-between min-h-[140px] ${
            special 
            ? 'bg-gradient-to-br from-[#1a1a2e] to-[#0c0c0c] border-indigo-500/20 hover:border-indigo-500/50' 
            : 'bg-[#141414] border-white/5 hover:border-emerald-500/30'
        }`}
    >
        <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity blur-sm group-hover:blur-0 duration-700 ${
            special ? 'text-indigo-500' : 'text-emerald-500'
        }`}>
            <Icon size={80} strokeWidth={1} />
        </div>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className={`size-10 rounded-xl flex items-center justify-center transition-all shadow-md border border-white/10 duration-500 ${
                    special 
                    ? 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white' 
                    : 'bg-white/5 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white'
                }`}>
                    <Icon size={18} />
                </div>
                {special && (
                    <div className="px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase tracking-[2px]">
                        Command
                    </div>
                )}
                {badge && !special && (
                    <span className="text-[8px] font-black uppercase tracking-[2px] px-2 py-1 rounded-md border border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                        {badge}
                    </span>
                )}
            </div>
            
            <h3 className={`text-lg font-black mb-1.5 transition-colors uppercase tracking-tight leading-none group-hover:translate-x-0.5 duration-300 ${
                special ? 'text-white group-hover:text-indigo-400' : 'text-white group-hover:text-emerald-500'
            }`}>{title}</h3>
            <p className="text-[9px] font-bold text-white/40 leading-snug uppercase tracking-widest italic group-hover:text-white/60 transition-colors duration-300 line-clamp-2">
                {desc}
            </p>
        </div>
    </motion.div>
);

const RoleSelectionPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-white font-display selection:bg-emerald-500/30 selection:text-white relative overflow-hidden flex flex-col justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent)] pointer-events-none" />
            
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none grayscale mix-blend-overlay">
                <div className="size-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>

            <div className="w-full max-w-[1400px] mx-auto px-6 py-6 md:px-12 relative z-10 flex flex-col h-full">
                
                <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-12 lg:gap-24 flex-1">
                    
                    {/* Left Column - Header Info */}
                    <div className="w-full lg:w-5/12 flex flex-col justify-center">
                        {/* Back Button */}
                        <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => navigate('/')}
                            className="mb-10 w-fit flex items-center gap-3 text-white/40 hover:text-emerald-500 transition-all group"
                        >
                            <div className="size-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10">
                                <ArrowLeft size={16} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[4px]">Return to Landing</span>
                        </motion.button>

                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4 mb-6"
                        >
                            <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Zap size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[6px] text-white/20">BoothIQ Management</span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl xl:text-[80px] font-black tracking-tighter text-white leading-[0.85] uppercase mb-8"
                        >
                            CHOOSE YOUR <br />
                            <span className="text-emerald-500">ROLE DASHBOARD</span>
                        </motion.h1>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-3"
                        >
                            <div className="flex items-center gap-3 px-3 py-1.5 w-fit rounded-full bg-white/5 border border-white/5">
                                <span className="relative flex size-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                                    <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                                </span>
                                <span className="text-[9px] font-bold uppercase tracking-[4px] text-emerald-500">System: Online</span>
                            </div>
                            <span className="text-[8px] font-bold text-white/10 uppercase tracking-[4px] pl-1">Platform Version 5.2</span>
                        </motion.div>
                    </div>

                    {/* Right Column - Compact Grid */}
                    <div className="w-full lg:w-7/12 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                        {[
                            { 
                                id: 'citizen', 
                                title: 'Citizen', 
                                desc: 'Public portal for grievances & live tracking.', 
                                icon: Users, 
                            },
                            { 
                                id: 'worker', 
                                title: 'Field Officer', 
                                desc: 'On-ground task & booth management.', 
                                icon: Briefcase, 
                            },
                            { 
                                id: 'panna', 
                                title: 'Voter Guide', 
                                desc: 'Information & local community outreach.', 
                                icon: UserCheck, 
                            },
                            { 
                                id: 'admin', 
                                title: 'Booth Mgr', 
                                desc: 'Booth ops & resource allocation.', 
                                icon: ShieldCheck, 
                            },
                            { 
                                id: 'analyst', 
                                title: 'Data Analyst', 
                                desc: 'Sentiment analysis & trend prediction.', 
                                icon: BarChart3, 
                            },
                            { 
                                id: 'constituency', 
                                title: 'Sub-Division', 
                                desc: 'Live turnout, worker GPS, sentiment maps.', 
                                icon: Zap, 
                                special: true,
                            },
                            { 
                                id: 'city_manager', 
                                title: 'City Admin', 
                                desc: 'City-wide ops coordination.', 
                                icon: Globe, 
                                badge: 'Root'
                            }
                        ].map((role, idx) => (
                            <RoleCard 
                                key={role.id} 
                                {...role} 
                                onClick={() => navigate(`/login?role=${role.id}`)}
                                delay={0.2 + (idx * 0.05)}
                            />
                        ))}
                    </div>
                </div>

                {/* Footer Info */}
                <footer className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[4px]">Secure Access</p>
                    <div className="flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-emerald-500 shadow-lg" />
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">E-Sarthi v5.2</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};


export default RoleSelectionPage;
