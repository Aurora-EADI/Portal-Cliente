import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  timestamp: string;
  path: string;
}

export const APP_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_INACTIVE: 'USER_INACTIVE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  FOREIGN_KEY_CONFLICT: 'FOREIGN_KEY_CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = APP_ERROR_CODES.INTERNAL_ERROR;
    let message = 'Ocorreu um erro interno. Tente novamente mais tarde.';
    let prismaCode: string | undefined;

    // 1. Erros conhecidos do Prisma
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      prismaCode = exception.code;
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          code = APP_ERROR_CODES.RESOURCE_CONFLICT;
          message = 'Já existe um registro com esses dados.';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          code = APP_ERROR_CODES.RESOURCE_NOT_FOUND;
          message = 'Registro não encontrado.';
          break;
        case 'P2003':
          status = HttpStatus.CONFLICT;
          code = APP_ERROR_CODES.FOREIGN_KEY_CONFLICT;
          message = 'Operação não permitida: registro vinculado a outros dados.';
          break;
        default:
          // Demais erros Prisma (P2021, conexão recusada, etc.) permanecem como 500 seguro
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          code = APP_ERROR_CODES.INTERNAL_ERROR;
          message = 'Ocorreu um erro interno. Tente novamente mais tarde.';
          break;
      }
    }
    // 2. Exceções HTTP do NestJS (HttpException)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;

        if (typeof resObj.code === 'string') {
          code = resObj.code;
        }

        if (status === HttpStatus.BAD_REQUEST) {
          code = typeof resObj.code === 'string' ? resObj.code : APP_ERROR_CODES.VALIDATION_ERROR;
          message = 'Verifique os dados informados.';
        } else if (typeof resObj.message === 'string') {
          message = resObj.message;
        } else if (Array.isArray(resObj.message)) {
          code = APP_ERROR_CODES.VALIDATION_ERROR;
          message = 'Verifique os dados informados.';
        }
      } else if (typeof res === 'string') {
        message = res;
      }

      // Códigos estáveis padrão caso não definidos pelo throw original
      if (code === APP_ERROR_CODES.INTERNAL_ERROR) {
        switch (status) {
          case HttpStatus.UNAUTHORIZED:
            code = APP_ERROR_CODES.UNAUTHORIZED;
            if (!message || message === 'Unauthorized') {
              message = 'Sua sessão expirou. Entre novamente.';
            }
            break;
          case HttpStatus.FORBIDDEN:
            code = APP_ERROR_CODES.FORBIDDEN;
            if (!message || message === 'Forbidden') {
              message = 'Você não tem permissão para realizar esta ação.';
            }
            break;
          case HttpStatus.NOT_FOUND:
            code = APP_ERROR_CODES.RESOURCE_NOT_FOUND;
            if (!message || message === 'Not Found') {
              message = 'Registro não encontrado.';
            }
            break;
          case HttpStatus.CONFLICT:
            code = APP_ERROR_CODES.RESOURCE_CONFLICT;
            if (!message || message === 'Conflict') {
              message = 'Não foi possível concluir a operação devido a um conflito de dados.';
            }
            break;
          case HttpStatus.TOO_MANY_REQUESTS:
            code = APP_ERROR_CODES.TOO_MANY_REQUESTS;
            message = 'Muitas tentativas. Aguarde um momento e tente novamente.';
            break;
          default:
            if (status >= 500) {
              code = APP_ERROR_CODES.INTERNAL_ERROR;
              message = 'Ocorreu um erro interno. Tente novamente mais tarde.';
            }
            break;
        }
      }
    }
    // 3. Demais erros inesperados
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = APP_ERROR_CODES.INTERNAL_ERROR;
      message = 'Ocorreu um erro interno. Tente novamente mais tarde.';
    }

    // 4. Log seguro e enxuto no backend
    // Não loga body, Authorization, Cookie ou headers completos
    const stack = exception instanceof Error ? exception.stack : String(exception);
    const correlationId = request.headers?.['x-correlation-id'] || request.headers?.['x-request-id'] || '-';
    const logDetails = `[${request.method}] ${request.url} -> ${status} (${code})${prismaCode ? ` [Prisma: ${prismaCode}]` : ''} [corr:${correlationId}]`;

    if (status >= 500) {
      this.logger.error(`${logDetails}\n${stack}`);
    } else {
      this.logger.warn(`${logDetails} - ${message}`);
    }

    const payload: ApiErrorResponse = {
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url?.split('?')[0] || request.url,
    };

    response.status(status).json(payload);
  }
}

