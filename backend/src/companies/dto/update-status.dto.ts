import { IsEnum } from 'class-validator';
import { CompanyStatus } from '@prisma/client-postgres';

export class UpdateCompanyStatusDto {
  @IsEnum(CompanyStatus)
  status: CompanyStatus;
}
