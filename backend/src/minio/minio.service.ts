import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as Minio from "minio";

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);

  // Cliente interno: usado para upload, delete, stream (resolve "minio" via DNS Docker)
  private minioClient: Minio.Client;

  // Cliente externo: usado APENAS para gerar URLs presignadas com o host correto
  // A assinatura HMAC é calculada com MINIO_EXTERNAL_ENDPOINT, que é o IP/domínio
  // acessível pelo navegador — sem necessidade de substituição de string posterior.
  private publicMinioClient: Minio.Client;

  private readonly bucketName: string;

  async onModuleInit() {
    this.bucketName = process.env.MINIO_BUCKET_NAME || "documents";

    // Cliente interno — resolve o hostname de serviço Docker (ex: "minio")
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || "minio",
      port: parseInt(process.env.MINIO_PORT || "9000", 10),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
      pathStyle: true,
    });

    // Cliente público — usa o endpoint externo (IP/domínio acessível pelo navegador)
    // A URL presignada já é gerada com o host correto; nenhum "replace" é necessário.
    const externalEndpoint =
      process.env.MINIO_EXTERNAL_ENDPOINT || "172.20.210.84";
    const externalPort = parseInt(
      process.env.MINIO_EXTERNAL_PORT || "9000",
      10,
    );
    const externalUseSSL = process.env.MINIO_EXTERNAL_USE_SSL === "true";

    this.publicMinioClient = new Minio.Client({
      endPoint: externalEndpoint,
      port: externalPort,
      useSSL: externalUseSSL,
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
      pathStyle: true,
    });

    this.logger.log(
      `MinIO público configurado: ${externalUseSSL ? "https" : "http"}://${externalEndpoint}:${externalPort}`,
    );

    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, "us-east-1");
      this.logger.log(`Bucket "${this.bucketName}" criado.`);
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
    // URL gerada já com o endpoint externo correto — assinatura HMAC válida.
    return this.publicMinioClient.presignedGetObject(
      this.bucketName,
      fileName,
      24 * 60 * 60, // 24 horas
    );
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.minioClient.removeObject(this.bucketName, fileName);
  }

  async getFileStream(fileName: string): Promise<any> {
    return this.minioClient.getObject(this.bucketName, fileName);
  }

  async getFileStat(fileName: string): Promise<any> {
    return this.minioClient.statObject(this.bucketName, fileName);
  }
}