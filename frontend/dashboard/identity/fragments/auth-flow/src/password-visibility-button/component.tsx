'use client';

import { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { EyeCloseIcon } from '../eye-close-icon/component';
import { EyeOpenIcon } from '../eye-open-icon/component';

type PasswordVisibilityButtonProps = {
  isVisible: boolean;
  onClick: () => void;
};

export function PasswordVisibilityButton({
  isVisible,
  onClick,
}: PasswordVisibilityButtonProps): ReactNode {
  const t = useTranslations('authFlow.fields');

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
      }}
      aria-label={isVisible ? t('hidePassword') : t('showPassword')}
    >
      {isVisible ? <EyeCloseIcon /> : <EyeOpenIcon />}
    </button>
  );
}
