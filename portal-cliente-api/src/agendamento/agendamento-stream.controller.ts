import { Controller, Req, Sse, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { User, UserRole } from '@prisma/client';
import { AgendamentoEventos } from './agendamento.eventos';
import { BetterAuthDomainGuard } from '../common/guards/better-auth-domain.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Stream do dashboard de agendamento: empurra a mudança de status feita no Aurora
 * assim que ela acontece. Caminho `/agendamento/stream` porque é o que o
 * `useAgendamentoStream` do front já consome.
 *
 * Controller separado do `AgendamentoController` de propósito: aquele tem
 * `@Roles(ADMIN, EMPLOYEE)` na classe, e como o `RolesGuard` usa
 * `getAllAndOverride`, o stream precisa declarar os cinco papéis. Em controller
 * próprio a intenção fica legível, do mesmo jeito que o
 * `DisAverbadasStreamController` faz.
 */
@Controller('agendamento')
@UseGuards(BetterAuthDomainGuard, RolesGuard)
export class AgendamentoStreamController {
  constructor(private readonly eventos: AgendamentoEventos) {}

  @Sse('stream')
  @Roles(
    UserRole.DESPACHANTE,
    UserRole.CLIENTE,
    UserRole.TRANSPORTADORA,
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
  )
  stream(@Req() req: Request) {
    return this.eventos.paraUsuario(req.user as User);
  }
}
