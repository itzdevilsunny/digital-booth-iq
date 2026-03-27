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
        className={`relative p-2.5 rounded-xl transition-all group flex items-center justify-center border shadow-sm ${
            isOpen ? 'bg-card border-primary text-primary shadow-xl shadow-primary/10' : 'bg-muted/50 border-border text-muted-foreground hover:text-primary hover:border-primary/30'
        }`}
      >
        <Bell size={20} className={isOpen ? 'text-primary' : 'group-hover:text-primary transition-colors'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 size-5 bg-primary text-primary-foreground text-[10px] font-black rounded-full flex items-center justify-center border-2 border-background shadow-lg shadow-primary/20">
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
                className="fixed inset-0 z-40 bg-background/20 backdrop-blur-[2px]" 
                onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute right-0 mt-4 w-[380px] max-h-[520px] bg-card rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-border z-50 overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-card sticky top-0 z-10">
                <div>
                    <h3 className="text-sm font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                        Notifications
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Live Sync Active</span>
                    </div>
                </div>
                <button 
                  onClick={markAllAsRead}
                  className="text-[9px] font-bold uppercase tracking-[2px] text-primary hover:text-foreground transition-colors bg-muted/50 px-3 py-1.5 rounded-lg border border-border"
                >
                  Clear All
                </button>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar scroll-smooth">
                {!Array.isArray(notifications) || notifications.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center px-8 text-center bg-card">
                    <div className="size-16 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground/20 mb-6 border border-border">
                        <Zap size={32} />
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1">ALL CLEAR</p>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-widest text-[10px]">No new alerts at this time.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {Array.isArray(notifications) && notifications.map((n) => (
                      <motion.div 
                        key={n.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => markAsRead(n.id)}
                        className={`p-6 hover:bg-muted/30 cursor-pointer transition-all relative group ${!n.read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex gap-4">
                          <div className={`size-10 rounded-xl flex items-center justify-center mt-1 transition-all ${!n.read ? 'bg-primary/10 shadow-sm ring-1 ring-primary/20' : 'bg-muted text-muted-foreground/40'}`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <p className={`text-xs font-black uppercase tracking-tight ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                                <div className="flex items-center gap-1 text-[9px] font-bold font-mono text-muted-foreground/40 uppercase">
                                    <Clock size={10} />
                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <p className={`text-[11px] leading-relaxed mb-3 line-clamp-2 ${!n.read ? 'text-foreground/70 font-medium' : 'text-muted-foreground/60 font-normal'}`}>
                              {n.message}
                            </p>
                            <div className="flex items-center gap-3">
                                <span className={`text-[8px] font-bold uppercase tracking-[2px] px-2 py-0.5 rounded ${n.type === 'error' ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'}`}>
                                    ID: #{n.id.toString().slice(-6)}
                                </span>
                                {!n.read && <span className="text-[8px] font-black text-primary uppercase tracking-widest animate-pulse">New Alert</span>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Zap size={12} className="text-primary" />
                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">End of list</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="size-8 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:border-rose-500/30 transition-all shadow-sm"
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
