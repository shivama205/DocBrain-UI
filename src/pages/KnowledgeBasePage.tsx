import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Plus, FileText, Send, ArrowLeft, Sparkles, Pencil, User, Trash2, MessageSquare, LogOut, Loader2, RefreshCw, Check, Copy, ChevronDown, Clock, AlertCircle, CheckCircle, Share2, HelpCircle, Code } from 'lucide-react';
import { knowledgeBaseApi, documentApi, conversationApi, messageApi, questionApi } from '../services/api';
import { FileUploadModal } from '../components/FileUploadModal';
import { ShareKnowledgeBaseModal } from '../components/ShareKnowledgeBaseModal';
import { CreateQuestionModal } from '../components/CreateQuestionModal';
import { useAuth } from '../contexts/AuthContext';
import PermissionGated from '../components/PermissionGated';
import { useUser } from '../contexts/UserContext';
import BulkQuestionUploadModal from '../components/BulkQuestionUploadModal';
import { toast } from 'react-hot-toast';
import { FixedSizeList as List } from 'react-window';
import { memo } from 'react';
import { ChatMessage } from '../components/ChatMessage';

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

function EmptyQuestionsState({ onAddQuestion }: { onAddQuestion: () => void }) {
  const { hasPermission } = useUser();
  
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 mb-8 bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-2xl shadow-lg shadow-purple-500/20">
        <HelpCircle className="w-full h-full text-white" />
      </div>
      <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-transparent bg-clip-text">
        {hasPermission("CREATE_QUESTION") ? "Add your first question" : "No questions available"}
      </h3>
      
      {hasPermission("CREATE_QUESTION") ? (
        <>
          <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">
            Create pre-defined questions for your knowledge base.
          </p>
          <button 
            onClick={onAddQuestion}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] font-medium"
          >
            Add question
          </button>
        </>
      ) : (
        <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">
          No questions have been added to this knowledge base yet. Please contact an administrator to add questions.
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

interface Question {
  id: string;
  question: string;
  answer: string;
  answer_type: 'DIRECT' | 'SQL_QUERY';
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  error_message: string | null;
  knowledge_base_id: string;
  user_id: string;
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
    content: string;
    
    // Document source fields (optional)
    document_id?: string;
    title?: string;
    chunk_index?: number;
    
    // Question source fields (optional)
    question_id?: string;
    question?: string;
    answer?: string;
    answer_type?: 'DIRECT' | 'SQL_QUERY';
    routing?: {
      service: string;
      confidence: number;
      reasoning: string;
    };
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

// Memoize the ChatMessage component to prevent unnecessary re-renders
const MemoizedChatMessage = memo(({ message }: { message: Message }) => {
  return <ChatMessage message={message} />;
});

// Row renderer for virtualized list
const Row = memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: Message[] }) => {
  const message = data[index];
  
  // Calculate a more accurate and compact estimate of message height
  const getEstimatedHeight = (message: Message) => {
    const baseHeight = 100; // Increased base height for messages
    const contentLength = message.content?.length || 0;
    const sourcesCount = message.sources?.length || 0;
    
    // Add height for content (roughly 25px per 100 chars)
    const contentHeight = Math.ceil(contentLength / 100) * 25;
    
    // Add height for sources (roughly 100px per source)
    const sourcesHeight = sourcesCount * 100;
    
    return Math.max(baseHeight + contentHeight + sourcesHeight, 150);
  };
  
  // Check if this message should be grouped with the previous one
  const isGrouped = useMemo(() => {
    if (index === 0) return false;
    
    const prevMessage = data[index - 1];
    // Group messages from the same sender (kind) if they're close in time
    return message.kind === prevMessage.kind && 
           Math.abs(new Date(message.created_at).getTime() - 
                    new Date(prevMessage.created_at).getTime()) < 60000; // Within 1 minute
  }, [index, data, message]);
  
  // Add padding to allow space for expanding messages
  const adjustedStyle = {
    ...style,
    height: getEstimatedHeight(message),
    // Reduce padding for all messages, especially grouped ones
    paddingTop: isGrouped ? '0.25rem' : '0.5rem',
    paddingBottom: '0.5rem'
  };
  
  // Use message status as part of the key to force re-render when status changes
  const messageKey = `${message.id}-${message.status}`;
  
  return (
    <div style={adjustedStyle} key={messageKey}>
      <MemoizedChatMessage message={message} />
    </div>
  );
});

