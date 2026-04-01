'use client';

import { type ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthSession } from '@lib/auth';
import { createRoom } from '@lib/rooms';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { DashboardActions } from './dashboard-actions/component';
import { HeroContent } from './hero-content/component';

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
      <HeroContent />
      <DashboardActions
        isCreatingRoom={isCreatingRoom}
        errorMessage={errorMessage}
        onCreateRoom={() => {
          void handleCreateRoom();
        }}
      />
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
