import { PartialType } from '@nestjs/swagger';
import { CreateMotoristasDto } from './create-motoristas.dto';

export class UpdateMotoristasDto extends PartialType(CreateMotoristasDto) {}
