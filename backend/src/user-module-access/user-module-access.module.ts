import { Module } from '@nestjs/common';
import { UserModuleAccessController } from './user-module-access.controller';
import { UserModuleAccessService } from './user-module-access.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserModuleAccessController],
  providers: [UserModuleAccessService],
  exports: [UserModuleAccessService],
})
export class UserModuleAccessModule {}