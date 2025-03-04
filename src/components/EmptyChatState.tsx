import { MessageSquare } from 'lucide-react';

interface EmptyChatStateProps {
  onUpload: () => void;
}

export function EmptyChatState({ onUpload }: EmptyChatStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 mb-8 bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
        <MessageSquare className="w-full h-full text-white" />
      </div>
      <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
        Start a conversation
      </h3>
      <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">
        Upload a document to start asking questions and getting insights from your knowledge base.
      </p>
      <button 
        onClick={onUpload}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] font-medium"
      >
        Upload document
      </button>
    </div>
  );
} 