import { Module } from '@nestjs/common';
import { JanelasController } from './janelas.controller';
import { JanelasService } from './janelas.service';

@Module({
  controllers: [JanelasController],
  providers: [JanelasService],
  exports: [JanelasService],
})
export class JanelasModule {}
