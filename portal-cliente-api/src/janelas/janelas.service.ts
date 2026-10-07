import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJanelasDto } from './dto/create-janelas.dto';
import { UpdateJanelasDto } from './dto/update-janelas.dto';

@Injectable()
export class JanelasService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.janelaAtendimento.findMany({ where: { ativo: true }, orderBy: { horaInicio: 'asc' } });
  }

  create(data: CreateJanelasDto) {
    return this.prisma.janelaAtendimento.create({ data });
  }

  update(id: string, data: UpdateJanelasDto) {
    return this.prisma.janelaAtendimento.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.janelaAtendimento.update({ where: { id }, data: { ativo: false } });
  }
}
