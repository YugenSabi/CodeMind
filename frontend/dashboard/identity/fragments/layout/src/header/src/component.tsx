'use client';

import { type ReactNode, useState } from 'react';
import { createLogoutFlow, getDisplayName, useAuthSession } from '@lib/auth';
import { JoinArrowIcon } from '@fragments/join-room';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export const MainHeader = (): ReactNode => {
  const { user } = useAuthSession();

  return (
    <Box width="$full" justifyContent="center">
      <Box
        as="header"
        width="$full"
        alignItems="center"
        justifyContent="space-between"
        backgroundColor="$mainCards"
        border="1px solid"
        borderColor="$border"
        borderRadius={30}
        padding={20}
      >
        <Box alignItems="center" color="#FFFFFF" aria-label="CodeMind">
          <Text color="#FFFFFF" font="$eng" size={24}>
            CodeMind
          </Text>
        </Box>

        {user ? <UserMenu user={user} /> : <GuestActions />}
      </Box>
    </Box>
  );
};

function GuestActions(): ReactNode {
  return (
    <Box alignItems="center" gap={10}>
      <Button
        type="link"
        href="/auth/registration"
        padding={25}
        border="1px solid"
        borderColor="$border"
        borderRadius={15}
        textColor="#FFFFFF"
      >
        <Text as="span" color="#FFFFFF" font="$footer" size={16}>
          регистрация
        </Text>
      </Button>

      <Button
        type="link"
        href="/auth/login"
        variant="filled"
        height={42}
        minWidth={82}
        padding={25}
        borderRadius={15}
        bg="#43953D"
        textColor="#FFFFFF"
      >
        <Text as="span" color="#FFFFFF" font="$footer" size={16} lineHeight="20px">
          вход
        </Text>
      </Button>
    </Box>
  );
}

function UserMenu({
  user,
}: {
  user: ReturnType<typeof useAuthSession>['user'] & { id: string };
}): ReactNode {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const name = getDisplayName(user);
  const initials = name.trim().charAt(0).toUpperCase() || 'U';

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    try {
      setIsLoggingOut(true);
      const logoutFlow = await createLogoutFlow();
      window.location.assign(logoutFlow.logout_url);
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <Box alignItems="center" gap={10}>
      <Button
        type="link"
        href="/profile"
        variant="ghost"
        border="1px solid"
        borderColor="$border"
        borderRadius={15}
        padding={0}
        bg="transparent"
        textColor="#FFFFFF"
        style={{ minHeight: 42 }}
      >
        <Box alignItems="center" gap={10} paddingTop={11} paddingRight={18} paddingBottom={11} paddingLeft={18}>
          <Box
            width={24}
            height={24}
            borderRadius={8}
            backgroundColor="#202734"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Text color="#FFFFFF" font="$footer" size={12} lineHeight="14px">
                {initials}
              </Text>
            )}
          </Box>
          <Text color="#FFFFFF" font="$footer" size={16} lineHeight="20px">
            {name}
          </Text>
        </Box>
      </Button>

      <Button
        type="button"
        variant="ghost"
        width={42}
        height={42}
        minWidth={42}
        minHeight={42}
        padding={0}
        border="1px solid"
        borderColor="$border"
        borderRadius={15}
        disabled={isLoggingOut}
        onClick={handleLogout}
        aria-label="Выйти из профиля"
      >
        <JoinArrowIcon strokeColor="#D14343" maskId="logout-arrow-mask" />
      </Button>
    </Box>
  );
}
