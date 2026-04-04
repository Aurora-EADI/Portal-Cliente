import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SqlServerService } from '../prisma/sqlserver.service';
import { TypeContainer } from './type/Container.type';

@Injectable()
export class KanbanService {
    constructor(private sqlServer: SqlServerService) { }

    private checkSqlServerConnection() {
        if (!this.sqlServer.isConnected()) {
            throw new HttpException(
                'SQL Server (Siaum) not available. Kanban data is currently unavailable.',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
    }

    async findAll(
        dtInicio: Date = new Date('2025-12-11T00:00:00'),
        dtFinal: Date = new Date(),
        flagTipo = 0,
        codTransp = 0,
    ): Promise<TypeContainer[]> {
        this.checkSqlServerConnection();

        const query = `
DECLARE 
    @dt_inicio  DATETIME = @param1,
    @dt_final   DATETIME = @param2,
    @flag_tipo  INT      = @param3,
    @cod_transp NUMERIC(18,0) = @param4,
    @hoje       DATE     = CONVERT(DATE, GETDATE());

;WITH base AS (
    SELECT
        e.entrada,
        e.dataentra,
        e.datasaida,
        e.flag_tipo,
        t.nomefantasia AS transportadora,
        m.nome         AS motorista,
        d.abreviatura,

        /* CLIENTE UNIVERSAL */
        COALESCE(
            cli_di.nomefantasia,     -- DI
            cli_dta.nomefantasia,    -- DTA
            cli_conh.nomefantasia    -- Conhecimento
        ) AS beneficiario,

        e.placa,
        e.placa_boogie
    FROM dbo.entrada e

    JOIN dbo.transportadora t
        ON t.cod_transp = e.cod_transp

    LEFT JOIN dbo.motoristas m
        ON m.cod_motorista = e.cod_motorista

    LEFT JOIN dbo.entradadoc ed
        ON ed.entrada = e.entrada

    LEFT JOIN dbo.documentos d
        ON d.cod_doc = ed.cod_doc

    /* ===== DI ===== */
    LEFT JOIN dbo.registro_di rdi
        ON rdi.n_di = ed.n_documento

    LEFT JOIN dbo.clientes cli_di
        ON cli_di.cod_cli = rdi.cod_cli

    /* ===== DTA ===== */
    LEFT JOIN dbo.sys_dta_antecipada dta
        ON dta.n_documento = ed.n_documento

    LEFT JOIN dbo.clientes cli_dta
        ON cli_dta.cod_cli = dta.cod_beneficiario

    /* ===== CONHECIMENTO ===== */
    LEFT JOIN dbo.doc_conhecimento dc
        ON dc.n_documento = ed.n_documento

    LEFT JOIN dbo.clientes cli_conh
        ON cli_conh.cod_cli = dc.consignatario

    WHERE e.cancelada = 0
      AND e.dataentra BETWEEN @dt_inicio AND @dt_final
      AND (e.datasaida IS NULL OR e.datasaida >= @hoje)
      AND e.flag_tipo <> 9
      AND (@cod_transp = 0 OR e.cod_transp = @cod_transp)
      AND (
            @flag_tipo = 0
         OR (@flag_tipo = 1 AND e.flag_tipo IN (1,2,3))
         OR (@flag_tipo = 2 AND e.flag_tipo IN (4,5,7))
      )
)

SELECT
    b.entrada               AS entryNumber,
    MIN(b.dataentra)        AS entryDate,
    MAX(b.datasaida)        AS exitDate,

    CASE
        WHEN b.flag_tipo IN (1,2,3) THEN 'RECEBIMENTO'
        WHEN b.flag_tipo IN (4,5,7) THEN 'RETIRADA'
        WHEN b.flag_tipo = 9        THEN 'SERVIÇOS'
        ELSE '<N/A>'
    END AS status,

    MAX(b.transportadora)   AS carrier,
    MAX(b.abreviatura)      AS abreviatura,
    MAX(b.placa)            AS licensePlate,

    /* CONTAINERS */
    STUFF((
        SELECT DISTINCT ', ' + ec.n_ctnr
        FROM dbo.entradactnr ec
        WHERE ec.entrada = b.entrada
        FOR XML PATH(''), TYPE
    ).value('.', 'VARCHAR(MAX)'), 1, 2, '') AS containerNumber,

    /* CLIENTE FINAL */
    CASE
        WHEN COUNT(DISTINCT b.beneficiario) > 1 THEN 'DIVERSOS'
        ELSE MAX(b.beneficiario)
    END AS beneficiario,

    /* MOTORISTA */
    MAX(b.motorista) AS motorista,

    /* TEMPO EM MINUTOS */
    DATEDIFF(MINUTE, MIN(b.dataentra), ISNULL(MAX(b.datasaida), GETDATE())) AS tempo_p,

    /* PRIORIDADE */
    CASE
        WHEN DATEDIFF(HOUR, MIN(b.dataentra), ISNULL(MAX(b.datasaida), GETDATE())) > 72 THEN 'high'
        WHEN DATEDIFF(HOUR, MIN(b.dataentra), ISNULL(MAX(b.datasaida), GETDATE())) > 24 THEN 'medium'
        ELSE 'low'
    END AS priority

FROM base b
GROUP BY
    b.entrada,
    b.flag_tipo
ORDER BY
    b.entrada;
`;

        return this.sqlServer.query<TypeContainer>(query, [
            dtInicio,
            dtFinal,
            flagTipo,
            codTransp,
        ]);
    }
}
