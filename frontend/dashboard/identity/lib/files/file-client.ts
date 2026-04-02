import type {
  CreateDirectoryPayload,
  CreateFilePayload,
  RoomDirectory,
  RoomFile,
} from './file-types';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

export async function createFile(payload: CreateFilePayload): Promise<RoomFile> {
  return request<RoomFile>('/files', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createDirectory(
  payload: CreateDirectoryPayload,
): Promise<RoomDirectory> {
  return request<RoomDirectory>('/files/directories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listRoomFiles(roomId: string): Promise<RoomFile[]> {
  const query = new URLSearchParams({
    roomId,
  });

  return request<RoomFile[]>(`/files?${query.toString()}`, {
    method: 'GET',
  });
}

export async function deleteFile(fileId: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
  });
}

export async function moveFile(
  fileId: string,
  directoryId: string | null,
): Promise<RoomFile> {
  return request<RoomFile>(`/files/${encodeURIComponent(fileId)}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ directoryId }),
  });
}

export async function moveDirectory(
  directoryId: string,
  parentId: string | null,
): Promise<RoomDirectory> {
  return request<RoomDirectory>(
    `/files/directories/${encodeURIComponent(directoryId)}/move`,
    {
      method: 'PATCH',
      body: JSON.stringify({ parentId }),
    },
  );
}

export async function deleteDirectory(
  directoryId: string,
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(
    `/files/directories/${encodeURIComponent(directoryId)}`,
    {
      method: 'DELETE',
    },
  );
}

export async function downloadFile(
  fileId: string,
  fileNameHint?: string,
): Promise<void> {
  const response = await fetch(
    `${BACKEND_URL}/files/${encodeURIComponent(fileId)}/download`,
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
  const fileName = extractFileName(contentDisposition) ?? fileNameHint ?? 'download';

  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

function extractFileName(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const fileNameMatch = contentDisposition.match(/filename="([^"]+)"|filename=([^;]+)/i);
  const value = fileNameMatch?.[1] ?? fileNameMatch?.[2];

  if (!value) {
    return null;
  }

  return value.trim();
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

  return `File request failed with status ${response.status}`;
}
