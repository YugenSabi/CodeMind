import { readString } from './string';

describe('readString', () => {
  it('returns trimmed string when value is valid', () => {
    expect(readString('  olympians  ')).toBe('olympians');
  });

  it('returns null for empty or non-string values', () => {
    expect(readString('   ')).toBeNull();
    expect(readString(null)).toBeNull();
    expect(readString(12)).toBeNull();
  });
});
