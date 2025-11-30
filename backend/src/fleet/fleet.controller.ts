// src/fleet/fleet.controller.ts

import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'; // Ajuste o caminho conforme seu projeto
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { FleetService } from './fleet.service';

@Controller('fleet')
@UseGuards(JwtAuthGuard, PermissionsGuard) // Aplica a verificação de Token (JWT) e a de Permissão
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  /**
   * Rota protegida que exige a permissão técnica 'LOG_VIEW_FLEET'.
   * Se o usuário não tiver essa permissão, o PermissionsGuard BLOQUEIA o acesso (403 Forbidden).
   */
  @Get()
  @RequirePermissions('LOG_VIEW_FLEET')
  async getFleetData(@Request() req) {
    // A lógica de negócio do Service (apenas retornamos dados mockados para o teste)
    return this.fleetService.findAll(req.user.companyId);
  }
}