export type Language = 'en' | 'vi';
export type Dictionary = Record<string, unknown>;

const lookup = (dict: Dictionary | undefined, keys: string[]): unknown => {
  let result: unknown = dict;
  for (const k of keys) {
    if (result === null || typeof result !== 'object') return undefined;
    result = (result as Dictionary)[k];
    if (result === undefined) return undefined;
  }
  return result;
};

/**
 * Resolve a dotted key. Order: current language → fallback dictionary
 * (English, when loaded) → caller fallback → the key itself.
 */
export const translate = (
  dict: Dictionary | undefined,
  fallbackDict: Dictionary | undefined,
  key: string,
  fallback?: string,
): string => {
  const keys = key.split('.');
  const value = lookup(dict, keys);
  if (value === undefined) {
    return (lookup(fallbackDict, keys) as string) || fallback || key;
  }
  return (value as string) || fallback || key;
};

export const parseLanguage = (value: string | null | undefined): Language =>
  value === 'en' || value === 'vi' ? value : 'vi';
