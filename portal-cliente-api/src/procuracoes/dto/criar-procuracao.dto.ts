import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class CriarProcuracaoDto {
  /** Cliente que o Despachante quer representar. */
  @IsUUID()
  clienteId!: string;

  /**
   * Data em que a procuração deixa de valer, em ISO (YYYY-MM-DD).
   *
   * Opcional — nem toda procuração traz prazo. Quando vier, é respeitada:
   * depois dela o despachante volta a ficar bloqueado para aquele cliente.
   * Chega como texto porque o corpo é multipart.
   */
  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'Validade deve ser uma data válida' })
  validade?: string;
}
