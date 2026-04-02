'use client';

import { useTranslations } from 'next-intl';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import type { AlgorithmTaskPanelProps } from '../types';
import { primaryButtonStyles, secondaryButtonStyles, selectStyles } from '../styles';

export function AlgorithmTaskPanel({
  task,
  difficulty,
  isGeneratingTask,
  isReviewingTask,
  review,
  onDifficultyChange,
  onGenerateTask,
  onReviewSolution,
}: AlgorithmTaskPanelProps) {
  const t = useTranslations('room.editor');

  return (
    <Box flexDirection="column" gap={10}>
      <Text color="#AEB7C2" font="$footer" size={12} lineHeight="16px">
        {t('algorithmMode')}
      </Text>

      <select
        value={difficulty}
        onChange={(event) => {
          onDifficultyChange(event.target.value as typeof difficulty);
        }}
        style={selectStyles}
      >
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </select>

      <button
        onClick={onGenerateTask}
        disabled={isGeneratingTask}
        style={primaryButtonStyles}
      >
        {isGeneratingTask ? t('generatingTask') : t('generateTask')}
      </button>

      {task ? (
        <Box
          backgroundColor="#181C24"
          border="1px solid"
          borderColor="rgba(255,255,255,0.08)"
          borderRadius={14}
          padding={12}
          flexDirection="column"
          gap={8}
        >
          <Text color="#FFFFFF" font="$rus" size={14} lineHeight="18px">
            {task.title}
          </Text>
          {task.constraints ? (
            <Text
              color="#98A3AF"
              font="$footer"
              size={12}
              lineHeight="18px"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {t('constraints', { constraints: task.constraints })}
            </Text>
          ) : null}
          <button
            onClick={onReviewSolution}
            disabled={isReviewingTask}
            style={secondaryButtonStyles}
          >
            {isReviewingTask ? t('reviewingSolution') : t('reviewSolution')}
          </button>
        </Box>
      ) : null}

      {review ? (
        <Box
          backgroundColor="#181C24"
          border="1px solid"
          borderColor={
            review.passed ? 'rgba(46,125,50,0.45)' : 'rgba(209,67,67,0.45)'
          }
          borderRadius={14}
          padding={12}
          flexDirection="column"
          gap={8}
        >
          <Text color="#FFFFFF" font="$rus" size={14} lineHeight="18px">
            {t('reviewTitle')}
          </Text>
          <Text color="#D7DEE7" font="$footer" size={13} lineHeight="18px">
            {t('reviewStatus', {
              status: review.passed
                ? t('reviewStatusPassed')
                : t('reviewStatusFailed'),
            })}
          </Text>
          <Text color="#D7DEE7" font="$footer" size={13} lineHeight="18px">
            {t('reviewScore', { score: review.score })}
          </Text>
          <Text
            color="#D7DEE7"
            font="$footer"
            size={13}
            lineHeight="20px"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {review.summary}
          </Text>
          {review.issues?.length ? (
            <Text
              color="#FFB4B4"
              font="$footer"
              size={12}
              lineHeight="18px"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {review.issues.join('\n')}
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
