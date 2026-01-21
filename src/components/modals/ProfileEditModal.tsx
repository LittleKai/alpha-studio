import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';

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

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="relative z-10 w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700/50 max-h-[90vh] overflow-y-auto">
                {/* Header Background */}
                <div className="h-32 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-pink-600/30 relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHptMCAzMmMtNy43MzIgMC0xNC02LjI2OC0xNC0xNHM2LjI2OC0xNCAxNC0xNCAxNCA2LjI2OCAxNCAxNC02LjI2OCAxNC0xNCAxNHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors text-white"
                    >
                        <XIcon />
                    </button>
                </div>

                {/* Avatar */}
                <div className="relative px-6 -mt-16">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-900 shadow-2xl bg-gradient-to-br from-purple-500 to-pink-500">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 pt-4">
                    {/* Name & Role */}
                    <div className="mb-4">
                        <h2 className="text-2xl font-bold text-white mb-2">{user?.name}</h2>
                        <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user?.role || 'student')}`}>
                                <BriefcaseIcon />
                                {getRoleLabel(user?.role || 'student')}
                            </span>
                            {user?.subscription?.plan && user.subscription.plan !== 'free' && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-sm font-medium">
                                    <StarIcon />
                                    {user.subscription.plan.charAt(0).toUpperCase() + user.subscription.plan.slice(1)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    {user?.bio && (
                        <p className="text-gray-300 mb-6 leading-relaxed">{user.bio}</p>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 text-gray-400">
                            <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-purple-400">
                                <MailIcon />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm text-white">{user?.email}</p>
                            </div>
                        </div>

                        {user?.phone && (
                            <div className="flex items-center gap-3 text-gray-400">
                                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-green-400">
                                    <PhoneIcon />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{language === 'vi' ? 'Điện thoại' : 'Phone'}</p>
                                    <p className="text-sm text-white">{user.phone}</p>
                                </div>
                            </div>
                        )}

                        {user?.location && (
                            <div className="flex items-center gap-3 text-gray-400">
                                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-red-400">
                                    <MapPinIcon />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{language === 'vi' ? 'Địa điểm' : 'Location'}</p>
                                    <p className="text-sm text-white">{user.location}</p>
                                </div>
                            </div>
                        )}

                        {user?.birthDate && user?.showBirthDate && (
                            <div className="flex items-center gap-3 text-gray-400">
                                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-blue-400">
                                    <CalendarIcon />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">{language === 'vi' ? 'Ngày sinh' : 'Birthday'}</p>
                                    <p className="text-sm text-white">{formatBirthDate(user.birthDate)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Skills */}
                    {user?.skills && user.skills.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                                {language === 'vi' ? 'Kỹ năng' : 'Skills'}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user.skills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm border border-purple-500/30"
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
                            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                                {language === 'vi' ? 'Tác phẩm nổi bật' : 'Featured Works'}
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                {extendedUser.featuredWorks.slice(0, 3).map((work, index) => (
                                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                                        <img
                                            src={work.image}
                                            alt={work.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white text-xs font-medium text-center px-2">{work.title}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {extendedUser.featuredWorks.length > 3 && (
                                <button
                                    onClick={handleEditProfile}
                                    className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    {language === 'vi' ? `+${extendedUser.featuredWorks.length - 3} tác phẩm khác` : `+${extendedUser.featuredWorks.length - 3} more works`}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Attachments Preview */}
                    {extendedUser?.attachments && extendedUser.attachments.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                                {language === 'vi' ? 'File đính kèm' : 'Attachments'}
                            </h3>
                            <div className="space-y-2">
                                {extendedUser.attachments.map((file, index) => (
                                    <a
                                        key={index}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors group"
                                    >
                                        <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-400">
                                            <FileTextIcon />
                                        </div>
                                        <span className="flex-1 text-white text-sm truncate">{file.filename}</span>
                                        <span className="text-gray-500 group-hover:text-purple-400 transition-colors">
                                            <ExternalLinkIcon />
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Social Links */}
                    {user?.socials && (user.socials.linkedin || user.socials.behance || user.socials.github) && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                                {language === 'vi' ? 'Liên kết' : 'Links'}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user.socials.linkedin && (
                                    <a
                                        href={user.socials.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-[#0077b5]/20 text-[#0077b5] rounded-lg hover:bg-[#0077b5]/30 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                        </svg>
                                        LinkedIn
                                    </a>
                                )}
                                {user.socials.behance && (
                                    <a
                                        href={user.socials.behance}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-[#1769ff]/20 text-[#1769ff] rounded-lg hover:bg-[#1769ff]/30 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M6.938 4.503c.702 0 1.34.06 1.92.188.577.13 1.07.33 1.485.61.41.28.733.65.96 1.12.225.47.34 1.05.34 1.73 0 .74-.17 1.36-.507 1.86-.338.5-.837.9-1.502 1.22.906.26 1.576.72 2.022 1.37.448.66.665 1.45.665 2.36 0 .75-.13 1.39-.41 1.93-.28.55-.67 1-1.16 1.35-.48.348-1.05.6-1.67.767-.61.165-1.252.254-1.91.254H0V4.51h6.938v-.007zM6.545 10.51c.6 0 1.09-.15 1.47-.45.38-.3.56-.73.56-1.29 0-.31-.05-.57-.16-.78-.11-.21-.26-.38-.46-.52-.2-.14-.432-.24-.692-.3-.26-.058-.55-.09-.868-.09H3.41v3.44h3.135zm.162 5.394c.35 0 .68-.033 1-.1.314-.067.59-.18.825-.34.236-.16.423-.38.56-.66.14-.28.21-.64.21-1.08 0-.83-.23-1.43-.697-1.8-.465-.37-1.084-.55-1.86-.55H3.41v4.53h3.296zM16.3 17.9c-.51.47-1.26.71-2.23.71-.64 0-1.19-.12-1.65-.36-.46-.24-.82-.56-1.08-.95-.26-.39-.44-.83-.55-1.31-.1-.47-.15-.97-.15-1.48s.055-.99.166-1.46c.11-.47.295-.9.54-1.28.248-.38.564-.68.95-.9.39-.22.86-.33 1.42-.33.68 0 1.24.14 1.68.44.44.29.795.67 1.06 1.13.266.46.45.99.55 1.59.1.6.125 1.22.08 1.86h-5.74c-.02.66.164 1.18.55 1.55.387.37.89.55 1.51.55.47 0 .86-.12 1.17-.36.31-.24.52-.55.63-.93h2.36c-.22.9-.65 1.59-1.28 2.06zm-1.94-6.7c-.29-.3-.72-.45-1.28-.45-.38 0-.69.06-.94.19-.24.13-.44.3-.58.5-.14.21-.24.44-.3.69-.05.25-.08.5-.09.75h4.13c-.05-.59-.23-1.06-.52-1.37l-.42-.31zM15.47 6.1h4.42v1.52h-4.42V6.1z"/>
                                        </svg>
                                        Behance
                                    </a>
                                )}
                                {user.socials.github && (
                                    <a
                                        href={user.socials.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        GitHub
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Edit Profile Button */}
                    <button
                        onClick={handleEditProfile}
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
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
