import { ReactNode } from 'react';
import { useUser, PERMISSIONS } from '../contexts/UserContext';

interface PermissionGatedProps {
  permission: keyof typeof PERMISSIONS;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * A component that conditionally renders its children based on whether the current user
 * has the specified permission.
 */
export default function PermissionGated({ 
  permission, 
  children, 
  fallback = null 
}: PermissionGatedProps) {
  const { hasPermission } = useUser();
  
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
} 