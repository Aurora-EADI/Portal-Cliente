import { Injectable, OnModuleInit } from "@nestjs/common";
import * as Minio from "minio";

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private publicMinioClient: Minio.Client;
  private readonly bucketName = "documents";

  async onModuleInit() {
    // Cliente para operações internas (upload, delete, check bucket)
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: parseInt(process.env.MINIO_PORT || "9000", 10),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
    });

    // Cliente para geração de URLs públicas (presigned URLs)
    // Usa endpoint externo se configurado, caso contrário usa o interno
    const externalEndpoint =
      process.env.MINIO_EXTERNAL_ENDPOINT ||
      process.env.MINIO_ENDPOINT ||
      "localhost";
    const externalPort = parseInt(
      process.env.MINIO_EXTERNAL_PORT || process.env.MINIO_PORT || "9000",
      10,
    );

    this.publicMinioClient = new Minio.Client({
      endPoint: externalEndpoint,
      port: externalPort,
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
    });

    // Criar bucket se não existir
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, "us-east-1");
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    fileName: string,
  ): Promise<string> {
    await this.minioClient.putObject(
      this.bucketName,
      fileName,
      file.buffer,
      file.size,
      { "Content-Type": file.mimetype },
    );
    return fileName;
  }

  async getFileUrl(fileName: string): Promise<string> {
    // Gera a URL usando o cliente configurado com o endpoint externo
    return await this.publicMinioClient.presignedGetObject(
      this.bucketName,
      fileName,
      24 * 60 * 60,
    );
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucketName, fileName);
  }
}
