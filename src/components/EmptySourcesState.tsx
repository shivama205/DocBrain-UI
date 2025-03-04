import { FileText } from 'lucide-react';

export function EmptySourcesState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 mb-8 bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-lg shadow-blue-500/20">
        <FileText className="w-full h-full text-white" />
      </div>
      <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
        Saved sources will appear here
      </h3>
      <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">
        Click Add source above to add PDFs, websites, text, videos or audio files. Or import a file directly from Google Drive.
      </p>
    </div>
  );
} 