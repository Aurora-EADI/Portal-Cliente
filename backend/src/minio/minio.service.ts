import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as Minio from "minio";

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);

  // Internal client for upload/delete/stream against Docker DNS host.
  private minioClient!: Minio.Client;

  // Public client used only to generate presigned URLs with browser-reachable host.
  private publicMinioClient!: Minio.Client;

  private readonly bucketName: string = process.env.MINIO_BUCKET_NAME || "documents";

  constructor() {}

  async onModuleInit() {
    // Internal client resolves Docker service hostname (e.g. "minio").
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || "minio",
      port: parseInt(process.env.MINIO_PORT || "9000", 10),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
      secretKey: process.env.MINIO_SECRET_KEY || "minioadmin123",
      pathStyle: true,
    });

    // Public client uses external endpoint reachable by browser.
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
      `MinIO public configured: ${externalUseSSL ? "https" : "http"}://${externalEndpoint}:${externalPort}`,
    );

    await this.ensureBucketExists();
    await this.ensureContainersBucketExists();
  }

  private async ensureBucketExists() {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, "us-east-1");
      this.logger.log(`Bucket "${this.bucketName}" created.`);
    }
  }

  async ensureContainersBucketExists() {
    const exists = await this.minioClient.bucketExists("containers");
    if (!exists) {
      await this.minioClient.makeBucket("containers", "us-east-1");
      this.logger.log(`Bucket "containers" created.`);
    }
  }

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
      { "Content-Type": file.mimetype },
    );
    return fileName;
  }

  async getFileUrl(fileName: string, bucket?: string): Promise<string> {
    const targetBucket = bucket ?? this.bucketName;
    return this.publicMinioClient.presignedGetObject(
      targetBucket,
      fileName,
      24 * 60 * 60,
    );
  }

  async deleteFile(fileName: string, bucket?: string): Promise<void> {
    const targetBucket = bucket ?? this.bucketName;
    await this.minioClient.removeObject(targetBucket, fileName);
  }

  async getFileStream(fileName: string, bucket?: string): Promise<any> {
    const targetBucket = bucket ?? this.bucketName;
    return this.minioClient.getObject(targetBucket, fileName);
  }

  async getFileStat(fileName: string, bucket?: string): Promise<any> {
    const targetBucket = bucket ?? this.bucketName;
    return this.minioClient.statObject(targetBucket, fileName);
  }
}
