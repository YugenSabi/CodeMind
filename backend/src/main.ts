import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CollaborationService } from './collaboration/collaboration.service';
import { createCollaborationServer } from './collaboration/collaboration.server';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const collaborationService = app.get(CollaborationService);
  const collaborationServer = createCollaborationServer(collaborationService);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('CodeMind Backend')
      .setVersion('0.1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await collaborationServer.listen();
  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
