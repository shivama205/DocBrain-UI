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
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scheduleTokenRefreshRef = useRef<((forceRefresh?: boolean) => void) | null>(null);

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
  }, []);

  // Define scheduleTokenRefresh function first
  const scheduleTokenRefresh = useCallback((forceRefresh = false) => {
    // Clear any existing refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    // Schedule refresh 5 minutes before token expires
    const tokenExpiresAt = localStorage.getItem('token_expires_at');
    if (tokenExpiresAt) {
      const expiryTime = parseInt(tokenExpiresAt);
      if (!isNaN(expiryTime)) {
        const now = new Date().getTime();
        const refreshIn = Math.max(0, expiryTime - now - 5 * 60 * 1000); // 5 minutes before expiry
        
        console.log(`Scheduling token refresh in ${Math.floor(refreshIn / 1000 / 60)} minutes`);
        
        refreshTimeoutRef.current = setTimeout(async () => {
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
            // Schedule the next refresh
            scheduleTokenRefresh();
          } catch (error) {
            console.error('Auth refresh failed:', error);
            setIsAuthenticated(false);
            authApi.logout();
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
          }
        }, forceRefresh ? 0 : refreshIn);
      }
    }
  }, []);

  // Store in ref to avoid dependency issues
  useEffect(() => {
    scheduleTokenRefreshRef.current = scheduleTokenRefresh;
  }, [scheduleTokenRefresh]);

  // Simplified refreshAuth that uses the ref
  const refreshAuth = useCallback(async () => {
    if (scheduleTokenRefreshRef.current) {
      scheduleTokenRefreshRef.current(true); // Force immediate refresh
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const isAuthed = await checkAuth();
        if (isAuthed && scheduleTokenRefreshRef.current) {
          scheduleTokenRefreshRef.current();
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
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkAuth]); // Remove scheduleTokenRefresh from dependencies

  const login = async (email: string, password: string) => {
    try {
      await authApi.login(email, password);
      await checkAuth(); // Verify auth state after login
      if (scheduleTokenRefreshRef.current) {
        scheduleTokenRefreshRef.current();
      }
    } catch (error) {
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
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