import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { SqlServerService } from "../prisma/sqlserver.service";
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
            SELECT 
    cliente = c.cliente + ' (' + c.cod_cli + ')',

    endereco = ISNULL(c.endereco,'') +
               CASE WHEN c.numero IS NOT NULL 
                    THEN ', ' + c.numero ELSE '' END,

    c.bairro,
    cid.cidade,
    c.uf,
    c.cep,
    c.cgc,
    c.inscr_munic,
    c.cod_cli,

    a.rps,
    a.nfse,
    a.tp_nota,
    a.vl_extenso,

    valor_fatura   = CONVERT(decimal(18,2), ISNULL(a.valor_servicos,0)),
    valor_servicos = CONVERT(decimal(18,2), ISNULL(a.valor_servicos,0)),

    a.dt_fatura,
    a.dt_vencimento,
    a.iss_cobrar,

    iss_valor       = CONVERT(decimal(18,2), ISNULL(a.iss_valor,0)),
    iss_percentual  = CONVERT(decimal(18,2), ISNULL(a.iss_percentual,0)),
    ii_valor        = CONVERT(decimal(18,2), ISNULL(a.ii_valor,0)),

    a.observacao,

    modalidade = CASE dc.modalidade
                    WHEN 1 THEN 'MAR'
                    WHEN 4 THEN 'AER'
                    WHEN 6 THEN 'FER'
                    WHEN 7 THEN 'ROD'
                    ELSE ''
                 END,

    modalidade_txt =
        CASE 
            WHEN (CASE dc.modalidade
                    WHEN 1 THEN 'MAR'
                    WHEN 4 THEN 'AER'
                    WHEN 6 THEN 'FER'
                    WHEN 7 THEN 'ROD'
                    ELSE ''
                  END) = '' 
                 AND ISNULL(a.nfse,0) <> 0 THEN 'ROD'

            WHEN (CASE dc.modalidade
                    WHEN 1 THEN 'MAR'
                    WHEN 4 THEN 'AER'
                    WHEN 6 THEN 'FER'
                    WHEN 7 THEN 'ROD'
                    ELSE ''
                  END) = '' 
                 AND ISNULL(a.nfse,0) = 0 THEN 'MAR'

            ELSE
                 CASE dc.modalidade
                    WHEN 1 THEN 'MAR'
                    WHEN 4 THEN 'AER'
                    WHEN 6 THEN 'FER'
                    WHEN 7 THEN 'ROD'
                    ELSE ''
                 END
        END,

    a.n_fatura,
    a.tributacao_msg,

    d.despachante,

    fd.n_lote,
    fd.n_di,
    fd.n_da,

    valor_cif = CONVERT(decimal(18,2), ISNULL(fd.cif_valor_di,0)),

    i.quantidade,
    i.servico_id,
    i.servico,
    valor = CONVERT(decimal(18,2), ISNULL(i.valor,0))

FROM fat_servfaturados a

LEFT JOIN clientes c ON a.cod_cli = c.cod_cli
LEFT JOIN cidades cid ON cid.cod_cidade = c.cod_cidade

LEFT JOIN fat_itensnota i
       ON a.n_fatura = i.n_fatura
      AND a.cnpj     = i.cnpj

OUTER APPLY (
    SELECT TOP 1
        fd.n_lote,
        fd.n_di,
        fd.n_da,
        fd.cif_valor_di
    FROM fat_dap fd
    JOIN fat_dap_itens fi ON fd.fat_id = fi.fat_id
    WHERE fd.cnpj = a.cnpj
      AND fi.n_fatura = a.n_fatura
    ORDER BY fd.dt_calculo DESC
) fd

LEFT JOIN doc_conhecimento dc ON dc.n_lote = fd.n_lote
LEFT JOIN despachante d ON d.cod_desp = a.cod_desp

WHERE a.status = 'E'
  AND a.dt_fatura >= '${inicio}'
  AND a.dt_fatura < DATEADD(DAY,1,'${fim}')

ORDER BY a.dt_fatura, a.n_fatura;
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
