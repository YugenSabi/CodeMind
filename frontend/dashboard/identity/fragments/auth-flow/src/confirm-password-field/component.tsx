'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@ui/input';
import { Box } from '@ui/layout';
import { Text } from '@ui/text';
import { PasswordVisibilityButton } from '../password-visibility-button/component';

type ConfirmPasswordFieldProps = {
  value: string;
  error: string | null;
  isPasswordVisible: boolean;
  onTogglePasswordVisibility: () => void;
  onChange: (value: string) => void;
};

export function ConfirmPasswordField({
  value,
  error,
  isPasswordVisible,
  onTogglePasswordVisibility,
  onChange,
}: ConfirmPasswordFieldProps): ReactNode {
  const t = useTranslations('authFlow.fields');

  return (
    <Box flexDirection="column" gap={8}>
      <Text color="#FFFFFF" font="$footer" size={14} lineHeight="18px">
        {t('confirmPassword')}
      </Text>
      <Input
        name="confirm_password"
        type={isPasswordVisible ? 'text' : 'password'}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        required
        autoComplete="new-password"
        fullWidth
        size="lg"
        variant="outline"
        radius="lg"
        font="$footer"
        fontSize={16}
        textColor="#FFFFFF"
        borderColor={error ? '#D14343' : '$border'}
        bg="$mainCards"
        placeholder={t('confirmPassword')}
        placeholderColor="$secondaryText"
        endIcon={
          <PasswordVisibilityButton
            isVisible={isPasswordVisible}
            onClick={onTogglePasswordVisibility}
          />
        }
        endIconInteractive
        style={{ paddingLeft: 18, paddingRight: 18 }}
      />
      {error ? (
        <Text color="#FFB4B4" font="$footer" size={13} lineHeight="18px">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}
