import { PartialType } from '@nestjs/swagger';
import { CreateTransportadoraDto } from './create-transportadora.dto';

export class UpdateTransportadoraDto extends PartialType(CreateTransportadoraDto) {}
