import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import PermissionGuard from './components/PermissionGuard';
import './styles/globals.css';
import UserManagementPage from './pages/UserManagementPage';

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage />
          )
        } 
      />
      
      {/* Landing page with knowledge bases - all authenticated users */}
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <PermissionGuard permission="VIEW_KNOWLEDGE_BASES">
              <LandingPage />
            </PermissionGuard>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Knowledge base details page - for conversation */}
      <Route 
        path="/kb/:id" 
        element={
          isAuthenticated ? (
            <PermissionGuard permission="CONVERSE_WITH_KNOWLEDGE_BASE">
              <KnowledgeBasePage />
            </PermissionGuard>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Create new knowledge base - only owner and admin */}
      <Route 
        path="/kb/new" 
        element={
          isAuthenticated ? (
            <PermissionGuard permission="CREATE_KNOWLEDGE_BASE" fallbackPath="/">
              <KnowledgeBasePage isNew />
            </PermissionGuard>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Document management - only owner and admin */}
      <Route 
        path="/kb/:id/documents" 
        element={
          isAuthenticated ? (
            <PermissionGuard permission="VIEW_DOCUMENTS" fallbackPath="/">
              <KnowledgeBasePage documentsView />
            </PermissionGuard>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* User management - admin only */}
      <Route 
        path="/users" 
        element={
          isAuthenticated ? (
            <PermissionGuard permission="VIEW_USERS" fallbackPath="/">
              <UserManagementPage />
            </PermissionGuard>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;