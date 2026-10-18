import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * Payload de POST /service/agendamentos vindo do Aurora
 * (`criarAgendamentoRetirada`). Superset dos campos que o Aurora envia e dos
 * que o service lê — com `forbidNonWhitelisted` global, um campo fora da lista
 * viraria 400 e derrubaria a criação. Antes era `@Body() any`: entrava
 * qualquer coisa sem validação de tipo.
 */
export class CreateAgendamentoDto {
  @IsString() empresa!: string;
  @IsString() operacao!: string;
  @IsString() data!: string;
  @IsString() horario!: string;
  @IsString() cpfMotorista!: string;
  @IsString() placaVeiculo!: string;

  @IsOptional() @IsString() subOperacao?: string;
  @IsOptional() @IsString() nomeMotorista?: string;
  @IsOptional() @IsString() tipoVeiculo?: string;
  @IsOptional() @IsString() transportadora?: string;
  @IsOptional() @IsBoolean() cargaEspecial?: boolean;
  @IsOptional() @IsArray() @IsString({ each: true }) servicos?: string[];
  @IsOptional() @IsString() diNumero?: string;
  @IsOptional() @IsString() container?: string;
  @IsOptional() @IsString() dta?: string;
  @IsOptional() @IsString() volumes?: string;
  @IsOptional() @IsString() peso?: string;
  @IsOptional() @IsString() consignatario?: string;
  @IsOptional() @IsString() observacao?: string;
  @IsOptional() @IsString() criadoPorNome?: string;
  @IsOptional() @IsString() criadoPorRole?: string;
  @IsOptional() @IsString() cnpjCliente?: string;
  @IsOptional() @IsString() enderecoCliente?: string;
  @IsOptional() @IsString() telefoneCliente?: string;
  @IsOptional() @IsString() emailCliente?: string;
  @IsOptional() @IsString() cnpjTransportadora?: string;
  @IsOptional() @IsString() enderecoTransportadora?: string;
  @IsOptional() @IsString() telefoneTransportadora?: string;
  @IsOptional() @IsString() emailTransportadora?: string;
}
