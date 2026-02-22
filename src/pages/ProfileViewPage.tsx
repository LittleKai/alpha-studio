import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
};

const formatDate = (dateStr: string, locale = 'vi-VN'): string =>
    new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

const getRoleLabel = (role: string): string => {
    const map: Record<string, string> = {
        student: 'Học viên', partner: 'Đối tác', mod: 'Mod', admin: 'Admin',
    };
    return map[role] ?? role;
};

const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('video')) return '🎬';
    if (type.includes('zip') || type.includes('compressed')) return '📦';
    return '📎';
};

// ─── icons ───────────────────────────────────────────────────────────────────

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.37 18a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 3.18 2 2 0 0 1 4.11 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

// ─── section header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-[var(--accent-primary)] rounded-full flex-shrink-0" />
        {title}
    </h2>
);

// ─── main page ────────────────────────────────────────────────────────────────

const ProfileViewPage: React.FC = () => {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();

    // Always fetch fresh user data so cover image / profile fields are up to date
    useEffect(() => {
        refreshUser();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (!user) return null;

    const displayBirthDate = user.showBirthDate && user.birthDate
        ? formatDate(user.birthDate)
        : null;

    const hasSocials = user.socials?.facebook
        || user.socials?.linkedin
        || user.socials?.github
        || (user.socials?.custom && user.socials.custom.length > 0);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex flex-col animate-fade-in">

            {/* ── cover ───────────────────────────────────────────────── */}
            <div className="relative h-56 md:h-72 overflow-hidden flex-shrink-0">
                {user.backgroundImage ? (
                    <img
                        src={user.backgroundImage}
                        alt="cover"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900" />
                )}
                <div className="absolute inset-0 bg-black/30" />

                {/* back button */}
                <button
                    onClick={() => navigate('/profile')}
                    className="absolute top-4 left-4 md:top-6 md:left-8 z-20 flex items-center gap-2 py-2 px-4 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
                >
                    <ArrowLeftIcon />
                    <span className="text-sm font-semibold">{t('common.back')}</span>
                </button>

                {/* edit button */}
                <button
                    onClick={() => navigate('/profile')}
                    className="absolute top-4 right-4 md:top-6 md:right-8 z-20 flex items-center gap-2 py-2 px-4 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
                >
                    <PencilIcon />
                    <span className="text-sm font-semibold">{t('profile.editProfile')}</span>
                </button>
            </div>

            {/* ── body ────────────────────────────────────────────────── */}
            <div className="container mx-auto px-4 md:px-8 -mt-16 md:-mt-20 relative z-10 pb-20">
                <div className="flex flex-col md:flex-row gap-6 items-start">

                    {/* ── left column ─────────────────────────────────── */}
                    <div className="w-full md:w-72 flex-shrink-0 flex flex-col gap-4">

                        {/* avatar card */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-lg flex flex-col items-center text-center">
                            <div className="w-32 h-32 rounded-full border-4 border-[var(--bg-primary)] shadow-xl overflow-hidden mb-4 bg-[var(--bg-secondary)]">
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[var(--accent-primary)]">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">{user.name}</h1>
                            <p className="text-[var(--accent-primary)] font-medium text-sm uppercase tracking-wider mb-1">
                                {getRoleLabel(user.role)}
                            </p>
                            <p className="text-[var(--text-secondary)] text-xs mb-4">{user.email}</p>

                            {/* meta: location / birthdate / phone */}
                            <div className="w-full space-y-2 text-sm text-[var(--text-secondary)] border-t border-[var(--border-primary)] pt-4">
                                {user.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPinIcon />
                                        <span>{user.location}</span>
                                    </div>
                                )}
                                {displayBirthDate && (
                                    <div className="flex items-center gap-2">
                                        <CalendarIcon />
                                        <span>{displayBirthDate}</span>
                                    </div>
                                )}
                                {user.phone && (
                                    <div className="flex items-center gap-2">
                                        <PhoneIcon />
                                        <span>{user.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary,var(--text-secondary))]">
                                    <CalendarIcon />
                                    <span>{t('profile.memberSince')} {formatDate(user.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* socials card */}
                        {hasSocials && (
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 shadow-lg">
                                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                                    {t('profile.socialLinks')}
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {user.socials?.facebook && (
                                        <a href={user.socials.facebook} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-3 py-2 px-3 bg-[var(--bg-secondary)] rounded-xl hover:border-[var(--accent-primary)] border border-transparent transition-colors text-sm text-[var(--text-primary)]">
                                            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex-shrink-0">Fb</span>
                                            <span className="truncate">Facebook</span>
                                        </a>
                                    )}
                                    {user.socials?.linkedin && (
                                        <a href={user.socials.linkedin} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-3 py-2 px-3 bg-[var(--bg-secondary)] rounded-xl hover:border-[var(--accent-primary)] border border-transparent transition-colors text-sm text-[var(--text-primary)]">
                                            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs flex-shrink-0">in</span>
                                            <span className="truncate">LinkedIn</span>
                                        </a>
                                    )}
                                    {user.socials?.github && (
                                        <a href={user.socials.github} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-3 py-2 px-3 bg-[var(--bg-secondary)] rounded-xl hover:border-[var(--accent-primary)] border border-transparent transition-colors text-sm text-[var(--text-primary)]">
                                            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-600/30 text-gray-300 font-bold text-xs flex-shrink-0">GH</span>
                                            <span className="truncate">GitHub</span>
                                        </a>
                                    )}
                                    {user.socials?.custom?.map((link, idx) => (
                                        <a key={idx} href={link.url} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-3 py-2 px-3 bg-[var(--bg-secondary)] rounded-xl hover:border-[var(--accent-primary)] border border-transparent transition-colors text-sm text-[var(--text-primary)]">
                                            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold text-xs flex-shrink-0">
                                                {link.label.slice(0, 2).toUpperCase()}
                                            </span>
                                            <span className="truncate">{link.label}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── right column ─────────────────────────────────── */}
                    <div className="flex-1 space-y-8 mt-2 md:mt-20 min-w-0">

                        {/* bio */}
                        <section>
                            <SectionHeader title={t('profile.bio')} />
                            {user.bio ? (
                                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                                    {user.bio}
                                </p>
                            ) : (
                                <p className="text-[var(--text-secondary)] opacity-50 italic text-sm">
                                    {t('profile.noBio')}
                                </p>
                            )}
                        </section>

                        {/* skills */}
                        {(user.skills && user.skills.length > 0) && (
                            <section>
                                <SectionHeader title={t('profile.skills')} />
                                <div className="flex flex-wrap gap-2">
                                    {user.skills.map((skill, idx) => (
                                        <span key={idx}
                                            className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-secondary)] hover:border-[var(--accent-primary)] transition-colors">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* featured works */}
                        {(user.featuredWorks && user.featuredWorks.length > 0) && (
                            <section>
                                <SectionHeader title={t('profile.featuredWorks')} />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {user.featuredWorks.map((work, idx) => (
                                        <div key={idx}
                                            className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden hover:border-[var(--accent-primary)] transition-colors group">
                                            {work.image && (
                                                <div className="relative aspect-video overflow-hidden">
                                                    <img
                                                        src={work.image}
                                                        alt={work.title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                </div>
                                            )}
                                            <div className="p-4">
                                                {work.title && (
                                                    <h3 className="font-semibold text-[var(--text-primary)] mb-1">{work.title}</h3>
                                                )}
                                                {work.description && (
                                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{work.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* attachments */}
                        {(user.attachments && user.attachments.length > 0) && (
                            <section>
                                <SectionHeader title={t('profile.attachments')} />
                                <div className="space-y-2">
                                    {user.attachments.map((file, idx) => (
                                        <a key={idx} href={file.url} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-4 p-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent-primary)] transition-colors group">
                                            <span className="text-2xl flex-shrink-0">{getFileIcon(file.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-[var(--text-primary)] truncate text-sm">{file.filename}</p>
                                                <p className="text-xs text-[var(--text-secondary)]">{formatBytes(file.size)}</p>
                                            </div>
                                            <span className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors flex-shrink-0">
                                                <DownloadIcon />
                                                {t('profile.download')}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileViewPage;
