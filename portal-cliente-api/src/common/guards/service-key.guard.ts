import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/**
 * Autenticação server-to-server das rotas /api/service/**.
 *
 * Só o Portal Aurora chama essas rotas, sempre outbound da intranet para cá.
 * Não há usuário, não há cookie: a credencial é o header x-service-key.
 *
 * Promove a lógica que estava inline nas Route Handlers do frontend
 * (src/app/api/service/convites/route.ts) a guard reutilizável, com duas
 * diferenças: comparação em tempo constante e log de tentativa recusada.
 */
@Injectable()
export class ServiceKeyGuard implements CanActivate {
  private readonly logger = new Logger(ServiceKeyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const esperada = process.env.SERVICE_API_KEY;

    // Sem chave configurada, negar tudo. Liberar seria transformar um erro de
    // configuração numa rota aberta na internet.
    if (!esperada) {
      this.logger.error(
        'SERVICE_API_KEY não configurada — rotas /service indisponíveis',
      );
      throw new ServiceUnavailableException('Service API não configurada');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const recebida = request.headers['x-service-key'];

    if (typeof recebida !== 'string' || !this.conferem(recebida, esperada)) {
      this.logger.warn(
        `Chave de serviço inválida em ${request.method} ${request.originalUrl} (origem ${request.ip})`,
      );
      throw new UnauthorizedException('Chave de serviço inválida');
    }

    return true;
  }

  /**
   * timingSafeEqual exige buffers do mesmo tamanho e vaza o tamanho por
   * exceção — comparar o length antes devolveria a diferença por outra via.
   * Passar as duas pelo mesmo hash iguala o tamanho sem revelar nada.
   */
  private conferem(recebida: string, esperada: string): boolean {
    const a = Buffer.from(recebida, 'utf8');
    const b = Buffer.from(esperada, 'utf8');
    if (a.length !== b.length) {
      // Ainda assim faz uma comparação, para o tempo não denunciar o tamanho.
      timingSafeEqual(b, b);
      return false;
    }
    return timingSafeEqual(a, b);
  }
}
