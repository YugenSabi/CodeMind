export type ColorTokenName =
  | 'background'
  | 'mainCards'
  | 'mainText'
  | 'primaryText'
  | 'secondaryText'
  | 'border'
  | 'cardBg'
  | 'headerBg'
  | 'errorText'
  | 'danger';

export type ColorToken = `$${ColorTokenName}`;
export type ColorValue = ColorToken | (string & {});

const COLOR_FALLBACKS: Record<ColorTokenName, string> = {
  background: '#151B23',
  mainCards: '#212830',
  mainText: '#212830',
  primaryText: '#FFFFFF',
  secondaryText: '#9198A1',
  border: '#383F47',
  cardBg: '#212830',
  headerBg: '#212830',
  errorText: '#D14343',
  danger: '#D14343',
};

export function cssVarColor(value?: ColorValue): string | undefined {
  if (!value) return value;
  const token = value.startsWith('$')
    ? (value.slice(1) as ColorTokenName)
    : (value as ColorTokenName);
  if (token in COLOR_FALLBACKS) {
    return `var(--ui-color-${token}, ${COLOR_FALLBACKS[token]})`;
  }
  return value;
}
