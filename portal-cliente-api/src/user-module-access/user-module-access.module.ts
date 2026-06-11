import { Module } from '@nestjs/common';
import { UserModuleAccessController } from './user-module-access.controller';
import { UserModuleAccessService } from './user-module-access.service';

@Module({
  controllers: [UserModuleAccessController],
  providers: [UserModuleAccessService],
  exports: [UserModuleAccessService],
})
export class UserModuleAccessModule {}
