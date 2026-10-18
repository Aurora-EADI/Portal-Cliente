import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { UserRole } from '@prisma/client';

/** Payload de POST /service/convites vindo do Aurora (`gerarConvite`). */
export class CreateInviteDto {
  @IsIn([UserRole.DESPACHANTE, UserRole.CLIENTE, UserRole.TRANSPORTADORA])
  tipo!: UserRole;

  @IsString() nome!: string;

  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() codDespachante?: string;
  @IsOptional() @IsString() cnpjCliente?: string;
  @IsOptional() @IsString() cnpjTransportadora?: string;
  @IsOptional() @IsString() codTransp?: string;
  @IsOptional() @IsBoolean() enviarEmail?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  diasValidade?: number;
}
