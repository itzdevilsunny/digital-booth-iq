import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Zap, LogOut, AlertCircle, 
    Briefcase, FileText, Activity, Users, Target
} from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const pathSegments = location.pathname.split('/');
    const role = pathSegments[1] || 'citizen';
    
    const isActive = (path) => {
        if (path === `/${role}`) {
            return location.pathname === `/${role}` || location.pathname === `/${role}/`;
        }
        return location.pathname === path;
    };

    // Role-specific navigation items
    const getNavItems = () => {
        const common = [
            { id: 'switch', label: 'Roles', icon: Zap, path: '/select-role', center: true },
            { id: 'logout', label: 'Exit', icon: LogOut, path: '/' },
        ];

        switch(role) {
            case 'citizen':
                return [
                    { id: 'home', label: 'Monitor', icon: Activity, path: '/citizen' },
                    { id: 'report', label: 'Report', icon: AlertCircle, path: '/citizen/report' },
                    { id: 'services', label: 'Services', icon: Briefcase, path: '/citizen/voter-services' },
                    { id: 'schemes', label: 'Schemes', icon: FileText, path: '/citizen/schemes' },
                    ...common
                ];
            case 'admin':
            case 'panna':
                return [
                    { id: 'home', label: 'Home', icon: LayoutDashboard, path: `/${role}` },
                    { id: 'voters', label: 'Voters', icon: Users, path: `/${role}/voters` },
                    ...common
                ];
            default:
                return [
                    { id: 'home', label: 'Home', icon: LayoutDashboard, path: `/${role}` },
                    ...common
                ];
        }
    };

    const isCitizen = role === 'citizen';
    const navItems = getNavItems();

    return (
        <nav className={`md:hidden fixed bottom-8 left-6 right-6 h-22 ${isCitizen ? 'bg-white/95 border-stone-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)]' : 'bg-[#0c0c0c]/80 border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]'} backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-around px-6 z-[100] border transition-all duration-500`}>
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
                                className={`p-5 rounded-3xl shadow-2xl transition-all border-4 ${isCitizen ? 'border-stone-50' : 'border-[#141414]'} ${
                                    active 
                                    ? 'bg-emerald-600 text-white shadow-emerald-500/40 ring-4 ring-emerald-500/10' 
                                    : (isCitizen ? 'bg-stone-100 text-emerald-600 shadow-stone-200/50' : 'bg-white/5 text-emerald-500 shadow-black/40')
                                }`}
                            >
                                <ActiveIcon size={28} strokeWidth={2.5} />
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center gap-1.5 pt-1 relative">
                                <motion.div
                                    animate={active ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                                    className={active ? 'text-emerald-500' : (isCitizen ? 'text-stone-300' : 'text-white/40')}
                                >
                                    <ActiveIcon size={22} strokeWidth={active ? 2.5 : 2} />
                                </motion.div>
                                <span className={`text-[9px] font-bold uppercase tracking-[0.2em] ${active ? (isCitizen ? 'text-stone-900' : 'text-white') : (isCitizen ? 'text-stone-300' : 'text-white/40')}`}>
                                    {item.label}
                                </span>
                                {active && (
                                    <motion.div 
                                        layoutId="bottom-nav-indicator"
                                        className="absolute -bottom-4 w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]" 
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
