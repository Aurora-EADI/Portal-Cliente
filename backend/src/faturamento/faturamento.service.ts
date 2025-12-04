import { Injectable } from '@nestjs/common';
// import { PrismaPostgresService as PrismaService } from 'src/prisma/prisma.service';
import { PrismaSqlServerService as PrismaService } from 'src/prisma/prisma.service';
import { Faturamento, Prisma } from '@prisma/client';

@Injectable()
export class FaturamentoService {
  constructor(private prisma: PrismaService) { }


  async findAll(dataInicio?: Date, dataFim?: Date): Promise<Faturamento[]> {

  const toSqlString = (d?: Date) => {
    if (!d) return null;
    // Extrai somente YYYY-MM-DD
    return d.toISOString().split("T")[0];
  };

  const inicio = toSqlString(dataInicio);
  const fim = toSqlString(dataFim);

  return this.prisma.$queryRaw<Faturamento[]>(Prisma.sql`
    SELECT *
    FROM dbo.fnConsulta_Faturamento_Por_Periodo(${inicio}, ${fim}) AS a
  `);
}


  // async findOne(id: number): Promise<Faturamento | null> {
  //   return this.prisma.faturamento.findUnique({
  //     where: { id },
  //   });
  // }
}
