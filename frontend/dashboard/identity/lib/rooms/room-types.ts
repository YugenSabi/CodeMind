import type { RoomDirectory, RoomFile } from '@lib/files';

export type RoomMode = 'JUST_CODING' | 'INTERVIEWS' | 'ALGORITHMS';
export type AlgorithmDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type RoomParticipant = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl?: string | null;
  role?: string;
};

export type Room = {
  id: string;
  code: string;
  name: string;
  mode: RoomMode;
  createdAt: string;
  updatedAt: string;
  owner: RoomParticipant;
  users: RoomParticipant[];
  files: RoomFile[];
  directories: RoomDirectory[];
  activeAlgorithmTask: RoomAlgorithmTask | null;
};

export type RoomAiAssistAction =
  | 'CURSOR_COMPLETE'
  | 'SELECTION_EXPLAIN'
  | 'SELECTION_REVIEW'
  | 'SELECTION_IMPROVE'
  | 'GENERATE_FROM_INSTRUCTION';

export type RoomAiCapabilities = {
  roomId: string;
  mode: RoomMode;
  aiEnabled: boolean;
  canAssistCode: boolean;
  canGenerateAlgorithmTasks: boolean;
  canReviewAlgorithmSolutions: boolean;
};

export type RoomAiHistoryItem = {
  id: string;
  roomId: string;
  fileId: string | null;
  kind:
    | 'CURSOR_COMPLETE'
    | 'SELECTION_EXPLAIN'
    | 'SELECTION_REVIEW'
    | 'SELECTION_IMPROVE'
    | 'GENERATE_FROM_INSTRUCTION'
    | 'ALGORITHM_TASK_GENERATED'
    | 'ALGORITHM_SOLUTION_REVIEWED';
  prompt: string;
  response: string;
  metadata: Record<string, unknown> | null;
  actor: RoomParticipant | null;
  createdAt: string;
};

export type RoomAiAssistResponse = {
  id: string;
  kind: RoomAiHistoryItem['kind'];
  response: string;
  createdAt: string;
};

export type RoomAlgorithmTask = {
  id: string;
  roomId: string;
  difficulty: AlgorithmDifficulty;
  title: string;
  problemStatement: string;
  inputFormat: string | null;
  outputFormat: string | null;
  constraints: string | null;
  starterCode: string | null;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }> | null;
  hints: string[] | null;
  evaluationCriteria: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReviewAlgorithmSolutionResult = {
  id: string;
  task: RoomAlgorithmTask;
  review: {
    passed: boolean;
    score: number;
    summary: string;
    strengths?: string[];
    issues?: string[];
    nextSteps?: string[];
  };
  createdAt: string;
};

export type RoomDashboardItem = {
  id: string;
  type: 'FILE_CREATED' | 'FILE_UPDATED' | 'FILE_COLLABORATION_JOINED';
  createdAt: string;
  actor: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  file: {
    id: string;
    name: string;
    language: RoomFile['language'];
  };
};

export type CreateRoomPayload = {
  name: string;
  mode: RoomMode;
};

export type JoinRoomPayload = {
  code: string;
};

export type DeleteRoomResponse = {
  success: boolean;
  roomId: string;
};
