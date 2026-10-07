import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Matches } from 'class-validator';

/**
 * O ValidationPipe global usa `whitelist` com `forbidNonWhitelisted`
 * (`src/main.ts`), então uma classe sem campos declarados recusa qualquer
 * corpo: enquanto este DTO esteve vazio, criar janela respondia 400 sempre.
 */
export class CreateJanelasDto {
  @IsString()
  @IsNotEmpty()
  descricao: string;

  // Horário em HH:MM, como o banco guarda e a tela envia.
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'horaInicio deve estar no formato HH:MM' })
  horaInicio: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'horaFim deve estar no formato HH:MM' })
  horaFim: string;

  // Opcionais: o banco tem default (60 minutos, 3 vagas).
  @IsOptional()
  @IsInt()
  @IsPositive()
  intervaloMinutos?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  vagasSimultaneas?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
