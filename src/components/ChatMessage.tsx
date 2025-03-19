import { Sparkles, User, Copy, Check, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, memo, useCallback } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Source {
  score: number;
  document_id: string;
  title: string;
  content: string;
  chunk_index: number;
}

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  type: 'user' | 'assistant';
  sources: Source[] | null;
  created_at: string;
  status: string;
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

// Memoize the actual component to prevent unnecessary rerenders
function ChatMessageComponent({ message }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

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

  // Don't render incomplete assistant messages
  if (message.type === 'assistant' && message.status !== 'processed') {
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
          <span className="text-sm">Processing response...</span>
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
      className={`group flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {message.type === 'assistant' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center ring-2 ring-white">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[85%] ${message.type === 'user' ? 'items-end' : 'items-start'}`}>
        <div className={`
          relative group/message px-4 py-2.5 rounded-2xl
          ${message.type === 'user' 
            ? 'bg-blue-600 text-white rounded-br-sm' 
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }
        `}>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>

          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className={`
                p-1.5 rounded-full transition-all duration-200
                ${message.type === 'user' 
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
                ${message.type === 'user'
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
          <motion.div
            initial="hidden"
            animate="visible"
            variants={sourceVariants}
            className="w-full space-y-2 overflow-hidden"
          >
            {message.sources.map((source, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  p-3 rounded-lg border text-sm
                  ${message.type === 'user'
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
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-gray-400">
            {formatTimestamp(message.created_at)}
          </span>
          {message.status && message.status !== 'processed' && (
            <span className="text-xs text-blue-500">
              {message.status}
            </span>
          )}
          {message.id && (
            <span className="text-xs text-gray-400">
              ID: {message.id.slice(0, 8)}
            </span>
          )}
        </div>
      </div>

      {message.type === 'user' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center ring-2 ring-white">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}

// Use React.memo to prevent re-renders when props haven't changed
export const ChatMessage = memo(ChatMessageComponent); 