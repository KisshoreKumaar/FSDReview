import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';
import { getAccessToken } from '../api/client.js';
import { listNotifications, markAllRead, markRead } from '../api/notification.api.js';

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5050';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const data = await listNotifications({ limit: 20 });
      setNotifications(data.items.items);
      setUnread(data.items.unreadCount);
    } catch {
      /* the badge is non-critical */
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setNotifications([]);
      setUnread(0);
      return undefined;
    }

    refresh();
    const socket = io(SOCKET_URL, {
      auth: { token: getAccessToken() },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('notification:new', (payload) => {
      setNotifications((prev) => [{ ...payload, _id: payload.id, isRead: false }, ...prev].slice(0, 20));
      setUnread((n) => n + 1);
      toast(payload.title, { icon: '🔔' });
    });

    socket.on('application:status', (payload) => {
      window.dispatchEvent(new CustomEvent('application:status', { detail: payload }));
    });

    return () => socket.disconnect();
  }, [user, refresh]);

  const readOne = useCallback(async (id) => {
    await markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnread((n) => Math.max(0, n - 1));
  }, []);

  const readAll = useCallback(async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }, []);

  const value = useMemo(
    () => ({ connected, notifications, unread, refresh, readOne, readAll }),
    [connected, notifications, unread, refresh, readOne, readAll],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
};
