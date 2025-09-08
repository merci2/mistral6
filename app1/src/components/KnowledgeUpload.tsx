// src/components/KnowledgeUpload.tsx
import React, { useState } from 'react';
import { KnowledgeBaseService } from '../services/knowledgeBase';

interface KnowledgeUploadProps {
  knowledgeBaseService: KnowledgeBaseService;
  onUploadComplete?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
}

// Type for PDF.js text items
type PDFTextItem = {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  [key: string]: unknown;
};

// Enhanced PDF content extraction using PDF.js
const extractPDFContent = async (file: File): Promise<string> => {
  try {
    // Dynamically import PDF.js
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Filter and map text items - use type assertion for PDF.js types
      const pageText = (textContent.items as PDFTextItem[])
        .filter(item => item.str && item.str.length > 0)
        .map(item => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
    }
    
    // Clean up the text
    fullText = fullText
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
    
    if (fullText.length < 50) {
      throw new Error('Could not extract meaningful text from PDF');
    }
    
    return fullText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    
    // Fallback to basic extraction
    return await basicPDFExtraction(file);
  }
};

// Fallback basic PDF extraction
const basicPDFExtraction = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  let text = '';
  for (let i = 0; i < uint8Array.length; i++) {
    const char = String.fromCharCode(uint8Array[i]);
    if (char.match(/[a-zA-Z0-9\s.,!?;:()\-'"äöüÄÖÜß]/)) {
      text += char;
    }
  }
  
  text = text.replace(/\s+/g, ' ').trim();
  
  if (text.length < 50) {
    return `PDF file: ${file.name}\n\nNote: This PDF contains complex formatting or is image-based. Basic text extraction returned limited content. Consider using OCR tools or converting to text format for better results.\n\nExtracted fragments: ${text.substring(0, 200)}...`;
  }
  
  return text;
};

// Enhanced Word document extraction using mammoth.js
const extractWordContent = async (file: File): Promise<string> => {
  try {
    // Dynamically import mammoth
    const mammoth = await import('mammoth');
    
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.value && result.value.trim().length > 0) {
      return result.value.trim();
    } else {
      throw new Error('No text content found in Word document');
    }
  } catch (error) {
    console.error('Word extraction error:', error);
    
    // Fallback to basic extraction for .docx files
    if (file.name.endsWith('.docx')) {
      return await basicWordExtraction(file);
    } else {
      return `Word document: ${file.name}\n\nNote: This appears to be a legacy .doc file. For better text extraction, please save the document as .docx or .txt format.`;
    }
  }
};

// Fallback basic Word extraction
const basicWordExtraction = async (file: File): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    let text = '';
    let inTextNode = false;
    
    // Look for text in XML structure of .docx
    for (let i = 0; i < uint8Array.length - 10; i++) {
      const char = String.fromCharCode(uint8Array[i]);
      
      // Simple XML parsing for <w:t> tags
      if (char === '<') {
        const nextChars = String.fromCharCode(...uint8Array.slice(i, i + 5));
        if (nextChars.includes('w:t')) {
          inTextNode = true;
          i += 10; // Skip the tag
          continue;
        } else if (nextChars.includes('</')) {
          inTextNode = false;
          i += 5;
          continue;
        }
      }
      
      if (inTextNode && char.match(/[a-zA-Z0-9\s.,!?;:()\-'"äöüÄÖÜß]/)) {
        text += char;
      }
    }
    
    text = text.replace(/\s+/g, ' ').trim();
    
    if (text.length < 50) {
      return `Word document: ${file.name}\n\nNote: This Word document contains complex formatting. Basic text extraction returned limited content. For better results, consider saving the document as plain text.\n\nExtracted fragments: ${text.substring(0, 200)}...`;
    }
    
    return text;
  } catch (error) {
    console.error('Basic Word extraction error:', error);
    return `Word document: ${file.name}\n\nError: Could not extract text from this Word document. Please try saving it as a text file first.`;
  }
};

// Enhanced file type detection
interface FileTypeInfo {
  type: string;
  supported: boolean;
  processor: ((file: File) => Promise<string>) | null;
}

