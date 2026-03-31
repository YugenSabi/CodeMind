'use client';

import {
  forwardRef,
  CSSProperties,
  ReactElement,
  ReactNode,
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  cloneElement,
  isValidElement,
  type Ref,
} from 'react';

import { cssVarColor, cssVarFont, cssVarRadius, cssVarShadow } from '@ui/theme';

import { ButtonProps } from './types';
import { sizeStyle, variantStyle, buttonBaseStyle } from './styles';
import Link from 'next/link';

const ICON_SIZE: Record<'sm' | 'md' | 'lg', number> = {
  sm: 16,
  md: 20,
  lg: 24,
};

const ICON_SLOT: Record<'sm' | 'md' | 'lg', number> = {
  sm: 28,
  md: 32,
  lg: 40,
};

type IconProps = {
  width?: number | string;
  height?: number | string;
};

function toCssSize(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  const trimmed = value.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return value;
}

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      size = 'md',
      variant = 'filled',
      radius = 'md',
      fullWidth,
      disabled,
      width,
      height,
      minWidth,
      minHeight,
      padding,
      justifyContent,
      position,
      border,
      borderRadius,
      shadow,
      transition,

      font,
      fontSize,
      fontWeight,
      lineHeight,
      textDecoration,
      textUnderlineOffset,

      textColor,
      borderColor,
      bg,

      startIcon,
      endIcon,

      style,
      type,
      children,
      ...props
    },
    ref,
  ) => {
    const iconSlotSize = ICON_SLOT[size];
    const iconSize = ICON_SIZE[size];

    const baseStyles = buttonBaseStyle();
    const sizeStyles = sizeStyle(size);
    const variantStyles = variantStyle(variant);
    const resolvedBorderRadius =
      borderRadius === undefined ? cssVarRadius(radius) : toCssSize(borderRadius);
    const resolvedWidth = toCssSize(width) ?? (fullWidth ? '100%' : undefined);
    const resolvedHeight = toCssSize(height);
    const resolvedMinWidth = toCssSize(minWidth);
    const resolvedMinHeight = toCssSize(minHeight);
    const resolvedPadding = toCssSize(padding);

    const buttonStyles: CSSProperties = {
      ...baseStyles,
      ...sizeStyles,
      ...variantStyles,

      borderRadius: resolvedBorderRadius,
      width: resolvedWidth,
      height: resolvedHeight ?? sizeStyles.height,
      minWidth: resolvedMinWidth,
      minHeight: resolvedMinHeight,
      padding: resolvedPadding ?? sizeStyles.padding,
      justifyContent: justifyContent ?? baseStyles.justifyContent,
      position,
      border: border ?? variantStyles.border ?? baseStyles.border,
      boxShadow: cssVarShadow(shadow),
      transition,

      fontFamily: cssVarFont(font) ?? baseStyles.fontFamily,
      fontSize: fontSize ?? sizeStyles.fontSize,
      fontWeight,
      lineHeight: lineHeight ?? baseStyles.lineHeight,
      textDecoration: textDecoration ?? baseStyles.textDecoration,
      textUnderlineOffset,

      color: cssVarColor(textColor) ?? variantStyles.color,
      backgroundColor: cssVarColor(bg) ?? variantStyles.backgroundColor,
      borderColor: cssVarColor(borderColor) ?? variantStyles.borderColor,

      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : baseStyles.cursor,

      ...style,
    };

    const iconSlotStyle: CSSProperties = {
      width: iconSlotSize,
      minWidth: iconSlotSize,
      height: '100%',

      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      pointerEvents: 'none',
      flexShrink: 0,
    };

    const renderIcon = (icon: ReactNode) => {
      if (!icon || !isValidElement<IconProps>(icon)) {
        return null;
      }

      return cloneElement<IconProps>(icon, {
        width: iconSize,
        height: iconSize,
        ...icon.props,
      });
    };

    const content = (
      <>
        {startIcon && <span style={iconSlotStyle}>{renderIcon(startIcon as ReactElement)}</span>}

        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </span>

        {endIcon && <span style={iconSlotStyle}>{renderIcon(endIcon as ReactElement)}</span>}
      </>
    );

    if (type === 'link') {
      const { href, target, rel, onClick, ...rest } = props as Omit<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        'color' | 'type'
      > & { href: string };

      const linkRel = target === '_blank' && !rel ? 'noopener noreferrer' : rel;

      return (
        <Link
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={linkRel}
          onClick={onClick}
          style={{
            ...buttonStyles,
            pointerEvents: disabled ? 'none' : buttonStyles.pointerEvents,
          }}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : undefined}
          {...rest}
        >
          {content}
        </Link>
      );
    }

    const buttonProps = props as Omit<
      ButtonHTMLAttributes<HTMLButtonElement>,
      'size' | 'color' | 'type'
    >;

    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type={type ?? 'button'}
        disabled={disabled}
        style={buttonStyles}
        {...buttonProps}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = 'Button';
