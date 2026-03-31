'use client';

import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export function AuthErrorComponent(): ReactNode {
  const searchParams = useSearchParams();
  const errorId = searchParams.get('id');

  return (
    <Box width="$full" minHeight="$full" alignItems="center" justifyContent="center">
      <Box
        width="$full"
        maxWidth={540}
        flexDirection="column"
        gap={12}
        backgroundColor="$mainCards"
        border="1px solid"
        borderColor="$border"
        borderRadius={30}
        paddingTop={28}
        paddingRight={24}
        paddingBottom={24}
        paddingLeft={24}
      >
        <Text color="#FFFFFF" font="$rus" size={28} lineHeight="34px">
          Ошибка авторизации
        </Text>
        <Text color="$secondaryText" font="$footer" size={16} lineHeight="22px">
          Не удалось завершить авторизацию. Проверьте данные и повторите попытку.
        </Text>
        {errorId ? (
          <Text color="$secondaryText" font="$footer" size={14} lineHeight="20px">
            Код ошибки: {errorId}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}
