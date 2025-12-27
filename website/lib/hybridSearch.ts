/**
 * Hybrid Search Implementation
 *
 * Combines BM25 (keyword) and vector (semantic) search results
 * using Reciprocal Rank Fusion (RRF).
 */

import { BM25Search, BM25SearchResult, createSearchText } from './bm25'
import { VectorSearch, VectorSearchResult, vectorSearch as vectorSearchInstance } from './vectorSearch'
import { embeddingService } from './embeddingService'

export type SearchMode = 'hybrid' | 'keyword' | 'semantic'

export interface HybridSearchResult {
  id: string
  score: number
  bm25Score?: number
  vectorScore?: number
  bm25Rank?: number
  vectorRank?: number
}

export interface HybridSearchConfig {
  mode: SearchMode
  topK: number
  rrfK: number // RRF constant (default 60)
  bm25Weight: number // Weight for BM25 in fusion (0-1)
  vectorWeight: number // Weight for vector in fusion (0-1)
}

const DEFAULT_CONFIG: HybridSearchConfig = {
  mode: 'hybrid',
  topK: 20,
  rrfK: 60,
  bm25Weight: 0.5,
  vectorWeight: 0.5,
}

/**
 * Reciprocal Rank Fusion
 *
 * Combines rankings from multiple retrievers.
 * score(doc) = Σ weight_i / (k + rank_i(doc))
 */
function reciprocalRankFusion(
  bm25Results: BM25SearchResult[],
  vectorResults: VectorSearchResult[],
  config: HybridSearchConfig
): HybridSearchResult[] {
  const scores: Map<string, HybridSearchResult> = new Map()

  // Add BM25 contributions
  for (const result of bm25Results) {
    const rrfScore = config.bm25Weight / (config.rrfK + result.rank)
    scores.set(result.id, {
      id: result.id,
      score: rrfScore,
      bm25Score: result.score,
      bm25Rank: result.rank,
    })
  }

  // Add vector contributions
  for (const result of vectorResults) {
    const rrfScore = config.vectorWeight / (config.rrfK + result.rank)
    const existing = scores.get(result.id)

    if (existing) {
      existing.score += rrfScore
      existing.vectorScore = result.score
      existing.vectorRank = result.rank
    } else {
      scores.set(result.id, {
        id: result.id,
        score: rrfScore,
        vectorScore: result.score,
        vectorRank: result.rank,
      })
    }
  }

  // Sort by combined score
  const results = Array.from(scores.values())
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, config.topK)
}

/**
 * Hybrid Search class
 */
export class HybridSearch {
  private bm25: BM25Search
  private vectorSearch: VectorSearch
  private config: HybridSearchConfig
  private indexed: boolean = false
  private documents: Map<string, any> = new Map()

  constructor(config: Partial<HybridSearchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.bm25 = new BM25Search()
    this.vectorSearch = vectorSearchInstance
  }

  /**
   * Index documents for search
   */
  async index(docs: Array<{ file_hash: string; [key: string]: any }>): Promise<void> {
    // Store documents for lookup
    this.documents.clear()
    for (const doc of docs) {
      this.documents.set(doc.file_hash, doc)
    }

    // Index for BM25
    const bm25Docs = docs.map((doc) => ({
      id: doc.file_hash,
      text: createSearchText(doc),
    }))
    this.bm25.index(bm25Docs)

    // Load vector embeddings
    await this.vectorSearch.loadEmbeddings()

    this.indexed = true
    console.log(`Hybrid search indexed ${docs.length} documents`)
  }

  /**
   * Check if ready for search
   */
  isReady(): boolean {
    return this.indexed
  }

  /**
   * Check if semantic search is available
   */
  isSemanticReady(): boolean {
    return this.vectorSearch.isLoaded() && embeddingService.isReady()
  }

  /**
   * Perform search
   */
  async search(query: string, config?: Partial<HybridSearchConfig>): Promise<HybridSearchResult[]> {
    const searchConfig = { ...this.config, ...config }
    const { mode, topK } = searchConfig

    if (!this.indexed) {
      console.warn('Search index not ready')
      return []
    }

    if (!query.trim()) {
      return []
    }

    // Keyword-only search
    if (mode === 'keyword') {
      const bm25Results = this.bm25.search(query, topK)
      return bm25Results.map((r) => ({
        id: r.id,
        score: r.score,
        bm25Score: r.score,
        bm25Rank: r.rank,
      }))
    }

    // Semantic-only search
    if (mode === 'semantic') {
      if (!this.isSemanticReady()) {
        console.warn('Semantic search not ready, falling back to keyword')
        const bm25Results = this.bm25.search(query, topK)
        return bm25Results.map((r) => ({
          id: r.id,
          score: r.score,
          bm25Score: r.score,
          bm25Rank: r.rank,
        }))
      }

      const vectorResults = await this.vectorSearch.search(query, topK)
      return vectorResults.map((r) => ({
        id: r.id,
        score: r.score,
        vectorScore: r.score,
        vectorRank: r.rank,
      }))
    }

    // Hybrid search
    const bm25Results = this.bm25.search(query, topK * 2) // Get more for fusion

    // If semantic not ready, return keyword results
    if (!this.isSemanticReady()) {
      return bm25Results.slice(0, topK).map((r) => ({
        id: r.id,
        score: r.score,
        bm25Score: r.score,
        bm25Rank: r.rank,
      }))
    }

    const vectorResults = await this.vectorSearch.search(query, topK * 2)

    return reciprocalRankFusion(bm25Results, vectorResults, searchConfig)
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): any | undefined {
    return this.documents.get(id)
  }

  /**
   * Get all documents matching search results
   */
  getDocuments(results: HybridSearchResult[]): any[] {
    return results.map((r) => this.documents.get(r.id)).filter(Boolean)
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<HybridSearchConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): HybridSearchConfig {
    return { ...this.config }
  }
}

// Singleton instance
export const hybridSearch = new HybridSearch()
