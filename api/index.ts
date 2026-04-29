import type { Request, Response } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedServer: any = null;

async function bootstrap() {
  if (cachedServer) return cachedServer;

  await import('reflect-metadata');
  const { NestFactory } = await import('@nestjs/core');
  const { ExpressAdapter } = await import('@nestjs/platform-express');
  const { ValidationPipe } = await import('@nestjs/common');
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const helmet = (await import('helmet')).default;
  const { AppModule } = await import('../src/app.module');

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const expressInstance = require('express')();

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
    { logger: ['error', 'warn', 'log'] },
  );

  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

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
        'Powers Pashto poetry platform with user content, moderation, gamification, and social features. ' +
        'Supported languages: Pashto (ps), Urdu (ur), English (en). API Version: 1.0.0',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth').addTag('Users').addTag('Poetry').addTag('Poets')
    .addTag('Social').addTag('Admin').addTag('Uploads').addTag('Gamification')
    .addTag('Search').addTag('Feed')
    .build();

  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig), {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.init();
  cachedServer = expressInstance;
  return cachedServer;
}

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
