// src/services/embeddingService.ts
import { pipeline, Pipeline } from '@xenova/transformers';

// Import Document interface from ragService to avoid duplication
import type { Document } from './ragService';

// Define more specific types for the embedder
interface EmbedderOutput {
  data: Float32Array | number[];
}

interface EmbedderOptions {
  pooling: 'mean';
  normalize: boolean;
}

// Define the pipeline type more specifically
type FeatureExtractionPipeline = Pipeline;

export class EmbeddingService {
  private embedder: FeatureExtractionPipeline | null = null;

  async initialize(): Promise<void> {
    this.embedder = await pipeline(
      'feature-extraction',
      'sentence-transformers/all-MiniLM-L6-v2'
    ) as FeatureExtractionPipeline;
  }

  async createEmbedding(text: string): Promise<number[]> {
    if (!this.embedder) {
      throw new Error('EmbeddingService not initialized. Call initialize() first.');
    }

    const output = await this.embedder(text, {
      pooling: 'mean',
      normalize: true,
    } as EmbedderOptions) as EmbedderOutput;
    
    return Array.from(output.data);
  }

  async searchSimilar(query: string, documents: Document[], topK = 5): Promise<(Document & { similarity: number })[]> {
    const queryEmbedding = await this.createEmbedding(query);
    
    // Filter documents that have embeddings
    const documentsWithEmbeddings = documents.filter(doc => doc.embedding && doc.embedding.length > 0);
    
    // Cosine similarity calculation
    const similarities = documentsWithEmbeddings.map(doc => ({
      ...doc,
      similarity: this.cosineSimilarity(queryEmbedding, doc.embedding!)
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length for cosine similarity calculation');
    }

    const dotProduct = a.reduce((sum, a_i, i) => sum + a_i * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, a_i) => sum + a_i * a_i, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, b_i) => sum + b_i * b_i, 0));
    
    // Avoid division by zero
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Helper method to check if the service is initialized
  public isInitialized(): boolean {
    return this.embedder !== null;
  }
}