import { Injectable, signal, computed } from '@angular/core';

export interface UISchema {
  id?: string;
  components: any[];
  layout?: any;
  version?: number;
}

export interface UIState {
  currentSchema: UISchema | null;
  streamingChunks: any[];
  isStreaming: boolean;
  completionPercentage: number;
  lastUpdate: Date | null;
}

@Injectable({
  providedIn: 'root',
})
export class UIStateStore {
  // Signals
  readonly currentSchema = signal<UISchema | null>(null);
  readonly streamingChunks = signal<any[]>([]);
  readonly isStreaming = signal(false);
  readonly completionPercentage = signal(0);
  readonly lastUpdate = signal<Date | null>(null);
  readonly error = signal<string | null>(null);

  // Computed
  readonly totalChunks = computed(() => this.streamingChunks().length);

  /**
   * Start streaming new UI
   */
  startStreaming(): void {
    this.isStreaming.set(true);
    this.streamingChunks.set([]);
    this.completionPercentage.set(0);
    this.currentSchema.set(null);
    this.error.set(null);
    this.lastUpdate.set(new Date());
  }

  /**
   * Add streaming chunk
   */
  addStreamingChunk(chunk: any): void {
    this.streamingChunks.update((chunks) => [...chunks, chunk]);

    // Update completion percentage
    const totalBytes = this.streamingChunks().reduce(
      (sum, c) => sum + (c.data ? JSON.stringify(c.data).length : 0),
      0
    );
    this.completionPercentage.set(Math.min(90, Math.floor((totalBytes / 10000) * 100)));
  }

  /**
   * Complete streaming
   */
  completeStreaming(schema: UISchema): void {
    this.currentSchema.set(schema);
    this.isStreaming.set(false);
    this.completionPercentage.set(100);
    this.lastUpdate.set(new Date());
    this.error.set(null);
  }

  /**
   * Handle streaming error
   */
  setStreamingError(error: string): void {
    this.error.set(error);
    this.isStreaming.set(false);
  }

  /**
   * Clear UI state
   */
  clear(): void {
    this.currentSchema.set(null);
    this.streamingChunks.set([]);
    this.isStreaming.set(false);
    this.completionPercentage.set(0);
    this.lastUpdate.set(null);
    this.error.set(null);
  }

  /**
   * Get current state
   */
  getState(): UIState {
    return {
      currentSchema: this.currentSchema(),
      streamingChunks: this.streamingChunks(),
      isStreaming: this.isStreaming(),
      completionPercentage: this.completionPercentage(),
      lastUpdate: this.lastUpdate(),
    };
  }
}
