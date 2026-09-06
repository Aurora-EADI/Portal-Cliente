import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

/**
 * Portado de apps/api/src/minio/minio.service.ts do Portal Aurora, com uma
 * diferenca deliberada: aqui NAO existe cliente publico nem geracao de URL
 * presigned.
 *
 * Este portal e exposto na internet e guarda arquivos enviados por usuarios
 * externos. Uma URL presigned e um link portavel que vaza o objeto para quem
 * receber a URL, sem passar por nenhum guard. Todo acesso a arquivo aqui e por
 * streaming autenticado (getFileStream), inclusive o do Portal Aurora, que le
 * por proxy server-to-server.
 */
@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);

  private minioClient!: Minio.Client;

  private readonly bucketName: string =
    process.env.MINIO_BUCKET_NAME || 'averbacao';

  async onModuleInit() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'minio',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
      pathStyle: true,
    });

    await this.ensureBucketExists(this.bucketName);
    this.logger.log(`MinIO pronto — bucket "${this.bucketName}"`);
  }

  private async ensureBucketExists(bucket: string) {
    const exists = await this.minioClient.bucketExists(bucket);
    if (!exists) {
      await this.minioClient.makeBucket(bucket, 'us-east-1');
      this.logger.log(`Bucket "${bucket}" criado.`);
    }
  }

  /** Grava o objeto e devolve a key (nunca uma URL). */
  async uploadFile(
    file: Express.Multer.File,
    fileName: string,
    bucket?: string,
  ): Promise<string> {
    const targetBucket = bucket ?? this.bucketName;
    await this.minioClient.putObject(
      targetBucket,
      fileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype },
    );
    return fileName;
  }

  async deleteFile(fileName: string, bucket?: string): Promise<void> {
    const targetBucket = bucket ?? this.bucketName;
    await this.minioClient.removeObject(targetBucket, fileName);
  }

  async getFileStream(fileName: string, bucket?: string) {
    const targetBucket = bucket ?? this.bucketName;
    return this.minioClient.getObject(targetBucket, fileName);
  }

  async getFileStat(fileName: string, bucket?: string) {
    const targetBucket = bucket ?? this.bucketName;
    return this.minioClient.statObject(targetBucket, fileName);
  }
}
