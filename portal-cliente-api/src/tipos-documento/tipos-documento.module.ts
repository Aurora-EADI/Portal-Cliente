import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import {
  TiposDocumentoController,
  TiposDocumentoServiceController,
} from './tipos-documento.controller';
import { TiposDocumentoService } from './tipos-documento.service';

@Module({
  imports: [PrismaModule],
  controllers: [TiposDocumentoController, TiposDocumentoServiceController],
  providers: [TiposDocumentoService],
  exports: [TiposDocumentoService],
})
export class TiposDocumentoModule {}
