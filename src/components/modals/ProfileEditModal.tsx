import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import { cdnFromUrl } from '../../services/cloudinaryAssets';

interface ProfileEditModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Icon components
const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const MapPinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

const CalendarIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const MailIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);

const PhoneIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);

const StarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
);

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
    const { language } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Extended user type for featuredWorks and attachments
    const extendedUser = user as typeof user & {
        featuredWorks?: { image: string; title: string; description: string }[];
        attachments?: { url: string; filename: string; type: string; size: number }[];
    };

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const formatBirthDate = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleEditProfile = () => {
        onClose();
        navigate('/profile');
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'partner': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'mod': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            default: return 'bg-green-500/20 text-green-400 border-green-500/30';
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, { vi: string; en: string }> = {
            admin: { vi: 'Quản trị viên', en: 'Administrator' },
            partner: { vi: 'Đối tác', en: 'Partner' },
            mod: { vi: 'Điều phối viên', en: 'Moderator' },
            student: { vi: 'Học viên', en: 'Student' }
        };
        return labels[role]?.[language] || role;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-2xl bg-[var(--bg-card)] rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-primary)] max-h-[90vh] overflow-y-auto">
                {/* Header Background */}
                <div className="h-32 relative">
                    {user?.backgroundImage ? (
                        <img
                            src={cdnFromUrl(user.backgroundImage, 'w_640')}
                            alt="Background"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-purple-500/30 via-[var(--accent-primary)]/30 to-blue-500/30">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
                        </div>
                    )}

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2.5 bg-[var(--bg-secondary)]/80 hover:bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full transition-colors text-[var(--text-primary)] shadow-md"
                        aria-label="Close"
                    >
                        <XIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="relative z-10 px-6 pb-6 -mt-16">
                    {/* Header Row: Avatar & Name on Left, Compact Contact Boxes on Right */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-5">
                        {/* Left Side: Avatar, Name, Role & Plan Badges */}
                        <div className="flex-1 min-w-0 space-y-3">
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-[var(--bg-card)] shadow-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 relative z-20">
                                {user?.avatar ? (
                                    <img
                                        src={cdnFromUrl(user.avatar, 'w_256')}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-5xl font-black text-white">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-2 tracking-tight">{user?.name}</h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user?.role || 'student')}`}>
                                        <BriefcaseIcon />
                                        {getRoleLabel(user?.role || 'student')}
                                    </span>
                                    {user?.subscription?.plan && user.subscription.plan !== 'free' && (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold">
                                            <StarIcon />
                                            {user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Narrow & Compact Contact Info Boxes (Lowered to sit completely below background banner) */}
                        <div className="w-full md:w-56 lg:w-60 flex-shrink-0 space-y-1.5 pt-2 md:pt-20">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl shadow-xs">
                                <div className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                                    <MailIcon className="w-3.5 h-3.5" />
                                </div>
                                <p className="text-xs font-bold text-[var(--text-primary)] truncate flex-1">{user?.email}</p>
                            </div>

                            {user?.phone && (
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl shadow-xs">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                                        <PhoneIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <p className="text-xs font-bold text-[var(--text-primary)] truncate flex-1">{user.phone}</p>
                                </div>
                            )}

                            {user?.location && (
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl shadow-xs">
                                    <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                                        <MapPinIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <p className="text-xs font-bold text-[var(--text-primary)] truncate flex-1">{user.location}</p>
                                </div>
                            )}

                            {user?.birthDate && user?.showBirthDate && (
                                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl shadow-xs">
                                    <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
                                        <CalendarIcon className="w-3.5 h-3.5" />
                                    </div>
                                    <p className="text-xs font-bold text-[var(--text-primary)] truncate flex-1">{formatBirthDate(user.birthDate)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bio: Full Width */}
                    {user?.bio && (
                        <div className="mb-6 p-3.5 bg-[var(--bg-secondary)]/40 border border-[var(--border-primary)]/50 rounded-2xl">
                            <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed">{user.bio}</p>
                        </div>
                    )}

                    {/* Skills */}
                    {user?.skills && user.skills.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-[var(--text-tertiary)] mb-3 uppercase tracking-wider">
                                {language === 'vi' ? 'Kỹ năng' : 'Skills'}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3.5 py-1.5 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] rounded-xl text-sm font-semibold border border-[var(--accent-primary)]/30"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Featured Works Preview */}
                    {extendedUser?.featuredWorks && extendedUser.featuredWorks.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-[var(--text-tertiary)] mb-3 uppercase tracking-wider">
                                {language === 'vi' ? 'Tác phẩm nổi bật' : 'Featured Works'}
                            </h3>
                            <div className="grid grid-cols-3 gap-2.5">
                                {extendedUser.featuredWorks.slice(0, 3).map((work, index) => (
                                    <div key={index} className="relative aspect-video rounded-xl overflow-hidden group border border-[var(--border-primary)]">
                                        <img
                                            src={cdnFromUrl(work.image, 'w_320')}
                                            alt={work.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                            <p className="text-white text-xs font-medium text-center">{work.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {extendedUser.featuredWorks.length > 3 && (
                                <button
                                    onClick={handleEditProfile}
                                    className="mt-2 text-sm text-[var(--accent-primary)] hover:underline transition-colors font-semibold"
                                >
                                    {language === 'vi' ? `+${extendedUser.featuredWorks.length - 3} tác phẩm khác` : `+${extendedUser.featuredWorks.length - 3} more works`}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Attachments Preview */}
                    {extendedUser?.attachments && extendedUser.attachments.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-[var(--text-tertiary)] mb-3 uppercase tracking-wider">
                                {language === 'vi' ? 'File đính kèm' : 'Attachments'}
                            </h3>
                            <div className="space-y-2">
                                {extendedUser.attachments.map((file, index) => (
                                    <a
                                        key={index}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent-primary)] transition-colors group"
                                    >
                                        <div className="w-9 h-9 bg-purple-500/15 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
                                            <FileTextIcon />
                                        </div>
                                        <span className="flex-1 text-[var(--text-primary)] text-sm font-medium truncate">{file.filename}</span>
                                        <span className="text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                            <ExternalLinkIcon />
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Social Links */}
                    {user?.socials && (user.socials.facebook || user.socials.linkedin || user.socials.github || (user.socials.custom && user.socials.custom.length > 0)) && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-[var(--text-tertiary)] mb-3 uppercase tracking-wider">
                                {language === 'vi' ? 'Liên kết' : 'Links'}
                            </h3>
                            <div className="flex flex-wrap gap-2.5">
                                {user.socials.facebook && (
                                    <a
                                        href={user.socials.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-[#1877f2]/15 text-[#1877f2] border border-[#1877f2]/30 rounded-xl hover:bg-[#1877f2]/25 transition-colors text-sm font-semibold"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                        Facebook
                                    </a>
                                )}
                                {user.socials.linkedin && (
                                    <a
                                        href={user.socials.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-[#0077b5]/15 text-[#0077b5] border border-[#0077b5]/30 rounded-xl hover:bg-[#0077b5]/25 transition-colors text-sm font-semibold"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                        LinkedIn
                                    </a>
                                )}
                                {user.socials.github && (
                                    <a
                                        href={user.socials.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-sm font-semibold"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        GitHub
                                    </a>
                                )}
                                {user.socials.custom?.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 rounded-xl hover:bg-[var(--accent-primary)]/25 transition-colors text-sm font-semibold"
                                    >
                                        <ExternalLinkIcon />
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Edit Profile Button with Deep Solid Blue Color */}
                    <button
                        onClick={handleEditProfile}
                        style={{ backgroundColor: '#0284c7', color: '#ffffff' }}
                        className="w-full py-4 bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-base rounded-2xl shadow-xl hover:shadow-cyan-900/30 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                    >
                        <EditIcon />
                        {language === 'vi' ? 'Chỉnh sửa hồ sơ' : 'Edit Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileEditModal;
