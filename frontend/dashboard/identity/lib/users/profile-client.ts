import type {
  OwnProfile,
  PublicProfile,
  UpdateProfilePayload,
} from './profile-types';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

export async function getOwnProfile(): Promise<OwnProfile> {
  return request<OwnProfile>('/users/me', {
    method: 'GET',
  });
}

export async function updateOwnProfile(
  payload: UpdateProfilePayload,
): Promise<OwnProfile> {
  return request<OwnProfile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  return request<PublicProfile>(`/users/${encodeURIComponent(userId)}`, {
    method: 'GET',
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

  return `Profile request failed with status ${response.status}`;
}
