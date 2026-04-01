import { type ReactNode } from 'react';
import type { RoomFile } from '@lib/files';
import {
  BrandLogo as PlainTextIcon,
  BrandTitle as CssIcon,
  GithubLogo as HtmlIcon,
  GoogleLogo as MarkdownIcon,
  Menu as PythonIcon,
  NotificationIcon as TypeScriptIcon,
  RadioCircle as JsonIcon,
  UserIcon as JavaScriptIcon,
} from '@ui/icons';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type FileCardProps = {
  file: RoomFile;
  isActive: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onClick: () => void;
  onDelete: () => void;
};

export function FileCard({
  file,
  isActive,
  canDelete,
  isDeleting,
  onClick,
  onDelete,
}: FileCardProps): ReactNode {
  return (
    <Box width="$full" position="relative">
      <Button
        type="button"
        variant="ghost"
        width="$full"
        height={36}
        minHeight={0}
        padding={0}
        textColor="#FFFFFF"
        onClick={onClick}
      >
        <Box
          width="$full"
          height={36}
          backgroundColor={isActive ? 'rgba(95, 135, 255, 0.12)' : 'transparent'}
          borderRadius={10}
          paddingLeft={10}
          paddingRight={34}
          alignItems="center"
          gap={8}
          style={{
            boxShadow: isActive ? 'inset 2px 0 0 #5F87FF' : 'none',
          }}
        >
          <Box
            width={16}
            height={16}
            minWidth={16}
            minHeight={16}
            alignItems="center"
            justifyContent="center"
            color="#8FB4FF"
          >
            <LanguageIcon language={file.language} />
          </Box>
          <Text color="#D7DEE7" font="$footer" size={13} lineHeight="16px">
            {file.name}
          </Text>
        </Box>
      </Button>

      {canDelete ? (
        <Button
          type="button"
          variant="ghost"
          width={20}
          height={20}
          minWidth={20}
          minHeight={20}
          padding={0}
          borderRadius={8}
          textColor="#7D8793"
          bg="transparent"
          style={{ position: 'absolute', top: 8, right: 8 }}
          disabled={isDeleting}
          onClick={onDelete}
        >
          <Text color="#7D8793" font="$footer" size={14} lineHeight="14px">
            {isDeleting ? '...' : '×'}
          </Text>
        </Button>
      ) : null}
    </Box>
  );
}

function LanguageIcon({ language }: { language: RoomFile['language'] }): ReactNode {
  const sharedProps = {
    width: 16,
    height: 16,
    style: {
      width: 16,
      height: 16,
      display: 'block',
      flexShrink: 0,
    },
  };

  switch (language) {
    case 'JAVASCRIPT':
      return <JavaScriptIcon {...sharedProps} />;
    case 'TYPESCRIPT':
      return <TypeScriptIcon {...sharedProps} />;
    case 'PYTHON':
      return <PythonIcon {...sharedProps} />;
    case 'JSON':
      return <JsonIcon {...sharedProps} />;
    case 'HTML':
      return <HtmlIcon {...sharedProps} />;
    case 'CSS':
      return <CssIcon {...sharedProps} />;
    case 'MARKDOWN':
      return <MarkdownIcon {...sharedProps} />;
    default:
      return <PlainTextIcon {...sharedProps} />;
  }
}
