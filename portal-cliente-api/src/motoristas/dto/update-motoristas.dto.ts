import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMotoristasDto } from './create-motoristas.dto';

// CPF identifica o motorista na conta: não muda na edição.
export class UpdateMotoristasDto extends PartialType(OmitType(CreateMotoristasDto, ['cpf'] as const)) {}
