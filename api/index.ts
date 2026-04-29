import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const express = require('express');
import { AppModule } from '../src/app.module';
import type { Express, Request, Response } from 'express';

const expressServer: Express = express();
let cachedApp: INestApplication | null = null;

async function bootstrap(): Promise<Express> {
  if (cachedApp) return expressServer;

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressServer),
    { logger: ['error', 'warn', 'log'] },
  );

  const config = app.get(ConfigService);

  app.use(
    helmet({
      contentSecurityPolicy: false, // allow Swagger UI
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.enableCors({
    origin: '*',
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PASHTOONIC API')
    .setDescription(
      'PASHTOONIC — A digital literary ecosystem for ~50-60M Pashto speakers globally. ' +
      'Pashto poetry platform | Languages: ps, ur, en | v1.0.0',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth').addTag('Users').addTag('Poetry').addTag('Poets')
    .addTag('Social').addTag('Admin').addTag('Uploads').addTag('Gamification')
    .addTag('Search').addTag('Feed')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.init();
  cachedApp = app;
  return expressServer;
}

export default async (req: Request, res: Response): Promise<void> => {
  try {
    const server = await bootstrap();
    server(req, res);
  } catch (err) {
    console.error('Bootstrap error:', err);
    res.status(500).json({
      statusCode: 500,
      message: 'Server initialization failed',
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
