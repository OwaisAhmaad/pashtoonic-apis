import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';
import type { Request, Response } from 'express';

// Cached across warm invocations
let cachedApp: INestApplication | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedServer: any = null;

async function bootstrap() {
  if (cachedApp && cachedServer) return cachedServer;

  // Create express server INSIDE bootstrap so no top-level failures
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expressInstance = require('express')();

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
    { logger: ['error', 'warn', 'log'] },
  );

  app.use(
    helmet({
      contentSecurityPolicy: false,
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
  cachedServer = expressInstance;
  return expressInstance;
}

// Catch unhandled promise rejections at process level
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

export default async (req: Request, res: Response): Promise<void> => {
  try {
    const server = await bootstrap();
    server(req, res);
  } catch (err) {
    console.error('Bootstrap error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        statusCode: 500,
        message: 'Server initialization failed',
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5) : undefined,
      });
    }
  }
};
