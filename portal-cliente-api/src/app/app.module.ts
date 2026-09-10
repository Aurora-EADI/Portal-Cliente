import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ModulesModule } from '../modules/modules.module';
import { UserModuleAccessModule } from '../user-module-access/user-module-access.module';
import { AgendamentoModule } from '../agendamento/agendamento.module';
import { ClientesModule } from '../clientes/clientes.module';
import { DisModule } from '../dis/dis.module';
import { MotoristasModule } from '../motoristas/motoristas.module';
import { VeiculosModule } from '../veiculos/veiculos.module';
import { TransportadorasModule } from '../transportadoras/transportadoras.module';
import { JanelasModule } from '../janelas/janelas.module';
import { TiposDocumentoModule } from '../tipos-documento/tipos-documento.module';
import { ProcuracoesModule } from '../procuracoes/procuracoes.module';
import { AverbacoesModule } from '../averbacoes/averbacoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Teto global modesto; endpoints caros (upload, login) apertam mais com
    // @Throttle. O portal e exposto, entao o padrao e limitar, nao liberar.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ModulesModule,
    UserModuleAccessModule,
    AgendamentoModule,
    ClientesModule,
    DisModule,
    MotoristasModule,
    VeiculosModule,
    TransportadorasModule,
    JanelasModule,
    TiposDocumentoModule,
    ProcuracoesModule,
    AverbacoesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
