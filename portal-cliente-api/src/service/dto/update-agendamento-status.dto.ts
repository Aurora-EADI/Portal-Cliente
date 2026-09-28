import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AgendamentoStatus } from '@prisma/client';
import { STATUS_SELECIONAVEIS } from '../../agendamento/agendamento-status.catalog';

export class UpdateAgendamentoStatusDto {
  /**
   * Só os status que o operador escolhe. Os de pontualidade (`ON_TIME`,
   * `ATRASADO`, `AG_CHEGADA`) continuam válidos no banco mas não entram por
   * aqui — ninguém os define à mão.
   */
  @IsIn([...STATUS_SELECIONAVEIS])
  status!: AgendamentoStatus;

  /**
   * Quem clicou, do lado do Aurora. Vai para o histórico. É um id de outro
   * banco, então a coluna não tem FK.
   */
  @IsOptional()
  @IsString()
  operadorId?: string;

  /**
   * Versão que o Aurora acredita ser a atual. Quando vem, a escrita só passa se
   * ainda for verdade — é o que impede dois operadores se atropelarem.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  expectedAggregateVersion?: number;
}
