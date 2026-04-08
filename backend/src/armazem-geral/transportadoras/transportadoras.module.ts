import { Module } from '@nestjs/common';
import { TransportadorasService } from './transportadoras.service';
import { TransportadorasController } from './transportadoras.controller';

@Module({
  controllers: [TransportadorasController],
  providers: [TransportadorasService],
  exports: [TransportadorasService],
})
export class TransportadorasModule {}
