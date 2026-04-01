import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import type { AiAssistPanelProps } from '../types';
import {
  primaryButtonStyles,
  secondaryButtonStyles,
  selectStyles,
  textareaStyles,
} from '../styles';

export function AiAssistPanel({
  action,
  prompt,
  response,
  history,
  isLoading,
  canReject,
  onActionChange,
  onPromptChange,
  onSubmit,
  onReject,
}: AiAssistPanelProps) {
  return (
    <Box flexDirection="column" gap={10}>
      <Text color="#AEB7C2" font="$footer" size={12} lineHeight="16px">
        Помощь по текущему файлу
      </Text>

      <select
        value={action}
        onChange={(event) => {
          onActionChange(event.target.value as typeof action);
        }}
        style={selectStyles}
      >
        <option value="GENERATE_FROM_INSTRUCTION">
          Сгенерировать код по инструкции
        </option>
        <option value="CURSOR_COMPLETE">Дополнить код у курсора</option>
        <option value="SELECTION_IMPROVE">Улучшить выделенный код</option>
        <option value="SELECTION_REVIEW">Сделать ревью выделенного кода</option>
        <option value="SELECTION_EXPLAIN">Объяснить выделенный код</option>
      </select>

      <textarea
        value={prompt}
        onChange={(event) => {
          onPromptChange(event.target.value);
        }}
        placeholder="Например: найди уязвимости, предложи рефакторинг, допиши функцию..."
        style={textareaStyles}
      />

      <button onClick={onSubmit} disabled={isLoading} style={primaryButtonStyles}>
        {isLoading ? 'AI думает...' : 'Спросить AI'}
      </button>

      {response ? (
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
            Результат
          </Text>
          <Text
            color="#D7DEE7"
            font="$footer"
            size={13}
            lineHeight="20px"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {response}
          </Text>
          {canReject ? (
            <button onClick={onReject} style={secondaryButtonStyles}>
              Отменить AI-вставку
            </button>
          ) : null}
        </Box>
      ) : null}

      {history.length > 0 ? (
        <Box flexDirection="column" gap={8}>
          <Text color="#AEB7C2" font="$footer" size={12} lineHeight="16px">
            История AI
          </Text>
          {history.slice(0, 4).map((item) => (
            <Box
              key={item.id}
              backgroundColor="#181C24"
              border="1px solid"
              borderColor="rgba(255,255,255,0.06)"
              borderRadius={12}
              padding={10}
              flexDirection="column"
              gap={6}
            >
              <Text color="#FFFFFF" font="$footer" size={12} lineHeight="16px">
                {item.prompt}
              </Text>
              <Text
                color="#98A3AF"
                font="$footer"
                size={12}
                lineHeight="18px"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {item.response}
              </Text>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
