import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, Info, Bell, X, ShieldCheck, Zap, Radio } from 'lucide-react';

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
            isOpen ? 'bg-stone-900 border-stone-800 text-white shadow-xl shadow-stone-900/20' : 'bg-white border-stone-200 text-stone-900 hover:border-emerald-600 shadow-sm'
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
              className="absolute right-0 mt-4 w-[380px] max-h-[520px] bg-white rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-stone-200 z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest flex items-center gap-2">
                        Intelligence Registry
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Live Node Sync Active</span>
                    </div>
                </div>
                <button 
                  onClick={markAllAsRead}
                  className="text-[9px] font-bold uppercase tracking-[2px] text-emerald-600 hover:text-stone-900 transition-colors bg-emerald-50 px-3 py-1.5 rounded-lg"
                >
                  Clear All
                </button>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar scroll-smooth">
                {!Array.isArray(notifications) || notifications.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center px-8 text-center">
                    <div className="size-16 rounded-3xl bg-stone-50 flex items-center justify-center text-stone-200 mb-6">
                        <Zap size={32} />
                    </div>
                    <p className="text-sm font-bold text-stone-900 mb-1">REGISTRY CLEAR</p>
                    <p className="text-xs text-stone-400 font-medium leading-relaxed uppercase tracking-widest text-[10px]">No tactical updates detected in current cycle.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {Array.isArray(notifications) && notifications.map((n) => (
                      <motion.div 
                        key={n.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => markAsRead(n.id)}
                        className={`p-6 hover:bg-stone-50 cursor-pointer transition-all relative group ${!n.read ? 'bg-emerald-50/20' : ''}`}
                      >
                        <div className="flex gap-4">
                          <div className={`size-10 rounded-xl flex items-center justify-center mt-1 transition-all ${!n.read ? 'bg-white shadow-sm ring-1 ring-emerald-500/20' : 'bg-stone-50 text-stone-300'}`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <p className={`text-xs font-black uppercase tracking-tight ${!n.read ? 'text-stone-900' : 'text-stone-400'}`}>{n.title}</p>
                                <div className="flex items-center gap-1 text-[9px] font-bold font-mono text-stone-300 uppercase">
                                    <Clock size={10} />
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <p className={`text-[11px] leading-relaxed mb-3 line-clamp-2 ${!n.read ? 'text-stone-600 font-medium' : 'text-stone-400 font-normal'}`}>
                              {n.message}
                            </p>
                            <div className="flex items-center gap-3">
                                <span className={`text-[8px] font-bold uppercase tracking-[2px] px-2 py-0.5 rounded ${n.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-stone-100 text-stone-500'}`}>
                                    ID: #{n.id.toString().slice(-6)}
                                </span>
                                {!n.read && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">New Tactical Update</span>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Radio size={12} className="text-emerald-500" />
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">End_of_Registry</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="size-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
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
