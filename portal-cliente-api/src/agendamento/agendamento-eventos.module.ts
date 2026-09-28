import { Module } from '@nestjs/common';
import { AgendamentoEventos } from './agendamento.eventos';
import { AgendamentoStreamController } from './agendamento-stream.controller';

/**
 * Módulo só do canal de eventos, sem importar nada. Existe separado do
 * `AgendamentoModule` porque quem emite não é apenas ele: a rota de serviço do
 * Aurora emite, e amanhã o consumer do RabbitMQ também. Como `RabbitMqModule`
 * não pode importar `AgendamentoModule` (este já o importa, e o ciclo se
 * fecharia), o provider seria declarado duas vezes — dois Subjects, e o stream
 * fica mudo. Mesmo papel que o `DisModule` cumpre para as DIs averbadas.
 */
@Module({
  controllers: [AgendamentoStreamController],
  providers: [AgendamentoEventos],
  exports: [AgendamentoEventos],
})
export class AgendamentoEventosModule {}
