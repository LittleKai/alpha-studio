import React from 'react';
import { useTranslation } from '../../i18n/context';
import type { PartnerCompany } from '../../types';

interface PartnerProfileViewerProps {
  partner: PartnerCompany;
  onBack: () => void;
}

const PartnerProfileViewer: React.FC<PartnerProfileViewerProps> = ({ partner, onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-blue-600 to-[var(--accent-primary)]">
        {partner.coverImage && (
          <img
            src={partner.coverImage}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* Partner Type Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-4 py-2 backdrop-blur-sm font-medium rounded-full ${
            partner.type === 'agency'
              ? 'bg-purple-500/80 text-white'
              : 'bg-blue-500/80 text-white'
          }`}>
            {partner.type === 'agency' ? t('partner.agency') : t('partner.supplier')}
          </span>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Logo & Basic Info */}
        <div className="relative -mt-16 flex flex-col md:flex-row gap-6 items-start md:items-end">
          <div className="w-32 h-32 rounded-2xl border-4 border-[var(--bg-primary)] overflow-hidden bg-[var(--bg-secondary)] shadow-xl flex items-center justify-center p-4">
            {partner.logo ? (
              <img
                src={partner.logo}
                alt={partner.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-4xl font-bold text-[var(--accent-primary)]">
                {partner.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">{partner.name}</h1>
              {partner.isVerified && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-[var(--text-secondary)] flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {partner.location}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {partner.contact.phone && (
            <a
              href={`tel:${partner.contact.phone}`}
              className="flex items-center gap-3 p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <div className="p-2 bg-green-500/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('partner.phone')}</p>
                <p className="text-[var(--text-primary)] font-medium">{partner.contact.phone}</p>
              </div>
            </a>
          )}

          {partner.contact.email && (
            <a
              href={`mailto:${partner.contact.email}`}
              className="flex items-center gap-3 p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('partner.email')}</p>
                <p className="text-[var(--text-primary)] font-medium">{partner.contact.email}</p>
              </div>
            </a>
          )}

          {partner.contact.website && (
            <a
              href={partner.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">{t('partner.website')}</p>
                <p className="text-[var(--text-primary)] font-medium truncate">{partner.contact.website}</p>
              </div>
            </a>
          )}
        </div>

        {/* Description */}
        {partner.description && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
              {t('partner.about')}
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">{partner.description}</p>
          </div>
        )}

        {/* Specialties */}
        {partner.specialties && partner.specialties.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
              {t('partner.specialties')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {partner.specialties.map((specialty, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-xl"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {partner.projects && partner.projects.length > 0 && (
          <div className="mt-8 pb-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              {t('partner.projects')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {partner.projects.map((project, index) => (
                <div
                  key={index}
                  className="aspect-video rounded-xl overflow-hidden bg-[var(--bg-secondary)]"
                >
                  <img
                    src={project}
                    alt={`Project ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="py-8 flex gap-4">
          <button className="flex-1 py-3 bg-gradient-to-r from-[var(--accent-primary)] to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-[var(--accent-primary)] transition-all shadow-lg shadow-orange-500/25">
            {t('partner.contact')}
          </button>
          <button className="px-6 py-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors border border-[var(--border-primary)]">
            {t('partner.save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerProfileViewer;
