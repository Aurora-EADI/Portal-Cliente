require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MinioService } = require('../src/minio/minio.service');

test('MinioService onModuleInit does not crash when MinIO connection fails', async () => {
  const service = new MinioService();
  const originalEndpoint = process.env.MINIO_ENDPOINT;
  const originalPort = process.env.MINIO_PORT;

  try {
    process.env.MINIO_ENDPOINT = '127.0.0.1';
    process.env.MINIO_PORT = '59999';

    await assert.doesNotReject(async () => {
      await service.onModuleInit();
    });
  } finally {
    process.env.MINIO_ENDPOINT = originalEndpoint;
    process.env.MINIO_PORT = originalPort;
  }
});

