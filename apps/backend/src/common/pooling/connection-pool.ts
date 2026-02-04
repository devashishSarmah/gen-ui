/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
}

/**
 * Generic connection pool implementation
 */
export class ConnectionPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private waiting: ((connection: T) => void)[] = [];

  constructor(
    private factory: {
      create(): Promise<T>;
      destroy(connection: T): Promise<void>;
      validate(connection: T): boolean;
    },
    private config: ConnectionPoolConfig
  ) {}

  /**
   * Initialize pool with minimum connections
   */
  async initialize() {
    for (let i = 0; i < this.config.minConnections; i++) {
      const conn = await this.factory.create();
      this.available.push(conn);
    }
  }

  /**
   * Acquire connection from pool
   */
  async acquire(timeoutMs = this.config.acquireTimeoutMs): Promise<T> {
    // Return available connection if exists
    if (this.available.length > 0) {
      const conn = this.available.pop()!;
      if (this.factory.validate(conn)) {
        this.inUse.add(conn);
        return conn;
      }
      // Invalid connection, destroy and create new one
      await this.factory.destroy(conn);
    }

    // Create new connection if under limit
    if (this.inUse.size + this.available.length < this.config.maxConnections) {
      const conn = await this.factory.create();
      this.inUse.add(conn);
      return conn;
    }

    // Wait for connection to be released
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        const index = this.waiting.indexOf(resolve);
        if (index >= 0) {
          this.waiting.splice(index, 1);
        }
        reject(new Error('Connection pool timeout'));
      }, timeoutMs);

      this.waiting.push((conn: T) => {
        clearTimeout(timeoutHandle);
        resolve(conn);
      });
    });
  }

  /**
   * Release connection back to pool
   */
  async release(conn: T) {
    this.inUse.delete(conn);

    // Notify waiting clients
    if (this.waiting.length > 0) {
      const waiter = this.waiting.shift()!;
      waiter(conn);
    } else if (this.factory.validate(conn)) {
      // Return to pool if valid
      this.available.push(conn);
    } else {
      // Destroy invalid connection
      await this.factory.destroy(conn);
    }
  }

  /**
   * Drain all connections
   */
  async drain() {
    const allConnections = [...this.available, ...this.inUse];
    for (const conn of allConnections) {
      await this.factory.destroy(conn);
    }
    this.available = [];
    this.inUse.clear();
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      waiting: this.waiting.length,
      total: this.available.length + this.inUse.size,
    };
  }
}
