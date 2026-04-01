import type { RoomFile } from '@lib/files';
import type {
  AlgorithmDifficulty,
  ReviewAlgorithmSolutionResult,
  RoomAiAssistAction,
  RoomAiAssistResponse,
  RoomAiCapabilities,
  RoomAiHistoryItem,
  RoomAlgorithmTask,
} from './room-types';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

type AssistRoomAiPayload = {
  action: RoomAiAssistAction;
  language: RoomFile['language'];
  instruction: string;
  currentCode: string;
  fileId?: string;
  selectedCode?: string;
  cursorPrefix?: string;
  cursorSuffix?: string;
};

type GenerateAlgorithmTaskPayload = {
  difficulty: AlgorithmDifficulty;
  topic?: string;
  preferredLanguage?: RoomFile['language'];
};

type ReviewAlgorithmSolutionPayload = {
  fileId?: string;
  solutionCode?: string;
  language: RoomFile['language'];
};

export async function getRoomAiCapabilities(
  roomId: string,
): Promise<RoomAiCapabilities> {
  return request(`/rooms/${encodeURIComponent(roomId)}/ai/capabilities`, {
    method: 'GET',
  });
}

export async function getRoomAiHistory(
  roomId: string,
): Promise<RoomAiHistoryItem[]> {
  return request(`/rooms/${encodeURIComponent(roomId)}/ai/history`, {
    method: 'GET',
  });
}

export async function assistRoomAi(
  roomId: string,
  payload: AssistRoomAiPayload,
): Promise<RoomAiAssistResponse> {
  return request(`/rooms/${encodeURIComponent(roomId)}/ai/assist`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCurrentAlgorithmTask(
  roomId: string,
): Promise<RoomAlgorithmTask | null> {
  return request(`/rooms/${encodeURIComponent(roomId)}/ai/tasks/current`, {
    method: 'GET',
  });
}

export async function generateAlgorithmTask(
  roomId: string,
  payload: GenerateAlgorithmTaskPayload,
): Promise<RoomAlgorithmTask> {
  return request(`/rooms/${encodeURIComponent(roomId)}/ai/tasks/generate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function reviewCurrentAlgorithmSolution(
  roomId: string,
  payload: ReviewAlgorithmSolutionPayload,
): Promise<ReviewAlgorithmSolutionResult> {
  return request(`/rooms/${encodeURIComponent(roomId)}/ai/tasks/current/review`, {
    method: 'POST',
    body: JSON.stringify(payload),
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

  if (response.status === 204) {
    return null as T;
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

  return `AI request failed with status ${response.status}`;
}
