import { useEffect, useRef, useState } from 'react';
import { api, setAuthToken } from '../services/api';
import { AppContext } from './appContextValue';

export const AppProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('vocademy_user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      localStorage.removeItem('vocademy_user');
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(Boolean(localStorage.getItem('vocademy_token')));
  const nextToastId = useRef(0);

  // Display a toast message
  const showToast = (message, type = 'success') => {
    const id = `toast-${nextToastId.current}`;
    nextToastId.current += 1;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const refreshCurrentUser = async () => {
      if (!localStorage.getItem('vocademy_token')) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await api.me();
        setUser(response.user);
        localStorage.setItem('vocademy_user', JSON.stringify(response.user));
      } catch {
        setAuthToken('');
        setUser(null);
        localStorage.removeItem('vocademy_user');
      } finally {
        setAuthLoading(false);
      }
    };

    refreshCurrentUser();
  }, []);

  const finishAuth = (response) => {
    setAuthToken(response.token);
    setUser(response.user);
    localStorage.setItem('vocademy_user', JSON.stringify(response.user));
  };

  const signup = async (credentials) => {
    const response = await api.signup(credentials);
    finishAuth(response);
    return response;
  };

  const login = async (credentials) => {
    const response = await api.login(credentials);
    finishAuth(response);
    return response;
  };

  const logout = () => {
    setAuthToken('');
    setUser(null);
    localStorage.removeItem('vocademy_user');
  };

  const value = {
    toasts,
    user,
    authLoading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    showToast,
    removeToast,
    signup,
    login,
    logout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
