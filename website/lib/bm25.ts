/**
 * BM25 Search Implementation
 *
 * BM25 (Best Matching 25) is a ranking function used for text retrieval.
 * It's based on term frequency and inverse document frequency with
 * length normalization.
 */

export interface BM25Document {
  id: string
  text: string
  [key: string]: any
}

export interface BM25SearchResult {
  id: string
  score: number
  rank: number
}

interface TokenizedDoc {
  id: string
  tokens: string[]
  length: number
}

/**
 * Simple tokenizer for search
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1)
}

/**
 * BM25 Search class
 */
export class BM25Search {
  private documents: TokenizedDoc[] = []
  private docMap: Map<string, TokenizedDoc> = new Map()
  private avgDocLength: number = 0
  private idf: Map<string, number> = new Map()

  // BM25 parameters
  private k1: number = 1.5 // Term frequency saturation
  private b: number = 0.75 // Length normalization

  constructor(k1: number = 1.5, b: number = 0.75) {
    this.k1 = k1
    this.b = b
  }

  /**
   * Index documents for search
   */
  index(docs: BM25Document[]): void {
    this.documents = []
    this.docMap.clear()
    this.idf.clear()

    // Document frequency for each term
    const df: Map<string, number> = new Map()
    let totalLength = 0

    // Tokenize all documents
    for (const doc of docs) {
      const tokens = tokenize(doc.text)
      const tokenizedDoc: TokenizedDoc = {
        id: doc.id,
        tokens,
        length: tokens.length,
      }

      this.documents.push(tokenizedDoc)
      this.docMap.set(doc.id, tokenizedDoc)
      totalLength += tokens.length

      // Count unique terms per document
      const uniqueTerms = new Set(tokens)
      for (const term of uniqueTerms) {
        df.set(term, (df.get(term) || 0) + 1)
      }
    }

    // Calculate average document length
    this.avgDocLength = totalLength / this.documents.length

    // Calculate IDF for each term
    const N = this.documents.length
    for (const [term, docFreq] of df) {
      // IDF formula: log((N - df + 0.5) / (df + 0.5))
      this.idf.set(term, Math.log((N - docFreq + 0.5) / (docFreq + 0.5) + 1))
    }
  }

  /**
   * Search documents
   */
  search(query: string, topK: number = 20): BM25SearchResult[] {
    const queryTokens = tokenize(query)

    if (queryTokens.length === 0) {
      return []
    }

    const scores: Array<{ id: string; score: number }> = []

    for (const doc of this.documents) {
      let score = 0

      // Calculate term frequencies in document
      const tf: Map<string, number> = new Map()
      for (const token of doc.tokens) {
        tf.set(token, (tf.get(token) || 0) + 1)
      }

      // BM25 scoring
      for (const term of queryTokens) {
        const termFreq = tf.get(term) || 0
        const idfScore = this.idf.get(term) || 0

        if (termFreq === 0) continue

        // BM25 formula
        const numerator = termFreq * (this.k1 + 1)
        const denominator =
          termFreq + this.k1 * (1 - this.b + this.b * (doc.length / this.avgDocLength))

        score += idfScore * (numerator / denominator)
      }

      if (score > 0) {
        scores.push({ id: doc.id, score })
      }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score)

    // Return top K with ranks
    return scores.slice(0, topK).map((item, index) => ({
      id: item.id,
      score: item.score,
      rank: index + 1,
    }))
  }

  /**
   * Get document count
   */
  get documentCount(): number {
    return this.documents.length
  }
}

/**
 * Create search text from CRL document
 */
export function createSearchText(doc: Record<string, unknown>): string {
  const parts: string[] = []

  if (typeof doc.drug_name === 'string') parts.push(doc.drug_name)
  if (typeof doc.application_number === 'string') parts.push(doc.application_number)
  if (typeof doc.sponsor_name === 'string') parts.push(doc.sponsor_name)
  if (typeof doc.therapeutic_area === 'string' && doc.therapeutic_area !== 'unknown') {
    parts.push(doc.therapeutic_area)
  }
  if (Array.isArray(doc.deficiency_categories)) {
    parts.push(doc.deficiency_categories.join(' '))
  }
  if (typeof doc.deficiencies_text === 'string') {
    parts.push(doc.deficiencies_text)
  } else if (typeof doc.raw_text === 'string') {
    // Use first 2000 chars of raw text for search
    parts.push(doc.raw_text.slice(0, 2000))
  }

  return parts.join(' ')
}
