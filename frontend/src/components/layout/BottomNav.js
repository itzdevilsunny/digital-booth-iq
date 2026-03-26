import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, ShieldCheck, ChevronRight, Zap, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const pathSegments = location.pathname.split('/');
    const role = pathSegments[1] || 'citizen';
    
    const isActive = (path) => location.pathname === path;

    const navItems = [
        { id: 'home', label: 'Home', icon: LayoutDashboard, path: `/${role}` },
        { id: 'switch', label: 'Roles', icon: Zap, path: '/select-role', center: true },
        { id: 'logout', label: 'Exit', icon: LogOut, path: '/' },
    ];

    return (
        <nav className="md:hidden fixed bottom-8 left-6 right-6 h-22 bg-[#0c0c0c]/80 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-around px-6 z-[100] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10">
            {navItems.map((item) => {
                const ActiveIcon = item.icon;
                const active = isActive(item.path);
                
                return (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center justify-center transition-all duration-500 relative ${
                            item.center ? '-top-8' : ''
                        }`}
                    >
                        {item.center ? (
                            <motion.div 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className={`p-5 rounded-3xl shadow-2xl transition-all border-4 border-white ${
                                    active 
                                    ? 'bg-emerald-600 text-white shadow-emerald-500/40 ring-4 ring-emerald-500/10' 
                                    : 'bg-white/5 text-emerald-500 shadow-black/40'
                                }`}
                            >
                                <ActiveIcon size={28} strokeWidth={2.5} />
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center gap-1.5 pt-1 relative">
                                <motion.div
                                    animate={active ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                                    className={active ? 'text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'text-white/40'}
                                >
                                    <ActiveIcon size={22} strokeWidth={active ? 2.5 : 2} />
                                </motion.div>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${active ? 'text-white' : 'text-white/40'}`}>
                                    {item.label}
                                </span>
                                {active && (
                                    <motion.div 
                                        layoutId="bottom-nav-indicator"
                                        className="absolute -bottom-4 w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,1)]" 
                                    />
                                )}
                            </div>
                        )}
                    </button>
                );
            })}
        </nav>
    );
};

export default BottomNav;