const getFileTypeInfo = (file: File): FileTypeInfo => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type;
  
  // PDF files
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    return { type: 'pdf', supported: true, processor: extractPDFContent };
  }
  
  // Word documents
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      extension === 'docx') {
    return { type: 'docx', supported: true, processor: extractWordContent };
  }
  
  if (mimeType === 'application/msword' || extension === 'doc') {
    return { type: 'doc', supported: true, processor: extractWordContent };
  }
  
  // Text files
  if (mimeType.startsWith('text/') || extension === 'txt') {
    return { 
      type: 'text', 
      supported: true, 
      processor: async (file: File) => await file.text() 
    };
  }
  
  // JSON files
  if (mimeType === 'application/json' || extension === 'json') {
    return { 
      type: 'json', 
      supported: true, 
      processor: async (file: File) => {
        const content = await file.text();
        return JSON.stringify(JSON.parse(content), null, 2);
      }
    };
  }
  
  // Markdown files
  if (extension === 'md' || extension === 'markdown') {
    return { 
      type: 'markdown', 
      supported: true, 
      processor: async (file: File) => await file.text() 
    };
  }
  
  return { type: 'unknown', supported: false, processor: null };
};

const KnowledgeUpload: React.FC<KnowledgeUploadProps> = ({
  knowledgeBaseService,
  onUploadComplete,
  onUploadError
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(`Analyzing file: ${file.name}...`);
    
    try {
      const fileInfo = getFileTypeInfo(file);
      
      if (!fileInfo.supported || !fileInfo.processor) {
        throw new Error(`Unsupported file type: ${file.type}. Supported formats: .txt, .json, .pdf, .doc, .docx, .md`);
      }

      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 10MB.');
      }

      setUploadProgress(`Extracting content from ${fileInfo.type.toUpperCase()} file...`);
      
      const content = await fileInfo.processor(file);
      
      if (!content || content.trim().length < 10) {
        throw new Error('No meaningful content could be extracted from the file.');
      }

      setUploadProgress('Adding to knowledge base...');
      
      const documentId = await knowledgeBaseService.addDocument(
        file.name,
        content,
        { 
          source: 'upload', 
          fileType: fileInfo.type
        }
      );
      
      setUploadProgress('Upload completed successfully!');
      
      // Success feedback
      if (onUploadComplete) {
        onUploadComplete(documentId);
      }
      
      // Clear progress after delay
      setTimeout(() => setUploadProgress(''), 2000);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setUploadProgress('');
      
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div className="knowledge-upload">
      <div 
        className={`upload-section ${dragActive ? 'drag-active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="upload-area">
          <div className="upload-icon">📄</div>
          <div className="upload-text">
            <h4>Upload Document</h4>
            <p>Drag & drop a file here, or click to browse</p>
          </div>
          <label htmlFor="file-upload" className="upload-label">
            {isUploading ? 'Uploading...' : 'Choose File'}
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept=".txt,.pdf,.docx,.doc,.json,.md,.markdown"
            disabled={isUploading}
            className="file-input"
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      {isUploading && (
        <div className="upload-progress">
          <div className="loading-spinner"></div>
          <span>{uploadProgress}</span>
        </div>
      )}
      
      <div className="file-info">
        <h5>Supported Formats:</h5>
        <div className="format-list">
          <div className="format-item">
            <strong>📄 Text Files:</strong> .txt, .md, .markdown
          </div>
          <div className="format-item">
            <strong>📋 Data Files:</strong> .json
          </div>
          <div className="format-item">
            <strong>📕 PDF Files:</strong> .pdf (with text extraction)
          </div>
          <div className="format-item">
            <strong>📘 Word Documents:</strong> .doc, .docx (with text extraction)
          </div>
        </div>
        <p className="note">
          <strong>Note:</strong> Maximum file size is 10MB. For best results with PDF and Word files, 
          ensure they contain selectable text (not scanned images).
        </p>
      </div>
    </div>
  );
};

export default KnowledgeUpload;