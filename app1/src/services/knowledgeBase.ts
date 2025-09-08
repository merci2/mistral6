// src/services/knowledgeBase.ts
import { EmbeddingService } from './embeddingService';
import type { Document } from './ragService';

// Define metadata interface for better type safety
interface DocumentMetadata {
  source: 'website' | 'upload' | 'manual';
  createdAt: Date;
  url?: string;
  fileType?: string;
}

// Define the type for partial metadata input
type PartialDocumentMetadata = Partial<Omit<DocumentMetadata, 'createdAt'>> & {
  source: DocumentMetadata['source'];
};

export class KnowledgeBaseService {
  private documents: Document[] = [];
  private embeddingService: EmbeddingService;

  constructor(embeddingService: EmbeddingService) {
    this.embeddingService = embeddingService;
    this.loadFromLocalStorage();
  }

  async addDocument(
    title: string, 
    content: string, 
    metadata: PartialDocumentMetadata
  ): Promise<string> {
    // Validate input data - create a proper document structure for validation
    const documentForValidation: Partial<Document> = {
      title,
      content,
      metadata: {
        ...metadata,
        createdAt: new Date() // Add createdAt for validation
      }
    };

    if (!this.validateDocument(documentForValidation)) {
      throw new Error('Invalid document data: title, content, and source are required');
    }

    const id = this.generateId();
    
    const document: Document = {
      id,
      title,
      content,
      embedding: [], // For now, we don't use real embeddings
      metadata: {
        createdAt: new Date(),
        ...metadata
      }
    };

    this.documents.push(document);
    this.saveToLocalStorage();
    return id;
  }

  async search(query: string, topK = 3): Promise<(Document & { similarity: number })[]> {
    const results = this.embeddingService.searchSimilar(
      query,
      this.documents,
      topK
    );

    return results;
  }

  getAllDocuments(): Document[] {
    return [...this.documents];
  }

  getDocumentById(id: string): Document | undefined {
    return this.documents.find(doc => doc.id === id);
  }

  removeDocument(id: string): boolean {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index !== -1) {
      this.documents.splice(index, 1);
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  updateDocument(id: string, updates: Partial<Pick<Document, 'title' | 'content'>>): boolean {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index !== -1) {
      this.documents[index] = {
        ...this.documents[index],
        ...updates
      };
      this.saveToLocalStorage();
      return true;
    }
    return false;
  }

  getDocumentsBySource(source: Document['metadata']['source']): Document[] {
    return this.documents.filter(doc => doc.metadata.source === source);
  }

  getDocumentsCount(): number {
    return this.documents.length;
  }

  clearAllDocuments(): void {
    this.documents = [];
    this.saveToLocalStorage();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private saveToLocalStorage(): void {
    try {
      const dataToSave = this.documents.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          createdAt: doc.metadata.createdAt.toISOString()
        }
      }));
      
      localStorage.setItem('knowledgeBase', JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Could not save to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem('knowledgeBase');
      if (data) {
        const parsed = JSON.parse(data);
        this.documents = parsed.map((doc: Document & { metadata: { createdAt: string } }) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            createdAt: new Date(doc.metadata.createdAt)
          }
        }));
      }
    } catch (error) {
      console.warn('Could not load from localStorage:', error);
      this.documents = [];
    }
  }

  // Utility method to validate document data
  private validateDocument(document: Partial<Document>): boolean {
    return !!(
      document.title?.trim() &&
      document.content?.trim() &&
      document.metadata?.source
    );
  }

  // Method to get statistics about the knowledge base
  getStatistics(): {
    totalDocuments: number;
    bySource: Record<Document['metadata']['source'], number>;
    totalContentLength: number;
  } {
    const bySource: Record<Document['metadata']['source'], number> = {
      manual: 0,
      upload: 0,
      website: 0
    };

    let totalContentLength = 0;

    this.documents.forEach(doc => {
      bySource[doc.metadata.source]++;
      totalContentLength += doc.content.length;
    });

    return {
      totalDocuments: this.documents.length,
      bySource,
      totalContentLength
    };
  }
}