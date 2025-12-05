import { Controller } from '@nestjs/common';
import { UserActivityAccessService } from './user-activity-access.service';

@Controller('user-activity-access')
export class UserActivityAccessController {
  constructor(private readonly userActivityAccessService: UserActivityAccessService) {}
}
