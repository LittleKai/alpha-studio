import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';
import vi from './vi';
import { translate, parseLanguage, type Dictionary, type Language } from './translate';

// Vietnamese (default + prerendered SEO language, complete key set) ships in the
// main bundle. English is fetched on demand so Vietnamese visitors never pay for it.
const dictionaries: Partial<Record<Language, Dictionary>> = { vi: vi as Dictionary };

export const loadLanguage = async (lang: Language): Promise<void> => {
  if (dictionaries[lang]) return;
  if (lang === 'en') dictionaries.en = (await import('./en')).default as Dictionary;
};

export const getInitialLanguage = (): Language => {
  try {
    return parseLanguage(localStorage.getItem('language'));
  } catch {
    return 'vi';
  }
};

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  // Bumped when a dictionary finishes loading so `t` re-resolves.
  const [loadedVersion, setLoadedVersion] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem('language', language);
      document.documentElement.lang = language;
    } catch (e) {
      console.error("Failed to save language to localStorage", e);
    }
  }, [language]);

  // main.tsx preloads the saved language before the first render; this covers
  // any other path where the dictionary is still missing.
  useEffect(() => {
    if (dictionaries[language]) return;
    let cancelled = false;
    loadLanguage(language).then(() => {
      if (!cancelled) setLoadedVersion(v => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const changeLanguage = useCallback((lang: Language) => {
    if (dictionaries[lang]) {
      setLanguage(lang);
      return;
    }
    loadLanguage(lang)
      .then(() => setLanguage(lang))
      .catch(e => console.error('Failed to load language', e));
  }, []);

  // Stable `t` per language so consumers can safely list it in effect deps.
  const t = useCallback(
    (key: string, fallback?: string): string =>
      translate(dictionaries[language] ?? dictionaries.vi, dictionaries.en, key, fallback),
    [language, loadedVersion],
  );

  const value = useMemo(() => ({ language, changeLanguage, t }), [language, changeLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
