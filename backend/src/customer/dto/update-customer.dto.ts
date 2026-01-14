import { IsOptional, IsString, IsEnum } from 'class-validator';
import { CustomerStatus } from '@prisma/client-postgres';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsEnum(CustomerStatus, { message: 'Status inválido.' })
  status?: CustomerStatus;
}
