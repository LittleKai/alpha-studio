import React from 'react';
import { useTranslation } from '../../i18n/context';
import type { Partner } from '../../services/partnerService';

interface PartnerProfileViewerProps {
  partner: Partner;
  onBack: () => void;
}

const PartnerProfileViewer: React.FC<PartnerProfileViewerProps> = ({ partner, onBack }) => {
  const { t, language } = useTranslation();

  const localizedDesc = partner.description?.[language] || partner.description?.vi || '';

  const partnerTypeLabel = t(`workflow.partners.types.${partner.partnerType}`, partner.partnerType);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex flex-col animate-fade-in">
        {/* Banner */}
        <div className="relative h-64 md:h-96 w-full overflow-hidden">
            <img
                src={partner.backgroundImage || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&h=900&fit=crop"}
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
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-[var(--bg-card)] border-4 border-[var(--bg-primary)] flex items-center justify-center text-6xl shadow-2xl overflow-hidden">
                        {partner.logo?.startsWith('http') ? (
                            <img src={partner.logo} alt={partner.companyName} className="w-full h-full object-cover" />
                        ) : (
                            <span>{partner.logo || '🏢'}</span>
                        )}
                    </div>
                    <div className="flex-1 mb-2">
                        <h1 className="text-4xl font-black text-white mb-2">{partner.companyName}</h1>
                        <div className="flex flex-wrap gap-3 text-sm">
                            <span className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full text-[var(--text-secondary)] uppercase font-bold tracking-wider">
                                {partnerTypeLabel}
                            </span>
                            {partner.address && (
                                <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                    {partner.address}
                                </span>
                            )}
                            {partner.featured && (
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
                        {/* About */}
                        <section>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">{t('workflow.partners.details.about')}</h3>
                            <p className="text-[var(--text-secondary)] leading-relaxed text-lg whitespace-pre-line">
                                {localizedDesc}
                            </p>
                        </section>

                        {/* Key Projects */}
                        <section>
                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border-primary)] pb-2">{t('workflow.partners.details.projects')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {partner.keyProjects && partner.keyProjects.length > 0 ? partner.keyProjects.map((project, idx) => (
                                    <div key={idx} className="rounded-xl overflow-hidden border border-[var(--border-primary)]">
                                        {project.image && (
                                            <div className="aspect-video">
                                                <img src={project.image} alt={`Project ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        )}
                                        {(project.description?.vi || project.description?.en) && (
                                            <div className="p-3 bg-[var(--bg-card)]">
                                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">
                                                    {project.description?.[language] || project.description?.vi || project.description?.en}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="col-span-2 py-8 text-center text-[var(--text-tertiary)] italic bg-[var(--bg-card)] rounded-xl border border-dashed border-[var(--border-primary)]">
                                        {t('workflow.partners.details.noProjects')}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Services */}
                        {partner.services && partner.services.length > 0 && (
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">{t('workflow.partners.details.services')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {partner.services.map((service, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg text-sm border border-[var(--border-primary)]">
                                            {service}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact Info */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">{t('workflow.partners.contact')}</h3>
                            <ul className="space-y-4 text-sm text-[var(--text-secondary)]">
                                {partner.email && (
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--accent-primary)]">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                                        </div>
                                        <a href={`mailto:${partner.email}`} className="hover:text-white transition-colors truncate">{partner.email}</a>
                                    </li>
                                )}
                                {partner.phone && (
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--accent-primary)]">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                        </div>
                                        <span>{partner.phone}</span>
                                    </li>
                                )}
                                {partner.website && (
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--accent-primary)]">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>
                                        </div>
                                        <a href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors truncate">{partner.website}</a>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Social Links */}
                        {partner.socialLinks && (partner.socialLinks.facebook || partner.socialLinks.linkedin || partner.socialLinks.twitter) && (
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">{t('workflow.partners.details.socialLinks')}</h3>
                                <div className="flex gap-3">
                                    {partner.socialLinks.facebook && (
                                        <a href={partner.socialLinks.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                        </a>
                                    )}
                                    {partner.socialLinks.linkedin && (
                                        <a href={partner.socialLinks.linkedin} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                        </a>
                                    )}
                                    {partner.socialLinks.twitter && (
                                        <a href={partner.socialLinks.twitter} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PartnerProfileViewer;
