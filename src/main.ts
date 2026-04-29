import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import * as path from 'path';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ConfigService);

  app.useLogger(app.get(Logger));

  app.use(helmet());

  app.enableCors({
    origin: config.get<string>('ALLOWED_ORIGINS')?.split(',') ?? '*',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Serve static uploads
  const uploadPath = config.get<string>('upload.path') ?? './uploads';
  const staticUrl = config.get<string>('upload.staticUrl') ?? '/static';
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require('express');
  app.use(staticUrl, express.static(path.resolve(uploadPath)));

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PASHTOONIC API')
    .setDescription(
      'PASHTOONIC — A digital literary ecosystem for ~50-60M Pashto speakers globally. ' +
        'Powers Pashto poetry platform with user content, moderation, gamification, and social features. ' +
        'Supported languages: Pashto (ps), Urdu (ur), English (en). API Version: 1.0.0',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication and token management')
    .addTag('Users', 'User profiles and management')
    .addTag('Poetry', 'Poem submission, browsing, search')
    .addTag('Poets', 'Verified poet profiles')
    .addTag('Social', 'Likes, comments, reviews, follows')
    .addTag('Admin', 'Moderation and administration')
    .addTag('Uploads', 'File upload endpoints')
    .addTag('Gamification', 'XP, levels, badges')
    .addTag('Search', 'Full-text and faceted search')
    .addTag('Feed', 'Personalized and explore feeds')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  console.log(`PASHTOONIC API running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
