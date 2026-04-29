import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const expressLib = require('express');
import helmet from 'helmet';
import { AppModule } from '../src/app.module';
import type { Express } from 'express';
import type { INestApplication } from '@nestjs/common';

const server: Express = expressLib();
let app: INestApplication;

async function bootstrap(): Promise<Express> {
  if (!app) {
    app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
      bufferLogs: true,
    });

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

    const swaggerConfig = new DocumentBuilder()
      .setTitle('PASHTOONIC API')
      .setDescription(
        'PASHTOONIC — A digital literary ecosystem for ~50-60M Pashto speakers globally.',
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
  }
  return server;
}

export default async (req: any, res: any) => {
  const expressApp = await bootstrap();
  expressApp(req, res);
};
