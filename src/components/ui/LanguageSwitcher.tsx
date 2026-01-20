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
      className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
      aria-label="Switch language"
    >
      {language === 'en' ? 'Tiếng Việt' : 'English'}
    </button>
  );
};

export default LanguageSwitcher;
