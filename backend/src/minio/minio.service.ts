import { Injectable, OnModuleInit } from "@nestjs/common";
import * as Minio from "minio";
import * as https from "https";

@Injectable()
export class MinioService implements OnModuleInit {
  private minioClient: Minio.Client;
  private publicMinioClient: Minio.Client;
  private readonly bucketName = "documents";

  async onModuleInit() {
    // Cliente para operações internas (upload, delete, check bucket)
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || "minio",
      port: parseInt(process.env.MINIO_PORT || "9000", 10),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
      pathStyle: true, // Usa path-style em vez de virtual-host-style
    });

    // Cliente para geração de URLs públicas
    // Usa host.docker.internal para conectar (acessa MinIO via porta exposta do host)
    // As URLs serão geradas com esse host e depois substituídas pelo IP externo
    this.publicMinioClient = new Minio.Client({
      endPoint: "host.docker.internal",
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
      pathStyle: true, // Usa path-style em vez de virtual-host-style
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
    // Gera URL usando publicMinioClient (conecta via host.docker.internal)
    const url = await this.publicMinioClient.presignedGetObject(
      this.bucketName,
      fileName,
      24 * 60 * 60, // 24 horas
    );

    // Substitui host.docker.internal pelo IP externo para acesso do navegador
    const externalEndpoint = process.env.MINIO_EXTERNAL_ENDPOINT || "172.20.210.84";
    const externalPort = process.env.MINIO_EXTERNAL_PORT || "9000";

    const externalUrl = url
      .replace("host.docker.internal:9000", `${externalEndpoint}:${externalPort}`)
      .replace("host.docker.internal", externalEndpoint);

    return externalUrl;
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucketName, fileName);
  }

  async getFileStream(fileName: string): Promise<any> {
    // Retorna um stream do arquivo do MinIO
    return await this.minioClient.getObject(this.bucketName, fileName);
  }

  async getFileStat(fileName: string): Promise<any> {
    // Retorna metadados do arquivo
    return await this.minioClient.statObject(this.bucketName, fileName);
  }
}