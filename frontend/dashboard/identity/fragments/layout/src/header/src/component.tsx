import { ReactNode } from 'react';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { BrandTitle } from '@ui/icons';
import { Text } from '@ui/text';

export const MainHeader = (): ReactNode => {
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

        <Box alignItems="center" gap={10}>
          <Button
            type="link"
            href="/register"
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
            href="/login"
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
      </Box>
    </Box>
  );
};
