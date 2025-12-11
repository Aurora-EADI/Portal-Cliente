import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(PrismaSqlServerService.name);
  private connected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.connected = true;
      this.logger.log('SQL Server connected successfully');
    } catch (error) {
      this.logger.warn('SQL Server connection failed - running without legacy database integration');
      this.logger.warn(`Error: ${error.message}`);
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}


