import { Module } from '@nestjs/common';
import { DocumentTypesService } from './document-types.service';
import { DocumentTypesController } from './document-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DocumentTypesController],
    providers: [DocumentTypesService],
    exports: [DocumentTypesService],
})
export class DocumentTypesModule { }