export default function KnowledgeBasePage({ isNew = false, documentsView = false }: KnowledgeBasePageProps) {
  const { id: knowledgeBaseId } = useParams<{ id: string }>();
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'questions'>('documents');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteQuestionConfirm, setShowDeleteQuestionConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isUserActive, setIsUserActive] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimestampRef = useRef<number>(Date.now());
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { hasPermission } = useUser();
  
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const [isRefreshingQuestions, setIsRefreshingQuestions] = useState(false);
  const [lastQuestionsRefresh, setLastQuestionsRefresh] = useState<Date | null>(null);
  const [showQuestionActions, setShowQuestionActions] = useState(false);
  
  // Check if any document is in processing state
  const pendingDocuments = documents.filter(doc => doc.status === 'PENDING').length;
  const processingDocuments = documents.filter(doc => doc.status === 'PROCESSING').length;
  const failedDocuments = documents.filter(doc => doc.status === 'FAILED').length;
  const hasProcessingDocuments = processingDocuments > 0 || pendingDocuments > 0;

  // Check if any question is in processing state
  const pendingQuestions = questions.filter(q => q.status === 'PENDING').length;
  const processingQuestions = questions.filter(q => q.status === 'PROCESSING').length;
  const failedQuestions = questions.filter(q => q.status === 'FAILED').length;
  const hasProcessingQuestions = processingQuestions > 0 || pendingQuestions > 0;

  const isNearBottom = useCallback(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return true;
    
    const threshold = 100;
    return chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < threshold;
  }, []);

  // Memoize sorted messages to prevent unnecessary re-sorting
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      // First sort by created_at timestamp
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      
      // If timestamps are the same (or very close), sort by kind
      // USER messages should come before ASSISTANT messages with the same timestamp
      if (Math.abs(timeA - timeB) < 1000) {
        if (a.kind === 'USER' && b.kind === 'ASSISTANT') return -1;
        if (a.kind === 'ASSISTANT' && b.kind === 'USER') return 1;
      }
      
      return timeA - timeB;
    });
  }, [messages]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      setIsUserActive(true);
      lastMessageTimestampRef.current = Date.now();
    };

    // Set up event listeners for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    
    // Set up inactivity timer
    const inactivityTimer = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - lastMessageTimestampRef.current;
      
      // If user has been inactive for 2 minutes, reduce polling frequency
      if (inactiveTime > 2 * 60 * 1000) {
        setIsUserActive(false);
      }
    }, 60 * 1000);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(inactivityTimer);
    };
  }, []);

  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const messagesData = await messageApi.list(conversationId);
      
      // Force re-render when a message status changes from processing to processed
      const hasStatusChange = messagesData.some(newMsg => {
        const existingMsg = messages.find(m => m.id === newMsg.id);
        return existingMsg && existingMsg.status !== newMsg.status;
      });

      // Use functional update to avoid race conditions
      setMessages(prevMessages => {
        // Always update if there's a status change
        if (hasStatusChange) {
          console.log("Message status change detected, updating messages");
        }
        
        // Compare message IDs to avoid unnecessary updates
        if (messagesData.length === prevMessages.length && 
            !hasStatusChange &&
            JSON.stringify(messagesData.map(m => m.id).sort()) === 
            JSON.stringify(prevMessages.map(m => m.id).sort())) {
          return prevMessages;
        }
        
        // Create a new array with latest data, ensuring proper conversation order
        return messagesData;
      });
      
      // Check if any message is still processing (only count ASSISTANT messages)
      const waitingForResponse = messagesData.some(msg => 
        msg.kind === 'ASSISTANT' && 
        ['PROCESSING', 'RECEIVED'].includes(msg.status)
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
  }, [conversationId, isNearBottom, messages]);

  // Restore the handleCreateNew function
  const handleCreateNew = useCallback(async () => {
    try {
      const newKb = await knowledgeBaseApi.create('Untitled knowledge base', 'New knowledge base');
      navigate(`/kb/${newKb.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to create knowledge base:', error);
      navigate('/');
    }
  }, [navigate]);

  // Restore the loadKnowledgeBase function
  const loadKnowledgeBase = useCallback(async () => {
    if (!knowledgeBaseId) return;
    try {
      const data = await knowledgeBaseApi.get(knowledgeBaseId);
      setTitle(data.name);

      const conversations = await conversationApi.list();
      const existingConversation = conversations.find((conv: Conversation) => conv.knowledge_base_id === knowledgeBaseId);
      
      if (existingConversation) {
        setConversationId(existingConversation.id);
      } else {
        const newConversation = await conversationApi.create(data.name, knowledgeBaseId);
        setConversationId(newConversation.id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      navigate('/');
    }
  }, [knowledgeBaseId, navigate, setConversationId, setTitle, setLoading]);

  // Restore the loadDocuments function with memoization
  const loadDocuments = useCallback(async () => {
    if (!knowledgeBaseId) return;
    try {
      const docs = await documentApi.list(knowledgeBaseId);
      setDocuments(prevDocs => {
        // Only update if there are actual changes
        if (JSON.stringify(docs.map(d => d.id)) === JSON.stringify(prevDocs.map(d => d.id))) {
          return prevDocs;
        }
        return docs;
      });
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }, [knowledgeBaseId]);

  // Restore the loadQuestions function with memoization
  const loadQuestions = useCallback(async () => {
    if (!knowledgeBaseId) return;
    try {
      const questionsList = await questionApi.list(knowledgeBaseId);
      setQuestions(prevQuestions => {
        // Only update if there are actual changes
        if (JSON.stringify(questionsList.map(q => q.id)) === JSON.stringify(prevQuestions.map(q => q.id))) {
          return prevQuestions;
        }
        return questionsList;
      });
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  }, [knowledgeBaseId]);

  // Restore the initial loading effect
  useEffect(() => {
    const loadData = async () => {
      if (!isNew) {
        await loadKnowledgeBase();
        await loadDocuments();
        await loadQuestions();
      } else if (isNew) {
        await handleCreateNew();
      }
    };
    
    loadData();
  }, [knowledgeBaseId, isNew, loadKnowledgeBase, loadDocuments, loadQuestions, handleCreateNew]);

  // Optimized message polling with adaptive frequency
  useEffect(() => {
    if (!conversationId) return;
    
    const pollMessages = () => {
      loadMessages();
      
      // Use shorter polling interval when waiting for responses
      const pollInterval = isWaitingForResponse ? 2000 : isUserActive ? 5000 : 15000;
      
      // Clear any existing timeout before setting a new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(pollMessages, pollInterval);
    };
    
    // Start polling immediately
    pollMessages();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [conversationId, loadMessages, isWaitingForResponse, isUserActive]);

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
    if (knowledgeBaseId) {
      try {
        await knowledgeBaseApi.update(knowledgeBaseId, title);
      } catch (error) {
        console.error('Failed to update knowledge base:', error);
      }
    }
  };

  const handleUploadDocument = async (file: File) => {
    if (!knowledgeBaseId) return;
    try {
      const newDoc = await documentApi.upload(knowledgeBaseId, file);
      setDocuments(prev => [...prev, newDoc]);
      setShowUploadModal(false);
      
      pollForDocumentStatus(newDoc.id);
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!knowledgeBaseId) return;
    console.log(`Attempting to delete document ${documentId} from knowledge base ${knowledgeBaseId}`);
    try {
      console.log('Making API call to delete document...');
      await documentApi.delete(knowledgeBaseId, documentId);
      console.log('Document deleted successfully, updating UI');
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !knowledgeBaseId || isWaitingForResponse) return;

    try {
      setIsWaitingForResponse(true);
      lastMessageTimestampRef.current = Date.now();
      setIsUserActive(true);
      
      if (!conversationId) {
        const conversation = await conversationApi.create(title, knowledgeBaseId);
        setConversationId(conversation.id);
      }

      if (conversationId) {
        const newMessage = await messageApi.create(conversationId, message);
        
        // Use functional update to ensure state consistency
        setMessages(prev => {
          const updatedMessages = [...prev];
          const messageExists = updatedMessages.some(m => m.id === newMessage.id);
          
          if (!messageExists) {
            updatedMessages.push(newMessage);
          }
          
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
    if (!knowledgeBaseId) return;
    try {
      const retryDoc = await documentApi.retry(knowledgeBaseId, documentId);
      setDocuments(prev => prev.map(doc => doc.id === documentId ? retryDoc : doc));
      
      pollForDocumentStatus(documentId);
    } catch (error) {
      console.error('Failed to retry document processing:', error);
    }
  };

  const pollForDocumentStatus = async (documentId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        if (!knowledgeBaseId) return;
        const doc = await documentApi.get(knowledgeBaseId, documentId);
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

  const handleCreateQuestion = async (questionText: string, answer: string, answerType: 'DIRECT' | 'SQL_QUERY') => {
    if (!knowledgeBaseId) return;
    try {
      const newQuestion = await questionApi.create(knowledgeBaseId, questionText, answer, answerType);
      setQuestions(prev => [...prev, newQuestion]);
      setLastQuestionsRefresh(new Date());
      setShowQuestionModal(false);
      
      // Poll for status updates
      pollForQuestionStatus(newQuestion.id);
      
    } catch (error) {
      console.error('Failed to create question:', error);
      toast.error('Failed to create question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!knowledgeBaseId) return;
    try {
      await questionApi.delete(knowledgeBaseId, questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      setShowDeleteQuestionConfirm(null);
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleRetryQuestion = async (questionId: string) => {
    if (!knowledgeBaseId) return;
    try {
      const retryQuestion = await questionApi.retry(knowledgeBaseId, questionId);
      setQuestions(prev => prev.map(q => q.id === questionId ? retryQuestion : q));
      
      pollForQuestionStatus(questionId);
    } catch (error) {
      console.error('Failed to retry question processing:', error);
    }
  };

  const pollForQuestionStatus = async (questionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        if (!knowledgeBaseId) return;
        const question = await questionApi.get(knowledgeBaseId, questionId);
        setQuestions(prev => prev.map(q => q.id === questionId ? question : q));
        
        if (question.status !== 'PENDING' && question.status !== 'PROCESSING') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Failed to poll question status:', error);
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
      
      if (knowledgeBaseId) {
        const newConversation = await conversationApi.create(title, knowledgeBaseId);
        setConversationId(newConversation.id);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleBulkUploadComplete = () => {
    fetchQuestions();
    setLastQuestionsRefresh(new Date());
  };

  const fetchQuestions = async () => {
    if (!knowledgeBaseId) return;
    try {
      setIsRefreshingQuestions(true);
      const response = await questionApi.list(knowledgeBaseId);
      setQuestions(response);
      setLastQuestionsRefresh(new Date());
      toast.success('Questions refreshed');
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to fetch questions');
    } finally {
      setIsRefreshingQuestions(false);
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
            
            {/* Add debug button (only visible in development) */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className={`p-2 rounded-xl transition-colors ${
                  showDebugInfo ? 'bg-green-100 text-green-700' : 'text-gray-400'
                }`}
                title="Debug message flow"
              >
                <Code className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Show debug info panel when enabled */}
      {showDebugInfo && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md w-full bg-gray-800 text-white p-4 rounded-lg shadow-lg max-h-[50vh] overflow-auto">
          <h3 className="text-sm font-medium mb-2">Message Debug Info</h3>
          <div className="space-y-2 text-xs">
            {sortedMessages.map((msg, i) => {
              // Normalize status to lowercase for comparison
              const status = msg.status.toLowerCase();
              
              return (
                <div key={msg.id} className="flex gap-2 p-2 rounded bg-gray-700">
                  <div className="font-mono">{i+1}.</div>
                  <div className={`font-medium ${msg.kind === 'USER' ? 'text-blue-300' : 'text-green-300'}`}>
                    {msg.kind}
                  </div>
                  <div className="truncate flex-1">{msg.content.slice(0, 30)}...</div>
                  <div className={`
                    px-1.5 rounded ${
                      status.includes('process') && !status.includes('processing') ? 'bg-green-800 text-green-200' : 
                      status.includes('received') ? 'bg-yellow-800 text-yellow-200' :
                      status.includes('processing') ? 'bg-blue-800 text-blue-200' :
                      status.includes('failed') ? 'bg-red-800 text-red-200' :
                      status.includes('sent') ? 'bg-green-800 text-green-200' :
                      'bg-gray-800 text-gray-200'
                    }
                  `}>
                    {msg.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-4rem)]">
        <PermissionGated 
          permission="VIEW_DOCUMENTS"
          fallback={documentsView ? <Navigate to="/" replace /> : null}
        >
          {/* Sidebar - now 1/3 width instead of 1/4 */}
          <div className="w-1/3 border-r border-gray-200 bg-white/80 backdrop-blur-lg flex flex-col shadow-lg shadow-blue-500/5">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex gap-1">
                <button 
                  onClick={() => setActiveTab('documents')}
                  className={`p-2 text-sm font-medium ${activeTab === 'documents' ? 'bg-blue-50 text-blue-600' : 'bg-white/0 text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="ml-1">Documents</span>
                </button>
                <button 
                  onClick={() => setActiveTab('questions')}
                  className={`p-2 text-sm font-medium ${activeTab === 'questions' ? 'bg-blue-50 text-blue-600' : 'bg-white/0 text-gray-600 hover:bg-gray-50'} rounded-lg transition-colors`}
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="ml-1">Questions</span>
                </button>
              </div>
            </div>
            
            {activeTab === 'documents' && (
              <div className="p-4 flex-1 overflow-y-auto">
                {/* Documents tab content */}
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
                        {/* Document item content */}
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
                        {/* Document actions */}
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
            )}

            {activeTab === 'questions' && (
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Questions</h2>
                    {lastQuestionsRefresh && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last updated: {lastQuestionsRefresh.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      onClick={fetchQuestions}
                      disabled={isRefreshingQuestions}
                      title="Refresh questions"
                    >
                      {isRefreshingQuestions ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                    
                    {hasPermission('CREATE_QUESTION') && (
                      <div className="relative">
                        <button
                          type="button"
                          className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
                          onClick={() => setShowQuestionActions(!showQuestionActions)}
                          title="Add question"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        
                        {showQuestionActions && (
                          <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <button
                              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => {
                                setShowQuestionActions(false);
                                setShowQuestionModal(true);
                              }}
                            >
                              Add Single Question
                            </button>
                            <button
                              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => {
                                setShowQuestionActions(false);
                                setIsBulkUploadModalOpen(true);
                              }}
                            >
                              Bulk Upload Questions
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Questions list */}
                {questions.length === 0 ? (
                  <EmptyQuestionsState onAddQuestion={() => setShowQuestionModal(true)} />
                ) : (
                  <>
                    {questions.map(question => (
                      <div key={question.id} className="group relative flex flex-col p-4 mb-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl cursor-pointer transition-all duration-200 border border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${
                              question.status === 'PENDING' ? 'bg-yellow-50' : 
                              question.status === 'PROCESSING' ? 'bg-blue-50' : 
                              question.status === 'FAILED' ? 'bg-red-50' : 
                              'bg-green-50'
                            }`}>
                              {question.status === 'PENDING' ? (
                                <Clock className="w-4 h-4 text-yellow-500" />
                              ) : question.status === 'PROCESSING' ? (
                                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                              ) : question.status === 'FAILED' ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <h3 className="font-medium text-sm text-gray-800">{question.question}</h3>
                          </div>
                          <PermissionGated permission="DELETE_QUESTION">
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {question.status === 'FAILED' && (
                                <button
                                  onClick={() => handleRetryQuestion(question.id)}
                                  className="p-1 rounded-lg transition-colors text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              )}
                              {showDeleteQuestionConfirm === question.id ? (
                                <div className="flex items-center gap-2 bg-white p-1 rounded-lg shadow-lg animate-fade-in">
                                  <button
                                    onClick={() => handleDeleteQuestion(question.id)}
                                    className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteQuestionConfirm(null)}
                                    className="px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-md"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteQuestionConfirm(question.id);
                                  }}
                                  className="p-1 rounded-lg transition-colors text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </PermissionGated>
                        </div>
                        <div className="px-6 py-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">Answer:</span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-700 flex items-center">
                              {question.answer_type === 'DIRECT' ? (
                                <><HelpCircle className="w-3 h-3 mr-1 text-blue-500" /> Direct</>
                              ) : (
                                <><Code className="w-3 h-3 mr-1 text-purple-500" /> SQL Query</>
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 truncate">
                            {question.answer}
                          </p>
                        </div>
                        {question.status === 'PENDING' && (
                          <div className="mt-1 text-xs text-yellow-600 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Waiting for processing...
                          </div>
                        )}
                        {question.status === 'PROCESSING' && (
                          <div className="mt-1 text-xs text-blue-600 flex items-center">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Processing question...
                          </div>
                        )}
                        {question.status === 'FAILED' && (
                          <div className="mt-1 text-xs text-red-600 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {question.error_message || 'Failed to process question'}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </PermissionGated>

        {/* Main content area - remaining 2/3 width instead of 3/4 */}
        <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-white/70 backdrop-blur-lg">
          {/* Main chat content */}
          {knowledgeBaseId === undefined || documents.length === 0 ? (
            <EmptyChatState onUpload={() => setShowUploadModal(true)} />
          ) : (
            <>
              <div className="flex-1 p-6 overflow-y-auto scroll-smooth relative" id="chat-messages" ref={chatContainerRef} onScroll={handleScroll}>
                <div className="max-w-3xl mx-auto space-y-4">
                  {sortedMessages.length === 0 ? (
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
                    <>
                      {/* Show all messages directly instead of using virtualization */}
                      {sortedMessages.map((message) => (
                        <div key={`${message.id}-${message.status}`} className="mb-4">
                          <ChatMessage message={message} />
                        </div>
                      ))}
                    </>
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
      </div>
      
      {/* Modals */}
      {showUploadModal && (
        <FileUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onUpload={handleUploadDocument}
        />
      )}
      
      {/* Other modals */}
      {showQuestionModal && (
        <CreateQuestionModal
          isOpen={showQuestionModal}
          onClose={() => setShowQuestionModal(false)}
          onCreate={handleCreateQuestion}
        />
      )}
      
      {showShareModal && (
        <ShareKnowledgeBaseModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          knowledgeBaseId={knowledgeBaseId}
        />
      )}

      {isBulkUploadModalOpen && knowledgeBaseId && (
        <BulkQuestionUploadModal
          isOpen={isBulkUploadModalOpen}
          onClose={() => setIsBulkUploadModalOpen(false)}
          knowledgeBaseId={knowledgeBaseId!}
          onUploadComplete={handleBulkUploadComplete}
        />
      )}
    </div>
  );
} 