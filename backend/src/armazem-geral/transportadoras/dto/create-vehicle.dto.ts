import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ description: 'Placa do veículo (única no sistema)' })
  @IsString()
  @IsNotEmpty({ message: 'A placa do veículo é obrigatória' })
  plate: string;

  @ApiProperty({ description: 'Tipo do veículo (ex: Truck, Van, Bitrem)', required: false })
  @IsOptional()
  @IsString()
  type?: string;
}
