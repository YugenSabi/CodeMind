import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import type { AlgorithmTaskPanelProps } from '../types';
import {
  inputStyles,
  primaryButtonStyles,
  secondaryButtonStyles,
  selectStyles,
} from '../styles';

export function AlgorithmTaskPanel({
  task,
  difficulty,
  topic,
  isGeneratingTask,
  isReviewingTask,
  review,
  onDifficultyChange,
  onTopicChange,
  onGenerateTask,
  onReviewSolution,
}: AlgorithmTaskPanelProps) {
  return (
    <Box flexDirection="column" gap={10}>
      <Text color="#AEB7C2" font="$footer" size={12} lineHeight="16px">
        Алгоритмический режим
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

      <input
        value={topic}
        onChange={(event) => {
          onTopicChange(event.target.value);
        }}
        placeholder="Тема задачи, например graph, dp, arrays"
        style={inputStyles}
      />

      <button
        onClick={onGenerateTask}
        disabled={isGeneratingTask}
        style={primaryButtonStyles}
      >
        {isGeneratingTask ? 'Генерация...' : 'Сгенерировать задачу'}
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
          <Text
            color="#D7DEE7"
            font="$footer"
            size={13}
            lineHeight="20px"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {task.problemStatement}
          </Text>
          {task.constraints ? (
            <Text
              color="#98A3AF"
              font="$footer"
              size={12}
              lineHeight="18px"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              Ограничения: {task.constraints}
            </Text>
          ) : null}
          <button
            onClick={onReviewSolution}
            disabled={isReviewingTask}
            style={secondaryButtonStyles}
          >
            {isReviewingTask ? 'Проверка...' : 'Проверить решение'}
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
            Ревью решения
          </Text>
          <Text color="#D7DEE7" font="$footer" size={13} lineHeight="18px">
            Статус: {review.passed ? 'задача решена' : 'нужно доработать'}
          </Text>
          <Text color="#D7DEE7" font="$footer" size={13} lineHeight="18px">
            Оценка: {review.score}
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
