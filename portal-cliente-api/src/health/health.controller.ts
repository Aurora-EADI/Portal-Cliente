import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { MinioService } from '../minio/minio.service';
import { PrismaService } from '../prisma/prisma.service';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService, private readonly minio: MinioService, private readonly rabbit: RabbitMqService) {}

  @Get('ready')
  async ready() {
    const [postgresql, minio] = await Promise.all([this.prisma.isHealthy(), this.minio.isHealthy()]);
    const dependencies = { api: 'ok', postgresql: postgresql ? 'ok' : 'down', minio: minio ? 'ok' : 'down', rabbitmq: this.rabbit.isReady ? 'ok' : 'down' };
    if (!postgresql || !minio || !this.rabbit.isReady) throw new ServiceUnavailableException({ status: 'degraded', dependencies });
    return { status: 'ok', dependencies };
  }
}
