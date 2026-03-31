import { ReactNode } from 'react';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

export const MainFooter = (): ReactNode => {
  return (
    <Box width="$full" justifyContent="center">
      <Box
        as="footer"
        width="$full"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        backgroundColor="$mainCards"
        border="1px solid"
        borderColor="$border"
        style={{
          borderTopLeftRadius: 30,
          borderTopRightRadius: 30,
          borderBottomRightRadius: 0,
          borderBottomLeftRadius: 0,
        }}
        paddingTop={15}
        paddingBottom={15}
      >
        <Text color="#FFFFFF" font="$footer" size={12}>
          © CodeMind, 2026
        </Text>
        <Text color="$secondaryText" font="$footer" size={10}>
          powered by Olympians
        </Text>
      </Box>
    </Box>
  );
};
