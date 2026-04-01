import { type ReactNode } from 'react';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type RoomCodeBadgeProps = {
  code: string;
  isCopied: boolean;
  onCopy: () => void;
};

export function RoomCodeBadge({
  code,
  isCopied,
  onCopy,
}: RoomCodeBadgeProps): ReactNode {
  return (
    <Box
      backgroundColor="#181C24"
      border="1px solid"
      borderColor="rgba(255,255,255,0.08)"
      borderRadius={10}
      paddingTop={8}
      paddingRight={10}
      paddingBottom={8}
      paddingLeft={10}
      alignItems="center"
      gap={8}
    >
      <Text color="#7D8793" font="$footer" size={11} lineHeight="14px">
        Код комнаты
      </Text>
      <Text color="#FFFFFF" font="$rus" size={14} lineHeight="18px">
        {code}
      </Text>
      <Button
        type="button"
        variant="ghost"
        width={38}
        height={40}
        minWidth={38}
        minHeight={40}
        padding={0}
        border="1px solid"
        borderColor={isCopied ? '#2E7D32' : 'rgba(255,255,255,0.08)'}
        borderRadius={8}
        textColor="#FFFFFF"
        bg="transparent"
        onClick={onCopy}
        aria-label={isCopied ? 'Код комнаты скопирован' : 'Скопировать код комнаты'}
      >
        <CopyRoomCodeIcon />
      </Button>
      {isCopied ? (
        <Text color="#B7F3B3" font="$footer" size={11} lineHeight="14px">
          Скопировано
        </Text>
      ) : null}
    </Box>
  );
}

function CopyRoomCodeIcon(): ReactNode {
  return (
    <svg width="20" height="20" viewBox="0 0 38 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 29.2188V1.71875L1.875 0H26.25L28.125 1.71875V8.59375H35.625L37.5 10.3125V37.8125L35.625 39.5312H11.25L9.375 37.8125V30.9375H1.875L0 29.2188ZM9.375 27.5V10.3125L11.25 8.59375H24.375V3.4375H3.75V27.5H9.375ZM33.75 12.0312H13.125V36.0938H33.75V12.0312Z"
        fill="white"
      />
    </svg>
  );
}
