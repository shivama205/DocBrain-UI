import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUser, PERMISSIONS } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';

interface PermissionGuardProps {
  permission: keyof typeof PERMISSIONS;
  children: ReactNode;
  fallbackPath?: string;
}

export default function PermissionGuard({ 
  permission, 
  children, 
  fallbackPath = '/' 
}: PermissionGuardProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasPermission, isLoading: userLoading } = useUser();

  // Show loading state while checking authentication and permissions
  if (authLoading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but doesn't have permission, redirect to fallback
  if (!hasPermission(permission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Has permission, render children
  return <>{children}</>;
} 