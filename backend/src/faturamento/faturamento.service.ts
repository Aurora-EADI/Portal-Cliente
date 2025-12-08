import { Injectable } from '@nestjs/common';
// import { PrismaPostgresService as PrismaService } from 'src/prisma/prisma.service';
import { PrismaSqlServerService as PrismaService } from 'src/prisma/prisma.service';
import { Faturamento, Prisma } from '@prisma/client-postgres';
import { TypeDetailedBilling } from './type/DetailedBilling.type'
import { TypeBillingCutOff } from './type/BillingCutOff.type';

@Injectable()
export class FaturamentoService {
  constructor(private prisma: PrismaService) { }


  async findAll(dataInicio?: Date, dataFim?: Date): Promise<TypeDetailedBilling[]> {

    const toSqlString = (d?: Date) => {
      if (!d) return null;
      // Extrai somente YYYY-MM-DD
      return d.toISOString().split("T")[0];
    };

    const inicio = toSqlString(dataInicio);
    const fim = toSqlString(dataFim);

    return this.prisma.$queryRaw<TypeDetailedBilling[]>(Prisma.sql`
    SELECT *
    FROM dbo.fnConsulta_Faturamento_Por_Periodo(${inicio}, ${fim}) AS a
  `);
  }

  async getDetailBillingCutOff() {

    return this.prisma.$queryRaw<TypeBillingCutOff[]>(Prisma.sql`
    EXEC stpRelatorio_Servicos_Pivot;
  `);
  }

}
