import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, MessageSquare, Sparkles, Trash2, LogOut } from 'lucide-react';
import { knowledgeBaseApi } from '../services/api';
import { CreateKnowledgeBaseModal } from '../components/CreateKnowledgeBaseModal';
import { useAuth } from '../contexts/AuthContext';

// Use the same interface as defined in api.ts
interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [newKbName, setNewKbName] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [newKbDescription, setNewKbDescription] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isCreating, setIsCreating] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      const data = await knowledgeBaseApi.list();
      setKnowledgeBases(data);
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
      // Handle error appropriately
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async (name: string, description: string) => {
    try {
      const newKb = await knowledgeBaseApi.create(name, description);
      navigate(`/kb/${newKb.id}`);
    } catch (error) {
      console.error('Failed to create knowledge base:', error);
      throw error; // Re-throw to be handled by the modal
    }
  };

  const handleDeleteKnowledgeBase = async (e: React.MouseEvent, knowledgeBaseId: string) => {
    e.stopPropagation();
    try {
      await knowledgeBaseApi.delete(knowledgeBaseId);
      setKnowledgeBases(prev => prev.filter(kb => kb.id !== knowledgeBaseId));
    } catch (error) {
      console.error('Failed to delete knowledge base:', error);
      // Handle error appropriately
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-lg z-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
              DocBrain
            </h1>
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 opacity-70 animate-gradient" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent opacity-40 animate-pulse" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-100 via-transparent to-transparent opacity-40 animate-pulse" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20">
          <h1 className="text-6xl font-bold tracking-tight text-gray-900 mb-8 leading-[1.15] animate-fade-in">
            <span className="inline-block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text font-extrabold animate-gradient">
              Transform your documents
            </span>
            <br />
            <span className="font-medium">into intelligent knowledge</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl leading-relaxed font-normal animate-fade-in-up">
            Create AI-powered knowledge bases that help you analyze, understand, and extract insights from your documents.
          </p>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-2xl text-lg font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] animate-fade-in-up"
          >
            <Plus className="w-5 h-5" />
            Create knowledge base
          </button>
        </div>
      </div>

      {/* Knowledge Bases Section */}
      {knowledgeBases.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text animate-gradient">Recent knowledge bases</h2>
              <p className="text-gray-500 text-lg">Continue where you left off</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Create new
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {knowledgeBases.map((kb, index) => (
              <div 
                key={kb.id}
                className="group relative bg-white border border-gray-100 rounded-2xl p-8 cursor-pointer hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => navigate(`/kb/${kb.id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-50 rounded-2xl transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">{kb.name.charAt(0)}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors duration-300">{kb.name}</h3>
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <span>{new Date(kb.updated_at).toLocaleDateString()}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{kb.description}</span>
                  </p>
                </div>
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <button 
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-500/5"
                    onClick={(e) => handleDeleteKnowledgeBase(e, kb.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-20 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Smart Document Analysis</h3>
            <p className="text-gray-600 leading-relaxed">Upload any document and let AI help you understand and analyze its content.</p>
          </div>
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Interactive Chat</h3>
            <p className="text-gray-600 leading-relaxed">Ask questions and get instant answers based on your document content.</p>
          </div>
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">AI-Powered Insights</h3>
            <p className="text-gray-600 leading-relaxed">Get automated summaries, key points, and recommendations from your documents.</p>
          </div>
        </div>
      </div>

      <CreateKnowledgeBaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateNew}
      />
    </div>
  );
} 