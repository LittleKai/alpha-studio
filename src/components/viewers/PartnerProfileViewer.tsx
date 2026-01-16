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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex flex-col animate-fade-in">
        {/* Banner */}
        <div className="relative h-64 md:h-96 w-full overflow-hidden">
            <img
                src={partner.coverImage || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&h=900&fit=crop"}
                alt="Cover"
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent"></div>

            <div className="absolute top-4 left-4 z-20">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 py-2 px-4 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-bold">{t('app.back')}</span>
                </button>
            </div>
        </div>

        <div className="container mx-auto px-6 relative z-10 -mt-32 pb-16">
            <div className="flex flex-col gap-8">
                {/* Header Info */}
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-[var(--bg-card)] border-4 border-[var(--bg-primary)] flex items-center justify-center text-6xl shadow-2xl">
                        {partner.logo}
                    </div>
                    <div className="flex-1 mb-2">
                        <h1 className="text-4xl font-black text-white mb-2">{partner.name}</h1>
                        <div className="flex flex-wrap gap-3 text-sm">
                            <span className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full text-[var(--text-secondary)] uppercase font-bold tracking-wider">
                                {partner.type === 'agency' ? t('workflow.partners.tabs.agency') : t('workflow.partners.tabs.supplier')}
                            </span>
                            <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                {partner.location}
                            </span>
                            {partner.isVerified && (
                                <span className="flex items-center gap-1 text-blue-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    {t('workflow.partners.verified')}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="mb-2">
                        <button className="py-3 px-8 bg-[var(--accent-primary)] text-black font-bold rounded-xl shadow-lg hover:opacity-90 transition-all">
                            {t('workflow.partners.details.connect')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
                    {/* Left Info Column */}
                    <div className="lg:col-span-2 space-y-10">
                        <section>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">{t('workflow.partners.details.about')}</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed text-lg">
                                {partner.description}
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">{t('workflow.partners.details.projects')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {partner.projects ? partner.projects.map((img, idx) => (
                                    <div key={idx} className="rounded-xl overflow-hidden border border-[var(--border-primary)] aspect-video">
                                        <img src={img} alt="Project" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )) : (
                                    <div className="col-span-2 py-8 text-center text-[var(--text-tertiary)] italic bg-[var(--bg-card)] rounded-xl border border-dashed border-[var(--border-primary)]">
                                        Chưa có dự án nào được cập nhật.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">{t('workflow.partners.details.services')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {partner.specialties.map((spec, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg text-sm border border-[var(--border-primary)]">
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">{t('workflow.partners.contact')}</h3>
                            <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--accent-primary)]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                                    </div>
                                    <a href={`mailto:${partner.contact.email}`} className="hover:text-white transition-colors truncate">{partner.contact.email}</a>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--accent-primary)]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                    </div>
                                    <span>{partner.contact.phone}</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--accent-primary)]">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>
                                    </div>
                                    <a href={`https://${partner.contact.website}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors truncate">{partner.contact.website}</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PartnerProfileViewer;
