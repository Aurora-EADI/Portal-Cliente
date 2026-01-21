import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sql from "mssql";

@Injectable()
export class SqlServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqlServerService.name);
  private pool: sql.ConnectionPool | null = null;
  private connected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.logger.log("Tentando conectar ao SQL Server...");

      const connectionString = this.configService.get<string>(
        "DATABASE_URL_SQLSERVER",
      );

      if (!connectionString) {
        this.logger.warn(
          "DATABASE_URL_SQLSERVER não configurado - SQL Server desabilitado",
        );
        this.connected = false;
        return;
      }

      // Parse connection string: sqlserver://host:port;database=X;user=Y;password=Z;...
      const config = this.parseConnectionString(connectionString);

      const maskedConfig = {
        ...config,
        password: "****",
      };
      this.logger.log(
        `Conectando em: ${config.server}:${config.port} / ${config.database}`,
      );

      // Criar pool de conexões com configurações de TLS para SQL Server legacy
      this.pool = await new sql.ConnectionPool({
        ...config,
        options: {
          // Configurações para SQL Server 2008 R2 com TLS legacy
          encrypt: true,
          trustServerCertificate: true,
          enableArithAbort: true,
          // Configurações de criptografia granulares
          cryptoCredentialsDetails: {
            minVersion: "TLSv1" as any, // Suporta TLS 1.0+ para SQL Server 2008 R2
            ciphers: "DEFAULT@SECLEVEL=0", // Permite cifras legacy
          },
        },
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000,
        },
        connectionTimeout: 15000,
        requestTimeout: 30000,
      }).connect();

      this.connected = true;
      this.logger.log("SQL Server connected successfully");
    } catch (error) {
      this.logger.warn(
        "SQL Server connection failed - running without legacy database integration",
      );
      this.logger.error(
        `Error details: ${JSON.stringify(
          {
            message: error.message,
            code: error.code,
            name: error.name,
          },
          null,
          2,
        )}`,
      );
      this.connected = false;
      this.pool = null;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      try {
        await this.pool.close();
        this.logger.log("SQL Server connection pool closed");
      } catch (error) {
        this.logger.error("Error closing SQL Server pool:", error);
      }
    }
  }

  isConnected(): boolean {
    return this.connected && this.pool !== null;
  }

  /**
   * Executa uma query raw no SQL Server
   * @param query Query SQL (pode incluir parâmetros com @param1, @param2, etc.)
   * @param params Array de valores para os parâmetros
   * @returns Resultado da query
   */
  async query<T = any>(query: string, params?: any[]): Promise<T[]> {
    if (!this.isConnected() || !this.pool) {
      throw new Error("SQL Server not connected");
    }

    try {
      const request = this.pool.request();

      // Adicionar parâmetros se fornecidos
      if (params && params.length > 0) {
        params.forEach((param, index) => {
          // Detectar tipo do parâmetro
          if (param === null || param === undefined) {
            request.input(`param${index + 1}`, sql.NVarChar, param);
          } else if (typeof param === "string") {
            request.input(`param${index + 1}`, sql.NVarChar, param);
          } else if (typeof param === "number") {
            request.input(`param${index + 1}`, sql.Int, param);
          } else if (param instanceof Date) {
            request.input(`param${index + 1}`, sql.DateTime, param);
          } else {
            request.input(`param${index + 1}`, param);
          }
        });
      }

      const result = await request.query(query);
      return result.recordset as T[];
    } catch (error) {
      this.logger.error("Error executing SQL Server query:", {
        message: error.message,
        query: query.substring(0, 200),
      });
      throw error;
    }
  }

  /**
   * Executa uma stored procedure
   * @param procedureName Nome da stored procedure
   * @param params Objeto com os parâmetros nomeados
   * @returns Resultado da execução
   */
  async executeProcedure<T = any>(
    procedureName: string,
    params?: Record<string, any>,
  ): Promise<T[]> {
    if (!this.isConnected() || !this.pool) {
      throw new Error("SQL Server not connected");
    }

    try {
      const request = this.pool.request();

      // Adicionar parâmetros nomeados se fornecidos
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value === null || value === undefined) {
            request.input(key, sql.NVarChar, value);
          } else if (typeof value === "string") {
            request.input(key, sql.NVarChar, value);
          } else if (typeof value === "number") {
            request.input(key, sql.Int, value);
          } else if (value instanceof Date) {
            request.input(key, sql.DateTime, value);
          } else {
            request.input(key, value);
          }
        });
      }

      const result = await request.execute(procedureName);
      return result.recordset as T[];
    } catch (error) {
      this.logger.error("Error executing SQL Server procedure:", {
        message: error.message,
        procedure: procedureName,
      });
      throw error;
    }
  }

  /**
   * Parse connection string format: sqlserver://host:port;database=X;user=Y;password=Z;...
   */
  private parseConnectionString(connectionString: string): sql.config {
    const urlPattern = /^sqlserver:\/\/([^:]+):(\d+);(.+)$/;
    const match = connectionString.match(urlPattern);

    if (!match) {
      throw new Error("Invalid SQL Server connection string format");
    }

    const [, server, port, paramsString] = match;
    const params = new URLSearchParams(paramsString.replace(/;/g, "&"));

    return {
      server,
      port: parseInt(port, 10),
      database: params.get("database") || "",
      user: params.get("user") || "",
      password: params.get("password") || "",
      options: {
        encrypt: params.get("encrypt") === "true",
        trustServerCertificate: params.get("trustServerCertificate") === "true",
        enableArithAbort: true,
      },
    };
  }
}
