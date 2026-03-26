import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast, Toaster } from 'sonner';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children, userId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications?user_id=${userId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } else {
        console.error('Expected notification array but got:', data);
        setNotifications([]);
      }
    } catch (e) {
      console.error('Error fetching notification history:', e);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchHistory();

    const wsUrl = process.env.REACT_APP_BACKEND_URL.replace('http', 'ws');
    const socket = new WebSocket(`${wsUrl}/ws/notifications/${userId}`);

    socket.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => Array.isArray(prev) ? [notification, ...prev] : [notification]);
      setUnreadCount(prev => prev + 1);
      
      // Trigger toast
      toast(notification.title, {
        description: notification.message,
        action: {
          label: 'View',
          onClick: () => console.log('Viewing notification:', notification.id)
        },
      });
    };

    socket.onclose = () => {
      console.log('Notification WebSocket disconnected. Attempting reconnect...');
      // Reconnect logic could go here
    };

    return () => socket.close();
  }, [userId, fetchHistory]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const markAllAsRead = () => {
    notifications.forEach(n => {
      if (!n.read) markAsRead(n.id);
    });
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
      <Toaster position="top-right" richColors expand={true} />
    </NotificationContext.Provider>
  );
};
