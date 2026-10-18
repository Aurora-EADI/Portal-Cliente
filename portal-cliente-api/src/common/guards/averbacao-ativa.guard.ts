import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';

/**
 * Trava o módulo Averbação Aduaneira no backend pela mesma flag que o frontend
 * usa (AVERBACAO_ATIVA). Antes a flag só escondia a navegação e relaxava uma
 * exigência de procuração — os controllers continuavam registrados e
 * alcançáveis, então "desligar o módulo" era falsa sensação de segurança.
 *
 * Desligada, responde 404 (e não 403) para espelhar o notFound() do Next: do
 * ponto de vista de quem chama, a rota simplesmente não existe.
 */
@Injectable()
export class AverbacaoAtivaGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.AVERBACAO_ATIVA !== 'true') {
      throw new NotFoundException();
    }
    return true;
  }
}
