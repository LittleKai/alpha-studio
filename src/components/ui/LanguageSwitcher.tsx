import React from 'react';
import { useTranslation } from '../../i18n/context';

/** Inline SVG flag icon (Vietnam / UK) so Windows browsers never fall back to "VN"/"GB" text. */
export const LanguageFlag: React.FC<{ lang: 'vi' | 'en' }> = ({ lang }) => {
  if (lang === 'vi') {
    return (
      <svg
        width="18"
        height="12"
        viewBox="0 0 30 20"
        aria-hidden="true"
        className="shrink-0 rounded-[2px] overflow-hidden ring-1 ring-black/10 dark:ring-white/15"
      >
        <rect width="30" height="20" fill="#DA251D" />
        <polygon
          fill="#FFFF00"
          points="15,4 16.35,8.15 20.71,8.15 17.18,10.71 18.53,14.85 15,12.29 11.47,14.85 12.82,10.71 9.29,8.15 13.65,8.15"
        />
      </svg>
    );
  }

  return (
    <svg
      width="18"
      height="12"
      viewBox="0 0 30 20"
      aria-hidden="true"
      className="shrink-0 rounded-[2px] overflow-hidden ring-1 ring-black/10 dark:ring-white/15"
    >
      <rect width="30" height="20" fill="#012169" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M0,0 L30,20 M30,0 L0,20" stroke="#C8102E" strokeWidth="1.8" />
      <path d="M15,0 V20 M0,10 H30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M15,0 V20 M0,10 H30" stroke="#C8102E" strokeWidth="3.6" />
    </svg>
  );
};

const LanguageSwitcher: React.FC = () => {
  const { language, changeLanguage } = useTranslation();
  const nextLang: 'vi' | 'en' = language === 'en' ? 'vi' : 'en';

  const toggleLanguage = () => {
    changeLanguage(nextLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={nextLang === 'vi' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
      className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[var(--bg-card-alpha)] border border-[var(--border-primary)] backdrop-blur-xl transition-all text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
      aria-label="Switch language"
    >
      <LanguageFlag lang={nextLang} />
      <span>{nextLang === 'vi' ? 'VI' : 'EN'}</span>
    </button>
  );
};

export default LanguageSwitcher;
