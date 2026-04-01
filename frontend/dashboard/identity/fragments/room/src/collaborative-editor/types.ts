import type { RoomFile } from '@lib/files';
import type {
  AlgorithmDifficulty,
  Room,
  RoomAiAssistAction,
  RoomAiHistoryItem,
  RoomAlgorithmTask,
  RoomSocket,
} from '@lib/rooms';

export type SessionUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type CollaborativeEditorProps = {
  room: Room;
  file: RoomFile;
  user: SessionUser | null;
  roomId: string;
  socket: RoomSocket | null;
};

export type AlgorithmReview = {
  passed: boolean;
  score: number;
  summary: string;
  strengths?: string[];
  issues?: string[];
  nextSteps?: string[];
} | null;

export type AiAssistPanelProps = {
  action: RoomAiAssistAction;
  prompt: string;
  response: string;
  history: RoomAiHistoryItem[];
  isLoading: boolean;
  canReject: boolean;
  onActionChange: (value: RoomAiAssistAction) => void;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  onReject: () => void;
};

export type AlgorithmTaskPanelProps = {
  task: RoomAlgorithmTask | null;
  difficulty: AlgorithmDifficulty;
  topic: string;
  isGeneratingTask: boolean;
  isReviewingTask: boolean;
  review: AlgorithmReview;
  onDifficultyChange: (value: AlgorithmDifficulty) => void;
  onTopicChange: (value: string) => void;
  onGenerateTask: () => void;
  onReviewSolution: () => void;
};
