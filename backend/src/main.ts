import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './App/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS - usar variável de ambiente
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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
  
  const port = process.env.PORT || 5000;
  
  // IMPORTANTE: Ouvir em 0.0.0.0 para funcionar no Docker
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
}

bootstrap();