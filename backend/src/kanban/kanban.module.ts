import { Module } from '@nestjs/common';
import { KanbanService } from './kanban.service';
import { KanbanController } from './kanban.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KanbanController],
  providers: [KanbanService],
})
export class KanbanModule {}
