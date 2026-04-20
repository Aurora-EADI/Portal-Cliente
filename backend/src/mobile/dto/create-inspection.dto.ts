import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class InspectionItemDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  posicao?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  avarias?: string[];

  @IsOptional()
  @IsString()
  observacao?: string;
}

export class SideLadoDto {
  @IsString()
  lado: string;

  @IsOptional()
  @IsBoolean()
  inspecionado?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InspectionItemDto)
  itens?: InspectionItemDto[];
}

export class CreateInspectionDto {
  @IsString()
  tipoOperacao: string;

  @IsString()
  statusContainer: string;

  @IsString()
  containerNumero: string;

  @IsString()
  containerType: string;

  @IsOptional()
  @IsString()
  destino?: string;

  @IsOptional()
  @IsString()
  origem?: string;

  @IsOptional()
  @IsString()
  transportadora?: string;

  @IsOptional()
  @IsString()
  condicaoContainer?: string;

  @IsOptional()
  @IsString()
  lacre?: string;

  @IsString()
  motorista: string;

  @IsString()
  cpf: string;

  @IsString()
  placaCavalo: string;

  @IsOptional()
  @IsString()
  placaPrancha?: string;

  @IsDateString()
  dataHora: string;

  @IsOptional()
  @IsString()
  localizacaoArmazenagem?: string;

  @IsOptional()
  @IsString()
  observacaoGeral?: string;

  @IsOptional()
  @IsNumber()
  gpsLat?: number;

  @IsOptional()
  @IsNumber()
  gpsLng?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SideLadoDto)
  lados?: SideLadoDto[];
}
