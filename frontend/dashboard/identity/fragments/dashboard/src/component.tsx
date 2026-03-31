'use client';

import { type ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@lib/auth';
import { createRoom } from '@lib/rooms';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export function DashboardComponent(): ReactNode {
  const router = useRouter();
  const { requiresVerification, verificationMessage } = useAuthSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  if (requiresVerification) {
    return (
      <VerificationRequiredCard
        message={verificationMessage}
        primaryHref="/auth/confirm"
      />
    );
  }

  const handleCreateRoom = async () => {
    if (isCreatingRoom) {
      return;
    }

    try {
      setIsCreatingRoom(true);
      setErrorMessage(null);

      const room = await createRoom({
        name: 'CodeMind Room',
      });

      router.push(`/room/${room.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось создать комнату. Попробуйте еще раз.',
      );
      setIsCreatingRoom(false);
    }
  };

  return (
    <Box
      width="$full"
      backgroundColor="$cardBg"
      borderRadius={30}
      border="1px solid"
      borderColor="$border"
      alignItems="center"
      justifyContent="center"
      paddingLeft={300}
      paddingRight={300}
      flexDirection="column"
      gap={10}
    >
      <Box flexDirection="column" gap={10}>
        <Text size={36} font="$rus" textAlign="center">
          Платформа для совместной
          <br />
          работы над кодом с AI-ревьюером
        </Text>

        <Text
          size={20}
          color="$secondaryText"
          textAlign="center"
          font="$footer"
        >
          Пишите код вместе, отслеживайте изменения и получайте AI-подсказки
          <br />
          прямо в редакторе.
        </Text>
      </Box>

      <Box flexDirection="row" gap={10} padding={10}>
        <Button
          type="button"
          variant="filled"
          height={80}
          minWidth={375}
          padding={10}
          borderRadius={45}
          bg="#43953D"
          textColor="#FFFFFF"
          disabled={isCreatingRoom}
          onClick={handleCreateRoom}
        >
          <Text size={24}>
            {isCreatingRoom ? 'Создание...' : 'Создать комнату'}
          </Text>
        </Button>

        <Button
          type="link"
          href="/join"
          padding={25}
          height={80}
          minWidth={375}
          border="1px solid"
          borderColor="$border"
          borderRadius={45}
          textColor="#FFFFFF"
        >
          <Text size={24}>Присоединиться</Text>
        </Button>
      </Box>

      {errorMessage ? (
        <Box
          width="$full"
          maxWidth={520}
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
  );
}

function VerificationRequiredCard({
  message,
  primaryHref,
}: {
  message: string | null;
  primaryHref: string;
}) {
  return (
    <Box
      width="$full"
      backgroundColor="$cardBg"
      borderRadius={30}
      border="1px solid"
      borderColor="$border"
      alignItems="center"
      justifyContent="center"
      paddingLeft={120}
      paddingRight={120}
      paddingTop={48}
      paddingBottom={48}
      flexDirection="column"
      gap={16}
    >
      <Text size={32} font="$rus" textAlign="center">
        Подтвердите аккаунт
      </Text>

      <Text
        size={18}
        color="$secondaryText"
        textAlign="center"
        font="$footer"
      >
        {message ?? 'Подтвердите почту, чтобы создавать комнаты и работать с кодом.'}
      </Text>

      <Button
        type="link"
        href={primaryHref}
        variant="filled"
        height={60}
        minWidth={280}
        padding={10}
        borderRadius={32}
        bg="#43953D"
        textColor="#FFFFFF"
      >
        <Text size={20}>Подтвердить аккаунт</Text>
      </Button>
    </Box>
  );
}
