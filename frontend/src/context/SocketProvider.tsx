import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiUrl } from '../services/apiClient';
import { useAuthStore } from '../store/authStore';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: PropsWithChildren) => {
  const token = useAuthStore((state) => state.token);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      socket?.disconnect();
      setSocket(null);
      return;
    }

    const nextSocket = io(getApiUrl(), {
      transports: ['websocket'],
      auth: { token },
      reconnectionDelay: 500,
      reconnectionAttempts: 5,
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, [token]);

  const value = useMemo(() => socket, [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => useContext(SocketContext);
