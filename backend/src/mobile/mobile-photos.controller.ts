import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { ApiTags, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { MobileJwtGuard } from "./guards/mobile-jwt.guard";
import { MinioService } from "../minio/minio.service";
import { PrismaPostgresService as PrismaService } from "../prisma/prisma.service";

@ApiTags("mobile-photos")
@ApiBearerAuth()
@UseGuards(MobileJwtGuard)
@Controller("mobile/photos")
export class MobilePhotosController {
  constructor(
    private minioService: MinioService,
    private prisma: PrismaService,
  ) {}

  @Post("upload")
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { storage: memoryStorage() }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body("inspectionId") inspectionId?: string,
    @Body("itemId") itemId?: string,
    @Body("sideLabel") sideLabel?: string,
  ) {
    if (!file) {
      throw new BadRequestException("Arquivo não fornecido");
    }

    const ext = file.originalname.split(".").pop() ?? "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    await this.minioService.uploadFile(file, fileName, "containers");
    const url = await this.minioService.getFileUrl(fileName, "containers");

    const photo = await this.prisma.inspectionPhotoMobile.create({
      data: {
        fileName,
        url,
        inspectionId: inspectionId || null,
        itemId: itemId || null,
        sideLabel: sideLabel || null,
      },
    });

    return { url, fileName, id: photo.id };
  }
}
