import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaPostgresService as  PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmployeeDto) {
    this.logger.log(`Criando funcionário: ${JSON.stringify(dto)}`);
    return this.prisma.user.create({
      data: {
        ...dto,
        role: UserRole.EMPLOYEE,
      },
    });
  }

  async findAll() {
    this.logger.log('Listando todos os funcionários');
    return this.prisma.user.findMany({
      where: { role: UserRole.EMPLOYEE },
    });
  }

  async findOne(id: string) {
    this.logger.log(`Buscando funcionário com ID: ${id}`);
    const employee = await this.prisma.user.findFirst({
      where: { id, role: UserRole.EMPLOYEE },
    });

    if (!employee) {
      this.logger.warn(`Funcionário não encontrado: ${id}`);
      throw new HttpException(
        'Esse funcionário não existe.',
        HttpStatus.NOT_FOUND,
      );
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    this.logger.log(
      `Atualizando funcionário ${id} com dados: ${JSON.stringify(dto)}`,
    );
    const exists = await this.prisma.user.findFirst({
      where: { id, role: UserRole.EMPLOYEE },
    });

    if (!exists) {
      this.logger.warn(`Tentativa de atualizar funcionário inexistente: ${id}`);
      throw new HttpException(
        'Esse funcionário não existe.',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    this.logger.log(`Removendo funcionário com ID: ${id}`);
    const exists = await this.prisma.user.findFirst({
      where: { id, role: UserRole.EMPLOYEE },
    });

    if (!exists) {
      this.logger.warn(`Tentativa de remover funcionário inexistente: ${id}`);
      throw new HttpException(
        'Esse funcionário não existe.',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.user.delete({ where: { id } });

    return { message: 'Funcionário excluído com sucesso!' };
  }
}
