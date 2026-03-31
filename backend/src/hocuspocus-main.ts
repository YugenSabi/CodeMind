import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CollaborationService } from './collaboration/collaboration.service';
import { createCollaborationServer } from './collaboration/collaboration.server';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const collaborationService = app.get(CollaborationService);
  const server = createCollaborationServer(collaborationService);

  await server.listen();

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown();
  });
  process.on('SIGTERM', () => {
    void shutdown();
  });

  console.log(
    `Hocuspocus server is running on port ${process.env.COLLAB_PORT ?? 1234}`,
  );
}

void bootstrap();
