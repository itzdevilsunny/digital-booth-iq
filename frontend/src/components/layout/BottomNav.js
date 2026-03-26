import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, Map, AlertCircle, User } from 'lucide-react';

const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine the role-based base path
    const pathSegments = location.pathname.split('/');
    const role = pathSegments[1] || 'citizen';
    
    const isActive = (path) => location.pathname === path;

    const navItems = [
        { id: 'home', label: 'Home', icon: Home, path: `/${role}` },
        { id: 'services', label: 'Services', icon: ClipboardList, path: `/${role}/services` },
        { id: 'area', label: 'My Area', icon: Map, path: `/${role}/area`, center: true },
        { id: 'issues', label: 'Issues', icon: AlertCircle, path: `/${role}/grievances` },
        { id: 'profile', label: 'Profile', icon: User, path: `/${role}/profile` },
    ];

    return (
        <nav className="md:hidden fixed bottom-6 left-4 right-4 h-16 glass-panel rounded-2xl flex items-center justify-around px-2 z-50 bottom-nav-shadow border border-stone-200/50">
            {navItems.map((item) => {
                const ActiveIcon = item.icon;
                const active = isActive(item.path);
                
                return (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center justify-center transition-all duration-300 relative ${
                            item.center ? '-top-6' : ''
                        } ${active ? 'text-emerald-600' : 'text-stone-400'}`}
                    >
                        {item.center ? (
                            <div className={`p-4 rounded-full shadow-lg transition-all transform hover:scale-110 active:scale-95 ${
                                active 
                                ? 'bg-emerald-600 text-white shadow-emerald-200' 
                                : 'bg-stone-100 text-stone-600 shadow-stone-200'
                            }`}>
                                <ActiveIcon size={24} strokeWidth={active ? 2.5 : 2} />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1 nav-item-transition">
                                <ActiveIcon size={20} strokeWidth={active ? 2.5 : 2} />
                                <span className={`text-[10px] uppercase tracking-tighter ${active ? 'font-bold' : 'font-medium'}`}>
                                    {item.label}
                                </span>
                                {active && (
                                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-600" />
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
