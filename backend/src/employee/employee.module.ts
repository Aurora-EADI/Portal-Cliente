import { Module } from '@nestjs/common';
import { EmployeesController } from './/employee.controller';
import { EmployeesService } from './employee.service';
import { PrismaPostgresService as  PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, PrismaService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
