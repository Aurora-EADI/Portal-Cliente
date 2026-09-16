import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { ServiceIntegrationController } from './service.controller';
import { ServiceIntegrationService } from './service.service';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [ServiceIntegrationController],
  providers: [ServiceIntegrationService],
})
export class ServiceModule {}
