import { type ReactNode } from 'react';
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
      aria-label={isVisible ? 'Скрыть пароль' : 'Показать пароль'}
    >
      {isVisible ? <EyeCloseIcon /> : <EyeOpenIcon />}
    </button>
  );
}
