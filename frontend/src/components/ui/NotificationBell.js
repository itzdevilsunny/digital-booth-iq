import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, Info, Bell, X, Zap } from 'lucide-react';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={16} />;
      case 'error': return <AlertCircle className="text-rose-500" size={16} />;
      default: return <Info className="text-emerald-400" size={16} />;
    }
  };

  return (
    <div className="relative">
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all group flex items-center justify-center border ${
            isOpen ? 'bg-[#141414] border-white/10 text-white shadow-xl shadow-black/20' : 'bg-white/5 border-white/5 text-white/40 hover:text-emerald-500 shadow-sm'
        }`}
      >
        <Bell size={20} className={isOpen ? 'text-emerald-500' : 'group-hover:text-emerald-600 transition-colors'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 size-5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-lg shadow-emerald-500/20">
            {unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-stone-900/5 backdrop-blur-[2px]" 
                onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute right-0 mt-4 w-[380px] max-h-[520px] bg-[#141414] rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] border border-white/10 z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#141414] sticky top-0 z-10">
                <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                        Notifications
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Live Sync Active</span>
                    </div>
                </div>
                <button 
                  onClick={markAllAsRead}
                  className="text-[9px] font-bold uppercase tracking-[2px] text-emerald-500 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg"
                >
                  Clear All
                </button>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar scroll-smooth">
                {!Array.isArray(notifications) || notifications.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center px-8 text-center" style={{ backgroundColor: '#141414' }}>
                    <div className="size-16 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mb-6">
                        <Zap size={32} />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">ALL CLEAR</p>
                    <p className="text-xs text-white/40 font-medium leading-relaxed uppercase tracking-widest text-[10px]">No new alerts at this time.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {Array.isArray(notifications) && notifications.map((n) => (
                      <motion.div 
                        key={n.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => markAsRead(n.id)}
                        className={`p-6 hover:bg-white/5 cursor-pointer transition-all relative group ${!n.read ? 'bg-emerald-500/5' : ''}`}
                      >
                        <div className="flex gap-4">
                          <div className={`size-10 rounded-xl flex items-center justify-center mt-1 transition-all ${!n.read ? 'bg-white/10 shadow-sm ring-1 ring-emerald-500/20' : 'bg-white/5 text-white/20'}`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <p className={`text-xs font-black uppercase tracking-tight ${!n.read ? 'text-white' : 'text-white/40'}`}>{n.title}</p>
                                <div className="flex items-center gap-1 text-[9px] font-bold font-mono text-white/20 uppercase">
                                    <Clock size={10} />
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <p className={`text-[11px] leading-relaxed mb-3 line-clamp-2 ${!n.read ? 'text-white/70 font-medium' : 'text-white/30 font-normal'}`}>
                              {n.message}
                            </p>
                            <div className="flex items-center gap-3">
                                <span className={`text-[8px] font-bold uppercase tracking-[2px] px-2 py-0.5 rounded ${n.type === 'error' ? 'bg-rose-500/10 text-rose-500' : 'bg-white/5 text-white/40'}`}>
                                    ID: #{n.id.toString().slice(-6)}
                                </span>
                                {!n.read && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">New Alert</span>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/5 bg-[#0c0c0c] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">End of list</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-rose-500 hover:border-rose-500/30 transition-all shadow-sm"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
