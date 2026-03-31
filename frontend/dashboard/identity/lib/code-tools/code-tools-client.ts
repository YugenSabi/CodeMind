const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

export async function runCode(input: {
  fileId: string;
  content: string;
  stdin?: string;
}) {
  return request<{
    language: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
    timedOut: boolean;
  }>('/code-tools/run', {
    method: 'POST',
    body: JSON.stringify(input),
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

  const payload = (await response.json().catch(() => null)) as
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    if (typeof payload?.message === 'string') {
      throw new Error(payload.message);
    }

    if (Array.isArray(payload?.message)) {
      throw new Error(payload.message.join(', '));
    }

    throw new Error(`Code tools request failed with status ${response.status}`);
  }

  return payload as T;
}
