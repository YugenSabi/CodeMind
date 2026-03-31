import { CSSProperties } from 'react';
import { cssVarColor, cssVarFont, cssVarRadius } from '@ui/theme';
import { InputSize, InputVariant } from './types';

export function sizeStyle(size: InputSize): CSSProperties {
  switch (size) {
    case 'sm':
      return { height: 36, fontSize: 13, padding: '0 10px' };
    case 'lg':
      return { height: 56, fontSize: 16, padding: '0 16px' };
    case 'md':
    default:
      return { height: 44, fontSize: 14, padding: '0 14px' };
  }
}

export function variantStyle(variant: InputVariant, error?: boolean): CSSProperties {
  if (error) {
    return {
      border: `1px solid ${cssVarColor('danger')}`,
      backgroundColor: cssVarColor('background'),
    };
  }

  switch (variant) {
    case 'filled':
      return {
        backgroundColor: cssVarColor('cardBg'),
        border: 'none',
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        border: 'none',
      };
    case 'outline':
    default:
      return {
        backgroundColor: cssVarColor('background'),
        border: `1px solid ${cssVarColor('border')}`,
      };
  }
}

export function wrapperStyle(radius: string, fullWidth?: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius,
    width: fullWidth ? '100%' : undefined,
  };
}

export function inputBaseStyle(): CSSProperties {
  return {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: cssVarFont('ui'),
    color: cssVarColor('primaryText'),
  };
}
