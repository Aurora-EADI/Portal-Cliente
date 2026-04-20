import { IsEnum, IsNotEmpty } from 'class-validator';
import { VisitanteStatus } from '@prisma/client';

export class UpdateVisitanteStatusDto {
  @IsEnum(VisitanteStatus)
  @IsNotEmpty()
  status: VisitanteStatus;
}
