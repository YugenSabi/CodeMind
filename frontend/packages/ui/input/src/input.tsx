'use client';

import {
  forwardRef,
  CSSProperties,
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
  useState,
} from 'react';

import { cssVarColor, cssVarFont, cssVarRadius } from '@ui/theme';

import { InputProps } from './types';
import { sizeStyle, variantStyle, wrapperStyle, inputBaseStyle } from './styles';

const ICON_SIZE: Record<'sm' | 'md' | 'lg', number> = {
  sm: 16,
  md: 20,
  lg: 32,
};

const ICON_SLOT: Record<'sm' | 'md' | 'lg', number> = {
  sm: 32,
  md: 40,
  lg: 56,
};

type IconProps = {
  width?: number | string;
  height?: number | string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'filled',
      radius = 'md',
      fullWidth,
      disabled,
      error,

      font,
      fontSize,
      fontWeight,

      textColor = '$primaryText',
      borderColor,
      focusStyle,
      placeholderColor,

      bg,

      startIcon,
      endIcon,
      startIconInteractive = false,
      endIconInteractive = false,

      style,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const iconSlotSize = ICON_SLOT[size];
    const iconSize = ICON_SIZE[size];
    const wrapperStyles: CSSProperties = {
      ...wrapperStyle(cssVarRadius(radius) ?? '8px', fullWidth),
      ...sizeStyle(size),
      ...variantStyle(variant, error),
      borderColor: cssVarColor(borderColor),
      backgroundColor: cssVarColor(bg),
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? 'not-allowed' : undefined,

      display: 'flex',
      alignItems: 'center',
      gap: 0,
      ...(isFocused ? focusStyle : null),
    };

    if (borderColor && (!wrapperStyles.border || wrapperStyles.border === 'none')) {
      wrapperStyles.border = `1px solid ${cssVarColor(borderColor)}`;
    }

    const inputStyles: CSSProperties = {
      ...inputBaseStyle(),
      fontFamily: font ? cssVarFont(font) : undefined,
      fontSize,
      fontWeight,
      color: cssVarColor(textColor),

      backgroundColor: 'transparent',
      outline: 'none',
      border: 'none',
      width: '100%',

      ...style,
    };

    const createIconSlotStyle = (interactive: boolean): CSSProperties => ({
      width: iconSlotSize,
      minWidth: iconSlotSize,
      height: '100%',

      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',

      pointerEvents: interactive ? 'auto' : 'none',
      cursor: interactive ? 'pointer' : undefined,
      flexShrink: 0,
    });

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

    const handleFocus: React.FocusEventHandler<HTMLInputElement> = (event) => {
      if (!disabled) {
        setIsFocused(true);
      }
      props.onFocus?.(event);
    };

    const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
      setIsFocused(false);
      props.onBlur?.(event);
    };

    return (
      <div style={wrapperStyles}>
        {startIcon && <div style={createIconSlotStyle(startIconInteractive)}>{renderIcon(startIcon)}</div>}

        <input
          ref={ref}
          disabled={disabled}
          aria-invalid={error}
          style={inputStyles}
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {endIcon && <div style={createIconSlotStyle(endIconInteractive)}>{renderIcon(endIcon)}</div>}

        <style jsx>{`
          input:-webkit-autofill,
          input:-webkit-autofill:hover,
          input:-webkit-autofill:focus {
            -webkit-box-shadow: 0 0 0 1000px ${cssVarColor(bg) ?? 'transparent'} inset;
            -webkit-text-fill-color: ${cssVarColor(textColor)};
            transition: background-color 5000s ease-in-out 0s;
          }
          input::placeholder {
            color: ${cssVarColor(placeholderColor) ?? cssVarColor('$primaryText')};
            opacity: 0.6;
          }
        `}</style>
      </div>
    );
  },
);

Input.displayName = 'Input';
