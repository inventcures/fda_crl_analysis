/**
 * Vector Search Implementation
 *
 * Performs semantic search using pre-computed document embeddings
 * and cosine similarity.
 */

import { embeddingService } from './embeddingService'

export interface VectorSearchResult {
  id: string
  score: number
  rank: number
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`)
  }

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)

  if (denominator === 0) return 0

  return dot / denominator
}

/**
 * Vector Search class
 */
export class VectorSearch {
  private embeddings: Map<string, number[]> = new Map()
  private loaded: boolean = false

  /**
   * Load pre-computed embeddings from JSON file
   */
  async loadEmbeddings(url: string = '/data/embeddings.json'): Promise<void> {
    if (this.loaded) return

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load embeddings: ${response.status}`)
      }

      const data: Record<string, number[]> = await response.json()

      this.embeddings.clear()
      for (const [id, embedding] of Object.entries(data)) {
        this.embeddings.set(id, embedding)
      }

      this.loaded = true
      console.log(`Loaded ${this.embeddings.size} document embeddings`)
    } catch (error) {
      console.error('Failed to load embeddings:', error)
      throw error
    }
  }

  /**
   * Check if embeddings are loaded
   */
  isLoaded(): boolean {
    return this.loaded && this.embeddings.size > 0
  }

  /**
   * Search by query text
   */
  async search(query: string, topK: number = 20): Promise<VectorSearchResult[]> {
    if (!this.loaded) {
      await this.loadEmbeddings()
    }

    // Generate query embedding
    const queryEmbedding = await embeddingService.embed(query)

    return this.searchByVector(queryEmbedding, topK)
  }

  /**
   * Search by pre-computed query vector
   */
  searchByVector(queryEmbedding: number[], topK: number = 20): VectorSearchResult[] {
    const scores: Array<{ id: string; score: number }> = []

    for (const [id, docEmbedding] of this.embeddings) {
      const similarity = cosineSimilarity(queryEmbedding, docEmbedding)
      scores.push({ id, score: similarity })
    }

    // Sort by similarity descending
    scores.sort((a, b) => b.score - a.score)

    // Return top K with ranks
    return scores.slice(0, topK).map((item, index) => ({
      id: item.id,
      score: item.score,
      rank: index + 1,
    }))
  }

  /**
   * Get embedding dimension
   */
  getDimension(): number {
    const firstEmbedding = this.embeddings.values().next().value
    return firstEmbedding ? firstEmbedding.length : 0
  }

  /**
   * Get document count
   */
  get documentCount(): number {
    return this.embeddings.size
  }
}

// Singleton instance
export const vectorSearch = new VectorSearch()
