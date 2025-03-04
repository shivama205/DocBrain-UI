import { useState } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

export function FileUploadModal({ isOpen, onClose, onUpload }: FileUploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl w-full max-w-lg mx-4">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
            Add source
          </h3>
        </div>
        <div className="p-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-2xl p-8 text-center
              ${dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
              }
              transition-colors duration-200
            `}
          >
            <Upload className={`w-8 h-8 mx-auto mb-4 ${uploading ? 'animate-bounce text-blue-500' : 'text-gray-400'}`} />
            <p className="text-gray-600 mb-2">
              {uploading ? (
                'Uploading...'
              ) : (
                <>
                  Drag and drop your file here, or{' '}
                  <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                    browse
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                  </label>
                </>
              )}
            </p>
            <p className="text-sm text-gray-500">
              Upload any document type - we'll process it for you
            </p>
            {error && (
              <p className="text-sm text-red-500 mt-4">{error}</p>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 