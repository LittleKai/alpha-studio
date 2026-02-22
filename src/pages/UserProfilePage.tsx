import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { getUserProfile, type UserPublicProfile } from '../services/workflowService';

// ─── helpers ─────────────────────────────────────────────────────────────────

const getRoleLabel = (role: string): string => {
    const map: Record<string, string> = {
        student: 'Học viên', partner: 'Đối tác', mod: 'Mod', admin: 'Admin',
    };
    return map[role] ?? role;
};

// ─── icons ───────────────────────────────────────────────────────────────────

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
    </svg>
);

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.37 18a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 3.18 2 2 0 0 1 4.11 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
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

const UserProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserPublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getUserProfile(id)
            .then(res => {
                if (res.success) setProfile(res.data);
                else setError('Profile not found');
            })
            .catch(() => setError('Failed to load profile'))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Profile Not Found</h2>
                    <p className="text-[var(--text-secondary)]">{error}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:scale-105 transition-all"
                    >
                        {t('common.back')}
                    </button>
                </div>
            </div>
        );
    }

    const hasSocials = profile.socials?.facebook
        || profile.socials?.linkedin
        || profile.socials?.github
        || (profile.socials?.custom && profile.socials.custom.length > 0);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex flex-col animate-fade-in">

            {/* ── cover ───────────────────────────────────────────────── */}
            <div className="relative h-56 md:h-72 overflow-hidden flex-shrink-0">
                {profile.backgroundImage ? (
                    <img src={profile.backgroundImage} alt="cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900" />
                )}
                <div className="absolute inset-0 bg-black/30" />
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 md:top-6 md:left-8 z-20 flex items-center gap-2 py-2 px-4 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
                >
                    <ArrowLeftIcon />
                    <span className="text-sm font-semibold">{t('common.back')}</span>
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
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[var(--accent-primary)]">
                                        {profile.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">{profile.name}</h1>
                            <p className="text-[var(--accent-primary)] font-medium text-sm uppercase tracking-wider mb-4">
                                {getRoleLabel(profile.role)}
                            </p>

                            {/* contact info */}
                            <div className="w-full space-y-2 text-sm text-[var(--text-secondary)] border-t border-[var(--border-primary)] pt-4">
                                {profile.email && (
                                    <div className="flex items-center gap-2">
                                        <MailIcon />
                                        <span className="truncate">{profile.email}</span>
                                    </div>
                                )}
                                {profile.location && (
                                    <div className="flex items-center gap-2">
                                        <MapPinIcon />
                                        <span>{profile.location}</span>
                                    </div>
                                )}
                                {profile.phone && (
                                    <div className="flex items-center gap-2">
                                        <PhoneIcon />
                                        <span>{profile.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* socials card */}
                        {hasSocials && (
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 shadow-lg">
                                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                                    {t('profile.socialLinks')}
                                </h3>
                                <div className="flex flex-col gap-2">
                                    {profile.socials?.facebook && (
                                        <a href={profile.socials.facebook} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-3 py-2 px-3 bg-[var(--bg-secondary)] rounded-xl hover:border-[var(--accent-primary)] border border-transparent transition-colors text-sm text-[var(--text-primary)]">
                                            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 font-bold text-xs flex-shrink-0">Fb</span>
                                            <span className="truncate">Facebook</span>
                                        </a>
                                    )}
                                    {profile.socials?.linkedin && (
                                        <a href={profile.socials.linkedin} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-3 py-2 px-3 bg-[var(--bg-secondary)] rounded-xl hover:border-[var(--accent-primary)] border border-transparent transition-colors text-sm text-[var(--text-primary)]">
                                            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 font-bold text-xs flex-shrink-0">in</span>
                                            <span className="truncate">LinkedIn</span>
                                        </a>
                                    )}
                                    {profile.socials?.github && (
                                        <a href={profile.socials.github} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-3 py-2 px-3 bg-[var(--bg-secondary)] rounded-xl hover:border-[var(--accent-primary)] border border-transparent transition-colors text-sm text-[var(--text-primary)]">
                                            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-600/30 text-gray-300 font-bold text-xs flex-shrink-0">GH</span>
                                            <span className="truncate">GitHub</span>
                                        </a>
                                    )}
                                    {profile.socials?.custom?.map((link, idx) => (
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
                            {profile.bio ? (
                                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                                    {profile.bio}
                                </p>
                            ) : (
                                <p className="text-[var(--text-secondary)] opacity-50 italic text-sm">
                                    {t('profile.noBio')}
                                </p>
                            )}
                        </section>

                        {/* skills */}
                        {profile.skills && profile.skills.length > 0 && (
                            <section>
                                <SectionHeader title={t('profile.skills')} />
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill, idx) => (
                                        <span key={idx}
                                            className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-secondary)] hover:border-[var(--accent-primary)] transition-colors">
                                            {skill}
                                        </span>
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

export default UserProfilePage;
