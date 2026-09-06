import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Portal do Cliente API')
    .setDescription('Documentação da API do Portal do Cliente')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = Number(process.env.PORT || process.env.BACKEND_PORT || 5001);
  await app.listen(port, '0.0.0.0');
  console.log(`Portal do Cliente API rodando em http://localhost:${port}`);
}
bootstrap();
