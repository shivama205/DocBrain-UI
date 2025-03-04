import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authApi } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  checkAuth: () => Promise<boolean>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);
  const scheduleTokenRefreshRef = useRef<(() => void) | null>(null);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');
      const tokenExpiresAt = localStorage.getItem('token_expires_at');

      if (!accessToken || !refreshToken) {
        setIsAuthenticated(false);
        return false;
      }

      if (!tokenExpiresAt || isNaN(parseInt(tokenExpiresAt))) {
        setIsAuthenticated(false);
        authApi.logout();
        return false;
      }

      const expiryTime = parseInt(tokenExpiresAt);
      const now = new Date().getTime();

      if (now >= expiryTime) {
        // Token has expired, try to refresh
        if (!window.location.pathname.includes('/login')) {
          try {
            await authApi.refresh(refreshToken);
            setIsAuthenticated(true);
            return true;
          } catch (error) {
            console.error('Token refresh failed:', error);
            setIsAuthenticated(false);
            authApi.logout();
            return false;
          }
        } else {
          setIsAuthenticated(false);
          return false;
        }
      }

      // Token is still valid
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      authApi.logout();
      return false;
    }
  }, [setIsAuthenticated]);

  const refreshAuth = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      setIsAuthenticated(false);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return;
    }

    try {
      await authApi.refresh(refreshToken);
      setIsAuthenticated(true);
      if (scheduleTokenRefreshRef.current) {
        scheduleTokenRefreshRef.current();
      }
    } catch (error) {
      console.error('Auth refresh failed:', error);
      setIsAuthenticated(false);
      authApi.logout();
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
  }, [setIsAuthenticated]);

  const scheduleTokenRefresh = useCallback(() => {
    // Clear any existing refresh timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    // Schedule refresh 5 minutes before token expires
    const tokenExpiresAt = localStorage.getItem('token_expires_at');
    if (tokenExpiresAt) {
      const expiryTime = parseInt(tokenExpiresAt);
      if (!isNaN(expiryTime)) {
        const now = new Date().getTime();
        const refreshIn = Math.max(0, expiryTime - now - 5 * 60 * 1000); // 5 minutes before expiry
        
        const timeout = setTimeout(() => {
          refreshAuth();
        }, refreshIn);
        
        setRefreshTimeout(timeout);
      }
    }
  }, [refreshTimeout, setRefreshTimeout, refreshAuth]);

  // Store the scheduleTokenRefresh function in a ref to avoid circular dependencies
  useEffect(() => {
    scheduleTokenRefreshRef.current = scheduleTokenRefresh;
  }, [scheduleTokenRefresh]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const isAuthed = await checkAuth();
        if (isAuthed) {
          scheduleTokenRefresh();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'access_token' && e.newValue !== e.oldValue) {
        await checkAuth();
      }
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await checkAuth();
      }
    };

    initAuth();
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuth, refreshTimeout, scheduleTokenRefresh]);

  const login = async (email: string, password: string) => {
    try {
      await authApi.login(email, password);
      await checkAuth(); // Verify auth state after login
      scheduleTokenRefresh();
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    authApi.logout();
    setIsAuthenticated(false);
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      isLoading,
      checkAuth,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
} 