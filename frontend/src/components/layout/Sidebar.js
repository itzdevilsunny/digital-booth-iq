import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, AlertCircle, Users, Activity, Target, Zap, LogOut, ChevronRight,
    Briefcase, FileText
} from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const pathSegments = location.pathname.split('/');
    const role = pathSegments[1] || 'citizen';
    const isCitizen = role === 'citizen';
    
    // Support nested sub-routes for active state
    const isActive = (path) => {
        if (path === `/${role}`) {
            return location.pathname === `/${role}` || location.pathname === `/${role}/`;
        }
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { id: 'home', label: role === 'citizen' ? 'Monitor' : 'Overview', icon: LayoutDashboard, path: `/${role}` },
        { id: 'report', label: 'Report Issue', icon: AlertCircle, path: `/${role}/report`, hide: role !== 'citizen' },
        { id: 'services', label: 'Voter Services', icon: Briefcase, path: `/${role}/voter-services`, hide: role !== 'citizen' },
        { id: 'schemes', label: 'Govt Schemes', icon: FileText, path: `/${role}/schemes`, hide: role !== 'citizen' },
        { id: 'voters', label: 'Voter Registry', icon: Users, path: `/${role}/voters`, hide: !['panna', 'admin'].includes(role) },
        { id: 'comms', label: 'Communications', icon: Activity, path: `/${role}/calls`, hide: role !== 'panna' },
    ];

    const filteredNav = navItems.filter(item => !item.hide);

    return (
        <aside className={`hidden md:flex flex-col w-72 ${isCitizen ? 'bg-white text-stone-900 border-stone-200' : 'bg-[#0a0a0a] text-white border-white/5'} h-screen sticky top-0 border-r shadow-2xl z-50 overflow-hidden font-display transition-all duration-500`}>
            {/* Background Grain */}
            <div className={`absolute inset-0 ${isCitizen ? 'opacity-[0.03]' : 'opacity-[0.02]'} pointer-events-none grayscale mix-blend-overlay`}>
                <div className="size-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </div>

            {/* Logo Area */}
            <div className={`p-8 pb-10 border-b ${isCitizen ? 'border-stone-100 bg-stone-50/50' : 'border-white/5 bg-gradient-to-br from-emerald-950/20 to-transparent'} relative z-10`}>
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="size-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-500 transition-all duration-500">
                        <Zap size={22} />
                    </div>
                    <div>
                        <h1 className={`font-bold text-2xl tracking-tighter leading-none ${isCitizen ? 'text-stone-900' : 'text-white'} group-hover:text-emerald-500 transition-colors`}>BoothIQ</h1>
                        <p className={`text-[9px] uppercase tracking-[0.4em] ${isCitizen ? 'text-stone-400' : 'text-white/40'} font-bold mt-1`}>Operational Node</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2 mt-4 relative z-10">
                <p className={`px-5 text-[10px] font-bold ${isCitizen ? 'text-stone-300' : 'text-white/20'} uppercase tracking-[4px] mb-6`}>Mission Command</p>
                {filteredNav.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden ${
                                active 
                                ? (isCitizen ? 'bg-stone-100 text-emerald-600 shadow-sm' : 'bg-white/5 text-emerald-500 border border-white/5 shadow-xl shadow-black/20')
                                : (isCitizen ? 'text-stone-500 hover:text-stone-900 hover:bg-stone-50' : 'text-white/40 hover:text-white hover:bg-white/5')
                            }`}
                        >
                            <Icon size={20} strokeWidth={active ? 2.5 : 2} className="group-hover:scale-110 transition-transform" />
                            <span className={`text-sm tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                            {active && (
                                <div className="ml-auto">
                                    <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,1)]" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className={`p-6 border-t ${isCitizen ? 'border-stone-100 bg-stone-50/50' : 'border-white/5 bg-black/20'} relative z-10`}>
                <div className={`${isCitizen ? 'bg-white text-stone-900 border-stone-200 shadow-sm' : 'bg-white/[0.03] text-white border-white/5 backdrop-blur-xl'} rounded-3xl p-5 mb-6 border group cursor-default transition-all duration-500`}>
                    <div className="flex items-center gap-4">
                        <div className="size-11 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-500 font-black border border-emerald-600/20 shadow-inner">
                            PK
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate tracking-tight uppercase">Pratik K.</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className={`text-[9px] ${isCitizen ? 'text-stone-400' : 'text-white/40'} truncate font-bold uppercase tracking-widest`}>{role.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => navigate('/select-role')}
                        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl ${isCitizen ? 'text-stone-400 hover:text-stone-900 hover:bg-stone-100' : 'text-white/40 hover:text-white hover:bg-white/5'} transition-all group`}
                    >
                        <div className="flex items-center gap-3">
                            <Activity size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-[2px]">Switch Interface</span>
                        </div>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    
                    <button 
                        onClick={() => navigate('/')}
                        className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl ${isCitizen ? 'text-stone-300 hover:text-rose-600' : 'text-white/20 hover:text-rose-500'} transition-colors group`}
                    >
                        <LogOut size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-[3px]">Terminate Session</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
