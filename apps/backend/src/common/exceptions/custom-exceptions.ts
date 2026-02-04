import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom exception for WebSocket connection failures
 */
export class WebSocketConnectionException extends HttpException {
  constructor(message = 'WebSocket connection failed', metadata?: any) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message,
        error: 'WebSocketConnectionError',
        timestamp: new Date().toISOString(),
        metadata,
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }
}

/**
 * Custom exception for AI provider failures with fallback support
 */
export class AiProviderException extends HttpException {
  constructor(
    message = 'AI provider failed',
    public readonly provider: string,
    public readonly retryable: boolean = true,
    metadata?: any
  ) {
    super(
      {
        statusCode: HttpStatus.BAD_GATEWAY,
        message,
        error: 'AiProviderError',
        provider,
        retryable,
        timestamp: new Date().toISOString(),
        metadata,
      },
      HttpStatus.BAD_GATEWAY
    );
  }
}

/**
 * Custom exception for database failures
 */
export class DatabaseException extends HttpException {
  constructor(message = 'Database operation failed', metadata?: any) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        error: 'DatabaseError',
        timestamp: new Date().toISOString(),
        metadata,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Custom exception for schema validation errors
 */
export class SchemaValidationException extends HttpException {
  constructor(message = 'Schema validation failed', public readonly errors: any[] = []) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: 'SchemaValidationError',
        validationErrors: errors,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

/**
 * Custom exception for network timeouts
 */
export class TimeoutException extends HttpException {
  constructor(message = 'Operation timed out', public readonly timeoutMs: number = 0) {
    super(
      {
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        message,
        error: 'TimeoutError',
        timeoutMs,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.REQUEST_TIMEOUT
    );
  }
}

/**
 * Custom exception for Redis failures
 */
export class RedisException extends HttpException {
  constructor(message = 'Redis operation failed', metadata?: any) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        error: 'RedisError',
        timestamp: new Date().toISOString(),
        metadata,
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
