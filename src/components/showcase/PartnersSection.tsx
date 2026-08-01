import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import type { Partner } from '../../services/partnerService';

interface Props {
  partners: Partner[];
  loading: boolean;
  onNavigate: (path: string) => void;
}

const PartnersSection: React.FC<Props> = ({ partners, loading, onNavigate }) => {
  const { t, language } = useTranslation();
  // Duplicate the list so the marquee can loop seamlessly.
  const loop = partners.length > 0 ? [...partners, ...partners] : [];

  return (
    <section className="sc-section sc-section-alt sc-partners">
      <div className="sc-container">
        <div className="sc-partners-head">
          <h2 className="sc-sec-title">{t('landing.partners.title')}</h2>
          <p className="sc-sec-sub">{t('landing.partners.subtitle')}</p>
          <button type="button" className="sc-sec-link" onClick={() => onNavigate('/workflow')}>
            {t('landing.partners.join')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="sc-loader"><span className="sc-spin" /></div>
      ) : partners.length === 0 ? (
        <p className="sc-empty">{language === 'vi' ? 'Chưa có đối tác nào' : 'No partners yet'}</p>
      ) : (
        <div className="sc-marquee" aria-label={t('landing.partners.title')}>
          <div className="sc-marquee-track">
            {loop.map((p, i) => (
              <Link key={`${p.slug}-${i}`} to={`/partners/${p.slug}`} className="sc-logo" aria-hidden={i >= partners.length}>
                {p.logo && p.logo.startsWith('http') ? (
                  <img src={p.logo} alt={p.companyName} loading="lazy" />
                ) : (
                  <span className="sc-logo-emoji">{p.logo || '🤝'}</span>
                )}
                <span className="sc-logo-name">{p.companyName}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default PartnersSection;
