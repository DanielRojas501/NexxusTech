import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api, clearAccessToken, getAccessToken } from '@/api/apiClient';
import { isGuestSession, getGuestProfile } from '@/lib/guestStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isGuest] = useState(() => isGuestSession());

  const checkUserAuth = useCallback(async () => {
    if (isGuestSession()) {
      setUser(getGuestProfile());
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      setAuthError(null);
      return;
    }
    if (!getAccessToken()) {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
      setAuthError(null);
      return;
    }

    setIsLoadingAuth(true);
    try {
      const currentUser = await api.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      clearAccessToken();
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(error.status === 401 ? { type: 'auth_required', message: error.message } : {
        type: 'unknown',
        message: error.message,
      });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  const checkAppState = useCallback(() => checkUserAuth(), [checkUserAuth]);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const logout = (shouldRedirect = true) => {
    api.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setAuthChecked(true);
    if (shouldRedirect) window.location.assign('/login');
  };

  const navigateToLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      authChecked,
      isGuest,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
