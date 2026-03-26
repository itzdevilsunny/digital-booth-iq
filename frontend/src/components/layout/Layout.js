import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import NotificationBell from '../ui/NotificationBell';
import AIChatbot from '../roles/AIChatbot';
import { Menu, Search, User, ArrowLeft } from 'lucide-react';

const Layout = ({ children, title = "Dashboard" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Detect role from URL path
    const pathSegments = location.pathname.split('/');
    const role = pathSegments[1] || 'citizen';
    const isCitizen = role === 'citizen';

    return (
        <div className={`flex min-h-screen ${isCitizen ? 'bg-stone-50' : 'bg-[#0c0c0c]'} overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200 transition-colors duration-500`}>
            {/* Sidebar - Desktop Only */}
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Header */}
                <header className={`sticky top-0 z-40 ${isCitizen ? 'bg-white/80 border-stone-200' : 'bg-[#0c0c0c]/80 border-white/5'} backdrop-blur-3xl border-b px-6 py-4 flex items-center justify-between transition-all duration-500`}>
                    <div className="flex items-center gap-4">
                        <button className={`md:hidden size-11 rounded-2xl ${isCitizen ? 'bg-stone-100 border-stone-200 text-stone-900' : 'bg-white/5 border-white/10 text-white'} border flex items-center justify-center active:scale-95 transition-transform`}>
                            <Menu size={22} />
                        </button>
                        
                        {/* PC Back Button */}
                        <button 
                            onClick={() => navigate('/select-role')}
                            className={`hidden md:flex size-11 rounded-2xl ${isCitizen ? 'bg-stone-100 border-stone-200 text-stone-400 hover:text-emerald-600' : 'bg-white/5 border-white/10 text-white/40 hover:text-emerald-500'} border items-center justify-center hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all group`}
                            title="Back to Role Selection"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        <div className="hidden sm:block ml-2">
                            <h2 className={`font-display font-black text-2xl ${isCitizen ? 'text-stone-900' : 'text-white'} tracking-tighter transition-colors`}>{title}</h2>
                            <p className={`text-[9px] uppercase tracking-[0.3em] ${isCitizen ? 'text-stone-400' : 'text-white/40'} font-bold`}>BoothIQ Intelligence Matrix</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search - Desktop */}
                        <div className={`hidden lg:flex items-center gap-3 ${isCitizen ? 'bg-stone-100 border-stone-200' : 'bg-white/5 border-white/5'} px-5 py-2.5 rounded-2xl border focus-within:border-emerald-500/50 transition-all w-72 mr-4 group`}>
                            <Search size={16} className={`${isCitizen ? 'text-stone-400' : 'text-white/20'} group-focus-within:text-emerald-500 transition-colors`} />
                            <input 
                                type="text" 
                                placeholder="Search system matrix..." 
                                className={`bg-transparent border-none outline-none text-xs w-full ${isCitizen ? 'text-stone-900 placeholder:text-stone-400' : 'text-white placeholder:text-white/10'}`}
                            />
                        </div>

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
                    {!isCitizen && <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />}
                    
                    <div className="max-w-7xl mx-auto p-4 md:p-10 relative z-10 pb-40 md:pb-10">
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
