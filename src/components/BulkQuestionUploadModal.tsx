import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { questionApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { InformationCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface BulkQuestionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledgeBaseId: string;
  onUploadComplete: () => void;
}

// Required CSV columns based on the API documentation
const REQUIRED_COLUMNS = ['question', 'answer', 'answer_type'];

export default function BulkQuestionUploadModal({
  isOpen,
  onClose,
  knowledgeBaseId,
  onUploadComplete,
}: BulkQuestionUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validatedColumns, setValidatedColumns] = useState<{ [key: string]: boolean }>({});

  const validateCsvColumns = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      setIsValidating(true);
      setValidationError(null);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (!content) {
            setValidationError('Could not read file content');
            setIsValidating(false);
            resolve(false);
            return;
          }
          
          // Parse the header row to get columns
          const lines = content.split('\n');
          if (lines.length === 0) {
            setValidationError('File is empty');
            setIsValidating(false);
            resolve(false);
            return;
          }
          
          const headerRow = lines[0].trim();
          const columns = headerRow.split(',').map(col => col.trim().toLowerCase());
          
          // Check if all required columns are present
          const columnsStatus: { [key: string]: boolean } = {};
          let missingColumns: string[] = [];
          
          REQUIRED_COLUMNS.forEach(requiredCol => {
            const hasColumn = columns.includes(requiredCol.toLowerCase());
            columnsStatus[requiredCol] = hasColumn;
            if (!hasColumn) {
              missingColumns.push(requiredCol);
            }
          });
          
          setValidatedColumns(columnsStatus);
          
          if (missingColumns.length > 0) {
            setValidationError(`Missing required columns: ${missingColumns.join(', ')}`);
            setIsValidating(false);
            resolve(false);
            return;
          }
          
          setIsValidating(false);
          resolve(true);
        } catch (error) {
          console.error('CSV validation error:', error);
          setValidationError('Failed to validate CSV format');
          setIsValidating(false);
          resolve(false);
        }
      };
      
      reader.onerror = () => {
        setValidationError('Failed to read file');
        setIsValidating(false);
        resolve(false);
      };
      
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setValidationError(null);
    setValidatedColumns({});
    
    if (!selectedFile) {
      setFile(null);
      return;
    }
    
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a valid CSV file');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    
    // Validate CSV columns when file is selected
    await validateCsvColumns(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    // Validate columns before uploading
    const isValid = await validateCsvColumns(file);
    if (!isValid) {
      toast.error('CSV validation failed. Please check the required columns.');
      return;
    }

    setIsUploading(true);
    try {
      const result = await questionApi.bulkUpload(knowledgeBaseId, file);
      toast.success(`Successfully uploaded ${result.success} questions`);
      if (result.failed > 0) {
        toast.error(`${result.failed} questions failed to upload`);
        console.error('Upload errors:', result.errors);
      }
      onUploadComplete();
      onClose();
    } catch (error) {
      toast.error('Failed to upload questions');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Bulk Upload Questions
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Upload a CSV file with questions and answers to add them to your knowledge base.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* CSV format information */}
                <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Required CSV Format</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Your CSV file must include the following columns:</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          <li><code className="bg-blue-100 px-1 py-0.5 rounded">question</code>: The question text</li>
                          <li><code className="bg-blue-100 px-1 py-0.5 rounded">answer</code>: The answer text</li>
                          <li><code className="bg-blue-100 px-1 py-0.5 rounded">answer_type</code>: Must be either "DIRECT" or "SQL_QUERY"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 sm:mt-6">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="dropzone-file"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-10 h-10 mb-3 text-gray-400"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">CSV file only</p>
                      </div>
                      <input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept=".csv"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  
                  {/* File selected and validation results */}
                  {file && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">
                        Selected file: {file.name}
                      </p>
                      
                      {isValidating && (
                        <p className="mt-2 text-xs text-blue-600">
                          Validating CSV format...
                        </p>
                      )}
                      
                      {Object.keys(validatedColumns).length > 0 && !isValidating && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-blue-800">Column validation:</p>
                          <ul className="mt-1 space-y-1">
                            {REQUIRED_COLUMNS.map(col => (
                              <li key={col} className="flex items-center text-xs">
                                {validatedColumns[col] ? (
                                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                  <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={validatedColumns[col] ? "text-green-700" : "text-red-700"}>
                                  {col}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Validation error message */}
                  {validationError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-sm font-medium text-red-800 flex items-start">
                        <XCircleIcon className="h-5 w-5 text-red-400 mr-1.5 flex-shrink-0" />
                        {validationError}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed sm:col-start-2"
                    onClick={handleUpload}
                    disabled={!file || isUploading || isValidating || !!validationError}
                  >
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 