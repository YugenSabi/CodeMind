import { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode, CSSProperties } from 'react';
import { ColorValue, FontValue, RadiusToken, ShadowValue } from '@ui/theme';

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonVariant = 'outline' | 'filled' | 'ghost';
type CssSize = number | string;

type ButtonBaseProps = {
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  width?: CssSize;
  height?: CssSize;
  minWidth?: CssSize;
  minHeight?: CssSize;
  padding?: CssSize;
  justifyContent?: CSSProperties['justifyContent'];
  position?: CSSProperties['position'];
  border?: CSSProperties['border'];
  borderRadius?: CssSize;
  shadow?: ShadowValue;
  transition?: CSSProperties['transition'];

  font?: FontValue;
  fontSize?: number | string;
  fontWeight?: CSSProperties['fontWeight'];
  lineHeight?: CSSProperties['lineHeight'];
  textDecoration?: CSSProperties['textDecoration'];
  textUnderlineOffset?: CSSProperties['textUnderlineOffset'];

  textColor?: ColorValue;
  borderColor?: ColorValue;
  bg?: ColorValue;

  variant?: ButtonVariant;
  radius?: RadiusToken;

  startIcon?: ReactNode;
  endIcon?: ReactNode;
};

export type ButtonProps =
  | (ButtonBaseProps &
      Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'color' | 'type'> & {
        type?: 'button' | 'submit' | 'reset';
      })
  | (ButtonBaseProps &
      Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'color' | 'type'> & {
        type: 'link';
        href: string;
      });
