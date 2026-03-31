import { ReactNode } from 'react';
import { Box } from '@ui/layout';

export const MainBackgroundComponent = (): ReactNode => (
    <Box
        aria-hidden
        backgroundColor="$background"
        position="fixed"
        inset={0}
        zIndex={0}
        pointerEvents="none"
        flexDirection="column"
    />
);
