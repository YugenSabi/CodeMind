import type {
  CreateRoomPayload,
  DeleteRoomResponse,
  JoinRoomPayload,
  Room,
} from './room-types';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
  return request<Room>('/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function joinRoom(payload: JoinRoomPayload): Promise<Room> {
  return request<Room>('/rooms/join', {
    method: 'POST',
    body: JSON.stringify({
      code: payload.code.trim().toUpperCase(),
    }),
  });
}

export async function getRoom(roomId: string): Promise<Room> {
  return request<Room>(`/rooms/${encodeURIComponent(roomId)}`, {
    method: 'GET',
  });
}

export async function removeRoomParticipant(
  roomId: string,
  participantId: string,
): Promise<Room> {
  return request<Room>(
    `/rooms/${encodeURIComponent(roomId)}/members/${encodeURIComponent(participantId)}`,
    {
      method: 'DELETE',
    },
  );
}

export async function deleteRoom(roomId: string): Promise<DeleteRoomResponse> {
  return request<DeleteRoomResponse>(`/rooms/${encodeURIComponent(roomId)}`, {
    method: 'DELETE',
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as
      | { message?: string | string[] }
      | undefined;

    if (Array.isArray(payload?.message)) {
      return payload.message.join(', ');
    }

    if (typeof payload?.message === 'string') {
      return payload.message;
    }
  } catch {}

  return `Room request failed with status ${response.status}`;
}
