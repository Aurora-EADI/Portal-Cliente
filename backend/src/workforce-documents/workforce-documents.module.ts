import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MinioModule } from "../minio/minio.module";
import { WorkforceDocumentsController } from "./workforce-documents.controller";
import { WorkforceDocumentsService } from "./workforce-documents.service";

@Module({
  imports: [PrismaModule, MinioModule],
  controllers: [WorkforceDocumentsController],
  providers: [WorkforceDocumentsService],
})
export class WorkforceDocumentsModule {}
