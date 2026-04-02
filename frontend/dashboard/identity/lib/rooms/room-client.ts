import type {
  CreateRoomPayload,
  DeleteRoomResponse,
  JoinRoomPayload,
  RoomDashboardItem,
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

export async function getRoomDashboard(
  roomId: string,
): Promise<RoomDashboardItem[]> {
  return request<RoomDashboardItem[]>(
    `/rooms/${encodeURIComponent(roomId)}/dashboard`,
    {
      method: 'GET',
    },
  );
}

export async function downloadRoomProject(
  roomId: string,
  roomNameHint?: string,
): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/rooms/${encodeURIComponent(roomId)}/export`,
    {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const message = await getErrorMessage(response);
    throw new Error(message);
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const contentDisposition = response.headers.get('Content-Disposition');
  const fileName =
    extractFileName(contentDisposition) ?? `${(roomNameHint ?? 'project').trim() || 'project'}.zip`;

  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
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

function extractFileName(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const fileNameMatch = contentDisposition.match(
    /filename="([^"]+)"|filename=([^;]+)/i,
  );
  const value = fileNameMatch?.[1] ?? fileNameMatch?.[2];

  if (!value) {
    return null;
  }

  return value.trim();
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
