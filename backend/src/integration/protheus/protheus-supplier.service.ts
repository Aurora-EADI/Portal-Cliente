import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaPostgresService as  PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierFromProtheusDto } from './dto/create-supplier-from-protheus.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class ProtheusSupplierService {
  private readonly logger = new Logger(ProtheusSupplierService.name);

  constructor(private prisma: PrismaService) {}

  async createSupplier(dto: CreateSupplierFromProtheusDto) {  
    this.logger.log(`Iniciando criação de fornecedor: CNPJ ${dto.cnpj}`);

    // 1. VALIDAR UNICIDADE DE CNPJ
    const cnpjLimpo = dto.cnpj.replace(/\D/g, ''); // Remove pontuação
    const companyExists = await this.prisma.company.findFirst({
      where: {
        cnpj: {
          contains: cnpjLimpo, // Busca com ou sem formatação
        },
      },
    });

    if (companyExists) {
      this.logger.warn(`CNPJ já cadastrado: ${dto.cnpj}`);
      throw new ConflictException({
        success: false,
        message: 'CNPJ já cadastrado no sistema',
        error: {
          code: 'CNPJ_ALREADY_EXISTS',
          details: `CNPJ ${dto.cnpj} já está cadastrado`,
          field: 'cnpj',
        },
      });
    }

    // 2. VALIDAR EMAIL
    const emailExists = await this.prisma.user.findUnique({
      where: { email: dto.contactEmail },
    });

    if (emailExists) {
      this.logger.warn(`Email já cadastrado: ${dto.contactEmail}`);
      throw new ConflictException({
        success: false,
        message: 'Email já cadastrado no sistema',
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          details: `Email ${dto.contactEmail} já está em uso`,
          field: 'contactEmail',
        },
      });
    }

    // 3. GERAR SENHA TEMPORÁRIA ALEATÓRIA
    const tempPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 4. CRIAR COMPANY E USER EM TRANSAÇÃO
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // 4.1 Criar Company com status PENDING
        const company = await tx.company.create({
          data: {
            cnpj: cnpjLimpo, // Salva CNPJ sem formatação
            fantasyName: dto.fantasyName,
            socialReason: dto.socialReason,
            zipCode: dto.zipCode,
            address: dto.address,
            number: dto.number,
            complement: dto.complement,
            neighborhood: dto.neighborhood,
            city: dto.city,
            state: dto.state.toUpperCase(), // Garantir maiúscula
            phone: dto.phone,
            status: 'PENDING', // STATUS CRÍTICO PARA APROVAÇÃO
          },
        });

        // 4.2 Criar User com role SUPPLIER vinculado à Company
        const user = await tx.user.create({
          data: {
            name: dto.cnpj,
            email: dto.contactEmail,
            password: hashedPassword,
            role: 'SUPPLIER', // ROLE OBRIGATÓRIO PARA FORNECEDOR
            companyId: company.id,
          },
        });

        this.logger.log(
          `Fornecedor criado com sucesso: Company ${company.id}, User ${user.id}`
        );

        return { company, user, tempPassword };
      });

      // 6. RETORNAR DADOS DE SUCESSO
      return {
        success: true,
        message: 'Fornecedor cadastrado com sucesso. Aguardando aprovação do administrador.',
        data: {
          companyId: result.company.id,
          userId: result.user.id,
          cnpj: result.company.cnpj,
          status: result.company.status,
          createdAt: result.company.createdAt,
          tempPassword: result.tempPassword,
        },
      };
    } catch (error) {
      this.logger.error('Erro ao criar fornecedor no banco de dados', error.stack);
      throw new Error('Erro ao processar cadastro de fornecedor');
    }
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';

    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) {
        password += '-';
      }
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }
}