import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { SqlServerService } from "src/prisma/sqlserver.service";
import { TypeEstoque } from "./type/Estoque.type";

@Injectable()
export class EstoqueService {
  constructor(private sqlServer: SqlServerService) {}

  private checkSqlServerConnection() {
    if (!this.sqlServer.isConnected()) {
      throw new HttpException(
        "SQL Server (Siaum) not available. Legacy inventory data is currently unavailable.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async findAll(
    dtInicio?: string,
    dtFim?: string,
    nLote?: string,
    cliente?: string,
  ): Promise<TypeEstoque[]> {
    this.checkSqlServerConnection();

    const query = `
      USE [Aurora_M]

      ;WITH resultado AS (
        SELECT
          filtro = convert(varchar(100), 'REGIME : TODOS, TODOS OS PROCESSOS'),
          dt_entrada = (
            SELECT MIN(x.dataentra)
            FROM entrada x, doc_recebimento y
            WHERE x.entrada = y.entrada
              AND y.n_lote = b.n_lote
          ),
          b.n_documento,
          b.n_lote,
          b.n_conhecimento,
          b.n_master AS master,
          cliente = (
            SELECT nomefantasia
            FROM clientes
            WHERE cod_cli = b.consignatario
          ),
          saldo = sum(c.saldo),
          a.n_da,
          numero = (
            SELECT TOP 1 l.numero
            FROM localizacao l
            INNER JOIN controle_etq e ON e.localizacao_id = l.cod_localizacao
            WHERE e.n_lote = b.n_lote
          )
        FROM doc_conhecimento b
        LEFT JOIN registro_da a ON a.n_lote = b.n_lote
        LEFT JOIN doc_conhecimento_itens c ON c.n_lote = b.n_lote
        LEFT JOIN clientes cl ON cl.cod_cli = b.consignatario
        WHERE b.fl_saida_efetiva = 0
          AND c.saldo > 0
          AND (@param1 IS NULL OR b.n_lote = @param1)
          AND (@param2 IS NULL OR cl.nomefantasia LIKE '%' + @param2 + '%')
        GROUP BY
          b.n_documento,
          b.n_lote,
          b.n_conhecimento,
          b.n_master,
          b.consignatario,
          a.n_da
      )
      SELECT * FROM resultado
      WHERE (@param3 IS NULL OR dt_entrada >= CAST(@param3 AS DATE))
        AND (@param4 IS NULL OR dt_entrada < DATEADD(day, 1, CAST(@param4 AS DATE)))
    `;

    return this.sqlServer.query<TypeEstoque>(query, [
      nLote ?? null,
      cliente ?? null,
      dtInicio ?? null,
      dtFim ?? null,
    ]);
  }
}
