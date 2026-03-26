import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import NotificationBell from '../ui/NotificationBell';
import { Menu, Search, User } from 'lucide-react';

const Layout = ({ children, title = "Dashboard" }) => {
    return (
        <div className="flex min-h-screen bg-[#0c0c0c] overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
            {/* Sidebar - Desktop Only */}
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-[#0c0c0c]/80 backdrop-blur-3xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden size-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform">
                            <Menu size={22} />
                        </button>
                        <div className="hidden sm:block">
                            <h2 className="font-display font-black text-2xl text-white tracking-tighter">{title}</h2>
                            <p className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold">BoothIQ Intelligence Matrix</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search - Desktop */}
                        <div className="hidden lg:flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-2xl border border-white/5 focus-within:border-emerald-500/50 transition-all w-72 mr-4 group">
                            <Search size={16} className="text-stone-600 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search system matrix..." 
                                className="bg-transparent border-none outline-none text-xs w-full text-white placeholder:text-stone-700"
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
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-stone-900/40 to-transparent pointer-events-none" />
                    
                    <div className="max-w-7xl mx-auto p-4 md:p-10 relative z-10 pb-40 md:pb-10">
                        {children}
                    </div>
                </main>

                {/* Bottom Nav - Mobile Only */}
                <BottomNav />
            </div>
        </div>
    );
};

export default Layout;
