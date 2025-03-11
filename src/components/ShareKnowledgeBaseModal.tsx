import { useState, useEffect } from 'react';
import { X, Users, UserPlus, Search, Shield, User as UserIcon, Trash2 } from 'lucide-react';
import { knowledgeBaseApi } from '../services/api';
import { UserRole } from '../contexts/UserContext';

interface ShareKnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBaseId: string;
}

interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name: string;
}

export function ShareKnowledgeBaseModal({ isOpen, onClose, knowledgeBaseId }: ShareKnowledgeBaseModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [sharedUsers, setSharedUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch all users and shared users
  useEffect(() => {
    if (isOpen && knowledgeBaseId && knowledgeBaseId.trim() !== '') {
      fetchUsers();
      fetchSharedUsers();
    }
  }, [isOpen, knowledgeBaseId]);

  // Filter users based on search term
  useEffect(() => {
    const filtered = allUsers.filter(user => {
      // Only proceed if we have a valid user object
      if (!user) return false;
      
      // Only include users with 'user' role (exclude owners and admins who already have access)
      const hasUserRole = user.role === UserRole.USER;
      
      // Filter by search term (case insensitive)
      const matchesSearchTerm = 
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Don't show users who already have access
      const notAlreadyShared = !sharedUsers.some(sharedUser => sharedUser.id === user.id);
      
      return hasUserRole && matchesSearchTerm && notAlreadyShared;
    });
    
    setFilteredUsers(filtered);
  }, [searchTerm, allUsers, sharedUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');
      
      // Add role=user query parameter to only fetch users with 'user' role
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/users?role=user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setAllUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedUsers = async () => {
    if (!knowledgeBaseId || knowledgeBaseId.trim() === '') {
      setError('Invalid knowledge base ID');
      return;
    }
    
    try {
      setLoading(true);
      const data = await knowledgeBaseApi.getSharedUsers(knowledgeBaseId);
      setSharedUsers(data);
    } catch (err) {
      console.error('Failed to fetch shared users:', err);
      setError('Failed to load shared users');
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithUser = async (userId: string) => {
    if (!knowledgeBaseId || knowledgeBaseId.trim() === '') {
      setError('Invalid knowledge base ID');
      return;
    }
    
    if (!userId || userId.trim() === '') {
      setError('Invalid user ID');
      return;
    }
    
    try {
      setLoading(true);
      await knowledgeBaseApi.share(knowledgeBaseId, userId);
      
      // Update local state
      const userToAdd = allUsers.find(user => user.id === userId);
      if (userToAdd) {
        setSharedUsers(prev => [...prev, userToAdd]);
      }
      
      setSuccess('Knowledge base shared successfully');
      setError(null);
      setSearchTerm('');
    } catch (err) {
      console.error('Failed to share knowledge base:', err);
      setError('Failed to share knowledge base');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!knowledgeBaseId || knowledgeBaseId.trim() === '') {
      setError('Invalid knowledge base ID');
      return;
    }
    
    if (!userId || userId.trim() === '') {
      setError('Invalid user ID');
      return;
    }
    
    try {
      // Find the user
      const user = sharedUsers.find(u => u.id === userId);
      
      // Don't allow removing access for owners and admins
      if (user && user.role && user.role !== UserRole.USER) {
        setError('Cannot remove access for owners or admins - they have default access to all knowledge bases.');
        return;
      }
      
      setLoading(true);
      await knowledgeBaseApi.unshare(knowledgeBaseId, userId);
      
      // Update local state
      setSharedUsers(prev => prev.filter(user => user.id !== userId));
      
      setSuccess('User access removed successfully');
      setError(null);
    } catch (err) {
      console.error('Failed to remove user access:', err);
      setError('Failed to remove user access');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role?: UserRole) => {
    if (!role) return <UserIcon className="w-4 h-4 text-gray-500" />;
    
    switch (role) {
      case UserRole.ADMIN:
        return <Shield className="w-4 h-4 text-purple-500" />;
      case UserRole.OWNER:
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleColorClass = (role?: UserRole) => {
    if (!role) return 'bg-gray-50 text-gray-700 border-gray-200';
    
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case UserRole.OWNER:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
              Share Knowledge Base
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 animate-fade-in">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 animate-fade-in">
              {success}
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Users with Access</h3>
            {sharedUsers.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-3 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-600">No users have been granted access yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {sharedUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/10">
                        <span className="text-sm font-medium">
                          {user.full_name && user.full_name.trim() ? user.full_name.charAt(0) : 
                           user.email && user.email.trim() ? user.email.charAt(0) : '?'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{user.full_name || 'No name'}</h4>
                        <p className="text-xs text-gray-500">{user.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColorClass(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role && typeof user.role === 'string' 
                          ? user.role.charAt(0).toUpperCase() + user.role.slice(1) 
                          : 'Unknown'}
                      </div>
                      {user.role !== UserRole.USER && user.role !== undefined && (
                        <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          Default Access
                        </div>
                      )}
                      {(user.role === UserRole.USER || user.role === undefined) && (
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Add Users</h3>
            <p className="text-sm text-gray-500 mb-3">
              Note: Only users with the 'User' role are shown. Owners and Admins already have access by default.
            </p>
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                placeholder="Search by name or email"
              />
            </div>

            {loading && searchTerm && (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {!loading && filteredUsers.length === 0 && searchTerm && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <p className="text-gray-600">No matching users found</p>
              </div>
            )}

            {filteredUsers.length > 0 && (
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => handleShareWithUser(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white">
                        <span className="text-sm font-medium">
                          {user.full_name && user.full_name.trim() ? user.full_name.charAt(0) : 
                           user.email && user.email.trim() ? user.email.charAt(0) : '?'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold">{user.full_name || 'No name'}</h4>
                        <p className="text-xs text-gray-500">{user.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleColorClass(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role && typeof user.role === 'string' 
                          ? user.role.charAt(0).toUpperCase() + user.role.slice(1) 
                          : 'Unknown'}
                      </div>
                      <div className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <UserPlus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
} 