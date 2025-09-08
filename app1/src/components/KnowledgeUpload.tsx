// src/components/KnowledgeUpload.tsx
import React, { useState } from 'react';
import { KnowledgeBaseService } from '../services/knowledgeBase';

interface KnowledgeUploadProps {
  knowledgeBaseService: KnowledgeBaseService;
  onUploadComplete?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
}

// Simple PDF content extraction function (placeholder)
const extractPDFContent = async (file: File): Promise<string> => {
  // For now, just return the filename as content
  // In a real implementation, you would use a PDF parsing library
  console.warn('PDF extraction not implemented yet');
  return `PDF file: ${file.name} (Content extraction not implemented)`;
};

const KnowledgeUpload: React.FC<KnowledgeUploadProps> = ({
  knowledgeBaseService,
  onUploadComplete,
  onUploadError
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      let content = '';
      
      if (file.type === 'application/pdf') {
        content = await extractPDFContent(file);
      } else if (file.type.includes('text')) {
        content = await file.text();
      } else if (file.type === 'application/json') {
        const jsonContent = await file.text();
        content = JSON.stringify(JSON.parse(jsonContent), null, 2);
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      const documentId = await knowledgeBaseService.addDocument(
        file.name,
        content,
        { 
          source: 'upload', 
          fileType: file.type 
        }
      );
      
      // Success feedback
      if (onUploadComplete) {
        onUploadComplete(documentId);
      }
      
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="knowledge-upload">
      <div className="upload-section">
        <label htmlFor="file-upload" className="upload-label">
          {isUploading ? 'Uploading...' : 'Choose File'}
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          accept=".txt,.pdf,.docx,.json"
          disabled={isUploading}
          className="file-input"
        />
      </div>
      
      {isUploading && (
        <div className="upload-progress">
          <div className="loading-spinner"></div>
          <span>Processing file...</span>
        </div>
      )}
      
      <div className="file-info">
        <p>Supported formats: .txt, .json, .pdf, .docx</p>
        <p className="note">Note: PDF and DOCX extraction is basic. For best results, use .txt or .json files.</p>
      </div>
    </div>
  );
};

export default KnowledgeUpload;