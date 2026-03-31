import { io, type Socket } from 'socket.io-client';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

export type RoomSocketStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error';

export function connectRoomSocket() {
  return io(SOCKET_URL, {
    transports: ['websocket'],
    withCredentials: true,
  });
}

export function joinRoomSocket(
  socket: Socket,
  payload: { roomId: string; userId: string },
) {
  socket.emit('joinRoom', payload);
}

export function disconnectRoomSocket(socket: Socket | null) {
  socket?.disconnect();
}
