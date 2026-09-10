import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelarAverbacaoDto {
  /**
   * Obrigatório: o processo não é apagado, e um registro cancelado sem motivo
   * não explica nada a quem for auditar. O mínimo de 5 caracteres barra o
   * "x" digitado só para passar pelo campo.
   */
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5, { message: 'Explique o motivo do cancelamento' })
  @MaxLength(500)
  motivo!: string;
}
