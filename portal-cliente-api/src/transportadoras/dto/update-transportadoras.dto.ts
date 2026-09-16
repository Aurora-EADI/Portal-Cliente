import { PartialType } from '@nestjs/swagger';
import { CreateTransportadorasDto } from './create-transportadoras.dto';

export class UpdateTransportadorasDto extends PartialType(CreateTransportadorasDto) {}
