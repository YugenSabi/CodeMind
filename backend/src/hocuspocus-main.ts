import 'dotenv/config';
import { CollaborationService } from './collaboration/collaboration.service';
import { createCollaborationServer } from './collaboration/collaboration.server';
import { FileEventsService } from './file-events/file-events.service';
import { FilesService } from './files/files.service';
import { KratosService } from './kratos/kratos.service';
import { PrismaService } from './prisma/prisma.service';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const prismaService = new PrismaService();
  await prismaService.onModuleInit();

  const usersService = new UsersService(prismaService);
  const kratosService = new KratosService();
  const fileEventsService = new FileEventsService(prismaService);
  const filesService = new FilesService(
    prismaService,
    fileEventsService,
    kratosService,
    usersService,
  );
  const collaborationService = new CollaborationService(
    filesService,
    fileEventsService,
    prismaService,
  );
  const server = createCollaborationServer(collaborationService);

  await server.listen();

  const shutdown = async () => {
    await prismaService.onModuleDestroy();
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
