export type ColorTokenName =
  | 'bg'
  | 'primaryText'
  | 'secondaryText'
  | 'cardBg'
  | 'headerBg'
  | 'errorText';

export type ColorToken = `$${ColorTokenName}`;
export type ColorValue = ColorToken | (string & {});

const COLOR_FALLBACKS: Record<ColorTokenName, string> = {
  bg: '#FFFFFF',
  cardBg: '#F7F7F7',
  primaryText: '#6B7280',
  secondaryText: '#111111',
  headerBg: '#FAFAFA',
  errorText: '#D14343',
};

export function cssVarColor(value?: ColorValue): string | undefined {
  if (!value) return value;
  if (value.startsWith('$')) {
    const token = value.slice(1) as ColorTokenName;
    return `var(--ui-color-${token}, ${COLOR_FALLBACKS[token]})`;
  }
  return value;
}
