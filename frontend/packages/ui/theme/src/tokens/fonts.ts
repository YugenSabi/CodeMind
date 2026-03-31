export type FontTokenName = 'rus' | 'eng' | 'ui' | 'footer';
export type FontToken = `$${FontTokenName}`;
export type FontValue = FontToken | (string & {});

export function cssVarFont(value?: FontValue): string | undefined {
  if (!value) return value;
  const token = value.startsWith('$')
    ? (value.slice(1) as FontTokenName)
    : (value as FontTokenName);
  if (token === 'ui') {
    return 'var(--ui-font-ui, var(--ui-font-rus))';
  }
  if (token === 'footer') {
    return 'var(--ui-font-footer, var(--ui-font-rus))';
  }
  if (token === 'rus' || token === 'eng') {
    return `var(--ui-font-${token})`;
  }
  return value;
}
