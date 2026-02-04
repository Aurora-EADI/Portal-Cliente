import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { SqlServerService } from "src/prisma/sqlserver.service";
import { TypeDetailedBilling } from "./type/DetailedBilling.type";
import { TypeBillingCutOff } from "./type/BillingCutOff.type";

@Injectable()
export class FaturamentoService {
  constructor(private sqlServer: SqlServerService) {}

  private checkSqlServerConnection() {
    if (!this.sqlServer.isConnected()) {
      throw new HttpException(
        "SQL Server (Siaum) not available. Legacy billing data is currently unavailable.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async findAll(
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<TypeDetailedBilling[]> {
    this.checkSqlServerConnection();

    const toSqlString = (d?: Date) => {
      if (!d) return null;
      // Extrai somente YYYY-MM-DD
      return d.toISOString().split("T")[0];
    };

    const inicio = toSqlString(dataInicio);
    const fim = toSqlString(dataFim);

    const query = `
            SELECT *
      FROM dbo.fnConsulta_Faturamento_Por_Periodo(
          @param1,
          @param2
      )
      WHERE NOT (
          dt_entrada IS NULL
          AND CAST(
              REPLACE(REPLACE(valor_cif, '.', ''), ',', '.') 
              AS DECIMAL(18,2)
          ) = 0
      );
    `;

    return this.sqlServer.query<TypeDetailedBilling>(query, [inicio, fim]);
  }

  async getDetailBillingCutOff() {
    this.checkSqlServerConnection();

    return this.sqlServer.executeProcedure<TypeBillingCutOff>(
      "stpRelatorio_Servicos_Pivot",
    );
  }
}
