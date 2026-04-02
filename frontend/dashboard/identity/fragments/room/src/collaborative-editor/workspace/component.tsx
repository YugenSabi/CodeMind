'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { RoomAiHistoryItem, RoomMode } from '@lib/rooms';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { TerminalPanel } from '../../terminal-panel/component';
import { AiAssistPanel } from '../ai-assist-panel/component';
import { AlgorithmTaskPanel } from '../algorithm-task-panel/component';
import type { AlgorithmReview } from '../types';

type WorkspaceProps = {
  editorRootRef: { current: HTMLDivElement | null };
  terminalRootRef: { current: HTMLDivElement | null };
  terminalStatus: 'idle' | 'running' | 'stopped';
  canUseAi: boolean;
  roomMode: RoomMode;
  algorithmTask: {
    id: string;
    roomId: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
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
  } | null;
  algorithmDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isGeneratingTask: boolean;
  isReviewingTask: boolean;
  review: AlgorithmReview;
  aiAction:
    | 'CURSOR_COMPLETE'
    | 'SELECTION_EXPLAIN'
    | 'SELECTION_REVIEW'
    | 'SELECTION_IMPROVE'
    | 'GENERATE_FROM_INSTRUCTION';
  aiPrompt: string;
  aiResponse: string;
  aiHistory: RoomAiHistoryItem[];
  isAiLoading: boolean;
  canReject: boolean;
  onDifficultyChange: (value: 'EASY' | 'MEDIUM' | 'HARD') => void;
  onGenerateTask: () => void;
  onReviewSolution: () => void;
  onAiActionChange: (
    value:
      | 'CURSOR_COMPLETE'
      | 'SELECTION_EXPLAIN'
      | 'SELECTION_REVIEW'
      | 'SELECTION_IMPROVE'
      | 'GENERATE_FROM_INSTRUCTION',
  ) => void;
  onAiPromptChange: (value: string) => void;
  onAiSubmit: () => void;
  onAiReject: () => void;
};

export function Workspace({
  editorRootRef,
  terminalRootRef,
  terminalStatus,
  canUseAi,
  roomMode,
  algorithmTask,
  algorithmDifficulty,
  isGeneratingTask,
  isReviewingTask,
  review,
  aiAction,
  aiPrompt,
  aiResponse,
  aiHistory,
  isAiLoading,
  canReject,
  onDifficultyChange,
  onGenerateTask,
  onReviewSolution,
  onAiActionChange,
  onAiPromptChange,
  onAiSubmit,
  onAiReject,
}: WorkspaceProps): ReactNode {
  const t = useTranslations('room.editor');

  return (
    <Box width="$full" minWidth={0} minHeight={0} gap={10} style={{ flex: 1 }}>
      <Box
        width="$full"
        minWidth={0}
        minHeight={0}
        backgroundColor="#10151C"
        border="1px solid"
        borderColor="rgba(255,255,255,0.06)"
        borderRadius={18}
        padding={0}
        overflow="hidden"
        flexDirection="column"
        style={{ flex: 1 }}
      >
        <Box
          width="$full"
          minWidth={0}
          minHeight={0}
          overflow="hidden"
          style={{ flex: 1 }}
        >
          <div
            ref={editorRootRef}
            style={{
              width: '100%',
              maxWidth: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          />
        </Box>

        <TerminalPanel terminalRootRef={terminalRootRef} status={terminalStatus} />
      </Box>

      {canUseAi ? (
        <Box
          width={340}
          minWidth={340}
          backgroundColor="#121720"
          border="1px solid"
          borderColor="rgba(255,255,255,0.06)"
          borderRadius={18}
          padding={14}
          flexDirection="column"
          gap={12}
          overflow="auto"
        >
          <Text color="#FFFFFF" font="$rus" size={16} lineHeight="18px">
            {t('aiAssistantTitle')}
          </Text>

          {roomMode === 'ALGORITHMS' ? (
            <AlgorithmTaskPanel
              task={algorithmTask}
              difficulty={algorithmDifficulty}
              isGeneratingTask={isGeneratingTask}
              isReviewingTask={isReviewingTask}
              review={review}
              onDifficultyChange={onDifficultyChange}
              onGenerateTask={onGenerateTask}
              onReviewSolution={onReviewSolution}
            />
          ) : null}

          {roomMode === 'JUST_CODING' ? (
            <AiAssistPanel
              action={aiAction}
              prompt={aiPrompt}
              response={aiResponse}
              history={aiHistory}
              isLoading={isAiLoading}
              canReject={canReject}
              onActionChange={onAiActionChange}
              onPromptChange={onAiPromptChange}
              onSubmit={onAiSubmit}
              onReject={onAiReject}
            />
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
