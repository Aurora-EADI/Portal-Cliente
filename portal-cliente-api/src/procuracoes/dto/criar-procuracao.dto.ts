import { IsUUID } from 'class-validator';

export class CriarProcuracaoDto {
  /** Cliente que o Despachante quer representar. */
  @IsUUID()
  clienteId!: string;
}
