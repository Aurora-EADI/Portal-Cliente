import { Module } from '@nestjs/common';
import { UserActivityAccessController } from './user-activity-access.controller';
import { UserActivityAccessService } from './user-activity-access.service';

@Module({
  controllers: [UserActivityAccessController],
  providers: [UserActivityAccessService],
  exports: [UserActivityAccessService],
})
export class UserActivityAccessModule {}
