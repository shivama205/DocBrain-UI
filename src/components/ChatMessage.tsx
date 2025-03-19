import { Sparkles, User, Copy, Check, MessageSquare, Loader2, HelpCircle, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, memo, useCallback, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Source {
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
  answer_type?: string;
  routing?: {
    service: string;
    confidence: number;
    reasoning: string;
  };
}

interface Message {
  id: string;
  content: string;
  content_type?: string;
  kind?: 'USER' | 'ASSISTANT';
  type?: 'user' | 'assistant';  // For backward compatibility
  user_id?: string;
  conversation_id: string;
  knowledge_base_id?: string;
  sources: Source[] | null;
  status: string;
  created_at: string;
  updated_at?: string;
}

interface ChatMessageProps {
  message: Message;
}

const messageVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

const sourceVariants = {
  hidden: { height: 0, opacity: 0 },
  visible: { 
    height: "auto", 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25
    }
  }
};

// Helper function to determine if a source is a question source
const isQuestionSource = (source: Source): boolean => {
  return !!source.question_id;
};

// Helper to format answer type for display
const formatAnswerType = (answerType: string | undefined): string => {
  if (!answerType) return 'DIRECT';
  
  // Handle 'AnswerType.DIRECT' format
  if (answerType.includes('.')) {
    return answerType.split('.')[1];
  }
  
  return answerType;
};

