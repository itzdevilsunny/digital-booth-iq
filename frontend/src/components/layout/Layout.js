import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import NotificationBell from '../ui/NotificationBell';
import { Menu, Search, User } from 'lucide-react';

const Layout = ({ children, title = "Dashboard" }) => {
    return (
        <div className="flex min-h-screen bg-stone-50 overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
            {/* Sidebar - Desktop Only */}
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-200/60 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden size-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 active:scale-95 transition-transform">
                            <Menu size={20} />
                        </button>
                        <div className="hidden sm:block">
                            <h2 className="font-display font-bold text-xl text-stone-900 tracking-tight">{title}</h2>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">BoothIQ Intelligence System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search - Desktop */}
                        <div className="hidden lg:flex items-center gap-2 bg-stone-100 px-4 py-2 rounded-full border border-stone-200 focus-within:border-emerald-500/50 transition-colors w-64 mr-4 group">
                            <Search size={16} className="text-stone-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search analytics..." 
                                className="bg-transparent border-none outline-none text-xs w-full text-stone-900 placeholder:text-stone-400"
                            />
                        </div>

                        {/* Notification Bell */}
                        <NotificationBell />

                        {/* Profile - Mobile */}
                        <button className="md:hidden size-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform">
                            <User size={20} />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto scroll-smooth animate-fade-in relative">
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-stone-200/20 to-transparent pointer-events-none" />
                    
                    <div className="max-w-7xl mx-auto p-4 md:p-8 relative z-10 pb-32 md:pb-8">
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
