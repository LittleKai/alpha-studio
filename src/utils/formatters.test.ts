import { describe, expect, it } from 'vitest';
import { formatTimeSaving, getPlatformLabel } from './formatters';

describe('formatTimeSaving', () => {
  it('formats hours and minutes in both supported languages', () => {
    expect(formatTimeSaving('2 hours', 'vi')).toBe('2 giờ');
    expect(formatTimeSaving('1 hr', 'en')).toBe('1 hour');
    expect(formatTimeSaving('30 mins', 'en')).toBe('30 mins');
  });

  it('keeps unknown values unchanged', () => {
    expect(formatTimeSaving('quick', 'vi')).toBe('quick');
    expect(formatTimeSaving('', 'en')).toBe('');
  });
});

describe('getPlatformLabel', () => {
  it('maps known platform IDs and preserves unknown IDs', () => {
    expect(getPlatformLabel('stable-diffusion')).toBe('Stable Diffusion');
    expect(getPlatformLabel('custom')).toBe('custom');
  });
});
