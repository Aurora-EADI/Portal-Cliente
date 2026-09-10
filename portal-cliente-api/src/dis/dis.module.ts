import { Module } from '@nestjs/common';
import { DisController } from './dis.controller';
import { DisService } from './dis.service';

@Module({
  controllers: [DisController],
  providers: [DisService],
  exports: [DisService],
})
export class DisModule {}
