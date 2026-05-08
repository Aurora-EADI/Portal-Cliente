import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MobileInspectionsService } from './mobile-inspections.service';

@Injectable()
export class ContainerSyncService {
  private readonly logger = new Logger(ContainerSyncService.name);

  constructor(private inspectionsService: MobileInspectionsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async syncContainers() {
    this.logger.log('ContainerSync: starting scheduled sync from SQL Server');
    try {
      await this.inspectionsService.getPendingContainers({});
      this.logger.log('ContainerSync: sync completed');
    } catch (err) {
      this.logger.error(`ContainerSync: sync failed — ${err}`);
    }
  }
}
