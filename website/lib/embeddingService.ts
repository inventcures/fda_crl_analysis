/**
 * Embedding Service using Hugging Face Transformers.js
 *
 * Uses all-MiniLM-L6-v2 model (384 dimensions) for semantic embeddings.
 * Model is cached in browser IndexedDB after first download (~23MB).
 */

import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'

export type EmbeddingStatus = 'idle' | 'loading' | 'ready' | 'error'

class EmbeddingService {
  private embedder: FeatureExtractionPipeline | null = null
  private loadingPromise: Promise<void> | null = null
  private _status: EmbeddingStatus = 'idle'
  private _error: Error | null = null
  private _progress: number = 0
  private listeners: Set<() => void> = new Set()

  get status(): EmbeddingStatus {
    return this._status
  }

  get error(): Error | null {
    return this._error
  }

  get progress(): number {
    return this._progress
  }

  /**
   * Subscribe to status changes
   */
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb())
  }

  /**
   * Initialize the embedding model
   */
  async init(): Promise<void> {
    if (this.embedder) return
    if (this.loadingPromise) return this.loadingPromise

    this._status = 'loading'
    this._progress = 0
    this.notify()

    this.loadingPromise = (async () => {
      try {
        // Type cast needed due to complex union type from transformers.js
        const pipelineFn = pipeline as unknown as (
          task: string,
          model: string,
          options: Record<string, unknown>
        ) => Promise<FeatureExtractionPipeline>
        this.embedder = await pipelineFn('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
          progress_callback: (progress: { progress?: number }) => {
            if (progress.progress !== undefined) {
              this._progress = progress.progress
              this.notify()
            }
          },
        })
        this._status = 'ready'
        this._progress = 100
        this.notify()
      } catch (err) {
        this._status = 'error'
        this._error = err instanceof Error ? err : new Error(String(err))
        this.notify()
        throw err
      }
    })()

    return this.loadingPromise
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this._status === 'ready' && this.embedder !== null
  }

  /**
   * Generate embedding for text
   */
  async embed(text: string): Promise<number[]> {
    if (!this.embedder) {
      await this.init()
    }

    if (!this.embedder) {
      throw new Error('Embedding model not initialized')
    }

    // Generate embedding with mean pooling and normalization
    const output = await this.embedder(text, {
      pooling: 'mean',
      normalize: true,
    })

    // Extract the embedding array
    // The output is a Tensor, convert to array
    const embedding = Array.from(output.data as Float32Array)

    return embedding
  }

  /**
   * Generate embeddings for multiple texts (batched)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.embedder) {
      await this.init()
    }

    if (!this.embedder) {
      throw new Error('Embedding model not initialized')
    }

    const embeddings: number[][] = []

    // Process in batches to avoid memory issues
    const batchSize = 10
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)
      const outputs = await Promise.all(batch.map((text) => this.embed(text)))
      embeddings.push(...outputs)
    }

    return embeddings
  }
}

// Singleton instance
export const embeddingService = new EmbeddingService()
