import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient as PrismaClientSqlServer } from '@prisma/client-sqlserver';
import { PrismaClient as PrismaClientPostgres } from '@prisma/client-postgres';

@Injectable()
export class PrismaPostgresService extends PrismaClientPostgres implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

@Injectable()
export class PrismaSqlServerService extends PrismaClientSqlServer implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}


