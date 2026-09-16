import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';
import { ServiceIntegrationController } from './service.controller';
import { ServiceIntegrationService } from './service.service';

@Module({
  imports: [PrismaModule, MailModule, RabbitMqModule],
  controllers: [ServiceIntegrationController],
  providers: [ServiceIntegrationService],
})
export class ServiceModule {}
