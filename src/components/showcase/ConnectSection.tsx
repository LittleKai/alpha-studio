import React from 'react';
import { Link } from 'react-router-dom';
import Reveal, { RevealItem } from '../motion/Reveal';
import { useTranslation } from '../../i18n/context';

interface Props {
  onNavigate: (path: string) => void;
}

const ConnectSection: React.FC<Props> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const items = [
    t('landing.features.item1'), t('landing.features.item2'),
    t('landing.features.item3'), t('landing.features.item4'),
  ];

  return (
    <>
      <section className="sc-section sc-connect" id="connect">
        <div className="sc-container sc-connect-grid">
          <Reveal staggerChildren={0.1} className="sc-connect-copy">
            <RevealItem tag="h2" className="sc-sec-title sc-connect-title">
              {t('landing.features.title')} <span className="sc-accent-text">{t('landing.features.highlight')}</span>
            </RevealItem>
            <RevealItem tag="p" className="sc-sec-sub">{t('landing.features.description')}</RevealItem>
            <RevealItem tag="ul" className="sc-check-list">
              {items.map((item, i) => (
                <li key={i}>
                  <span className="sc-check">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </span>
                  {item}
                </li>
              ))}
            </RevealItem>
            <RevealItem>
              <button type="button" className="sc-cta-primary" onClick={() => onNavigate('/workflow')}>
                {t('landing.features.cta')}
              </button>
            </RevealItem>
          </Reveal>

          <Reveal y={30} className="sc-connect-visual">
            <div className="sc-orbit">
              <div className="sc-orbit-core"><span>AI</span></div>
              <div className="sc-orbit-ring sc-ring-1"><span className="sc-orbit-chip">🎨</span></div>
              <div className="sc-orbit-ring sc-ring-2"><span className="sc-orbit-chip">📂</span></div>
              <div className="sc-orbit-ring sc-ring-3"><span className="sc-orbit-chip">⚙️</span></div>
              <div className="sc-orbit-glow" />
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="sc-footer">
        <div className="sc-container sc-footer-inner">
          <Link to="/" className="sc-brand">
            <img src="/alpha-logo-animated.svg" alt="" className="sc-brand-logo" />
            <span className="sc-brand-name">ALPHA STUDIO ACADEMY</span>
          </Link>
          <p className="sc-footer-copy">© 2026 {t('landing.footer.copyright')}</p>
        </div>
      </footer>
    </>
  );
};

export default ConnectSection;
