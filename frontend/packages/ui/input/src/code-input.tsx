'use client';

import {
  useRef,
  useCallback,
  type CSSProperties,
  type KeyboardEvent,
  type ClipboardEvent,
  type ReactNode,
} from 'react';
import { Box } from '@ui/layout';
import {
  cssVarColor,
  cssVarFont,
  cssVarRadius,
  type ColorValue,
  type FontValue,
  type RadiusToken,
} from '@ui/theme';

type CssSize = number | string;

function toCssSize(value: CssSize | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  const trimmed = value.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return value;
}

interface CodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  gap?: CssSize;
  cellWidth?: CssSize;
  cellHeight?: CssSize;
  cellRadius?: RadiusToken | CssSize;
  cellBorderWidth?: CssSize;
  font?: FontValue;
  fontSize?: CssSize;
  fontWeight?: CSSProperties['fontWeight'];
  bg?: ColorValue;
  textColor?: ColorValue;
  emptyBorderColor?: ColorValue;
  filledBorderColor?: ColorValue;
  ariaLabel?: string;
}

export function CodeInput({
  length = 6,
  value,
  onChange,
  disabled,
  gap = 12,
  cellWidth = 52,
  cellHeight = 60,
  cellRadius = 12,
  cellBorderWidth = 2,
  font = '$rus',
  fontSize = 24,
  fontWeight = 600,
  bg = '$cardBg',
  textColor = '$secondaryText',
  emptyBorderColor = '$primaryText',
  filledBorderColor = '$secondaryText',
  ariaLabel = 'Verification code',
}: CodeInputProps): ReactNode {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const focusInput = (index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (!/^\d$/.test(char)) return;

      const newDigits = [...digits];
      newDigits[index] = char;
      onChange(newDigits.join(''));

      if (index < length - 1) focusInput(index + 1);
    },
    [digits, length, onChange],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newDigits = [...digits];
        if (newDigits[index]) {
          newDigits[index] = '';
          onChange(newDigits.join(''));
        } else if (index > 0) {
          newDigits[index - 1] = '';
          onChange(newDigits.join(''));
          focusInput(index - 1);
        }
      } else if (e.key === 'ArrowLeft') {
        focusInput(index - 1);
      } else if (e.key === 'ArrowRight') {
        focusInput(index + 1);
      }
    },
    [digits, length, onChange],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (pasted) {
        onChange(pasted);
        focusInput(Math.min(pasted.length, length - 1));
      }
    },
    [length, onChange],
  );

  return (
    <Box flexDirection="row" gap={gap} justifyContent="center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          aria-label={`${ariaLabel} ${i + 1}`}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          style={{
            width: toCssSize(cellWidth),
            height: toCssSize(cellHeight),
            borderRadius:
              typeof cellRadius === 'string' && !cellRadius.startsWith('$') && !/^\d/.test(cellRadius)
                ? cssVarRadius(cellRadius as RadiusToken)
                : toCssSize(cellRadius as CssSize) ?? cssVarRadius('md'),
            border: `${toCssSize(cellBorderWidth) ?? '2px'} solid ${
              cssVarColor(digit ? filledBorderColor : emptyBorderColor)
            }`,
            backgroundColor: cssVarColor(bg),
            color: cssVarColor(textColor),
            fontFamily: cssVarFont(font),
            fontSize: toCssSize(fontSize),
            fontWeight,
            textAlign: 'center',
            outline: 'none',
            opacity: disabled ? 0.6 : 1,
            transition: 'border-color 0.2s',
          }}
        />
      ))}
    </Box>
  );
}
