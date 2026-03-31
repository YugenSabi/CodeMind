import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' }, // нужно для тестов, потом убрать
})
export class RoomsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, userId } = data;

    client.join(roomId);

    /*
    client.to(roomId).emit('notification', {
      text: `Пользователь ${userId} присоединился к редактированию`,
    });
    */


    console.log(`User ${userId} connected to room ${roomId}`);
  }
}
