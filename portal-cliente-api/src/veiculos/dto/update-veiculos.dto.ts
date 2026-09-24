import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateVeiculosDto } from './create-veiculos.dto';

// Placa identifica o veículo na conta: não muda na edição.
export class UpdateVeiculosDto extends PartialType(OmitType(CreateVeiculosDto, ['placa'] as const)) {}
