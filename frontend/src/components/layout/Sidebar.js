import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Map, AlertCircle, User, LogOut, LayoutDashboard } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const pathSegments = location.pathname.split('/');
    const role = pathSegments[1] || 'citizen';
    
    const isActive = (path) => location.pathname === path;

    const navItems = [
        { id: 'home', label: 'Dashboard', icon: LayoutDashboard, path: `/${role}` },
        { id: 'services', label: 'Voter Services', icon: ClipboardList, path: `/${role}/services` },
        { id: 'area', label: 'Area Insights', icon: Map, path: `/${role}/area` },
        { id: 'issues', label: 'Grievance Redressal', icon: AlertCircle, path: `/${role}/grievances` },
        { id: 'profile', label: 'Profile Settings', icon: User, path: `/${role}/profile` },
    ];

    return (
        <aside className="hidden md:flex flex-col w-72 bg-stone-950 text-white h-screen sticky top-0 border-r border-white/5 shadow-2xl z-50 overflow-hidden">
            {/* Logo Area */}
            <div className="p-8 pb-10 border-b border-white/5 bg-gradient-to-br from-emerald-950/20 to-transparent">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <span className="font-display font-bold text-2xl">B</span>
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-2xl tracking-tight">BoothIQ</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500/80 font-bold mt-0.5">Intelligence Portal</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2 mt-4">
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group ${
                                active 
                                ? 'bg-emerald-600/10 border border-emerald-600/20 text-emerald-400' 
                                : 'text-stone-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon size={20} strokeWidth={active ? 2.5 : 2} className="group-hover:scale-110 transition-transform" />
                            <span className={`text-sm tracking-wide ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.8)]" />}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-6 border-t border-white/5 bg-stone-900/50">
                <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-600/30">
                            P
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">Pratik K.</p>
                            <p className="text-[10px] text-stone-500 truncate capitalize">{role} Role</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/login')}
                    className="w-full flex items-center gap-3 px-5 py-3 rounded-lg text-stone-500 hover:text-red-400 transition-colors group"
                >
                    <LogOut size={16} />
                    <span className="text-xs font-bold uppercase tracking-widest">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
