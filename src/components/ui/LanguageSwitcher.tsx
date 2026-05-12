import React from 'react';
import { useTranslation } from '../../i18n/context';

const LanguageSwitcher: React.FC = () => {
  const { language, changeLanguage } = useTranslation();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'vi' : 'en';
    changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-2.5 py-2 rounded-xl bg-[var(--bg-card-alpha)] border border-[var(--border-primary)] backdrop-blur-xl transition-all text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
      aria-label="Switch language"
    >
      {language === 'en' ? 'VI' : 'EN'}
    </button>
  );
};

export default LanguageSwitcher;
