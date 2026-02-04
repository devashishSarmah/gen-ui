import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, retryWhen, mergeMap, finalize } from 'rxjs/operators';
import { parseErrorResponse, getUserFriendlyMessage, isRetryableError, DEFAULT_HTTP_RETRY_CONFIG, HttpRetryConfig } from './error-handler';

/**
 * HTTP client with automatic retry and error handling
 */
@Injectable({
  providedIn: 'root',
})
export class ResilientHttpClient {
  constructor(private http: HttpClient) {}

  /**
   * GET with retry logic
   */
  get<T>(url: string, config?: Partial<HttpRetryConfig>): Observable<T> {
    const mergedConfig = { ...DEFAULT_HTTP_RETRY_CONFIG, ...config };
    
    return this.http.get<T>(url).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, attempt) => {
            if (attempt >= mergedConfig.maxRetries || !isRetryableError(error, mergedConfig)) {
              return throwError(() => error);
            }

            const delayMs = mergedConfig.initialDelayMs * Math.pow(mergedConfig.backoffMultiplier, attempt);
            console.warn(`Retrying GET ${url} after ${delayMs}ms (attempt ${attempt + 1}/${mergedConfig.maxRetries})`);
            return timer(delayMs);
          })
        )
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * POST with retry logic
   */
  post<T>(url: string, body: any, config?: Partial<HttpRetryConfig>): Observable<T> {
    const mergedConfig = { ...DEFAULT_HTTP_RETRY_CONFIG, ...config };

    return this.http.post<T>(url, body).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, attempt) => {
            if (attempt >= mergedConfig.maxRetries || !isRetryableError(error, mergedConfig)) {
              return throwError(() => error);
            }

            const delayMs = mergedConfig.initialDelayMs * Math.pow(mergedConfig.backoffMultiplier, attempt);
            console.warn(`Retrying POST ${url} after ${delayMs}ms (attempt ${attempt + 1}/${mergedConfig.maxRetries})`);
            return timer(delayMs);
          })
        )
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * PUT with retry logic
   */
  put<T>(url: string, body: any, config?: Partial<HttpRetryConfig>): Observable<T> {
    const mergedConfig = { ...DEFAULT_HTTP_RETRY_CONFIG, ...config };

    return this.http.put<T>(url, body).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, attempt) => {
            if (attempt >= mergedConfig.maxRetries || !isRetryableError(error, mergedConfig)) {
              return throwError(() => error);
            }

            const delayMs = mergedConfig.initialDelayMs * Math.pow(mergedConfig.backoffMultiplier, attempt);
            console.warn(`Retrying PUT ${url} after ${delayMs}ms (attempt ${attempt + 1}/${mergedConfig.maxRetries})`);
            return timer(delayMs);
          })
        )
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * DELETE with retry logic
   */
  delete<T>(url: string, config?: Partial<HttpRetryConfig>): Observable<T> {
    const mergedConfig = { ...DEFAULT_HTTP_RETRY_CONFIG, ...config };

    return this.http.delete<T>(url).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, attempt) => {
            if (attempt >= mergedConfig.maxRetries || !isRetryableError(error, mergedConfig)) {
              return throwError(() => error);
            }

            const delayMs = mergedConfig.initialDelayMs * Math.pow(mergedConfig.backoffMultiplier, attempt);
            console.warn(`Retrying DELETE ${url} after ${delayMs}ms (attempt ${attempt + 1}/${mergedConfig.maxRetries})`);
            return timer(delayMs);
          })
        )
      ),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Handle errors with user-friendly messages
   */
  private handleError(error: any) {
    const errorResponse = parseErrorResponse(error);
    const userMessage = getUserFriendlyMessage(errorResponse);

    const enhancedError = {
      ...errorResponse,
      userMessage,
    };

    console.error('HTTP Error:', enhancedError);
    return throwError(() => enhancedError);
  }
}
