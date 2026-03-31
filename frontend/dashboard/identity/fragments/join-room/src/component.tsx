'use client';

import { type KeyboardEvent, type ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { joinRoom } from '@lib/rooms';
import { Input } from '@ui/input';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export function JoinRoomComponent(): ReactNode {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode || isJoining) {
      return;
    }

    try {
      setIsJoining(true);
      setErrorMessage(null);

      const room = await joinRoom({ code: normalizedCode });
      router.push(`/room/${room.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось присоединиться к комнате. Попробуйте еще раз.',
      );
      setIsJoining(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleJoin();
    }
  };

  return (
    <Box width="$full" minHeight="$full" alignItems="center" justifyContent="center">
      <Box
        width="$full"
        maxWidth={780}
        minHeight={120}
        flexDirection="column"
        alignItems="center"
        gap={10}
        backgroundColor="#272D35"
        border="1px solid"
        borderColor="$border"
        borderRadius={30}
        padding={15}
      >
        <Text color="#FFFFFF" font="$rus" size={20} textAlign="center">
          Введите код комнаты:
        </Text>

        <Input
          value={code}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase());
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
          onKeyDown={handleKeyDown}
          fullWidth
          variant="outline"
          font="$rus"
          height={83}
          fontSize={24}
          textColor="#FFFFFF"
          borderColor="$border"
          bg="$mainCards"
          endIcon={
            <JoinArrowButton
              disabled={isJoining || code.trim().length === 0}
              onClick={() => {
                void handleJoin();
              }}
            />
          }
          endIconInteractive
          style={{
            borderRadius: '20px',
          }}
          placeholder="Код комнаты"
          placeholderColor="$secondaryText"
          autoComplete="off"
          spellCheck={false}
        />

        {errorMessage ? (
          <Box
            width="$full"
            backgroundColor="rgba(209, 67, 67, 0.12)"
            border="1px solid"
            borderColor="#D14343"
            borderRadius={18}
            paddingTop={12}
            paddingRight={14}
            paddingBottom={12}
            paddingLeft={14}
          >
            <Text color="#FFB4B4" font="$footer" size={14} lineHeight="20px" textAlign="center">
              {errorMessage}
            </Text>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

type JoinArrowButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

function JoinArrowButton({
  disabled = false,
  onClick,
}: JoinArrowButtonProps): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 31,
        height: 31,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      aria-label="Войти в комнату"
    >
      <JoinArrowIcon />
    </button>
  );
}

type JoinArrowIconProps = {
  strokeColor?: string;
  maskId?: string;
};

export function JoinArrowIcon({
  strokeColor = '#3B8640',
  maskId = 'join-room-mask',
}: JoinArrowIconProps): ReactNode {
  return (
    <Box
      width={31}
      height={31}
      alignItems="center"
      justifyContent="center"
      style={{
        pointerEvents: 'none',
      }}
    >
      <svg width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask
          id={maskId}
          style={{ maskType: 'luminance' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="31"
          height="31"
        >
          <path d="M31 0H0V31H31V0Z" fill="white" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path
            d="M11.625 5.1665H24.5417V23.2498C24.5417 24.6766 23.3851 25.8331 21.9583 25.8331H11.625"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15.4999 19.3748L19.3749 15.4998M19.3749 15.4998L15.4999 11.6248M19.3749 15.4998H6.45825"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </Box>
  );
}
