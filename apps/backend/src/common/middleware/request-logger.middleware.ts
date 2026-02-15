import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '-';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const durationMs = Date.now() - startTime;
      const contentLength = res.get('content-length') || '-';

      const message = `${method} ${originalUrl} ${statusCode} ${durationMs}ms ${contentLength}b`;

      if (statusCode >= 500) {
        this.logger.error(`${message} ip=${ip} ua="${userAgent}"`);
      } else if (statusCode >= 400) {
        this.logger.warn(`${message} ip=${ip}`);
      } else {
        this.logger.log(message);
      }
    });

    next();
  }
}
