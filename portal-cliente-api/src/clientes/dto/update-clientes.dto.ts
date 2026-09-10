import { PartialType } from '@nestjs/swagger';
import { CreateClientesDto } from './create-clientes.dto';

export class UpdateClientesDto extends PartialType(CreateClientesDto) {}
