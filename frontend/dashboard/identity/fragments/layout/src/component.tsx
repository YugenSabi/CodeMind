import { PropsWithChildren, ReactNode } from 'react';
import { Box } from '@ui/layout';
import { MainBackgroundComponent } from './background/src/component';
import { MainFooter } from './footer/src/component';
import { MainHeader } from './header/src';

export const MainLayoutComponent = ({ children }: PropsWithChildren): ReactNode => {
  return (
    <Box position="relative" minHeight="100vh" flexDirection="column">
      <MainBackgroundComponent />
      <Box position="relative" zIndex={1} minHeight="100vh" flexDirection="column" paddingTop={30} paddingRight={30} paddingLeft={30} paddingBottom={0} gap={20}>
        <MainHeader />
        <Box position="relative" zIndex={1} width="$full" flexGrow={1}>
          {children}
        </Box>
        <MainFooter />
      </Box>
    </Box>
  );
};
