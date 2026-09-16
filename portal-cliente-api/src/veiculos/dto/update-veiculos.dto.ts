import { PartialType } from '@nestjs/swagger';
import { CreateVeiculosDto } from './create-veiculos.dto';

export class UpdateVeiculosDto extends PartialType(CreateVeiculosDto) {}
