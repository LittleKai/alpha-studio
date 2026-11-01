import { describe, expect, it } from 'vitest';
import { parseLanguage, translate } from './translate';

const vi = { common: { home: 'Trang chủ', empty: '' }, only: { vi: 'chỉ vi' } };
const en = { common: { home: 'Home', extra: 'Extra' } };

describe('translate', () => {
  it('returns the value from the current language', () => {
    expect(translate(vi, en, 'common.home')).toBe('Trang chủ');
  });

  it('falls back to the fallback dictionary when the key is missing', () => {
    expect(translate(vi, en, 'common.extra')).toBe('Extra');
  });

  it('uses the caller fallback, then the key, when nothing matches', () => {
    expect(translate(vi, en, 'missing.key', 'Default')).toBe('Default');
    expect(translate(vi, undefined, 'missing.key')).toBe('missing.key');
  });

  it('works before the fallback dictionary is loaded', () => {
    expect(translate(vi, undefined, 'only.vi')).toBe('chỉ vi');
  });

  it('does not walk into string values', () => {
    expect(translate(vi, en, 'common.home.deeper')).toBe('common.home.deeper');
  });

  it('treats empty strings like the previous implementation (caller fallback / key)', () => {
    expect(translate(vi, en, 'common.empty', 'Fallback')).toBe('Fallback');
  });
});

describe('parseLanguage', () => {
  it('accepts supported languages and defaults to vi', () => {
    expect(parseLanguage('en')).toBe('en');
    expect(parseLanguage('vi')).toBe('vi');
    expect(parseLanguage('fr')).toBe('vi');
    expect(parseLanguage(null)).toBe('vi');
  });
});
