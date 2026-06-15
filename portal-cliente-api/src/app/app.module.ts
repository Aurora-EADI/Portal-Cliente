import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ModulesModule } from '../modules/modules.module';
import { ActivitiesModule } from '../activities/activities.module';
import { UserModuleAccessModule } from '../user-module-access/user-module-access.module';
import { AgendamentoModule } from '../agendamento/agendamento.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    ModulesModule,
    ActivitiesModule,
    UserModuleAccessModule,
    AgendamentoModule,
  ],
})
export class AppModule {}
