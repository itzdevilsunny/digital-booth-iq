import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ShieldCheck, Users, Briefcase, UserCheck, 
    BarChart3, Globe, Zap, 
    ChevronRight, ArrowLeft
} from 'lucide-react';

const RoleCard = ({ role, title, desc, icon: Icon, color, onClick, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        onClick={onClick}
        className="group p-8 rounded-[2.5rem] border border-white/5 transition-all cursor-pointer bg-[#141414] relative overflow-hidden active:scale-[0.98] duration-500 flex flex-col h-full hover:border-emerald-500/30"
    >
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500 blur-sm group-hover:blur-0 duration-700">
            <Icon size={140} strokeWidth={1} />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
            <div className={`size-16 rounded-2xl flex items-center justify-center mb-10 transition-all shadow-xl bg-white/5 border border-white/10 text-emerald-500 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 duration-500`}>
                <Icon size={28} />
            </div>
            
            <h3 className="text-3xl font-black text-white mb-3 group-hover:text-emerald-500 transition-colors uppercase tracking-tight leading-none group-hover:translate-x-1 duration-500">{title}</h3>
            <p className="text-[11px] font-bold text-white/40 mb-auto leading-relaxed pr-6 uppercase tracking-widest italic group-hover:text-white/60 transition-colors duration-500">
                {desc}
            </p>
            
            <div className="mt-12 flex items-center justify-between text-white/20 group-hover:text-white transition-all duration-500">
                <span className="text-[10px] font-black uppercase tracking-[5px] group-hover:tracking-[6px] transition-all">Login Now</span>
                <div className="size-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-500">
                    <ChevronRight size={20} />
                </div>
            </div>
        </div>
    </motion.div>
);

const RoleSelectionPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0c0c0c] text-white font-display selection:bg-emerald-500/30 selection:text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent)] pointer-events-none" />
            
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none grayscale mix-blend-overlay">
                <div className="size-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>

            <div className="max-w-7xl mx-auto px-8 py-20 relative z-10">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/')}
                    className="mb-12 flex items-center gap-3 text-white/40 hover:text-emerald-500 transition-all group"
                >
                    <div className="size-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10">
                        <ArrowLeft size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[4px]">Return to Landing</span>
                </motion.button>

                {/* Header */}
                <header className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/5 pb-12">
                    <div className="max-w-2xl">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-4 mb-8"
                        >
                            <div className="size-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Zap size={24} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[8px] text-white/20">BoothIQ_System</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[0.85] uppercase"
                        >
                            CHOOSE YOUR <br />
                            <span className="text-emerald-500">LOGIN ROLE</span>
                        </motion.h1>
                    </div>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col gap-3 pb-2"
                    >
                        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                            <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                                <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-[4px] text-emerald-500">System: Online</span>
                        </div>
                        <span className="text-[9px] font-bold text-white/10 uppercase tracking-[5px] text-right">Data_Sync_v5.2</span>
                    </motion.div>
                </header>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { 
                            id: 'citizen', 
                            title: 'Citizen', 
                            desc: 'Public portal for grievance submission and real-time development tracking.', 
                            icon: Users, 
                        },
                        { 
                            id: 'worker', 
                            title: 'Field Officer', 
                            desc: 'On-ground task management and area monitoring for assigned booths.', 
                            icon: Briefcase, 
                        },
                        { 
                            id: 'panna', 
                            title: 'Voter Guide', 
                            desc: 'Voter registry insights and localized community engagement management.', 
                            icon: UserCheck, 
                        },
                        { 
                            id: 'admin', 
                            title: 'Booth Manager', 
                            desc: 'Management dashboard for resource oversight and operational audits.', 
                            icon: ShieldCheck, 
                        },
                        { 
                            id: 'analyst', 
                            title: 'Data Analyst', 
                            desc: 'Data analysis and strategy insights for constituency-wide planning.', 
                            icon: BarChart3, 
                        },
                        { 
                            id: 'city_manager', 
                            title: 'City Admin', 
                            desc: 'Regional administration and multi-zone coordination.', 
                            icon: Globe, 
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

                {/* Footer Info */}
                <footer className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[6px]">Official Access Only &bull; Authorization Required</p>
                    <div className="flex items-center gap-6">
                         <div className="flex items-center gap-3">
                             <div className="size-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                             <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">BoothIQ v5.2 Deployment</span>
                         </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};


export default RoleSelectionPage;
