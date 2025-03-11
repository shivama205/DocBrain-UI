import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Plus, FileText, Send, ArrowLeft, Sparkles, Pencil, User, Trash2, MessageSquare, LogOut, Loader2, RefreshCw, Check, Copy, ChevronDown, Clock, AlertCircle, CheckCircle, Share2 } from 'lucide-react';
import { knowledgeBaseApi, documentApi, conversationApi, messageApi } from '../services/api';
import { FileUploadModal } from '../components/FileUploadModal';
import { ShareKnowledgeBaseModal } from '../components/ShareKnowledgeBaseModal';
import { useAuth } from '../contexts/AuthContext';
import PermissionGated from '../components/PermissionGated';
import { useUser } from '../contexts/UserContext';

// Temporary inline component until the actual component is created
function EmptySourcesState({ onUpload }: { onUpload: () => void }) {
  const { hasPermission } = useUser();
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 mb-8 bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
        <FileText className="w-full h-full text-white" />
      </div>
      <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
        {hasPermission("UPLOAD_DOCUMENT") ? "Add your first source" : "No sources available"}
      </h3>
      
      {hasPermission("UPLOAD_DOCUMENT") ? (
        <>
          <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">
            Upload any document type - we'll process it for you.
          </p>
          <button 
            onClick={onUpload}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] font-medium"
          >
            Upload document
          </button>
        </>
      ) : (
        <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">
          No documents have been added to this knowledge base yet. Please contact an administrator to add content.
        </p>
      )}
    </div>
  );
}

// Temporary inline component until the actual component is created
function EmptyChatState({ onUpload }: { onUpload: () => void }) {
  const { hasPermission } = useUser();
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 mb-8 bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
        <MessageSquare className="w-full h-full text-white" />
      </div>
      <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
        Start a conversation
      </h3>
      
      {hasPermission("UPLOAD_DOCUMENT") ? (
        <>
          <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">
            Upload a document to start asking questions and getting insights from your knowledge base.
          </p>
          <button 
            onClick={onUpload}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] font-medium"
          >
            Upload document
          </button>
        </>
      ) : (
        <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">
          This knowledge base is ready for your questions. Start typing in the chat box below to interact with the AI.
        </p>
      )}
    </div>
  );
}

