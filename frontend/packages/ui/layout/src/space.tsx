import type { CSSProperties, ReactNode } from 'react';

export type SpaceProps = {
  x?: number | string;
  y?: number | string;
};

function toCssSize(v: number | string): string {
  if (typeof v === 'number') return `${v}px`;
  const trimmed = v.trim();
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return v;
}

export function Space({ x, y }: SpaceProps): ReactNode {
  const style: CSSProperties = {};

  if (x !== undefined) style.width = toCssSize(x);
  if (y !== undefined) style.height = toCssSize(y);

  return <div aria-hidden style={style} />;
}
