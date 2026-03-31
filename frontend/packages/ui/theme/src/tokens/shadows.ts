export type ShadowTokenName = 'sm' | 'md' | 'lg';
export type ShadowToken = `$${ShadowTokenName}`;
export type ShadowValue = ShadowToken | (string & {});

const SHADOW_FALLBACKS: Record<ShadowTokenName, string> = {
  sm: '0 2px 8px rgba(0, 0, 0, 0.08)',
  md: '0 4px 10px rgba(0, 0, 0, 0.2)',
  lg: '0 14px 40px rgba(0, 0, 0, 0.18)',
};

export function cssVarShadow(value?: ShadowValue): string | undefined {
  if (!value) return value;
  if (value.startsWith('$')) {
    const token = value.slice(1) as ShadowTokenName;
    return `var(--ui-shadow-${token}, ${SHADOW_FALLBACKS[token]})`;
  }
  return value;
}
