import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ModulesModule } from '../modules/modules.module';
import { ActivitiesModule } from '../activities/activities.module';
import { UserModuleAccessModule } from '../user-module-access/user-module-access.module';
import { AgendamentoModule } from '../agendamento/agendamento.module';
import { ClientesModule } from '../clientes/clientes.module';
import { DisModule } from '../dis/dis.module';
import { MotoristasModule } from '../motoristas/motoristas.module';
import { VeiculosModule } from '../veiculos/veiculos.module';
import { TransportadorasModule } from '../transportadoras/transportadoras.module';
import { JanelasModule } from '../janelas/janelas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ModulesModule,
    ActivitiesModule,
    UserModuleAccessModule,
    AgendamentoModule,
    ClientesModule,
    DisModule,
    MotoristasModule,
    VeiculosModule,
    TransportadorasModule,
    JanelasModule,
  ],
})
export class AppModule {}
