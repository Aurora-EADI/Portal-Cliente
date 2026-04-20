import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { SqlServerService } from "../prisma/sqlserver.service";
import { TypeEstoque } from "./type/Estoque.type";

@Injectable()
export class EstoqueService {
  private readonly logger = new Logger(EstoqueService.name);

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
    report_type?: string,
  ): Promise<TypeEstoque[]> {
    this.checkSqlServerConnection();

    const query = `
      -- ============================================================
      -- INVENTÁRIO COMPLETO — REFATORADO PARA PERFORMANCE
      -- v2 — 2026-03-12
      -- BLOCO 1 → CTEs base: cada tabela varrida UMA única vez
      -- BLOCO 2 → CTEs de negócio: apenas JOINs leves nas bases
      -- BLOCO 3 → SELECT final sem nenhuma subquery correlacionada
      -- ============================================================
      ;WITH

      -- ============================================================
      -- BLOCO 1: CTEs BASE
      -- ============================================================

      base_itens AS (
          SELECT
              n_lote,
              SUM(saldo)                                                  AS saldo_total,
              SUM(qtde_embal_verif)                                       AS qtde_total,
              SUM(CASE WHEN saldo > 0 THEN saldo ELSE qtde_embal_verif END) AS saldo_ou_qtde,
              MAX(CASE WHEN saldo         > 0 THEN 1 ELSE 0 END)          AS tem_saldo,
              MAX(CASE WHEN qtde_embal_verif > 0 THEN 1 ELSE 0 END)       AS tem_qtde
          FROM doc_conhecimento_itens
          GROUP BY n_lote
      ),

      base_da_itens AS (
          SELECT
              y.n_lote,
              x.n_da,
              x.data_libera,
              SUM(y.saldo)  AS saldo_da,
              SUM(y.qtde_v) AS qtde_v_da,
              SUM(y.qtde)   AS qtde_da,
              MAX(CASE WHEN y.saldo > 0 THEN 1 ELSE 0 END) AS tem_saldo
          FROM registro_da x
          INNER JOIN registro_da_itens y ON y.n_da = x.n_da AND y.n_lote = x.n_lote
          GROUP BY y.n_lote, x.n_da, x.data_libera
      ),

      base_da_saldo AS (
          SELECT
              n_lote,
              SUM(saldo_da)  AS saldo_total_da,
              SUM(qtde_v_da) AS qtde_v_total_da,
              SUM(qtde_da)   AS qtde_total_da,
              MAX(tem_saldo) AS tem_saldo,
              MAX(CASE WHEN data_libera IS NULL AND qtde_da > 0 THEN 1 ELSE 0 END) AS tem_da_pendente
          FROM base_da_itens
          GROUP BY n_lote
      ),

      base_di AS (
          SELECT
              x.n_lote,
              SUM(x.sd_qtde)  AS saldo_di,
              MIN(z.n_di)     AS n_di
          FROM registro_di_itens x
          INNER JOIN registro_di z ON z.cod_doc = x.cod_doc AND z.n_di = x.n_di
          WHERE z.status = 'E' AND x.sd_qtde > 0
          GROUP BY x.n_lote
      ),

      base_dt_entrada AS (
          SELECT
              y.n_lote,
              MIN(x.dataentra) AS dt_entrada
          FROM entrada x
          INNER JOIN doc_recebimento y ON y.entrada = x.entrada
          GROUP BY y.n_lote
      ),

      base_descarga AS (
          SELECT n_lote, SUM(m3_total_verificado) AS m3_total
          FROM descarga
          GROUP BY n_lote
      ),

      base_cif AS (
          SELECT n_lote, SUM(cif_max) AS cif_total
          FROM (
              SELECT
                  n_lote,
                  ISNULL(NULLIF(LTRIM(RTRIM(n_di)), ''), '__sem_di__' + CAST(fat_id AS VARCHAR)) AS chave_di,
                  MAX(cif_valor_dolar) AS cif_max
              FROM fat_dap
              GROUP BY n_lote,
                       ISNULL(NULLIF(LTRIM(RTRIM(n_di)), ''), '__sem_di__' + CAST(fat_id AS VARCHAR))
          ) x
          GROUP BY n_lote
      ),

      base_faturamento AS (
          SELECT
              bb.n_lote,
              bb.n_di,
              MAX(bb.qt_periodos)                           AS qt_periodos,
              MAX(bb.cif_valor_dolar)                       AS cif_valor_dolar,
              SUM(fa.valor_servicos - fa.iss_valor)         AS vl_fatura,
              SUM(ISNULL(i.valor, 0))                       AS valor,
              SUM(fa.rps)                                   AS rps,
              MAX(fa.nfse)                                  AS nfse
          FROM fat_dap bb
          INNER JOIN fat_dap_itens     bi ON bi.fat_id   = bb.fat_id
          INNER JOIN fat_servfaturados fa ON fa.n_fatura  = bi.n_fatura
                                         AND fa.serie     = bi.serie
                                         AND fa.status    = 'E'
          LEFT  JOIN fat_itensnota      i ON i.n_fatura   = fa.n_fatura
                                         AND i.cnpj       = fa.cnpj
          GROUP BY bb.n_lote, bb.n_di
      ),

      base_localizacao AS (
          SELECT
              e.n_lote,
              MAX(l.loc_nokia) AS localizacao,
              MAX(l.numero)    AS numero
          FROM controle_etq e
          INNER JOIN localizacao l ON l.cod_localizacao = e.localizacao_id
          GROUP BY e.n_lote
      ),

      base_container AS (
          SELECT
              dr.n_lote,
              STUFF((
                  SELECT DISTINCT ' / ' + e2.n_ctnr
                  FROM doc_recebimento dr2
                  INNER JOIN entradactnr e2 ON e2.entrada = dr2.entrada
                  WHERE dr2.n_lote = dr.n_lote
                    AND e2.n_ctnr IS NOT NULL
                  FOR XML PATH('')
              ), 1, 3, '')        AS containers,
              MIN(tc.tamanho)     AS tamanho,
              MIN(e.lacre_orig_1) AS lacre
          FROM doc_recebimento dr
          LEFT  JOIN entradactnr e  ON e.entrada   = dr.entrada
          LEFT  JOIN tipo_ctnr   tc ON tc.cod_tipo = e.tipo_ctnr
          GROUP BY dr.n_lote
      ),

      base_da_numero AS (
          SELECT
              n_lote,
              STUFF((
                  SELECT DISTINCT ' / ' + x2.n_da
                  FROM registro_da x2
                  INNER JOIN registro_da_itens y2 ON y2.n_da = x2.n_da AND y2.n_lote = x2.n_lote
                  WHERE x2.n_lote = x.n_lote
                    AND x2.n_da IS NOT NULL
                    AND y2.saldo > 0
                  FOR XML PATH('')
              ), 1, 3, '') AS n_da_concat
          FROM registro_da x
          GROUP BY n_lote
      ),

      base_dta AS (
          SELECT
              n_lote,
              MIN(n_documento) AS n_documento
          FROM doc_conhecimento
          WHERE n_documento IS NOT NULL
          GROUP BY n_lote
      ),

      base_dta_info AS (
          SELECT
              dc.n_documento,
              MIN(dc.n_lote)            AS primeiro_lote,
              COUNT(DISTINCT e.n_ctnr)  AS qtd_ctnr
          FROM doc_conhecimento dc
          INNER JOIN doc_recebimento dr ON dr.n_lote  = dc.n_lote
          INNER JOIN entradactnr     e  ON e.entrada  = dr.entrada
          WHERE dc.n_documento IS NOT NULL
          GROUP BY dc.n_documento
      ),

      base_saldo_valor AS (
          SELECT
              dai.n_lote,
              SUM(
                  CASE WHEN ISNULL(dai.qtde_v_da, 0) > 0
                       THEN ROUND(a.vmld_cif / dai.qtde_v_da * dai.saldo_da, 3)
                       ELSE 0
                  END
              )                               AS saldo_valor_total,
              SUM(a.vmld_cif)                 AS vmld_cif_total,
              SUM(ISNULL(dai.qtde_v_da, 0))   AS qtde_v_da_total
          FROM base_da_itens dai
          INNER JOIN registro_da a ON a.n_da = dai.n_da AND a.n_lote = dai.n_lote
          GROUP BY dai.n_lote
      ),

      -- ============================================================
      -- BLOCO 2: CTEs DE NEGÓCIO
      -- ============================================================

      em_estoque AS (
          SELECT
              b.n_documento,
              b.n_lote,
              b.n_conhecimento,
              b.n_master                                                                AS master,
              cl.nomefantasia                                                            AS cliente,
              ISNULL(bi.saldo_ou_qtde, 0)                                               AS saldo,
              da_num.n_da_concat                                                         AS n_da,
              CAST('Em Estoque' AS VARCHAR(20))                                          AS status_estoque,
              fat.n_di,
              CAST(NULL AS VARCHAR(500))                                                 AS container,
              CAST(NULL AS VARCHAR(20))                                                  AS tamanho,
              CAST(NULL AS VARCHAR(20))                                                  AS lacre,
              CASE ISNULL(b.modalidade,0)
                  WHEN 1 THEN 'MAR' WHEN 4 THEN 'AER'
                  WHEN 6 THEN 'FER' WHEN 7 THEN 'ROD' ELSE ''
              END                                                                        AS modalidade,
              fat.qt_periodos                                                            AS qt_periodo,
              ISNULL(ds.saldo_total_da, bi.qtde_total) + ISNULL(di_ativo.saldo_di, 0)   AS qt_total,
              CASE WHEN da_num.n_da_concat IS NOT NULL THEN sv.vmld_cif_total
                   ELSE b.valor_declarado END                                            AS vl_documento,
              ROUND(
                  sv.vmld_cif_total
                  / NULLIF(sv.qtde_v_da_total, 0)
                  * (ISNULL(ds.saldo_total_da, 0) + ISNULL(di_ativo.saldo_di, 0))
              , 3)                                                                       AS saldo_valor,
              de.dt_entrada,
              loc.localizacao,
              ISNULL(loc.numero, 0)                                                      AS numero,
              REPLACE(CONVERT(varchar(30), CAST(ISNULL(desc_.m3_total,0) AS float)),'.',',' ) AS m3,
              cif.cif_total                                                              AS _cif_valor,
              desc_.m3_total                                                             AS _m3_valor,
              REPLACE(REPLACE(CONVERT(varchar(20),CAST(ISNULL(fat.cif_valor_dolar,0) AS decimal(18,2)),1),',','#'),'.',',' ) AS valor_cif,
              REPLACE(REPLACE(CONVERT(varchar(20),CAST(ISNULL(fat.vl_fatura,0)       AS decimal(18,2)),1),',','#'),'.',',' ) AS vl_fatura,
              REPLACE(REPLACE(CONVERT(varchar(20),CAST(ISNULL(fat.valor,0)           AS decimal(18,2)),1),',','#'),'.',',' ) AS valor,
              fat.rps,
              fat.nfse
          FROM doc_conhecimento b
          INNER JOIN base_da_saldo     ds      ON ds.n_lote      = b.n_lote AND ds.tem_saldo = 1
          INNER JOIN base_itens        bi      ON bi.n_lote      = b.n_lote
          LEFT  JOIN clientes          cl      ON cl.cod_cli     = b.consignatario
          LEFT  JOIN base_dt_entrada   de      ON de.n_lote      = b.n_lote
          LEFT  JOIN base_localizacao  loc     ON loc.n_lote     = b.n_lote
          LEFT  JOIN base_descarga     desc_   ON desc_.n_lote   = b.n_lote
          LEFT  JOIN base_cif          cif     ON cif.n_lote     = b.n_lote
          LEFT  JOIN base_da_numero    da_num  ON da_num.n_lote  = b.n_lote
          LEFT  JOIN base_saldo_valor  sv      ON sv.n_lote      = b.n_lote
          LEFT  JOIN base_di           di_ativo ON di_ativo.n_lote = b.n_lote
          LEFT  JOIN base_faturamento  fat     ON fat.n_lote     = b.n_lote
                                              AND fat.n_di       = (
                                                  SELECT MIN(f2.n_di) FROM base_faturamento f2
                                                  WHERE f2.n_lote = b.n_lote
                                              )
          WHERE b.fl_saida_efetiva = 0
            AND (bi.saldo_total > 0 OR bi.qtde_total > 0)
      ),

      finalizado AS (
          SELECT
              b.n_documento, b.n_lote, b.n_conhecimento, b.n_master AS master,
              cl.nomefantasia                     AS cliente,
              ISNULL(bi.qtde_total, 0)            AS saldo,
              CAST(NULL AS VARCHAR(20))           AS n_da,
              CAST('Finalizado' AS VARCHAR(20))   AS status_estoque,
              CAST(NULL AS VARCHAR(20))           AS n_di,
              CAST(NULL AS VARCHAR(200))          AS container,
              CAST(NULL AS VARCHAR(20))           AS tamanho,
              CAST(NULL AS VARCHAR(20))           AS lacre,
              CAST(NULL AS VARCHAR(10))           AS modalidade,
              CAST(NULL AS NUMERIC(18,0))         AS qt_periodo,
              ISNULL(bi.qtde_total, 0)            AS qt_total,
              b.valor_declarado                   AS vl_documento,
              ROUND(b.valor_declarado, 3)         AS saldo_valor,
              de.dt_entrada,
              loc.localizacao,
              ISNULL(loc.numero, 0)               AS numero,
              CAST(NULL AS VARCHAR(30))           AS m3,
              cif.cif_total                       AS _cif_valor,
              desc_.m3_total                      AS _m3_valor,
              CAST(NULL AS VARCHAR(20))           AS valor_cif,
              CAST(NULL AS VARCHAR(20))           AS vl_fatura,
              CAST(NULL AS VARCHAR(20))           AS valor,
              CAST(NULL AS NUMERIC(18,0))         AS rps,
              CAST(NULL AS NUMERIC(18,0))         AS nfse
          FROM doc_conhecimento b
          INNER JOIN base_itens       bi    ON bi.n_lote    = b.n_lote AND bi.qtde_total > 0 AND bi.saldo_total = 0
          LEFT  JOIN base_da_saldo    ds    ON ds.n_lote    = b.n_lote
          LEFT  JOIN clientes         cl    ON cl.cod_cli   = b.consignatario
          LEFT  JOIN base_dt_entrada  de    ON de.n_lote    = b.n_lote
          LEFT  JOIN base_localizacao loc   ON loc.n_lote   = b.n_lote
          LEFT  JOIN base_descarga    desc_ ON desc_.n_lote = b.n_lote
          LEFT  JOIN base_cif         cif   ON cif.n_lote   = b.n_lote
          WHERE b.fl_saida_efetiva = 0
            AND ISNULL(ds.tem_saldo, 0) = 0
            AND NOT EXISTS (
                SELECT 1 FROM registro_da_itens x WHERE x.n_lote = b.n_lote AND x.saldo > 0
            )
            AND NOT EXISTS (
                SELECT 1
                FROM registro_di_itens x
                INNER JOIN registro_di z ON z.cod_doc = x.cod_doc AND z.n_di = x.n_di
                WHERE x.n_lote = b.n_lote AND z.status = 'E' AND x.sd_qtde > 0
            )
      ),

      sem_registro_da AS (
          SELECT
              b.n_documento, b.n_lote, b.n_conhecimento, b.n_master AS master,
              cl.nomefantasia                      AS cliente,
              ISNULL(bi.saldo_ou_qtde, 0)          AS saldo,
              b.n_documento                        AS n_da,
              CAST('Em Estoque' AS VARCHAR(20))    AS status_estoque,
              di.n_di,
              CAST(NULL AS VARCHAR(500))           AS container,
              CAST(NULL AS VARCHAR(20))            AS tamanho,
              CAST(NULL AS VARCHAR(20))            AS lacre,
              CASE ISNULL(b.modalidade,0)
                  WHEN 1 THEN 'MAR' WHEN 4 THEN 'AER'
                  WHEN 6 THEN 'FER' WHEN 7 THEN 'ROD' ELSE ''
              END                                  AS modalidade,
              CAST(NULL AS NUMERIC(18,0))          AS qt_periodo,
              ISNULL(bi.saldo_total, 0)            AS qt_total,
              b.valor_declarado                    AS vl_documento,
              ROUND(b.valor_declarado, 3)          AS saldo_valor,
              de.dt_entrada,
              loc.localizacao,
              ISNULL(loc.numero, 0)                AS numero,
              REPLACE(CONVERT(varchar(30), CAST(ISNULL(desc_.m3_total,0) AS float)),'.',',' ) AS m3,
              cif.cif_total                        AS _cif_valor,
              desc_.m3_total                       AS _m3_valor,
              CAST(NULL AS VARCHAR(20))            AS valor_cif,
              CAST(NULL AS VARCHAR(20))            AS vl_fatura,
              CAST(NULL AS VARCHAR(20))            AS valor,
              CAST(NULL AS NUMERIC(18,0))          AS rps,
              CAST(NULL AS NUMERIC(18,0))          AS nfse
          FROM doc_conhecimento b
          INNER JOIN base_itens       bi    ON bi.n_lote    = b.n_lote AND bi.saldo_total > 0
          LEFT  JOIN base_da_saldo    ds    ON ds.n_lote    = b.n_lote
          LEFT  JOIN base_di          di    ON di.n_lote    = b.n_lote
          LEFT  JOIN clientes         cl    ON cl.cod_cli   = b.consignatario
          LEFT  JOIN base_dt_entrada  de    ON de.n_lote    = b.n_lote
          LEFT  JOIN base_localizacao loc   ON loc.n_lote   = b.n_lote
          LEFT  JOIN base_descarga    desc_ ON desc_.n_lote = b.n_lote
          LEFT  JOIN base_cif         cif   ON cif.n_lote   = b.n_lote
          WHERE b.fl_saida_efetiva = 0
            AND ds.n_lote IS NULL
      ),

      sem_saldo_real AS (
          SELECT
              b.n_documento, b.n_lote, b.n_conhecimento, b.n_master AS master,
              cl.nomefantasia                     AS cliente,
              ISNULL(bi.qtde_total, 0)            AS saldo,
              CAST(NULL AS VARCHAR(20))           AS n_da,
              CAST('Finalizado' AS VARCHAR(20))   AS status_estoque,
              CAST(NULL AS VARCHAR(20))           AS n_di,
              CAST(NULL AS VARCHAR(200))          AS container,
              CAST(NULL AS VARCHAR(20))           AS tamanho,
              CAST(NULL AS VARCHAR(20))           AS lacre,
              CAST(NULL AS VARCHAR(10))           AS modalidade,
              CAST(NULL AS NUMERIC(18,0))         AS qt_periodo,
              ISNULL(bi.qtde_total, 0)            AS qt_total,
              b.valor_declarado                   AS vl_documento,
              ROUND(b.valor_declarado, 3)         AS saldo_valor,
              de.dt_entrada,
              loc.localizacao,
              ISNULL(loc.numero, 0)               AS numero,
              CAST(NULL AS VARCHAR(30))           AS m3,
              cif.cif_total                       AS _cif_valor,
              desc_.m3_total                      AS _m3_valor,
              CAST(NULL AS VARCHAR(20))           AS valor_cif,
              CAST(NULL AS VARCHAR(20))           AS vl_fatura,
              CAST(NULL AS VARCHAR(20))           AS valor,
              CAST(NULL AS NUMERIC(18,0))         AS rps,
              CAST(NULL AS NUMERIC(18,0))         AS nfse
          FROM doc_conhecimento b
          INNER JOIN base_itens       bi    ON bi.n_lote    = b.n_lote AND bi.tem_qtde = 1 AND bi.tem_saldo = 0
          LEFT  JOIN base_da_saldo    ds    ON ds.n_lote    = b.n_lote
          LEFT  JOIN base_di          di    ON di.n_lote    = b.n_lote
          LEFT  JOIN clientes         cl    ON cl.cod_cli   = b.consignatario
          LEFT  JOIN base_dt_entrada  de    ON de.n_lote    = b.n_lote
          LEFT  JOIN base_localizacao loc   ON loc.n_lote   = b.n_lote
          LEFT  JOIN base_descarga    desc_ ON desc_.n_lote = b.n_lote
          LEFT  JOIN base_cif         cif   ON cif.n_lote   = b.n_lote
          WHERE b.fl_saida_efetiva = 0
            AND ISNULL(ds.tem_saldo, 0)       = 0
            AND ISNULL(ds.tem_da_pendente, 0) = 0
            AND di.n_lote IS NULL
      ),

      da_zerada_com_saldo_dci AS (
          SELECT
              b.n_documento, b.n_lote, b.n_conhecimento, b.n_master AS master,
              cl.nomefantasia                      AS cliente,
              ISNULL(bi.saldo_total, 0)            AS saldo,
              b.n_documento                        AS n_da,
              CAST('Em Estoque' AS VARCHAR(20))    AS status_estoque,
              CAST(NULL AS VARCHAR(20))            AS n_di,
              CAST(NULL AS VARCHAR(500))           AS container,
              CAST(NULL AS VARCHAR(20))            AS tamanho,
              CAST(NULL AS VARCHAR(20))            AS lacre,
              CASE ISNULL(b.modalidade,0)
                  WHEN 1 THEN 'MAR' WHEN 4 THEN 'AER'
                  WHEN 6 THEN 'FER' WHEN 7 THEN 'ROD' ELSE ''
              END                                  AS modalidade,
              CAST(NULL AS NUMERIC(18,0))          AS qt_periodo,
              ISNULL(bi.saldo_total, 0)            AS qt_total,
              b.valor_declarado                    AS vl_documento,
              ROUND(b.valor_declarado, 3)          AS saldo_valor,
              de.dt_entrada,
              loc.localizacao,
              ISNULL(loc.numero, 0)                AS numero,
              REPLACE(CONVERT(varchar(30), CAST(ISNULL(desc_.m3_total,0) AS float)),'.',',' ) AS m3,
              cif.cif_total                        AS _cif_valor,
              desc_.m3_total                       AS _m3_valor,
              CAST(NULL AS VARCHAR(20))            AS valor_cif,
              CAST(NULL AS VARCHAR(20))            AS vl_fatura,
              CAST(NULL AS VARCHAR(20))            AS valor,
              CAST(NULL AS NUMERIC(18,0))          AS rps,
              CAST(NULL AS NUMERIC(18,0))          AS nfse
          FROM doc_conhecimento b
          INNER JOIN base_itens       bi    ON bi.n_lote  = b.n_lote AND bi.saldo_total > 0
          INNER JOIN base_da_saldo    ds    ON ds.n_lote  = b.n_lote AND ds.tem_saldo = 0
          LEFT  JOIN clientes         cl    ON cl.cod_cli = b.consignatario
          LEFT  JOIN base_dt_entrada  de    ON de.n_lote  = b.n_lote
          LEFT  JOIN base_localizacao loc   ON loc.n_lote = b.n_lote
          LEFT  JOIN base_descarga    desc_ ON desc_.n_lote = b.n_lote
          LEFT  JOIN base_cif         cif   ON cif.n_lote = b.n_lote
          WHERE b.fl_saida_efetiva = 0
      ),

      da_nao_desembarcada AS (
          SELECT
              b.n_documento, b.n_lote, b.n_conhecimento, b.n_master AS master,
              cl.nomefantasia                      AS cliente,
              ISNULL(dai_pend.qtde_da, 0)          AS saldo,
              dai_pend.n_da,
              CAST('Em Estoque' AS VARCHAR(20))    AS status_estoque,
              CAST(NULL AS VARCHAR(20))            AS n_di,
              CAST(NULL AS VARCHAR(500))           AS container,
              CAST(NULL AS VARCHAR(20))            AS tamanho,
              CAST(NULL AS VARCHAR(20))            AS lacre,
              CASE ISNULL(b.modalidade,0)
                  WHEN 1 THEN 'MAR' WHEN 4 THEN 'AER'
                  WHEN 6 THEN 'FER' WHEN 7 THEN 'ROD' ELSE ''
              END                                  AS modalidade,
              CAST(NULL AS NUMERIC(18,0))          AS qt_periodo,
              ISNULL(dai_pend.qtde_da, 0)          AS qt_total,
              sv.vmld_cif_total                    AS vl_documento,
              ROUND(ISNULL(sv.vmld_cif_total, 0), 3) AS saldo_valor,
              de.dt_entrada,
              loc.localizacao,
              ISNULL(loc.numero, 0)                AS numero,
              REPLACE(CONVERT(varchar(30), CAST(ISNULL(desc_.m3_total,0) AS float)),'.',',' ) AS m3,
              cif.cif_total                        AS _cif_valor,
              desc_.m3_total                       AS _m3_valor,
              CAST(NULL AS VARCHAR(20))            AS valor_cif,
              CAST(NULL AS VARCHAR(20))            AS vl_fatura,
              CAST(NULL AS VARCHAR(20))            AS valor,
              CAST(NULL AS NUMERIC(18,0))          AS rps,
              CAST(NULL AS NUMERIC(18,0))          AS nfse
          FROM doc_conhecimento b
          INNER JOIN (
              SELECT n_lote, MIN(n_da) AS n_da, SUM(qtde_da) AS qtde_da
              FROM base_da_itens
              WHERE data_libera IS NULL AND qtde_da > 0
              GROUP BY n_lote
          ) dai_pend                             ON dai_pend.n_lote = b.n_lote
          LEFT  JOIN base_da_saldo    ds         ON ds.n_lote   = b.n_lote
          LEFT  JOIN base_saldo_valor sv         ON sv.n_lote   = b.n_lote
          LEFT  JOIN clientes         cl         ON cl.cod_cli  = b.consignatario
          LEFT  JOIN base_dt_entrada  de         ON de.n_lote   = b.n_lote
          LEFT  JOIN base_localizacao loc        ON loc.n_lote  = b.n_lote
          LEFT  JOIN base_descarga    desc_      ON desc_.n_lote = b.n_lote
          LEFT  JOIN base_cif         cif        ON cif.n_lote  = b.n_lote
          WHERE b.fl_saida_efetiva = 0
            AND ISNULL(ds.tem_saldo, 0) = 0
      ),

      di_com_saldo AS (
          SELECT
              b.n_documento, b.n_lote, b.n_conhecimento, b.n_master AS master,
              cl.nomefantasia                      AS cliente,
              ISNULL(di.saldo_di, 0)               AS saldo,
              b.n_documento                        AS n_da,
              CAST('Em Estoque' AS VARCHAR(20))    AS status_estoque,
              di.n_di,
              CAST(NULL AS VARCHAR(500))           AS container,
              CAST(NULL AS VARCHAR(20))            AS tamanho,
              CAST(NULL AS VARCHAR(20))            AS lacre,
              CASE ISNULL(b.modalidade,0)
                  WHEN 1 THEN 'MAR' WHEN 4 THEN 'AER'
                  WHEN 6 THEN 'FER' WHEN 7 THEN 'ROD' ELSE ''
              END                                  AS modalidade,
              CAST(NULL AS NUMERIC(18,0))          AS qt_periodo,
              ISNULL(di.saldo_di, 0)               AS qt_total,
              b.valor_declarado                    AS vl_documento,
              CASE
                  WHEN sv.qtde_v_da_total > 0
                  THEN ROUND(
                          (sv.vmld_cif_total / NULLIF(sv.qtde_v_da_total, 0))
                          * ISNULL(di.saldo_di, 0)
                       , 3)
                  WHEN ISNULL(bi.qtde_total, 0) > 0
                  THEN ROUND(
                          b.valor_declarado
                          / bi.qtde_total
                          * ISNULL(di.saldo_di, 0)
                       , 3)
                  ELSE 0
              END                                  AS saldo_valor,
              de.dt_entrada,
              loc.localizacao,
              ISNULL(loc.numero, 0)                AS numero,
              REPLACE(CONVERT(varchar(30), CAST(ISNULL(desc_.m3_total,0) AS float)),'.',',' ) AS m3,
              cif.cif_total                        AS _cif_valor,
              desc_.m3_total                       AS _m3_valor,
              CAST(NULL AS VARCHAR(20))            AS valor_cif,
              CAST(NULL AS VARCHAR(20))            AS vl_fatura,
              CAST(NULL AS VARCHAR(20))            AS valor,
              CAST(NULL AS NUMERIC(18,0))          AS rps,
              CAST(NULL AS NUMERIC(18,0))          AS nfse
          FROM doc_conhecimento b
          INNER JOIN base_di          di    ON di.n_lote    = b.n_lote
          INNER JOIN base_itens       bi    ON bi.n_lote    = b.n_lote
          LEFT  JOIN base_da_saldo    ds    ON ds.n_lote    = b.n_lote
          LEFT  JOIN base_saldo_valor sv    ON sv.n_lote    = b.n_lote
          LEFT  JOIN clientes         cl    ON cl.cod_cli   = b.consignatario
          LEFT  JOIN base_dt_entrada  de    ON de.n_lote    = b.n_lote
          LEFT  JOIN base_localizacao loc   ON loc.n_lote   = b.n_lote
          LEFT  JOIN base_descarga    desc_ ON desc_.n_lote = b.n_lote
          LEFT  JOIN base_cif         cif   ON cif.n_lote   = b.n_lote
          WHERE b.fl_saida_efetiva = 0
            AND ISNULL(ds.tem_saldo, 0) = 0
            AND NOT EXISTS (
                SELECT 1 FROM registro_da_itens x
                WHERE x.n_lote = b.n_lote AND x.saldo > 0
            )
            AND NOT EXISTS (
                SELECT 1 FROM doc_conhecimento_itens x
                WHERE x.n_lote = b.n_lote AND x.saldo > 0
            )
      ),

      -- ============================================================
      -- BLOCO 3: UNIÃO DE TODOS OS LOTES
      -- @param5 (report_type) removido — filtro de simplificado
      -- agora é responsabilidade do frontend.
      -- ============================================================
      todos AS (
          SELECT * FROM em_estoque
          UNION ALL
          SELECT * FROM finalizado
          UNION ALL
          SELECT * FROM sem_registro_da
          UNION ALL
          SELECT * FROM sem_saldo_real
          UNION ALL
          SELECT * FROM da_zerada_com_saldo_dci
          UNION ALL
          SELECT * FROM da_nao_desembarcada
          UNION ALL
          SELECT * FROM di_com_saldo
      )

      -- ============================================================
      -- SELECT FINAL — zero subqueries correlacionadas
      -- ============================================================
      SELECT
          ano             = YEAR(t.dt_entrada),
          t.dt_entrada,
          t.n_lote,
          t.n_conhecimento,
          t.cliente,
          t.status_estoque,
          n_da            = COALESCE(t.n_da, b.n_documento),
          dta             = b.n_documento,
          container       = ctnr.containers,
          [Saldo_(Vol)]       = REPLACE(REPLACE(CONVERT(varchar(20), CAST(MAX(t.qt_total)    AS decimal(18,2)),1),',','#'),'.',',' ),
          [Saldo_Valor_(US$)] = REPLACE(REPLACE(CONVERT(varchar(20), CAST(MAX(t.saldo_valor) AS decimal(18,2)),1),',','#'),'.',',' ),
          valor_cif_total = REPLACE(REPLACE(CONVERT(varchar(20), CAST(MAX(t._cif_valor)  AS decimal(18,2)),1),',','#'),'.',',' ),
          m3_total        = REPLACE(CONVERT(varchar(30), CAST(MAX(t._m3_valor) AS float)),'.',',' ),
          qtd_container   = CASE
                                WHEN t.n_lote = di.primeiro_lote THEN di.qtd_ctnr
                                ELSE 0
                            END
      FROM todos t
      LEFT JOIN base_dta         b    ON b.n_lote      = t.n_lote
      LEFT JOIN base_dta_info    di   ON di.n_documento = b.n_documento
      LEFT JOIN base_container   ctnr ON ctnr.n_lote   = t.n_lote
      WHERE (@param1 IS NULL OR @param1 = '' OR t.n_lote = @param1)
        AND (@param2 IS NULL OR @param2 = '' OR t.cliente LIKE '%' + @param2 + '%')
        AND (@param3 IS NULL OR @param3 = '' OR t.dt_entrada >= CAST(@param3 AS DATE))
        AND (@param4 IS NULL OR @param4 = '' OR t.dt_entrada < DATEADD(day, 1, CAST(@param4 AS DATE)))
      GROUP BY
          t.dt_entrada, t.n_lote, t.n_conhecimento, t.cliente, t.status_estoque,
          t.n_da, b.n_documento,
          ctnr.containers,
          di.primeiro_lote, di.qtd_ctnr
      ORDER BY
          t.status_estoque DESC,
          CASE WHEN CHARINDEX('/', t.n_lote) > 0
               THEN LEFT(t.n_lote, CHARINDEX('/', t.n_lote) - 1)
               ELSE t.n_lote END,
          CASE WHEN CHARINDEX('/', t.n_lote) > 0
               AND ISNUMERIC(SUBSTRING(t.n_lote, CHARINDEX('/', t.n_lote) + 1, 10)) = 1
               THEN CAST(SUBSTRING(t.n_lote, CHARINDEX('/', t.n_lote) + 1, 10) AS int)
               ELSE 0 END;
    `;

    try {
      return await this.sqlServer.query<TypeEstoque>(query, [
        nLote || null,
        cliente || null,
        dtInicio || null,
        dtFim || null,
      ]);
    } catch (error: any) {
      const isTimeout = error?.message?.includes("Timeout");

      this.logger.error(
        `Estoque query failed${isTimeout ? " (timeout)" : ""}: ${error?.message}`,
      );

      if (isTimeout) {
        throw new HttpException(
          "A consulta demorou muito para responder. Tente reduzir o período ou adicionar filtros.",
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      throw new HttpException(
        "Erro ao consultar dados de estoque. Tente novamente.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
