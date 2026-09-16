import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Correção de um processo aberto por engano no cadastro.
 *
 * Todos os campos são opcionais — envia-se só o que muda. A modalidade e o
 * cliente ficam de fora de propósito: a modalidade define quais documentos
 * foram materializados na abertura, e trocá-la invalidaria a lista já enviada;
 * o cliente define de qual procuração o processo depende. Mudar qualquer um
 * dos dois é abrir outro processo, não corrigir este.
 *
 * As regras de formato são as mesmas de `CriarAverbacaoDto`, deliberadamente
 * repetidas em vez de herdadas: aqui todo campo é opcional, e um `PartialType`
 * traria junto `modalidade` e `clienteId`, que não podem ser editados.
 */
export class EditarAverbacaoDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}\/(\d{7}-\d|\d{9})$/, {
    message: 'DI/DUIMP deve estar no formato XX/XXXXXXX-X',
  })
  diDuimp?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().replace(/\s+/g, '') : value,
  )
  @IsString()
  @Matches(/^[A-Z0-9]+$/, {
    message: 'Container/Conhecimento aceita apenas letras e números',
  })
  containerConhecimento?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  localOrigem?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  recintoDestino?: string;

  @IsOptional()
  @IsBoolean()
  cargaEspecial?: boolean;
}
