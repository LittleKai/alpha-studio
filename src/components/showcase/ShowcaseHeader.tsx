import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';

interface Props {
  onLaunch: () => void;
}

const ShowcaseHeader: React.FC<Props> = ({ onLaunch }) => {
  const { t, language, changeLanguage } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#courses', label: t('landing.nav.academy') },
    { href: '#tools', label: t('landing.nav.utilities') },
    { href: '#students', label: t('landing.nav.showcase') },
    { href: '#connect', label: t('landing.nav.connect') },
  ];

  return (
    <header className={`sc-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="sc-header-inner">
        <Link to="/" className="sc-brand" aria-label="Alpha Studio">
          <img src="/alpha-logo-animated.svg" alt="" className="sc-brand-logo" />
          <span className="sc-brand-name">ALPHA<span className="sc-brand-accent">STUDIO</span></span>
        </Link>

        <nav className="sc-nav" aria-label="Primary">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="sc-nav-link">{l.label}</a>
          ))}
        </nav>

        <div className="sc-header-actions">
          <button
            type="button"
            className="sc-lang"
            onClick={() => changeLanguage(language === 'vi' ? 'en' : 'vi')}
            aria-label="Language"
          >
            {language === 'vi' ? 'VI' : 'EN'}
          </button>
          <button type="button" className="sc-cta-primary sc-cta-sm" onClick={onLaunch}>
            {t('landing.nav.enterStudio')}
          </button>
        </div>
      </div>
    </header>
  );
};

export default ShowcaseHeader;
