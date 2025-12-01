import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Faturamento, Prisma } from '@prisma/client';

@Injectable()
export class FaturamentoService {
    constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Faturamento[]> {

    const rawQuery = Prisma.sql`
      SELECT 
        * 
      FROM 
        faturamento
      ORDER BY 
        id ASC
    `;
    
    return this.prisma.$queryRaw<Faturamento[]>(rawQuery);
  }

    async findOne(id: number): Promise<Faturamento | null> {
        return this.prisma.faturamento.findUnique({
            where: { id },
        });
    }
}
