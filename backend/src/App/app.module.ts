import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EmployeesModule } from '../employee/employee.module';
import { AdminModule } from '../admin/admin.module';
import { SupplierModule } from 'src/supplier/supplier.module';
import { FaturamentoModule } from 'src/faturamento/faturamento.module';
import { ModulesModule } from 'src/modules/modules.module';
import { UserModule } from 'src/user/user.module';
import { PermissionsModule } from 'src/permissions/permissions.module';
import { ActivitiesModule } from 'src/activities/activities.module';
import { UserModuleAccessModule } from 'src/user-module-access/user-module-access.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    AdminModule,
    SupplierModule,
    FaturamentoModule,
    ModulesModule,
    UserModule,
    PermissionsModule,
    ActivitiesModule,
    UserModuleAccessModule
  ],
})
export class AppModule {}
