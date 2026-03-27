import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ThemeToggle from './ThemeToggle';
import NotificationBell from '../ui/NotificationBell';
import AIChatbot from '../roles/AIChatbot';
import { Menu, Search, User, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Layout = ({ children, title = "Dashboard", user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme } = useTheme();
    
    // Detect role from URL path
    const pathSegments = location.pathname.split('/');
    const role = pathSegments[1] || 'citizen';
    const isCitizen = role === 'citizen';

    return (
        <div className={`flex min-h-screen bg-background text-foreground overflow-hidden selection:bg-emerald-500/30 transition-colors duration-500`}>
            {/* Sidebar - Desktop Only */}
            <Sidebar user={user} />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Header */}
                <header className={`sticky top-0 z-40 bg-background/80 backdrop-blur-3xl border-b border-border px-4 py-2.5 flex items-center justify-between transition-all duration-500`}>
                    <div className="flex items-center gap-4">
                        <button className={`md:hidden size-11 rounded-2xl bg-muted border border-border text-foreground flex items-center justify-center active:scale-95 transition-transform`}>
                            <Menu size={22} />
                        </button>
                        
                        {/* PC Back Button */}
                        <button 
                            onClick={() => navigate('/select-role')}
                            className={`hidden md:flex size-9 rounded-xl bg-muted border border-border text-muted-foreground hover:text-emerald-500 items-center justify-center hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all group`}
                            title="Back to Role Selection"
                        >
                            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        <div className="hidden sm:block ml-1">
                            <h2 className={`font-display font-black text-lg text-foreground tracking-tighter transition-colors`}>{title}</h2>
                            <p className={`text-[8px] uppercase tracking-[0.2em] text-muted-foreground font-bold`}>BoothIQ System Dashboard</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search - Desktop */}
                        <div className={`hidden lg:flex items-center gap-2.5 bg-muted px-4 py-2 rounded-xl border border-border focus-within:border-emerald-500/50 transition-all w-60 mr-2 group`}>
                            <Search size={14} className={`text-muted-foreground group-focus-within:text-emerald-500 transition-colors`} />
                            <input 
                                type="text" 
                                placeholder="Search records..." 
                                className={`bg-transparent border-none outline-none text-[11px] w-full text-foreground placeholder:text-muted-foreground/50`}
                            />
                        </div>

                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Notification Bell */}
                        <NotificationBell />

                        {/* Profile - Mobile */}
                        <button className="md:hidden size-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/20 active:scale-95 transition-transform">
                            <User size={22} />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto scroll-smooth animate-fade-in relative scrollbar-hide">
                    {/* Decorative Background Element */}
                    {!isCitizen && <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-foreground/5 to-transparent pointer-events-none" />}
                    
                    <div className="max-w-7xl mx-auto p-3 md:p-6 relative z-10 pb-32 md:pb-6">
                        {children}
                    </div>
                </main>

                {/* Bottom Nav - Mobile Only */}
                <BottomNav />

                {/* Global AI Chatbot FAB */}
                <AIChatbot currentUser={null} boothId={17} />
            </div>
        </div>
    );
};

export default Layout;