// Temporary inline component until the actual component is created
function ChatMessage({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format message content with Markdown-like syntax
  const formatContent = (content: string) => {
    // Replace markdown-style headers
    let formattedContent = content
      // Format headers (# Header)
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      // Format bold (**text**)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Format italic (*text*)
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Format bullet points
      .replace(/^\s*[-*+]\s+(.*$)/gm, '<li>$1</li>')
      // Format numbered lists
      .replace(/^\s*(\d+)\.\s+(.*$)/gm, '<li>$2</li>')
      // Format code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Format inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Convert line breaks to <br>
      .replace(/\n/g, '<br>');
    
    // Wrap bullet points in <ul>
    if (formattedContent.includes('<li>')) {
      formattedContent = formattedContent.replace(/<li>[\s\S]*?(?=<\/li>)<\/li>/g, match => {
        return `<ul>${match}</ul>`;
      });
    }
    
    return formattedContent;
  };

  const isUserMessage = message.kind === 'USER';
  
  // Check if message is in a processing state
  const isProcessing = message.kind === 'ASSISTANT' && message.status === 'PROCESSING';
  const isFailed = message.status === 'FAILED';

  return (
    <div 
      ref={messageRef}
      className={`group flex gap-3 ${isUserMessage ? 'justify-end' : 'justify-start'} mb-6`}
    >
      {!isUserMessage && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center ring-2 ring-white">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[85%] ${isUserMessage ? 'items-end' : 'items-start'}`}>
        <div className={`
          relative group/message px-4 py-2.5 rounded-2xl
          ${isUserMessage 
            ? 'bg-blue-600 text-white rounded-br-sm shadow-md shadow-blue-500/10' 
            : 'bg-gray-100 text-gray-900 rounded-bl-sm shadow-md shadow-gray-200/20'
          }
        `}>
          <div 
            className={`prose prose-sm max-w-none ${isUserMessage ? 'prose-invert' : ''}`}
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />

          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className={`
                p-1.5 rounded-full transition-all duration-200
                ${isUserMessage 
                  ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }
              `}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {message.sources && message.sources.length > 0 && (
            <button
              onClick={() => setShowSources(!showSources)}
              className={`
                absolute bottom-0 left-0 transform -translate-x-2 translate-y-2
                flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
                ${isUserMessage
                  ? 'bg-blue-700 text-white/90 hover:bg-blue-800'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }
              `}
            >
              <MessageSquare className="w-3 h-3" />
              {message.sources.length} {message.sources.length === 1 ? 'source' : 'sources'}
            </button>
          )}
        </div>

        {message.sources && message.sources.length > 0 && showSources && (
          <div className="w-full space-y-2 overflow-hidden">
            {message.sources.map((source, index) => (
              <div
                key={index}
                className={`
                  p-3 rounded-lg border text-sm
                  ${isUserMessage
                    ? 'bg-blue-50 border-blue-100'
                    : 'bg-white border-gray-200'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{source.title}</h4>
                    <p className="mt-1 text-gray-600 line-clamp-2">{source.content}</p>
                  </div>
                  <span className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
                    {Math.round(source.score * 100)}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-gray-400">
            {formatTimestamp(message.created_at)}
          </span>
          {isProcessing && (
            <span className="flex items-center text-xs text-blue-500">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Processing...
            </span>
          )}
          {isFailed && (
            <span className="flex items-center text-xs text-red-500">
              <AlertCircle className="w-3 h-3 mr-1" />
              Failed
            </span>
          )}
        </div>
      </div>

      {isUserMessage && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center ring-2 ring-white">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
}

interface Document {
  id: string;
  title: string;
  file_type: string;
  size_bytes: number;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  error_message: string | null;
  knowledge_base_id: string;
  user_id: string;
  processed_chunks: number | null;
  summary: string | null;
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

interface Conversation {
  id: string;
  title: string;
  knowledge_base_id: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface KnowledgeBasePageProps {
  isNew?: boolean;
  documentsView?: boolean;
}

export default function KnowledgeBasePage({ isNew = false, documentsView = false }: KnowledgeBasePageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [, setLastScrollTop] = useState(0);
  const [shouldAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showGetLatestButton, setShowGetLatestButton] = useState(false);
  
  const [, setLoading] = useState(true);
  const [title, setTitle] = useState('New Knowledge Base');
  const [isEditing, setIsEditing] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if any document is in processing state
  const pendingDocuments = documents.filter(doc => doc.status === 'PENDING').length;
  const processingDocuments = documents.filter(doc => doc.status === 'PROCESSING').length;
  // These variables are used in the UI conditionally
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const failedDocuments = documents.filter(doc => doc.status === 'FAILED').length;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hasProcessingDocuments = processingDocuments > 0 || pendingDocuments > 0;

  const isNearBottom = useCallback(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return true;
    
    const threshold = 100;
    return chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < threshold;
  }, []);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const messages = await messageApi.list(conversationId);
      const sortedMessages = [...messages].sort((a, b) => 
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      );
      
      setMessages(sortedMessages);
      
      const waitingForResponse = sortedMessages.some(msg => 
        msg.kind === 'ASSISTANT' && msg.status === 'PROCESSING'
      );
      setIsWaitingForResponse(waitingForResponse);
      
      if (isNearBottom()) {
        setShowGetLatestButton(false);
      } else {
        setShowGetLatestButton(true);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [conversationId, isNearBottom]);

  const handleCreateNew = useCallback(async () => {
    try {
      const newKb = await knowledgeBaseApi.create('Untitled knowledge base', 'New knowledge base');
      navigate(`/kb/${newKb.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to create knowledge base:', error);
      navigate('/');
    }
  }, [navigate]);

  const loadKnowledgeBase = useCallback(async () => {
    if (!id) return;
    try {
      const data = await knowledgeBaseApi.get(id);
      setTitle(data.name);

      const conversations = await conversationApi.list();
      const existingConversation = conversations.find((conv: Conversation) => conv.knowledge_base_id === id);
      
      if (existingConversation) {
        setConversationId(existingConversation.id);
      } else {
        const newConversation = await conversationApi.create(data.name, id);
        setConversationId(newConversation.id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      navigate('/');
    }
  }, [id, navigate, setConversationId, setTitle, setLoading]);

  const loadDocuments = useCallback(async () => {
    if (!id) return;
    try {
      const docs = await documentApi.list(id);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }, [id, setDocuments]);
  
  useEffect(() => {
    if (!isNew) {
      loadKnowledgeBase();
      loadDocuments();
    } else if (isNew) {
      handleCreateNew();
    }
  }, [id, isNew, loadKnowledgeBase, loadDocuments, handleCreateNew]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();

      pollIntervalRef.current = setInterval(() => {
        if (isNearBottom()) {
          loadMessages();
        } else {
          setShowGetLatestButton(true);
        }
      }, 5000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [conversationId, loadMessages, isNearBottom]);

  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, shouldAutoScroll]);

  const scrollToBottomAndRefresh = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      setShowScrollButton(false);
      setShowGetLatestButton(false);
      if (conversationId) {
        loadMessages();
      }
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      setShowScrollButton(false);
      setShowGetLatestButton(false);
    }
  };

  const handleScroll = () => {
    const container = chatContainerRef.current;
    if (!container) return;

    const nearBottom = isNearBottom();
    setShowScrollButton(!nearBottom);
    setShowGetLatestButton(!nearBottom);
    
    setLastScrollTop(container.scrollTop);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleTitleBlur();
    }
  };

  const handleTitleBlur = async () => {
    setIsEditing(false);
    if (id) {
      try {
        await knowledgeBaseApi.update(id, title);
      } catch (error) {
        console.error('Failed to update knowledge base:', error);
      }
    }
  };

  const handleUploadDocument = async (file: File) => {
    if (!id) return;
    try {
      const newDoc = await documentApi.upload(id, file);
      setDocuments(prev => [...prev, newDoc]);
      setShowUploadModal(false);
      
      pollForDocumentStatus(newDoc.id);
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!id) return;
    console.log(`Attempting to delete document ${documentId} from knowledge base ${id}`);
    try {
      console.log('Making API call to delete document...');
      await documentApi.delete(id, documentId);
      console.log('Document deleted successfully, updating UI');
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !id || isWaitingForResponse) return;

    try {
      setIsWaitingForResponse(true);
      
      if (!conversationId) {
        const conversation = await conversationApi.create(title, id);
        setConversationId(conversation.id);
      }

      if (conversationId) {
        const newMessage = await messageApi.create(conversationId, message);
        setMessages(prev => {
          const updatedMessages = [...prev, newMessage];
          return updatedMessages.sort((a, b) => 
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          );
        });
        setMessage('');
        
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsWaitingForResponse(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetryDocument = async (documentId: string) => {
    if (!id) return;
    try {
      const retryDoc = await documentApi.retry(id, documentId);
      setDocuments(prev => prev.map(doc => doc.id === documentId ? retryDoc : doc));
      
      pollForDocumentStatus(documentId);
    } catch (error) {
      console.error('Failed to retry document processing:', error);
    }
  };

  const pollForDocumentStatus = async (documentId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        if (!id) return;
        const doc = await documentApi.get(id, documentId);
        setDocuments(prev => prev.map(d => d.id === documentId ? doc : d));
        
        if (doc.status !== 'PENDING' && doc.status !== 'PROCESSING') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Failed to poll document status:', error);
        clearInterval(pollInterval);
      }
    }, 2000);
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    
    try {
      await conversationApi.delete(conversationId);
      setMessages([]);
      setConversationId(null);
      
      if (id) {
        const newConversation = await conversationApi.create(title, id);
        setConversationId(newConversation.id);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="max-w-[90rem] mx-auto px-6">
          <div className="h-16 flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/80 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 group relative flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
                <span className="text-xl">{title.charAt(0)}</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="text-xl font-bold bg-white/50 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                />
              ) : (
                <h1 
                  onDoubleClick={() => setIsEditing(true)}
                  className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text cursor-pointer"
                >
                  {title}
                </h1>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            
            <PermissionGated permission="SHARE_KNOWLEDGE_BASE">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 px-4 py-2 rounded-xl hover:shadow-md hover:border-blue-200 transition-all"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </PermissionGated>
            
            <button
              onClick={handleDeleteConversation}
              disabled={!conversationId || isWaitingForResponse}
              className={`
                p-2 rounded-xl transition-colors flex items-center gap-2
                ${!conversationId || isWaitingForResponse
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                }
              `}
              title="Start new conversation"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="text-sm font-medium">New Chat</span>
            </button>
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

      <div className="flex max-w-[90rem] mx-auto">
        <PermissionGated 
          permission="VIEW_DOCUMENTS"
          fallback={documentsView ? <Navigate to="/" replace /> : null}
        >
          <div className="w-[400px] bg-white/70 backdrop-blur-lg border-r border-gray-200 flex flex-col h-[calc(100vh-4rem)] shadow-lg shadow-blue-500/5">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Sources</h2>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {documents.length === 0 ? (
                <EmptySourcesState onUpload={() => setShowUploadModal(true)} />
              ) : (
                <>
                  <PermissionGated permission="UPLOAD_DOCUMENT">
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 text-blue-600 p-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 mb-4 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add source
                    </button>
                  </PermissionGated>

                  {documents.map(doc => (
                    <div key={doc.id} className="group relative flex items-center justify-between p-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl cursor-pointer transition-all duration-200">
                      <div className="flex items-center gap-3 flex-grow">
                        <div className={`p-2 rounded-lg ${
                          doc.status === 'PENDING' ? 'bg-yellow-50' : 
                          doc.status === 'PROCESSING' ? 'bg-blue-50' : 
                          doc.status === 'FAILED' ? 'bg-red-50' : 
                          'bg-green-50'
                        }`}>
                          {doc.status === 'PENDING' ? (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          ) : doc.status === 'PROCESSING' ? (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          ) : doc.status === 'FAILED' ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700">{doc.title}</span>
                          {doc.status === 'PENDING' && (
                            <span className="text-xs text-yellow-600 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending...
                            </span>
                          )}
                          {doc.status === 'PROCESSING' && (
                            <span className="text-xs text-blue-600 flex items-center">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Processing...
                            </span>
                          )}
                          {doc.status === 'FAILED' && (
                            <span className="text-xs text-red-600 flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {doc.error_message || 'Processing failed'}
                            </span>
                          )}
                        </div>
                      </div>
                      {doc.status === 'FAILED' ? (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRetryDocument(doc.id)}
                            className="p-1 rounded-lg transition-colors text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          {showDeleteConfirm === doc.id ? (
                            <div className="flex items-center gap-2 bg-white p-1 rounded-lg shadow-lg animate-fade-in">
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(doc.id);
                              }}
                              className="p-1 rounded-lg transition-colors text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {showDeleteConfirm === doc.id ? (
                            <div className="flex items-center gap-2 bg-white p-1 rounded-lg shadow-lg animate-fade-in">
                              <button
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteConfirm(doc.id);
                              }}
                              className="p-1 rounded-lg transition-colors text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </PermissionGated>

        <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white/70 backdrop-blur-lg">
          {isNew || documents.length === 0 ? (
            <EmptyChatState onUpload={() => setShowUploadModal(true)} />
          ) : (
            <>
              <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 p-6 overflow-y-auto scroll-smooth relative" 
                id="chat-messages"
              >
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-16 h-16 mb-6 bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
                        <MessageSquare className="w-full h-full text-white" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
                        Start the conversation
                      </h3>
                      <p className="text-gray-500 max-w-sm">
                        Ask questions about your documents and I'll help you find the answers.
                      </p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <ChatMessage key={msg.id} message={msg} />
                    ))
                  )}
                </div>
                
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  {showGetLatestButton && (
                    <button
                      onClick={scrollToBottomAndRefresh}
                      className="p-3 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all duration-200 animate-fade-in flex items-center gap-2"
                      aria-label="Get latest messages"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span className="text-sm font-medium">Get Latest</span>
                    </button>
                  )}
                  
                  {showScrollButton && !showGetLatestButton && (
                    <button
                      onClick={scrollToBottom}
                      className="p-3 rounded-full bg-gray-600 text-white shadow-lg shadow-gray-500/20 hover:bg-gray-700 transition-all duration-200 animate-fade-in"
                      aria-label="Scroll to bottom"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 bg-white p-6">
                <div className="max-w-3xl mx-auto">
                  <div className="relative">
                    <textarea
                      placeholder={isWaitingForResponse ? "Waiting for response..." : "Ask a question about your documents..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      className={`
                        w-full pl-4 pr-14 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner 
                        ${isWaitingForResponse ? 'bg-gray-100 text-gray-500' : 'bg-gray-50/50 text-gray-900'}
                        text-base resize-none transition-colors duration-200
                      `}
                      disabled={isWaitingForResponse}
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isWaitingForResponse}
                      className={`
                        absolute right-2 top-1/2 transform -translate-y-1/2 p-3 rounded-xl transition-all duration-200
                        ${message.trim() && !isWaitingForResponse
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02]'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {isWaitingForResponse ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-500">
                      {isWaitingForResponse ? (
                        <span className="flex items-center text-blue-600">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Processing your request...
                        </span>
                      ) : (
                        <>Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Enter ↵</kbd> to send</>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      <Sparkles className="w-3 h-3 inline-block mr-1" />
                      AI-powered by DocBrain
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <PermissionGated permission="UPLOAD_DOCUMENT">
          <FileUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onUpload={handleUploadDocument} />
        </PermissionGated>
        
        <PermissionGated permission="SHARE_KNOWLEDGE_BASE">
          {id && id.trim() !== '' && (
            <ShareKnowledgeBaseModal 
              isOpen={showShareModal} 
              onClose={() => setShowShareModal(false)} 
              knowledgeBaseId={id} 
            />
          )}
        </PermissionGated>
      </div>
    </div>
  );
} 