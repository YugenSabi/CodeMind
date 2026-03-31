'use client';

import React, { type ReactNode } from 'react';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { useToast } from './toast-context';

const TOAST_ACCENT_BY_TYPE = {
  error: 'var(--ui-color-errorText, #A54E4E)',
  info: 'var(--ui-color-secondaryText, #2B2520CC)',
  success: 'var(--ui-color-secondaryText, #2B2520CC)',
} as const;

export function ToastContainer(): ReactNode {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <Box
      position="fixed"
      flexDirection="column"
      gap={10}
      maxWidth={380}
      zIndex={10}
      style={{ top: 20, right: 30 }}
    >
      {toasts.map((toast) => {
        const accentColor = TOAST_ACCENT_BY_TYPE[toast.type];

        return (
          <Box
            key={toast.id}
            borderRadius={12}
            paddingTop={12}
            paddingBottom={12}
            paddingRight={44}
            paddingLeft={16}
            backgroundColor="$headerBg"
            borderLeft={`3px solid ${accentColor}`}
            shadow="$md"
            style={{
              animation: 'toastSlideIn 0.3s ease-out',
              position: 'relative',
            }}
          >
            <Text color="$secondaryText" font="$rus" size={16} lineHeight="22px" fontWeight={500}>
              {toast.message}
            </Text>
            <Button
              type="button"
              variant="ghost"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              aria-label="Close toast"
              width={24}
              height={24}
              minWidth={24}
              minHeight={24}
              padding={0}
              textColor="$secondaryText"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                opacity: 0.6,
              }}
            >
              <Text color="$secondaryText" size={16} lineHeight="16px">
                ×
              </Text>
            </Button>
          </Box>
        );
      })}
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </Box>
  );
}
