import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Define API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token management
const TOKEN_STORAGE = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (access_token: string, refresh_token: string) => {
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    // Store token expiry (assuming token expires in 1 hour)
    const expiresAt = new Date().getTime() + 60 * 60 * 1000;
    localStorage.setItem('token_expires_at', expiresAt.toString());
  },
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
  },
  isTokenExpired: () => {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    // Return true if token expires in less than 5 minutes
    return new Date().getTime() > (parseInt(expiresAt) - 5 * 60 * 1000);
  },
  hasValidTokens: () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    return !!(accessToken && refreshToken);
  },
  shouldAttemptRefresh: () => {
    const refreshToken = localStorage.getItem('refresh_token');
    const tokenExpiresAt = localStorage.getItem('token_expires_at');
    
    if (!refreshToken || !tokenExpiresAt) return false;
    
    // Only attempt refresh if:
    // 1. We have a refresh token
    // 2. Token is expired or will expire soon
    // 3. Token expiry time is valid
    const expiryTime = parseInt(tokenExpiresAt);
    if (isNaN(expiryTime)) return false;
    
    const now = new Date().getTime();
    return now > (expiryTime - 5 * 60 * 1000); // 5 minutes before expiry
  }
};

// Define response types
interface AuthResponse {
  access_token: string;
  token_type: string;
}

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Document {
  id: string;
  title: string;
  file_type: string;
  size_bytes: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_message: string | null;
  knowledge_base_id: string;
  user_id: string;
  processed_chunks: number | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string;
  title: string;
  knowledge_base_id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  content: string;
  content_type: string;
  kind: 'USER' | 'ASSISTANT';
  user_id: string;
  conversation_id: string;
  knowledge_base_id: string;
  sources: {
    score: number;
    document_id: string;
    title: string;
    content: string;
    chunk_index: number;
  }[] | null;
  status: 'RECEIVED' | 'PROCESSING' | 'SENT' | 'FAILED';
  created_at: string;
  updated_at: string;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars, prefer-const
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: unknown) => void; }[] = [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor for API calls
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = TOKEN_STORAGE.getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const formData = new URLSearchParams();
          formData.append('refresh_token', refreshToken);
          
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            formData,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );
          const { access_token, refresh_token } = response.data;
          TOKEN_STORAGE.setTokens(access_token, refresh_token);
          
          // Update auth header and retry
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        console.error('Token refresh failed:', refreshError);
        TOKEN_STORAGE.clearTokens();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', email); // OAuth2 standard uses 'username' for the email
    formData.append('password', password);
    
    const response = await api.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, refresh_token } = response.data;
    TOKEN_STORAGE.setTokens(access_token, refresh_token);
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    TOKEN_STORAGE.clearTokens();
  },
  
  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('refresh_token', refreshToken);
    
    const response = await api.post('/auth/refresh', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, refresh_token } = response.data;
    TOKEN_STORAGE.setTokens(access_token, refresh_token);
    return response.data;
  },
};

// Knowledge Base API
export const knowledgeBaseApi = {
  create: async (name: string, description?: string): Promise<KnowledgeBase> => {
    const response = await api.post('/knowledge-bases', { name, description });
    return response.data;
  },
  
  list: async (): Promise<KnowledgeBase[]> => {
    const response = await api.get('/knowledge-bases');
    return response.data;
  },
  
  get: async (id: string): Promise<KnowledgeBase> => {
    const response = await api.get(`/knowledge-bases/${id}`);
    return response.data;
  },
  
  update: async (id: string, name: string, description?: string): Promise<KnowledgeBase> => {
    const response = await api.put(`/knowledge-bases/${id}`, { name, description });
    return response.data;
  },
  
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/knowledge-bases/${id}`);
    return response.data;
  },
};

// Document API
export const documentApi = {
  upload: async (knowledgeBaseId: string, file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/knowledge-bases/${knowledgeBaseId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  list: async (knowledgeBaseId: string): Promise<Document[]> => {
    const response = await api.get(`/knowledge-bases/${knowledgeBaseId}/documents`);
    return response.data;
  },
  
  get: async (knowledgeBaseId: string, documentId: string): Promise<Document> => {
    const response = await api.get(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`);
    return response.data;
  },
  
  update: async (knowledgeBaseId: string, documentId: string, title: string): Promise<Document> => {
    const response = await api.put(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`, { title });
    return response.data;
  },
  
  delete: async (knowledgeBaseId: string, documentId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`);
    return response.data;
  },
  
  retry: async (knowledgeBaseId: string, documentId: string): Promise<Document> => {
    const response = await api.post(`/knowledge-bases/${knowledgeBaseId}/documents/${documentId}/retry`);
    return response.data;
  }
};

// Conversation API
export const conversationApi = {
  create: async (title: string, knowledgeBaseId: string): Promise<Conversation> => {
    const response = await api.post('/conversations', { title, knowledge_base_id: knowledgeBaseId });
    return response.data;
  },
  
  list: async (): Promise<Conversation[]> => {
    const response = await api.get('/conversations');
    return response.data;
  },
  
  get: async (id: string): Promise<Conversation> => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },
  
  update: async (id: string, title: string): Promise<Conversation> => {
    const response = await api.put(`/conversations/${id}`, { title });
    return response.data;
  },
  
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/conversations/${id}`);
    return response.data;
  },
};

// Message API
export const messageApi = {
  create: async (
    conversationId: string,
    content: string,
  ): Promise<Message> => {
    const response = await api.post(`/conversations/${conversationId}/messages`, {
      content: content,
      content_type: 'TEXT'
    });
    return response.data;
  },

  list: async (conversationId: string): Promise<Message[]> => {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  get: async (conversationId: string, messageId: string): Promise<Message> => {
    const response = await api.get(
      `/conversations/${conversationId}/messages/${messageId}`
    );
    return response.data;
  },
};

export default api; 