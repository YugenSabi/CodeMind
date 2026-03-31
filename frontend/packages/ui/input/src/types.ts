import { InputHTMLAttributes, ReactNode, CSSProperties } from 'react';
import { ColorValue, FontValue, RadiusToken } from '@ui/theme';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'outline' | 'filled' | 'ghost';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'> & {
  size?: InputSize;
  fullWidth?: boolean;

  font?: FontValue;
  fontSize?: number | string;
  fontWeight?: CSSProperties['fontWeight'];

  textColor?: ColorValue;
  borderColor?: ColorValue;
  focusStyle?: CSSProperties;
  placeholderColor?: ColorValue;
  bg?: ColorValue;

  variant?: InputVariant;
  radius?: RadiusToken;
  error?: boolean;

  startIcon?: ReactNode;
  endIcon?: ReactNode;
  startIconInteractive?: boolean;
  endIconInteractive?: boolean;
};
