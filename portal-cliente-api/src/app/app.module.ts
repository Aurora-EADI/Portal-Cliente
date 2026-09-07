import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ModulesModule } from '../modules/modules.module';
import { UserModuleAccessModule } from '../user-module-access/user-module-access.module';
import { TiposDocumentoModule } from '../tipos-documento/tipos-documento.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ModulesModule,
    UserModuleAccessModule,
    TiposDocumentoModule,
  ],
})
export class AppModule {}
