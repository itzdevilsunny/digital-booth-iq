import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    ShieldCheck, Users, Briefcase, UserCheck, 
    BarChart3, Globe, ArrowRight, Zap, 
    ChevronRight, Cpu, Radio, Network
} from 'lucide-react';

const RoleCard = ({ role, title, desc, icon: Icon, color, onClick, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        onClick={onClick}
        className="glass-panel group p-8 rounded-[2.5rem] border border-stone-200/60 transition-all cursor-pointer bg-white relative overflow-hidden hover:shadow-2xl hover:shadow-stone-200/50 flex flex-col h-full"
    >
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
            <div className={`size-14 rounded-2xl flex items-center justify-center mb-10 transition-all shadow-sm ${color} group-hover:scale-110`}>
                <Icon size={24} />
            </div>
            
            <h3 className="text-3xl font-display font-bold text-stone-900 mb-2 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{title}</h3>
            <p className="text-sm font-medium text-stone-400 mb-auto leading-relaxed pr-4 uppercase tracking-widest text-[10px]">
                {desc}
            </p>
            
            <div className="mt-12 flex items-center justify-between text-stone-300 group-hover:text-emerald-600 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-[4px]">Initialize Protocol</span>
                <div className="size-8 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    <ChevronRight size={16} />
                </div>
            </div>
        </div>
    </motion.div>
);

const RoleSelectionPage = () => {
    const navigate = useNavigate();

    const roles = [
        { 
            key: 'citizen', 
            title: 'Citizen', 
            desc: 'Public portal for grievance submission and real-time development tracking.', 
            icon: Users, 
            color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
        },
        { 
            key: 'worker', 
            title: 'Field Worker', 
            desc: 'Tactical reconnaissance and on-ground mission management for assigned sectors.', 
            icon: Briefcase, 
            color: 'bg-stone-100 text-stone-600 border border-stone-200' 
        },
        { 
            key: 'panna', 
            title: 'Panna Pramukh', 
            desc: 'Registry intelligence and localized voter engagement orchestration hub.', 
            icon: UserCheck, 
            color: 'bg-stone-900 text-white' 
        },
        { 
            key: 'admin', 
            title: 'Admin', 
            desc: 'Command center oversight for high-level resource deployment and operational audits.', 
            icon: ShieldCheck, 
            color: 'bg-amber-50 text-amber-600 border border-amber-100' 
        },
        { 
            key: 'analyst', 
            title: 'Analyst', 
            desc: 'Deep data synthesis and predictive intelligence for state-wide policy alignment.', 
            icon: BarChart3, 
            color: 'bg-stone-50 text-stone-900 border border-stone-100 shadow-sm' 
        },
        { 
            key: 'city_manager', 
            title: 'Manager', 
            desc: 'Regional strategy command and multi-sector intervention synchronization.', 
            icon: Globe, 
            color: 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
        }
    ];

    return (
        <div className="min-h-screen bg-stone-50 font-display selection:bg-emerald-100 selection:text-emerald-900 relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none grayscale mix-blend-multiply">
                <div className="size-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </div>

            <div className="max-w-7xl mx-auto px-8 py-20 relative z-10">
                {/* Header */}
                <header className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-stone-200/60 pb-8">
                    <div>
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 mb-6"
                        >
                            <div className="size-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Zap size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[6px] text-stone-400">BoothIQ_Core</span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl font-bold tracking-tighter text-stone-900 leading-[0.9]"
                        >
                            WELCOME TO <br />
                            <span className="text-stone-300">BOOTHIQ PORTAL</span>
                        </motion.h1>
                    </div>
                    
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-[4px] text-stone-400 pb-2"
                    >
                        <div className="flex items-center gap-2">
                            <Radio size={12} className="text-emerald-500" />
                            <span>Status: Online</span>
                        </div>
                    </motion.div>
                </header>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        { 
                            key: 'citizen', 
                            title: 'Citizen', 
                            desc: 'Report local problems and track government schemes in your area.', 
                            icon: Users, 
                            color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        },
                        { 
                            key: 'worker', 
                            title: 'Field Officer', 
                            desc: 'Manage daily tasks and visit assigned locations in your area.', 
                            icon: Briefcase, 
                            color: 'bg-stone-100 text-stone-600 border border-stone-200' 
                        },
                        { 
                            key: 'panna', 
                            title: 'Voter Guide', 
                            desc: 'Assist local voters and keep the voter registry up to date.', 
                            icon: UserCheck, 
                            color: 'bg-stone-900 text-white' 
                        },
                        { 
                            key: 'admin', 
                            title: 'Booth Manager', 
                            desc: 'Full control of booth operations, resource management, and help desk.', 
                            icon: ShieldCheck, 
                            color: 'bg-amber-50 text-amber-600 border border-amber-100' 
                        },
                        { 
                            key: 'analyst', 
                            title: 'Data Analyst', 
                            desc: 'Analyze booth performance and suggest improvements based on data.', 
                            icon: BarChart3, 
                            color: 'bg-stone-50 text-stone-900 border border-stone-100 shadow-sm' 
                        },
                        { 
                            key: 'city_manager', 
                            title: 'Admin', 
                            desc: 'High-level oversight of all booths and regional planning.', 
                            icon: Globe, 
                            color: 'bg-emerald-100 text-emerald-900 border border-emerald-200' 
                        }
                    ].map((role, idx) => (
                        <RoleCard 
                            key={role.key} 
                            {...role} 
                            onClick={() => navigate(`/login?role=${role.key}`)}
                            delay={0.2 + (idx * 0.05)}
                        />
                    ))}
                </div>

                {/* Footer Info */}
                <footer className="mt-32 pt-12 border-t border-stone-200/60 flex flex-col md:flex-row items-center justify-between gap-8">
                    <p className="text-[10px] font-bold text-stone-300 uppercase tracking-[4px]">Access Restricted to Authorized Personnel Only</p>
                    <div className="flex items-center gap-4">
                         <div className="size-2 rounded-full bg-emerald-500" />
                         <span className="text-[10px] font-bold text-stone-900 uppercase tracking-widest">E-Sarthi v4.0 Global Deployment</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default RoleSelectionPage;
