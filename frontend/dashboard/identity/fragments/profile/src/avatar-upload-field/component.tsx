'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@ui/button';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';

type AvatarUploadFieldProps = {
  avatarUrl: string;
  isLoading: boolean;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
};

export function AvatarUploadField({
  avatarUrl,
  isLoading,
  onFileChange,
  onRemove,
}: AvatarUploadFieldProps): ReactNode {
  const t = useTranslations('profile');

  return (
    <Box flexDirection="column" gap={8}>
      <Text color="#D7DEE7" font="$footer" size={12} lineHeight="16px">
        {t('avatar.label')}
      </Text>
      <Box
        flexDirection="column"
        gap={12}
        padding={14}
        border="1px solid"
        borderColor="rgba(255,255,255,0.08)"
        borderRadius={16}
        backgroundColor="#0F141C"
      >
        <Text color="#7D8793" font="$footer" size={12} lineHeight="18px">
          {t('avatar.description')}
        </Text>
        <Box alignItems="center" gap={10}>
          <label style={{ display: 'inline-flex' }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(event) => {
                onFileChange(event.target.files?.[0] ?? null);
                event.currentTarget.value = '';
              }}
            />
            <Box
              as="div"
              alignItems="center"
              justifyContent="center"
              height={42}
              paddingLeft={16}
              paddingRight={16}
              borderRadius={12}
              backgroundColor="#202734"
              border="1px solid"
              borderColor="rgba(255,255,255,0.08)"
              style={{ cursor: 'pointer' }}
            >
              <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
                {isLoading ? t('avatar.uploading') : t('avatar.upload')}
              </Text>
            </Box>
          </label>
          <Button
            type="button"
            variant="ghost"
            height={42}
            padding={16}
            border="1px solid"
            borderColor="rgba(209,67,67,0.35)"
            borderRadius={12}
            textColor="#D89A9A"
            bg="transparent"
            onClick={onRemove}
          >
            <Text color="#D89A9A" font="$footer" size={14} lineHeight="18px">
              {t('avatar.remove')}
            </Text>
          </Button>
        </Box>
        {avatarUrl ? (
          <Text color="#7BC77A" font="$footer" size={12} lineHeight="16px">
            {t('avatar.ready')}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}
