import { Module } from '@nestjs/common';
import { DisController, DisAverbadasStreamController } from './dis.controller';
import { DisService } from './dis.service';
import { DisAverbadasEventos } from './dis.eventos';

@Module({
  controllers: [DisController, DisAverbadasStreamController],
  providers: [DisService, DisAverbadasEventos],
  // DisAverbadasEventos é exportado para o consumer RabbitMQ (inbox) emitir a DI
  // recém-averbada no mesmo canal que o stream do dashboard escuta.
  exports: [DisService, DisAverbadasEventos],
})
export class DisModule {}
