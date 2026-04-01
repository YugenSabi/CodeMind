import { type ReactNode } from 'react';
import type { RoomFile } from '@lib/files';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type CreateFileModalProps = {
  fileName: string;
  fileExtension: string;
  language: RoomFile['language'];
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onLanguageChange: (value: RoomFile['language']) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CreateFileModal({
  fileName,
  fileExtension,
  language,
  isLoading,
  onNameChange,
  onLanguageChange,
  onCancel,
  onConfirm,
}: CreateFileModalProps): ReactNode {
  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={20}
      backgroundColor="rgba(21, 27, 35, 0.72)"
      alignItems="center"
      justifyContent="center"
      padding={24}
    >
      <Box
        width="$full"
        maxWidth={520}
        backgroundColor="$cardBg"
        border="1px solid"
        borderColor="$border"
        borderRadius={28}
        padding={24}
        flexDirection="column"
        gap={18}
      >
        <Box flexDirection="column" gap={8}>
          <Text color="#FFFFFF" font="$rus" size={28} lineHeight="32px">
            Создать файл
          </Text>
          <Text color="$secondaryText" font="$footer" size={16} lineHeight="22px">
            Выберите название и тип файла для комнаты.
          </Text>
        </Box>

        <Box flexDirection="column" gap={8}>
          <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
            Название файла
          </Text>
          <Box alignItems="center" gap={8}>
            <input
              value={fileName}
              onChange={(event) => {
                onNameChange(stripFileExtension(event.target.value));
              }}
              placeholder="Например, main"
              style={{
                ...getModalFieldStyles(),
                flex: 1,
              }}
            />
            <Box
              minWidth={72}
              height={48}
              border="1px solid"
              borderColor="$border"
              borderRadius={16}
              alignItems="center"
              justifyContent="center"
              paddingLeft={12}
              paddingRight={12}
              backgroundColor="#151B23"
            >
              <Text color="$secondaryText" font="$footer" size={14} lineHeight="18px">
                {fileExtension || 'none'}
              </Text>
            </Box>
          </Box>
        </Box>

        <Box flexDirection="column" gap={8}>
          <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
            Тип файла
          </Text>
          <select
            value={language}
            onChange={(event) => {
              onLanguageChange(event.target.value as RoomFile['language']);
            }}
            style={getModalFieldStyles()}
          >
            {FILE_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Box>

        <Box justifyContent="flex-end" gap={10}>
          <Button
            type="button"
            variant="ghost"
            height={44}
            padding={18}
            border="1px solid"
            borderColor="$border"
            borderRadius={16}
            textColor="#FFFFFF"
            disabled={isLoading}
            onClick={onCancel}
          >
            <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
              Отмена
            </Text>
          </Button>

          <Button
            type="button"
            variant="filled"
            height={44}
            padding={18}
            borderRadius={16}
            bg="#43953D"
            textColor="#FFFFFF"
            disabled={isLoading}
            onClick={onConfirm}
          >
            <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
              {isLoading ? 'Создание...' : 'Создать'}
            </Text>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function getModalFieldStyles() {
  return {
    width: '100%',
    height: 48,
    borderRadius: 16,
    border: '1px solid #383F47',
    background: '#151B23',
    color: '#FFFFFF',
    padding: '0 14px',
    outline: 'none',
    fontSize: '14px',
  } as const;
}

function stripFileExtension(value: string) {
  return value.replace(/\.[^./\\]+$/, '');
}

const FILE_LANGUAGE_OPTIONS: Array<{
  value: RoomFile['language'];
  label: string;
}> = [
  { value: 'TYPESCRIPT', label: 'TypeScript' },
  { value: 'JAVASCRIPT', label: 'JavaScript' },
  { value: 'PYTHON', label: 'Python' },
  { value: 'JSON', label: 'JSON' },
  { value: 'HTML', label: 'HTML' },
  { value: 'CSS', label: 'CSS' },
  { value: 'MARKDOWN', label: 'Markdown' },
  { value: 'PLAINTEXT', label: 'Plain text' },
];
