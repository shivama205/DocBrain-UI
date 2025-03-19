import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Define user roles
export enum UserRole {
  USER = 'user',
  OWNER = 'owner',
  ADMIN = 'admin'
}

// Define permissions mapped to roles
export const PERMISSIONS = {
  // Knowledge Base Permissions
  VIEW_KNOWLEDGE_BASES: [UserRole.USER, UserRole.OWNER, UserRole.ADMIN],
  CREATE_KNOWLEDGE_BASE: [UserRole.OWNER, UserRole.ADMIN],
  UPDATE_KNOWLEDGE_BASE: [UserRole.OWNER, UserRole.ADMIN],
  DELETE_KNOWLEDGE_BASE: [UserRole.OWNER, UserRole.ADMIN],
  
  // Knowledge Base Sharing Permissions
  SHARE_KNOWLEDGE_BASE: [UserRole.OWNER, UserRole.ADMIN],
  VIEW_SHARED_USERS: [UserRole.OWNER, UserRole.ADMIN],
  
  // Document Permissions
  VIEW_DOCUMENTS: [UserRole.OWNER, UserRole.ADMIN],
  UPLOAD_DOCUMENT: [UserRole.OWNER, UserRole.ADMIN],
  DELETE_DOCUMENT: [UserRole.OWNER, UserRole.ADMIN],
  
  // Question Permissions
  VIEW_QUESTIONS: [UserRole.USER, UserRole.OWNER, UserRole.ADMIN],
  CREATE_QUESTION: [UserRole.OWNER, UserRole.ADMIN],
  UPDATE_QUESTION: [UserRole.OWNER, UserRole.ADMIN],
  DELETE_QUESTION: [UserRole.OWNER, UserRole.ADMIN],
  
  // Conversation Permissions
  CONVERSE_WITH_KNOWLEDGE_BASE: [UserRole.USER, UserRole.OWNER, UserRole.ADMIN],
  
  // User Management Permissions
  VIEW_USERS: [UserRole.ADMIN],
  CREATE_USER: [UserRole.ADMIN],
  UPDATE_USER: [UserRole.ADMIN],
  DELETE_USER: [UserRole.ADMIN]
};

// Define types
interface UserContextType {
  role: UserRole | null;
  hasPermission: (permission: keyof typeof PERMISSIONS) => boolean;
  isLoading: boolean;
}

interface UserProviderProps {
  children: ReactNode;
}

interface UserData {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name: string;
}

// Create context
const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export function UserProvider({ children }: UserProviderProps) {
  const { isAuthenticated } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch user data including role
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Get access token from localStorage
        const accessToken = localStorage.getItem('access_token');
        
        // Use axios directly with the token
        const response = await axios.get(`${API_BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        const userData: UserData = response.data;
        setRole(userData.role);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated]);

  // Check if user has a specific permission
  const hasPermission = (permission: keyof typeof PERMISSIONS): boolean => {
    if (!role) return false;
    return PERMISSIONS[permission].includes(role);
  };

  return (
    <UserContext.Provider value={{ role, hasPermission, isLoading }}>
      {children}
    </UserContext.Provider>
  );
} 