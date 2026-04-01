import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from './rooms.service';
import { TerminalService } from './terminal.service';

type RoomSocketData = {
  roomId?: string;
  user?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  };
};

@WebSocketGateway({
  cors: { origin: '*' },
})
export class RoomsGateway implements OnGatewayDisconnect {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly terminalService: TerminalService,
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = data.roomId?.trim();

    if (!roomId) {
      throw new WsException('roomId is required');
    }

    const context = await this.roomsService.getRealtimeRoomContext(
      roomId,
      client.handshake.headers.cookie,
    );

    const previousRoomId = (client.data as RoomSocketData).roomId;
    if (previousRoomId && previousRoomId !== roomId) {
      await client.leave(previousRoomId);
      this.broadcastPresence(previousRoomId);
    }

    (client.data as RoomSocketData).roomId = context.roomId;
    (client.data as RoomSocketData).user = context.user;

    await client.join(context.roomId);

    client.emit('room:joined', {
      roomId: context.roomId,
      roomName: context.roomName,
      user: context.user,
      participants: this.getParticipants(context.roomId),
    });

    client.to(context.roomId).emit('room:user_joined', {
      roomId: context.roomId,
      user: context.user,
    });

    this.broadcastPresence(context.roomId);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(@ConnectedSocket() client: Socket) {
    const socketData = client.data as RoomSocketData;

    if (!socketData.roomId) {
      return;
    }

    const roomId = socketData.roomId;
    const user = socketData.user;

    await client.leave(roomId);
    delete socketData.roomId;
    delete socketData.user;

    client.emit('room:left', { roomId });

    if (user) {
      client.to(roomId).emit('room:user_left', {
        roomId,
        user,
      });
    }

    this.broadcastPresence(roomId);
  }

  handleDisconnect(client: Socket) {
    const socketData = client.data as RoomSocketData;
    const roomId = socketData.roomId;
    const user = socketData.user;

    if (!roomId) {
      return;
    }

    if (user) {
      client.to(roomId).emit('room:user_left', {
        roomId,
        user,
      });
    }

    this.broadcastPresence(roomId);
  }

  private broadcastPresence(roomId: string) {
    this.server.to(roomId).emit('room:presence', {
      roomId,
      participants: this.getParticipants(roomId),
    });
  }

  emitFileCreated(roomId: string, file: unknown) {
    this.server.to(roomId).emit('room:file_created', {
      roomId,
      file,
    });
  }

  emitFileUpdated(roomId: string, file: unknown) {
    this.server.to(roomId).emit('room:file_updated', {
      roomId,
      file,
    });
  }

  emitFileDeleted(roomId: string, fileId: string) {
    this.server.to(roomId).emit('room:file_deleted', {
      roomId,
      fileId,
    });
  }

  emitRoomTreeUpdated(roomId: string, room: unknown) {
    this.server.to(roomId).emit('room:tree_updated', {
      roomId,
      room,
    });
  }

  @SubscribeMessage('terminal:start')
  async handleTerminalStart(
    @MessageBody()
    data: {
      roomId: string;
      fileId: string;
      content: string;
      cols?: number;
      rows?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const socketData = client.data as RoomSocketData;

    if (
      !socketData.roomId ||
      socketData.roomId !== data.roomId ||
      !socketData.user
    ) {
      throw new WsException('Join the room before starting terminal');
    }

    const session = await this.terminalService.startSession({
      roomId: data.roomId,
      fileId: data.fileId,
      content: data.content,
      user: socketData.user,
      cols: data.cols,
      rows: data.rows,
      onData: (chunk) => {
        this.server.to(data.roomId).emit('terminal:data', {
          roomId: data.roomId,
          chunk,
        });
      },
    });

    this.server.to(data.roomId).emit('terminal:started', session);
  }

  @SubscribeMessage('terminal:input')
  async handleTerminalInput(
    @MessageBody() data: { roomId: string; input: string },
    @ConnectedSocket() client: Socket,
  ) {
    const socketData = client.data as RoomSocketData;

    if (!socketData.roomId || socketData.roomId !== data.roomId) {
      throw new WsException('Join the room before sending terminal input');
    }

    await this.terminalService.sendInput(data.roomId, data.input);
  }

  @SubscribeMessage('terminal:resize')
  async handleTerminalResize(
    @MessageBody() data: { roomId: string; cols: number; rows: number },
    @ConnectedSocket() client: Socket,
  ) {
    const socketData = client.data as RoomSocketData;

    if (!socketData.roomId || socketData.roomId !== data.roomId) {
      throw new WsException('Join the room before resizing terminal');
    }

    await this.terminalService.resizeSession(data);
  }

  @SubscribeMessage('terminal:stop')
  async handleTerminalStop(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const socketData = client.data as RoomSocketData;

    if (!socketData.roomId || socketData.roomId !== data.roomId) {
      throw new WsException('Join the room before stopping terminal');
    }

    await this.terminalService.stopSession(data.roomId);
    this.server.to(data.roomId).emit('terminal:stopped', {
      roomId: data.roomId,
    });
  }

  private getParticipants(roomId: string) {
    const socketIds = this.server.sockets.adapter.rooms.get(roomId);
    if (!socketIds) {
      return [];
    }

    const participants = new Map<string, RoomSocketData['user']>();
    for (const socketId of socketIds) {
      const socket = this.server.sockets.sockets.get(socketId);
      const user = socket?.data
        ? (socket.data as RoomSocketData).user
        : undefined;

      if (user) {
        participants.set(user.id, user);
      }
    }

    return Array.from(participants.values());
  }
}
