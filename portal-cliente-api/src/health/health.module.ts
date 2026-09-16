import { Module } from '@nestjs/common';
import { MinioModule } from '../minio/minio.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';
import { HealthController } from './health.controller';

@Module({ imports: [PrismaModule, MinioModule, RabbitMqModule], controllers: [HealthController] })
export class HealthModule {}
