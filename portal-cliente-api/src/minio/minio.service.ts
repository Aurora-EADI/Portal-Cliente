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
  private readonly ensuredBuckets = new Set<string>();

  private readonly bucketName: string =
    process.env.MINIO_BUCKET_NAME || 'averbacao';

  async onModuleInit() {
    const endPoint =
      process.env.MINIO_ENDPOINT ||
      (process.env.NODE_ENV === 'production' ? 'minio' : 'localhost');
    const port = parseInt(process.env.MINIO_PORT || '9000', 10);
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';

    this.minioClient = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey,
      secretKey,
      pathStyle: true,
    });

    try {
      await this.ensureBucketExists(this.bucketName);
      this.logger.log(
        `MinIO pronto — bucket "${this.bucketName}" (${endPoint}:${port})`,
      );
    } catch (err: any) {
      this.logger.warn(
        `Não foi possível conectar ao MinIO em ${endPoint}:${port} (${err?.message || err}). ` +
          `A API continuará funcionando, mas operações de arquivo falharão até que o MinIO esteja acessível.`,
      );
    }
  }

  private async ensureBucketExists(bucket: string) {
    if (this.ensuredBuckets.has(bucket)) {
      return;
    }
    const exists = await this.minioClient.bucketExists(bucket);
    if (!exists) {
      await this.minioClient.makeBucket(bucket, 'us-east-1');
      this.logger.log(`Bucket "${bucket}" criado.`);
    }
    this.ensuredBuckets.add(bucket);
  }

  /** Grava o objeto e devolve a key (nunca uma URL). */
  async uploadFile(
    file: Express.Multer.File,
    fileName: string,
    bucket?: string,
  ): Promise<string> {
    const targetBucket = bucket ?? this.bucketName;
    await this.ensureBucketExists(targetBucket);
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
