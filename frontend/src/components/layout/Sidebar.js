import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, AlertCircle, Users, Activity, Target, Zap, LogOut, ChevronRight,
    Briefcase, FileText, TrendingUp, Globe
} from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

const Sidebar = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useUser();

    const pathSegments = location.pathname.split('/');
    const role = pathSegments[1] || 'citizen';
    const isCitizen = role === 'citizen';
    
    // Get initials and display name from user
    const userName = user?.name || (role === 'citizen' ? 'Citizen' : 'User');
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
        { id: 'campaigns', label: 'Campaigns', icon: Zap, path: `/${role}/campaigns`, hide: role !== 'admin' },
        { id: 'intelligence', label: 'Intelligence', icon: Globe, path: `/${role}/intel`, hide: !['analyst', 'constituency'].includes(role) },
        { id: 'comms', label: 'Communications', icon: Activity, path: `/${role}/calls`, hide: role !== 'panna' },
    ];

    const filteredNav = navItems.filter(item => !item.hide);

    return (
        <aside className="hidden md:flex flex-col w-64 bg-card text-foreground border-r border-border h-screen sticky top-0 shadow-2xl z-50 overflow-hidden font-display transition-all duration-500">
            {/* Background Grain */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none grayscale mix-blend-overlay">
                <div className="size-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            </div>

            {/* Logo Area */}
            <div className="p-5 pb-6 border-b border-border bg-muted/40 relative z-10">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="size-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:bg-primary/80 transition-all duration-500">
                        <Zap size={18} />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tighter leading-none text-foreground group-hover:text-emerald-500 transition-colors">BoothIQ</h1>
                        <p className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground font-bold mt-1">Booth Management</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 mt-2 relative z-10">
                <p className="px-4 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[3px] mb-4">Main Menu</p>
                {filteredNav.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 group relative overflow-hidden ${
                                active 
                                ? 'bg-primary/10 text-primary border border-primary/20 shadow-xl shadow-primary/5'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                        >
                            <Icon size={18} strokeWidth={active ? 2.5 : 2} className="group-hover:scale-110 transition-transform" />
                            <span className={`text-xs tracking-tight ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                            {active && (
                                <div className="ml-auto">
                                    <div className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))] shadow-primary/50" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-border bg-muted/20 relative z-10">
                <div className="bg-card text-foreground border-border rounded-2xl p-4 mb-4 border group cursor-default shadow-sm transition-all duration-500">
                    <div className="flex items-center gap-4">
                        <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20 shadow-inner">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate tracking-tight uppercase">{userName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                                <p className="text-[9px] text-muted-foreground truncate font-bold uppercase tracking-widest">
                                    {
                                        {
                                            citizen: 'Citizen App',
                                            worker: 'Field Agent',
                                            panna: 'Field Staff',
                                            admin: 'Booth Manager',
                                            blo: 'Registration Lead',
                                            city_manager: 'Operations Lead',
                                            constituency: 'HQ Command',
                                            analyst: 'Intelligence Lead'
                                        }[role] || role.replace('_', ' ')
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={() => navigate('/select-role')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <Activity size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-[2px]">Change Role</span>
                        </div>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    
                    <button 
                        onClick={() => {
                            logout();
                            navigate('/');
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 rounded-xl text-muted-foreground/40 hover:text-rose-500 transition-colors group"
                    >
                        <LogOut size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-[3px]">Logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
