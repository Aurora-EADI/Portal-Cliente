import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EmployeesModule } from '../employee/employee.module';
import { AdminModule } from '../admin/admin.module';
import { SupplierModule } from 'src/supplier/supplier.module';

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
  ],
})
export class AppModule {}
