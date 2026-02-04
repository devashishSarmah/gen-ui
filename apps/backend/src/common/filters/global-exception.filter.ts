import { ExceptionFilter, Catch, ArgumentsHost, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/**
 * Global exception filter for all HTTP exceptions
 * Provides consistent error response format
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'InternalServerError';
    let details: any = {};

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object') {
        const objResponse = exceptionResponse as any;
        message = objResponse.message || message;
        error = objResponse.error || error;
        details = objResponse;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.constructor.name;
      this.logger.error(`Unhandled ${error}: ${exception.message}`, exception.stack);
    }

    const errorResponse = {
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      ...details,
    };

    // Log errors in production
    if (statusCode >= 500) {
      this.logger.error(`HTTP ${statusCode}: ${message}`, {
        url: request.url,
        method: request.method,
        stack: exception.stack,
      });
    }

    response.status(statusCode).json(errorResponse);
  }
}
