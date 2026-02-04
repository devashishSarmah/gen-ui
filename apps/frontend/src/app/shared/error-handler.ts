/**
 * Global error handler for Angular
 */
export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
  details?: any;
}

/**
 * Parse error response from API
 */
export function parseErrorResponse(error: any): ErrorResponse {
  if (error.error && typeof error.error === 'object') {
    return error.error as ErrorResponse;
  }

  return {
    statusCode: error.status || 500,
    message: error.message || 'An unexpected error occurred',
    error: error.error?.error || 'UnknownError',
    timestamp: new Date().toISOString(),
    details: error,
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(errorResponse: ErrorResponse): string {
  const errorMap: Record<string, string> = {
    'WebSocketConnectionError': 'Connection lost. Please refresh the page.',
    'AiProviderError': 'AI service temporarily unavailable. Please try again.',
    'DatabaseError': 'Database operation failed. Please try again later.',
    'SchemaValidationError': 'Invalid schema configuration.',
    'TimeoutError': 'Request took too long. Please try again.',
    'RedisError': 'Cache service unavailable. Please try again.',
    'BadRequest': 'Invalid request. Please check your input.',
    'Unauthorized': 'You are not authorized to perform this action.',
    'Forbidden': 'You do not have permission to access this resource.',
    'NotFound': 'The requested resource was not found.',
  };

  return errorMap[errorResponse.error] || errorResponse.message || 'An error occurred. Please try again.';
}

/**
 * Retry configuration for HTTP requests
 */
export interface HttpRetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

export const DEFAULT_HTTP_RETRY_CONFIG: HttpRetryConfig = {
  maxRetries: 3,
  initialDelayMs: 100,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any, config: HttpRetryConfig): boolean {
  const statusCode = error.status;
  return config.retryableStatusCodes.includes(statusCode);
}