// Memoize the actual component to prevent unnecessary rerenders
function ChatMessageComponent({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Count document and question sources
  const documentSources = message.sources?.filter(source => !isQuestionSource(source)) || [];
  const questionSources = message.sources?.filter(source => isQuestionSource(source)) || [];

  // Format the timestamp nicely
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Determine message type, supporting both 'kind' and 'type' fields for compatibility
  const isUserMessage = message.kind === 'USER' || message.type === 'user';

  // Normalize the status for comparison
  const normalizeStatus = useCallback((status: string): string => {
    return status.toLowerCase();
  }, []);

  // Check if message is in processing state
  const isProcessing = useMemo(() => {
    // User messages should not show processing state if they've been received
    // User messages with status RECEIVED are normal, not "processing"
    if (isUserMessage) {
      return false;
    }
    
    // Only assistant messages can be in processing state
    if (!message.status) return false;
    const status = normalizeStatus(message.status);
    return ['processing', 'received'].includes(status);
  }, [message.status, normalizeStatus, isUserMessage]);

  // Clean content to ensure proper markdown rendering
  const cleanContent = useMemo(() => {
    if (!message.content) return '';
    
    // Remove any excessive newlines that might break markdown
    return message.content.replace(/\n{3,}/g, '\n\n');
  }, [message.content]);

  // Don't render incomplete assistant messages
  if ((message.kind === 'ASSISTANT' || message.type === 'assistant') && isProcessing) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={messageVariants}
        className="flex gap-3"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center ring-2 ring-white">
          <Loader2 className="w-4 h-4 text-white animate-spin" />
        </div>
        <div className="flex items-center bg-gray-100 text-gray-500 px-4 py-2.5 rounded-2xl rounded-bl-sm">
          <span className="text-sm">
            {message.content || "Processing response..."}
            <span className="inline-flex ml-2">
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
            </span>
          </span>
        </div>
      </motion.div>
    );
  }

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  // Define markdown components
  const markdownComponents: Components = {
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match;
      return isInline ? (
        <code className={className} {...props}>
          {children}
        </code>
      ) : (
        <SyntaxHighlighter
          style={atomDark}
          language={match[1]}
          PreTag="div"
          customStyle={{ borderRadius: '0.5rem', fontSize: '0.875rem' }}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={messageVariants}
      className={`group flex gap-3 ${isUserMessage ? 'justify-end' : 'justify-start'}`}
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
            ? 'bg-blue-600 text-white rounded-br-sm' 
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }
        `}>
          <div className={`prose prose-sm max-w-none ${isUserMessage ? 'prose-invert' : ''}`}>
            <ReactMarkdown components={markdownComponents}>
              {cleanContent}
            </ReactMarkdown>
          </div>

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
            <div className="absolute bottom-0 left-0 transform -translate-x-2 translate-y-2 flex gap-1">
              {documentSources.length > 0 && (
                <button
                  onClick={() => setShowSources(!showSources)}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
                    ${isUserMessage
                      ? 'bg-blue-700 text-white/90 hover:bg-blue-800'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }
                  `}
                >
                  <FileText className="w-3 h-3" />
                  {documentSources.length} {documentSources.length === 1 ? 'document' : 'documents'}
                </button>
              )}
              
              {questionSources.length > 0 && (
                <button
                  onClick={() => setShowSources(!showSources)}
                  className={`
                    flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200
                    ${isUserMessage
                      ? 'bg-purple-700 text-white/90 hover:bg-purple-800'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }
                  `}
                >
                  <HelpCircle className="w-3 h-3" />
                  {questionSources.length} {questionSources.length === 1 ? 'question' : 'questions'}
                </button>
              )}
            </div>
          )}
        </div>

        {message.sources && message.sources.length > 0 && showSources && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={sourceVariants}
            className="w-full space-y-2 overflow-hidden"
          >
            {/* Document Sources */}
            {documentSources.map((source, index) => (
              <motion.div
                key={`doc-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
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
                    <div className="flex items-center gap-1.5 mb-1">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <h4 className="font-medium text-gray-900">{source.title || 'Document'}</h4>
                    </div>
                    <p className="mt-1 text-gray-600 line-clamp-2">{source.content}</p>
                  </div>
                  <span className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-green-50 text-green-700 rounded-full">
                    {Math.round(source.score * 100)}% match
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Question Sources */}
            {questionSources.map((source, index) => (
              <motion.div
                key={`q-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (documentSources.length + index) * 0.1 }}
                className={`
                  p-3 rounded-lg border text-sm
                  ${isUserMessage
                    ? 'bg-purple-50 border-purple-100'
                    : 'bg-purple-50 border-purple-100'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                      <h4 className="font-medium text-gray-900">Matched Question</h4>
                      {source.answer_type && (
                        <span className="ml-auto text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                          {formatAnswerType(source.answer_type)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 font-medium">{source.question}</p>
                    <div className="mt-2 bg-white p-2 rounded-md border border-purple-100">
                      <p className="text-xs text-gray-500 mb-1">Answer:</p>
                      <p className="text-sm text-gray-700">{source.answer}</p>
                    </div>
                    {source.routing && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="text-purple-600 font-medium">Confidence:</span> {Math.round(source.routing.confidence * 100)}%
                      </div>
                    )}
                  </div>
                  <span className="flex-shrink-0 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                    {Math.round(source.score * 100)}% match
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-gray-400">
            {formatTimestamp(message.created_at)}
          </span>
          {isProcessing && (
            <span className="text-xs text-blue-500 flex items-center">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Processing
            </span>
          )}
          {message.status && normalizeStatus(message.status) === 'failed' && (
            <span className="text-xs text-red-500 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Failed
            </span>
          )}
          <button 
            onClick={() => setShowDebug(!showDebug)} 
            className="text-xs text-gray-400 hover:text-gray-600"
            title="Show message details"
          >
            ID: {message.id.slice(0, 8)}
          </button>
        </div>

        {/* Debug information */}
        {showDebug && (
          <div className="w-full mt-1 p-2 bg-gray-100 rounded-lg text-xs text-gray-700 font-mono overflow-x-auto">
            <pre>{JSON.stringify(message, null, 2)}</pre>
          </div>
        )}
      </div>

      {isUserMessage && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center ring-2 ring-white">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}

// Use React.memo to prevent re-renders when props haven't changed
export const ChatMessage = memo(ChatMessageComponent, (prevProps, nextProps) => {
  // Always re-render if status changes
  if (prevProps.message.status !== nextProps.message.status) {
    return false;
  }
  
  // Always re-render if content changes
  if (prevProps.message.content !== nextProps.message.content) {
    return false;
  }
  
  // Re-render if sources changes
  if (JSON.stringify(prevProps.message.sources) !== JSON.stringify(nextProps.message.sources)) {
    return false;
  }
  
  // Otherwise, only re-render if the entire message object changes
  return JSON.stringify(prevProps.message) === JSON.stringify(nextProps.message);
}); 