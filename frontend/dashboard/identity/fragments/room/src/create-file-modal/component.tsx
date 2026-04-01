import { type ReactNode } from 'react';
import type { RoomFile } from '@lib/files';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type CreateFileModalProps = {
  itemType: 'file' | 'directory';
  fileName: string;
  fileExtension?: string;
  language: RoomFile['language'];
  isLoading: boolean;
  onNameChange: (value: string) => void;
  onLanguageChange: (value: RoomFile['language']) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

export function CreateFileModal({
  itemType,
  fileName,
  fileExtension,
  language,
  isLoading,
  onNameChange,
  onLanguageChange,
  onCancel,
  onConfirm,
}: CreateFileModalProps): ReactNode {
  const isDirectory = itemType === 'directory';

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={20}
      backgroundColor="rgba(8, 12, 18, 0.72)"
      alignItems="center"
      justifyContent="center"
      padding={24}
      style={{ backdropFilter: 'blur(10px)' }}
    >
      <Box
        width="$full"
        maxWidth={480}
        backgroundColor="#121720"
        border="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        borderRadius={20}
        paddingTop={20}
        paddingRight={20}
        paddingBottom={18}
        paddingLeft={20}
        flexDirection="column"
        gap={16}
        shadow="$md"
      >
        <Box flexDirection="column" gap={6}>
          <Text color="#FFFFFF" font="$rus" size={24} lineHeight="28px">
            {isDirectory ? 'Создать папку' : 'Создать файл'}
          </Text>
          <Text color="#7D8793" font="$footer" size={13} lineHeight="18px">
            {isDirectory
              ? 'Укажите название директории для комнаты.'
              : 'Укажите имя и язык файла для комнаты.'}
          </Text>
        </Box>

        <Box flexDirection="column" gap={8}>
          <Text color="#D7DEE7" font="$footer" size={12} lineHeight="14px">
            {isDirectory ? 'Название папки' : 'Имя файла'}
          </Text>
          <Box
            alignItems="center"
            gap={8}
            paddingTop={6}
            paddingRight={6}
            paddingBottom={6}
            paddingLeft={12}
            backgroundColor="#0F141C"
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            borderRadius={12}
          >
            <input
              value={fileName}
              onChange={(event) => {
                onNameChange(
                  isDirectory
                    ? event.target.value
                    : stripFileExtension(event.target.value),
                );
              }}
              placeholder={isDirectory ? 'Например, components' : 'Например, main'}
              style={{
                ...getModalFieldStyles(),
                flex: 1,
              }}
            />
            {!isDirectory ? (
              <Box
                minWidth={58}
                height={34}
                border="1px solid"
                borderColor="rgba(255,255,255,0.06)"
                borderRadius={9}
                alignItems="center"
                justifyContent="center"
                paddingLeft={10}
                paddingRight={10}
                backgroundColor="#171D26"
              >
                <Text color="#8C97A4" font="$footer" size={12} lineHeight="14px">
                  {fileExtension || 'txt'}
                </Text>
              </Box>
            ) : null}
          </Box>
        </Box>

        {!isDirectory ? (
          <Box flexDirection="column" gap={8}>
            <Text color="#D7DEE7" font="$footer" size={12} lineHeight="14px">
              Язык
            </Text>
            <Box position="relative" width="$full">
              <select
                value={language}
                onChange={(event) => {
                  onLanguageChange(event.target.value as RoomFile['language']);
                }}
                style={getSelectStyles()}
              >
                {FILE_LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Box
                position="absolute"
                alignItems="center"
                justifyContent="center"
                style={{
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 5.25L7 9.25L11 5.25"
                    stroke="#D7DEE7"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Box>
            </Box>
          </Box>
        ) : null}

        <Box
          justifyContent="flex-end"
          alignItems="center"
          gap={10}
          paddingTop={4}
        >
          <Button
            type="button"
            variant="ghost"
            height={38}
            padding={16}
            border="1px solid"
            borderColor="rgba(255,255,255,0.08)"
            borderRadius={10}
            textColor="#C7D0DB"
            bg="transparent"
            disabled={isLoading}
            onClick={onCancel}
          >
            <Text color="#C7D0DB" font="$footer" size={13} lineHeight="16px">
              Отмена
            </Text>
          </Button>

          <Button
            type="button"
            variant="filled"
            height={38}
            padding={16}
            borderRadius={10}
            bg="#2E7D32"
            textColor="#FFFFFF"
            disabled={isLoading}
            onClick={onConfirm}
          >
            <Text color="#FFFFFF" font="$footer" size={13} lineHeight="16px">
              {isLoading ? 'Создание...' : isDirectory ? 'Создать папку' : 'Создать'}
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
    height: 34,
    border: 'none',
    background: 'transparent',
    color: '#FFFFFF',
    padding: '0',
    outline: 'none',
    fontSize: '14px',
    lineHeight: '18px',
  } as const;
}

function getSelectStyles() {
  return {
    width: '100%',
    height: 46,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#0F141C',
    color: '#FFFFFF',
    padding: '0 40px 0 14px',
    outline: 'none',
    fontSize: '14px',
    lineHeight: '18px',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
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
