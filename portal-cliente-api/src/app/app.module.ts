import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ModulesModule } from '../modules/modules.module';
import { ActivitiesModule } from '../activities/activities.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { UserModuleAccessModule } from '../user-module-access/user-module-access.module';
import { UserActivityAccessModule } from '../user-activity-access/user-activity-access.module';
import { AgendamentoModule } from '../agendamento/agendamento.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ModulesModule,
    ActivitiesModule,
    PermissionsModule,
    UserModuleAccessModule,
    UserActivityAccessModule,
    AgendamentoModule,
  ],
})
export class AppModule {}
