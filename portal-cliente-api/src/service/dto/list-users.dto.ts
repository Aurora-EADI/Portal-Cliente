import { IsIn, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

/** Query de GET /service/users. Só os roles externos são consultáveis aqui. */
export class ListUsersDto {
  @IsOptional()
  @IsIn([UserRole.DESPACHANTE, UserRole.CLIENTE, UserRole.TRANSPORTADORA])
  role?: UserRole;
}
