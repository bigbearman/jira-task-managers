import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    // Skip non-HTTP contexts (e.g., Telegraf bot updates)
    if (host.getType() !== 'http') {
      this.logger.error(
        `[${host.getType()}] Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      const errorId = uuidv4();
      this.logger.error({
        errorId,
        route: request.url,
        method: request.method,
        message: exception.message,
        stack: exception.stack,
      });

      response.status(status).json({
        success: false,
        errorId,
        message: 'Internal server error',
        statusCode: status,
      });
    } else {
      const exceptionResponse =
        exception instanceof HttpException ? exception.getResponse() : {};
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any)?.message || exception.message;

      response.status(status).json({
        success: false,
        message,
        statusCode: status,
      });
    }
  }
}
