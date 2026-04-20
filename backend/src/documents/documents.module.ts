import { Module } from "@nestjs/common";
import { DocumentsController } from "./documents.controller";
import { DocumentsService } from "./documents.service";
import { PrismaModule } from "../prisma/prisma.module";
import { MinioModule } from "../minio/minio.module";

@Module({
  imports: [PrismaModule, MinioModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
