import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
// import { PrismaClient as PrismaClientSqlServer } from '@prisma/client-sqlserver'; // DEPRECATED: Usar SqlServerService
import { PrismaClient as PrismaClientPostgres } from "@prisma/client-postgres";

@Injectable()
export class PrismaPostgresService
  extends PrismaClientPostgres
  implements OnModuleInit
{
  async onModuleInit() {
    await this.$connect();
  }
}

// DEPRECATED: Substituído por SqlServerService (mssql/tedious)
// Mantido comentado para fallback caso necessário
// @Injectable()
// export class PrismaSqlServerService extends PrismaClientSqlServer implements OnModuleInit {
//   private readonly logger = new Logger(PrismaSqlServerService.name);

//   constructor(private configService: ConfigService) {
//     const url = configService.get<string>('DATABASE_URL_SQLSERVER');
//     super({
//       datasources: {
//         db: {
//           url,
//         },
//       },
//     });
//     const maskedUrl = url ? url.replace(/password=[^;]+/, 'password=****') : 'UNDEFINED';
//     this.logger.log(`Conectando em: ${maskedUrl}`);
//   }

//   private connected = false;

//   async onModuleInit() {
//   try {
//     this.logger.log('Tentando conectar ao SQL Server...');
//     await this.$connect();
//     this.connected = true;
//     this.logger.log('SQL Server connected successfully');
//   } catch (error) {
//     this.logger.warn('SQL Server connection failed - running without legacy database integration');
//     this.logger.error(`Error details: ${JSON.stringify({
//       message: error.message,
//       code: error.code,
//       meta: error.meta,
//       stack: error.stack?.split('\n').slice(0, 3)
//     }, null, 2)}`);
//     this.connected = false;
//   }
// }

//   isConnected(): boolean {
//     return this.connected;
//   }
// }
