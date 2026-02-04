/**
 * Message batching for optimized database writes
 */
export interface BatchConfig {
  batchSize: number;
  flushIntervalMs: number;
}

export class MessageBatcher<T> {
  private queue: T[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private processor: (batch: T[]) => Promise<void>,
    private config: BatchConfig
  ) {}

  /**
   * Add message to batch
   */
  async add(message: T) {
    this.queue.push(message);

    // Flush if batch size reached
    if (this.queue.length >= this.config.batchSize) {
      await this.flush();
    } else if (!this.flushTimer) {
      // Start timer if not already running
      this.flushTimer = setTimeout(() => this.flush(), this.config.flushIntervalMs);
    }
  }

  /**
   * Flush batch
   */
  async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.queue.length === 0 || this.processing) {
      return;
    }

    this.processing = true;
    const batch = this.queue.splice(0, this.config.batchSize);

    try {
      await this.processor(batch);
    } finally {
      this.processing = false;

      // Continue processing if more messages in queue
      if (this.queue.length > 0) {
        await this.flush();
      }
    }
  }

  /**
   * Force flush and wait
   */
  async flushAndWait() {
    await this.flush();
    // Wait for any pending processing
    while (this.processing) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }
}
