import { Module } from '@nestjs/common';
import { AgendamentoController } from './agendamento.controller';
import { AgendamentoService } from './agendamento.service';

@Module({
  controllers: [AgendamentoController],
  providers: [AgendamentoService],
  exports: [AgendamentoService],
})
export class AgendamentoModule {}
