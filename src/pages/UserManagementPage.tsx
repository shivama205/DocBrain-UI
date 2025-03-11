import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserRole } from '../contexts/UserContext';
import { Users, Plus, ArrowLeft, User, Trash2, Shield, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  full_name: string;
}

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: UserRole.USER, full_name: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const accessToken = localStorage.getItem('access_token');
        
        const response = await axios.get(`${API_BASE_URL}/users`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
        
        setUsers(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Handle new user form submission
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');
      
      await axios.post(`${API_BASE_URL}/users`, newUser, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Refresh user list
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      setUsers(response.data);
      setNewUser({ email: '', password: '', role: UserRole.USER, full_name: '' });
      setSuccess('User created successfully');
      setError(null);
    } catch (err) {
      console.error('Failed to create user:', err);
      setError('Failed to create user');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle role change for a user
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');
      
      await axios.patch(`${API_BASE_URL}/users/${userId}`, 
        { role: newRole },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      
      setSuccess('User role updated successfully');
      setError(null);
    } catch (err) {
      console.error('Failed to update user role:', err);
      setError('Failed to update user role');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('access_token');
      
      await axios.delete(`${API_BASE_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
      setSuccess('User deleted successfully');
      setError(null);
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  // Get role icon based on role
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Shield className="w-4 h-4 text-purple-500" />;
      case UserRole.OWNER:
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get role color class
  const getRoleColorClass = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case UserRole.OWNER:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-lg z-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/80 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
                User Management
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create New User Form */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
                Create New User
              </h2>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter user's full name"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Create a secure password"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={UserRole.USER}>User</option>
                  <option value={UserRole.OWNER}>Owner</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] font-medium"
                disabled={loading}
              >
                <Plus className="w-5 h-5" />
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>
          
          {/* User List */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-lg shadow-blue-500/5 lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/10">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
                Manage Users
              </h2>
            </div>
            
            {loading && users.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            
            {!loading && users.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 mb-6 bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
                  <Users className="w-full h-full text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
                  No Users Found
                </h3>
                <p className="text-gray-500 max-w-sm">
                  Create your first user to get started.
                </p>
              </div>
            )}
            
            {users.length > 0 && (
              <div className="overflow-x-auto">
                <div className="grid grid-cols-1 gap-4">
                  {users.map((user) => (
                    <div 
                      key={user.id} 
                      className="group relative bg-white border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
                          <span className="text-lg font-medium">{user.full_name ? user.full_name.charAt(0) : user.email.charAt(0)}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{user.full_name || 'No name'}</h3>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getRoleColorClass(user.role)}`}>
                                {getRoleIcon(user.role)}
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </div>
                              
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                className="px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="Change user role"
                              >
                                <option value={UserRole.USER}>User</option>
                                <option value={UserRole.OWNER}>Owner</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                              </select>
                              
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                aria-label="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-400">
                            Created: {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 