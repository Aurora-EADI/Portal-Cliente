import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../user/user.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateEmployeeDto) {
    this.logger.log(`Criando funcionÃ¡rio: ${JSON.stringify(dto)}`);
    return this.prisma.user.create({
      data: {
        ...dto,
        role: UserRole.EMPLOYEE,
      },
    });
  }

  async findAll() {
    this.logger.log("Listando todos os funcionÃ¡rios");
    return this.prisma.user.findMany({
      where: { role: UserRole.EMPLOYEE },
    });
  }

  async findOne(id: string) {
    this.logger.log(`Buscando funcionÃ¡rio com ID: ${id}`);
    const employee = await this.prisma.user.findFirst({
      where: { id, role: UserRole.EMPLOYEE },
    });

    if (!employee) {
      this.logger.warn(`FuncionÃ¡rio nÃ£o encontrado: ${id}`);
      throw new HttpException(
        "Esse funcionÃ¡rio nÃ£o existe.",
        HttpStatus.NOT_FOUND,
      );
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    this.logger.log(
      `Atualizando funcionÃ¡rio ${id} com dados: ${JSON.stringify(dto)}`,
    );
    const exists = await this.prisma.user.findFirst({
      where: { id, role: UserRole.EMPLOYEE },
    });

    if (!exists) {
      this.logger.warn(`Tentativa de atualizar funcionÃ¡rio inexistente: ${id}`);
      throw new HttpException(
        "Esse funcionÃ¡rio nÃ£o existe.",
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    this.logger.log(`Removendo funcionÃ¡rio com ID: ${id}`);
    const exists = await this.prisma.user.findFirst({
      where: { id, role: UserRole.EMPLOYEE },
    });

    if (!exists) {
      this.logger.warn(`Tentativa de remover funcionÃ¡rio inexistente: ${id}`);
      throw new HttpException(
        "Esse funcionÃ¡rio nÃ£o existe.",
        HttpStatus.NOT_FOUND,
      );
    }

    // Usa o mÃ©todo centralizado do UsersService que tem todas as verificaÃ§Ãµes de seguranÃ§a
    return this.usersService.remove(id);
  }
}

