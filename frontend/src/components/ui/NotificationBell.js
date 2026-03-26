import React, { useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, Info, Bell, X } from 'lucide-react';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={16} />;
      case 'warning': return <AlertCircle className="text-amber-500" size={16} />;
      case 'error': return <AlertCircle className="text-rose-500" size={16} />;
      default: return <Info className="text-blue-500" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/50 border border-black/5 hover:border-gold/30 hover:bg-white transition-all group"
      >
        <Bell size={20} className="text-navy group-hover:text-gold transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 size-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#f0ece3]">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 max-h-[480px] bg-white rounded-2xl shadow-2xl border border-black/5 z-50 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-black/5 flex items-center justify-between bg-white sticky top-0">
                <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                  Notifications
                </h3>
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-mono font-black uppercase tracking-wider text-gold hover:text-navy transition-colors"
                >
                  Mark all as read
                </button>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-[#080d1a]/40 font-medium italic">No notifications yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/5">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 hover:bg-black/[0.02] cursor-pointer transition-colors relative ${!n.read ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5">{getIcon(n.type)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-navy mb-0.5 truncate">{n.title}</p>
                            <p className="text-[11px] text-[#080d1a]/60 leading-relaxed mb-1 line-clamp-2">
                              {n.message}
                            </p>
                            <div className="flex items-center gap-2 text-[9px] font-mono text-[#080d1a]/40">
                              <Clock size={10} />
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {!n.read && (
                            <div className="size-2 rounded-full bg-blue-500 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-black/5 bg-black/[0.01] text-center">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-[10px] font-mono font-black uppercase tracking-widest text-[#080d1a]/30 hover:text-navy transition-colors"
                >
                  Close Registry
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
