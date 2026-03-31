import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

import { cssVarColor, cssVarFont, type ColorValue, type FontValue } from '@ui/theme';

type TextTag = 'span' | 'div' | 'p' | 'label';
type CssSize = number | string;

function toCssSize(v: CssSize | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return `${v}px`;
  const trimmed = v.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return v;
}

export type TextProps = Omit<HTMLAttributes<HTMLElement>, 'color'> & {
  as?: TextTag;
  color?: ColorValue;
  font?: FontValue;
  size?: CssSize;
  textAlign?: CSSProperties['textAlign'];
  lineHeight?: CSSProperties['lineHeight'];
  letterSpacing?: CSSProperties['letterSpacing'];
  fontWeight?: CSSProperties['fontWeight'];
  textTransform?: CSSProperties['textTransform'];
  textDecoration?: CSSProperties['textDecoration'];
  textUnderlineOffset?: CSSProperties['textUnderlineOffset'];
  opacity?: CSSProperties['opacity'];
  whiteSpace?: CSSProperties['whiteSpace'];
  wordBreak?: CSSProperties['wordBreak'];
  overflowWrap?: CSSProperties['overflowWrap'];
  children?: ReactNode;
};

export function Text({
  as = 'span',
  color,
  font,
  size,
  textAlign,
  lineHeight,
  letterSpacing,
  fontWeight,
  textTransform,
  textDecoration,
  textUnderlineOffset,
  opacity,
  whiteSpace,
  wordBreak,
  overflowWrap,
  style,
  ...props
}: TextProps) {
  const nextStyle: CSSProperties = {
    color: cssVarColor(color),
    fontFamily: cssVarFont(font),
    fontSize: toCssSize(size),
    textAlign,
    lineHeight,
    letterSpacing,
    fontWeight,
    textTransform,
    textDecoration,
    textUnderlineOffset,
    opacity,
    whiteSpace,
    wordBreak,
    overflowWrap,
    ...style,
  };

  return createElement(as, { ...props, style: nextStyle });
}
