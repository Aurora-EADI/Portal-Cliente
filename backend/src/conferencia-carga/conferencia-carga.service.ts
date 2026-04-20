import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { SqlServerService } from "../prisma/sqlserver.service";
import { TypeConferenciaCarga } from "./type/ConferenciaCarga.type";

@Injectable()
export class ConferenciaCargaService {
  constructor(private sqlServer: SqlServerService) {}

  private checkSqlServerConnection() {
    if (!this.sqlServer.isConnected()) {
      throw new HttpException(
        "SQL Server (Siaum) not available. Conferencia de Carga data is currently unavailable.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async findOpen(): Promise<TypeConferenciaCarga[]> {
    this.checkSqlServerConnection();

    const query = `
SELECT
    c.conferencia_id   AS conferenciaId,
    c.dt_conferencia   AS dtConferencia,
    d.despachante      AS despachante,
    c.representante    AS representante,
    c.obs              AS obs,
    c.cad_user         AS cadUser,
    c.cad_date         AS cadDate,

    ci.n_lote          AS nLote,
    dc.n_documento     AS nDocumento,
    dc.n_conhecimento  AS nConhecimento,

    cli.nomefantasia   AS cliente,

    CASE dc.modalidade
        WHEN 1 THEN 'MARITIMO'
        WHEN 4 THEN 'AEREO'
        WHEN 6 THEN 'FERROVIARIO'
        WHEN 7 THEN 'RODOVIARIO'
        ELSE 'N/A'
    END AS modalidade,

    CASE
        WHEN c.fim_user IS NULL THEN 'N'
        ELSE 'S'
    END AS concluido,

    ISNULL(u.nome, c.cad_user) AS usuarioCadastro

FROM conferencia c

LEFT JOIN despachante d
    ON d.cod_desp = c.cod_desp

LEFT JOIN conferencia_itens ci
    ON ci.conferencia_id = c.conferencia_id

LEFT JOIN doc_conhecimento dc
    ON dc.n_lote = ci.n_lote

LEFT JOIN clientes cli
    ON cli.cod_cli = dc.consignatario

LEFT JOIN sys_usuarios u
    ON u.login = c.cad_user

WHERE c.fim_user IS NULL
ORDER BY c.dt_conferencia DESC, c.conferencia_id DESC;
`;

    return this.sqlServer.query<TypeConferenciaCarga>(query);
  }
}
