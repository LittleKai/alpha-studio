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
      className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      aria-label="Switch language"
    >
      {language === 'en' ? 'VI' : 'EN'}
    </button>
  );
};

export default LanguageSwitcher;
