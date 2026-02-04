import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";
import { UsersService } from "../user/user.service";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update.admin.dto";
import { UserRole } from "@prisma/client-postgres";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateAdminDto) {
    this.logger.log(`Criando administrador: ${JSON.stringify(dto)}`);
    return this.prisma.user.create({
      data: {
        ...dto,
        role: UserRole.ADMIN,
      },
    });
  }

  async findAll() {
    this.logger.log("Listando todos os administradores");
    return this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
    });
  }

  async findOne(id: string) {
    this.logger.log(`Buscando administrador com ID: ${id}`);
    const admin = await this.prisma.user.findFirst({
      where: { id, role: UserRole.ADMIN },
    });

    if (!admin) {
      this.logger.warn(`Administrador não encontrado: ${id}`);
      throw new HttpException(
        "Esse administrador não existe.",
        HttpStatus.NOT_FOUND,
      );
    }

    return admin;
  }

  async update(id: string, dto: UpdateAdminDto) {
    this.logger.log(
      `Atualizando administrador ${id} com dados: ${JSON.stringify(dto)}`,
    );
    const exists = await this.prisma.user.findFirst({
      where: { id, role: UserRole.ADMIN },
    });

    if (!exists) {
      this.logger.warn(
        `Tentativa de atualizar administrador inexistente: ${id}`,
      );
      throw new HttpException(
        "Esse administrador não existe.",
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    this.logger.log(`Removendo administrador com ID: ${id}`);
    const exists = await this.prisma.user.findFirst({
      where: { id, role: UserRole.ADMIN },
    });

    if (!exists) {
      this.logger.warn(`Tentativa de remover administrador inexistente: ${id}`);
      throw new HttpException(
        "Esse administrador não existe.",
        HttpStatus.NOT_FOUND,
      );
    }

    // Usa o método centralizado do UsersService que tem todas as verificações de segurança
    return this.usersService.remove(id);
  }
}
