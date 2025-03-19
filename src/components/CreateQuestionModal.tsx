import { useState } from 'react';
import { X, HelpCircle, Code } from 'lucide-react';

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (question: string, answer: string, answerType: 'DIRECT' | 'SQL_QUERY') => Promise<void>;
}

export function CreateQuestionModal({ isOpen, onClose, onCreate }: CreateQuestionModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerType, setAnswerType] = useState<'DIRECT' | 'SQL_QUERY'>('DIRECT');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError('Question and answer are required');
      return;
    }
    
    setIsCreating(true);
    setError(null);
    try {
      await onCreate(question, answer, answerType);
      setQuestion('');
      setAnswer('');
      setAnswerType('DIRECT');
      onClose();
    } catch (error) {
      console.error('Failed to create question:', error);
      setError('Failed to create question. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
            Add Question
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreating}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter the answer"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreating}
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="answerType"
                  checked={answerType === 'DIRECT'}
                  onChange={() => setAnswerType('DIRECT')}
                  className="mr-2"
                  disabled={isCreating}
                />
                <HelpCircle className="w-4 h-4 mr-1 text-blue-500" />
                <span>Direct Answer</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="answerType"
                  checked={answerType === 'SQL_QUERY'}
                  onChange={() => setAnswerType('SQL_QUERY')}
                  className="mr-2"
                  disabled={isCreating}
                />
                <Code className="w-4 h-4 mr-1 text-purple-500" />
                <span>SQL Query</span>
              </label>
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-red-500 mb-4">{error}</p>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`
                px-4 py-2 rounded-xl transition-all
                ${isCreating
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02]'
                }
              `}
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 