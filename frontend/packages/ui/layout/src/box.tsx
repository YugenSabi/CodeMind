import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

import { cssVarColor, cssVarShadow, type ColorValue, type ShadowValue } from '@ui/theme';

type BoxTag = 'div' | 'section' | 'main' | 'header' | 'footer' | 'form';

type SizeToken = '$full';
type CssSize = number | string | SizeToken;

function toCssSize(v: CssSize | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (v === '$full') return '100%';
  if (typeof v === 'number') return `${v}px`;
  const trimmed = v.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return v;
}

export type BoxProps = Omit<HTMLAttributes<HTMLElement>, 'color'> & {
  as?: BoxTag;

  display?: CSSProperties['display'];
  position?: CSSProperties['position'];
  inset?: CSSProperties['inset'];
  zIndex?: CSSProperties['zIndex'];
  opacity?: CSSProperties['opacity'];
  cursor?: CSSProperties['cursor'];
  pointerEvents?: CSSProperties['pointerEvents'];
  overflow?: CSSProperties['overflow'];

  width?: CssSize;
  height?: CssSize;
  minWidth?: CssSize;
  minHeight?: CssSize;
  maxWidth?: CssSize;
  maxHeight?: CssSize;

  backgroundColor?: ColorValue;
  color?: ColorValue;
  borderColor?: ColorValue;

  flexDirection?: CSSProperties['flexDirection'];
  alignItems?: CSSProperties['alignItems'];
  justifyContent?: CSSProperties['justifyContent'];
  flexWrap?: CSSProperties['flexWrap'];
  gap?: CssSize;
  flexGrow?: CSSProperties['flexGrow'];
  flexShrink?: CSSProperties['flexShrink'];
  flexBasis?: CssSize;
  gridTemplateColumns?: CSSProperties['gridTemplateColumns'];
  gridColumn?: CSSProperties['gridColumn'];
  gridRow?: CSSProperties['gridRow'];

  padding?: CssSize;
  paddingTop?: CssSize;
  paddingRight?: CssSize;
  paddingBottom?: CssSize;
  paddingLeft?: CssSize;

  margin?: CssSize;
  marginTop?: CssSize;
  marginRight?: CssSize;
  marginBottom?: CssSize;
  marginLeft?: CssSize;

  borderRadius?: CssSize;
  border?: CSSProperties['border'];
  borderTop?: CSSProperties['borderTop'];
  borderRight?: CSSProperties['borderRight'];
  borderBottom?: CSSProperties['borderBottom'];
  borderLeft?: CSSProperties['borderLeft'];
  shadow?: ShadowValue;

  children?: ReactNode;
};

export function Box({
  as = 'div',
  display = 'flex',
  position,
  inset,
  zIndex,
  opacity,
  cursor,
  pointerEvents,
  overflow,
  width,
  height,
  minWidth,
  minHeight,
  maxWidth,
  maxHeight,
  backgroundColor,
  color,
  borderColor,
  flexDirection,
  alignItems,
  justifyContent,
  flexWrap,
  gap,
  flexGrow,
  flexShrink,
  flexBasis,
  gridTemplateColumns,
  gridColumn,
  gridRow,
  padding,
  paddingTop,
  paddingRight,
  paddingBottom,
  paddingLeft,
  margin,
  marginTop,
  marginRight,
  marginBottom,
  marginLeft,
  borderRadius,
  border,
  borderTop,
  borderRight,
  borderBottom,
  borderLeft,
  shadow,
  style,
  ...props
}: BoxProps) {
  const resolvedPadding = toCssSize(padding);
  const resolvedPaddingTop = paddingTop === undefined ? resolvedPadding : toCssSize(paddingTop);
  const resolvedPaddingRight =
    paddingRight === undefined ? resolvedPadding : toCssSize(paddingRight);
  const resolvedPaddingBottom =
    paddingBottom === undefined ? resolvedPadding : toCssSize(paddingBottom);
  const resolvedPaddingLeft = paddingLeft === undefined ? resolvedPadding : toCssSize(paddingLeft);

  const nextStyle: CSSProperties = {
    boxSizing: 'border-box',
    display,
    position,
    inset,
    zIndex,
    opacity,
    cursor,
    pointerEvents,
    overflow,

    width: toCssSize(width),
    height: toCssSize(height),
    minWidth: toCssSize(minWidth),
    minHeight: toCssSize(minHeight),
    maxWidth: toCssSize(maxWidth),
    maxHeight: toCssSize(maxHeight),

    flexDirection,
    alignItems,
    justifyContent,
    flexWrap,
    gap: toCssSize(gap),
    flexGrow,
    flexShrink,
    flexBasis: toCssSize(flexBasis),
    gridTemplateColumns,
    gridColumn,
    gridRow,

    ...style,

    padding: resolvedPadding,
    paddingTop: resolvedPaddingTop,
    paddingRight: resolvedPaddingRight,
    paddingBottom: resolvedPaddingBottom,
    paddingLeft: resolvedPaddingLeft,

    margin: toCssSize(margin),
    marginTop: toCssSize(marginTop),
    marginRight: toCssSize(marginRight),
    marginBottom: toCssSize(marginBottom),
    marginLeft: toCssSize(marginLeft),

    borderRadius: toCssSize(borderRadius),
    boxShadow: cssVarShadow(shadow),

    backgroundColor: cssVarColor(backgroundColor),
    color: cssVarColor(color),
  };

  if (border !== undefined) {
    nextStyle.border = border;
    if (borderTop === undefined) nextStyle.borderTop = border;
    if (borderRight === undefined) nextStyle.borderRight = border;
    if (borderBottom === undefined) nextStyle.borderBottom = border;
    if (borderLeft === undefined) nextStyle.borderLeft = border;
  }
  if (borderTop !== undefined) nextStyle.borderTop = borderTop;
  if (borderRight !== undefined) nextStyle.borderRight = borderRight;
  if (borderBottom !== undefined) nextStyle.borderBottom = borderBottom;
  if (borderLeft !== undefined) nextStyle.borderLeft = borderLeft;
  if (borderColor !== undefined) nextStyle.borderColor = cssVarColor(borderColor);

  return createElement(as, { ...props, style: nextStyle });
}
