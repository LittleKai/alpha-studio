import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import { uploadToCloudinary } from '../services/cloudinaryService';

interface FeaturedWork {
    image: string;
    title: string;
    description: string;
}

interface Attachment {
    url: string;
    filename: string;
    type: string;
    size: number;
}

// Icon components
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const CameraIcon = ({ size = 18 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const TrashIcon = ({ size = 16 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const SaveIcon = ({ size = 18 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
);

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
        <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);

const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
);

const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

const FileTextIcon = ({ size = 20 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const XIcon = ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

const ImageIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
);

const ProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const backgroundInputRef = useRef<HTMLInputElement>(null);
    const workImageInputRef = useRef<HTMLInputElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: user?.name || '',
        avatar: user?.avatar || '',
        backgroundImage: user?.backgroundImage || '',
        bio: user?.bio || '',
        phone: user?.phone || '',
        location: user?.location || '',
        birthDate: user?.birthDate ? user.birthDate.split('T')[0] : '',
        showBirthDate: user?.showBirthDate || false,
        skills: user?.skills || [],
        socials: {
            linkedin: user?.socials?.linkedin || '',
            behance: user?.socials?.behance || '',
            github: user?.socials?.github || ''
        }
    });

    const [featuredWorks, setFeaturedWorks] = useState<FeaturedWork[]>(
        (user as any)?.featuredWorks || []
    );
    const [attachments, setAttachments] = useState<Attachment[]>(
        (user as any)?.attachments || []
    );

    const [newSkill, setNewSkill] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingBackground, setUploadingBackground] = useState(false);
    const [uploadingWorkImage, setUploadingWorkImage] = useState(false);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);

    // New featured work form
    const [newWork, setNewWork] = useState<FeaturedWork>({
        image: '',
        title: '',
        description: ''
    });
    const [showAddWork, setShowAddWork] = useState(false);

    // Handle avatar upload - compressed to 150KB max, 400x400px
    const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const result = await uploadToCloudinary(file, 'avatars', 'avatar');
            if (result.success) {
                setFormData(prev => ({ ...prev, avatar: result.url }));
            }
        } catch (error) {
            console.error('Avatar upload failed:', error);
        } finally {
            setUploadingAvatar(false);
        }
    }, []);

    // Handle background image upload
    const handleBackgroundUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingBackground(true);
        try {
            const result = await uploadToCloudinary(file, 'backgrounds', 'general');
            if (result.success) {
                setFormData(prev => ({ ...prev, backgroundImage: result.url }));
            }
        } catch (error) {
            console.error('Background upload failed:', error);
        } finally {
            setUploadingBackground(false);
        }
    }, []);

    // Handle work image upload - compressed to 500KB max, 1200x800px
    const handleWorkImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingWorkImage(true);
        try {
            const result = await uploadToCloudinary(file, 'works', 'featured_work');
            if (result.success) {
                setNewWork(prev => ({ ...prev, image: result.url }));
            }
        } catch (error) {
            console.error('Work image upload failed:', error);
        } finally {
            setUploadingWorkImage(false);
        }
    }, []);

    // Handle attachment upload - compressed to 800KB max, 1920x1080px for images
    const handleAttachmentUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || attachments.length >= 3) return;

        setUploadingAttachment(true);
        try {
            const result = await uploadToCloudinary(file, 'attachments', 'attachment');
            if (result.success) {
                setAttachments(prev => [...prev, {
                    url: result.url,
                    filename: file.name,
                    type: file.type,
                    size: file.size
                }]);
            }
        } catch (error) {
            console.error('Attachment upload failed:', error);
        } finally {
            setUploadingAttachment(false);
        }
    }, [attachments.length]);

    // Add skill
    const handleAddSkill = () => {
        if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, newSkill.trim()]
            }));
            setNewSkill('');
        }
    };

    // Remove skill
    const handleRemoveSkill = (skillToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skillToRemove)
        }));
    };

    // Add featured work
    const handleAddWork = () => {
        if (newWork.image && newWork.title) {
            setFeaturedWorks(prev => [...prev, newWork]);
            setNewWork({ image: '', title: '', description: '' });
            setShowAddWork(false);
        }
    };

    // Remove featured work
    const handleRemoveWork = (index: number) => {
        setFeaturedWorks(prev => prev.filter((_, i) => i !== index));
    };

    // Remove attachment
    const handleRemoveAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Save profile
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const result = await updateProfile({
                ...formData,
                backgroundImage: formData.backgroundImage || undefined,
                featuredWorks,
                attachments
            } as any);

            if (result.success) {
                navigate('/workflow');
            }
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <div className="bg-gray-800/50 border-b border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/workflow')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon />
                        <span>{t('common.back', 'Quay lại')}</span>
                    </button>
                    <h1 className="text-xl font-semibold text-white">
                        {t('profile.editProfile', 'Chỉnh sửa hồ sơ')}
                    </h1>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <SaveIcon />
                        <span>{isSaving ? t('common.saving', 'Đang lưu...') : t('common.save', 'Lưu')}</span>
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                {/* Avatar Section */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-700 border-4 border-purple-500/30">
                                {formData.avatar ? (
                                    <img
                                        src={formData.avatar}
                                        alt="Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                        <CameraIcon size={40} />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={uploadingAvatar}
                                className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors border-4 border-gray-800 text-white"
                            >
                                {uploadingAvatar ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <CameraIcon />
                                )}
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={t('profile.name', 'Tên của bạn')}
                                className="w-full text-2xl font-bold bg-transparent border-b border-gray-600 focus:border-purple-500 text-white pb-2 outline-none"
                            />
                            <p className="text-gray-400 mt-2 flex items-center gap-2">
                                <MailIcon />
                                {user?.email}
                            </p>
                            <p className="text-purple-400 mt-1 flex items-center gap-2">
                                <BriefcaseIcon />
                                {user?.role === 'student' ? 'Student' : user?.role === 'partner' ? 'Partner' : 'Admin'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Background Image Section */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-purple-400"><ImageIcon /></span>
                        {t('profile.backgroundImage', 'Ảnh bìa')}
                    </h2>
                    <div className="relative">
                        {formData.backgroundImage ? (
                            <div className="relative aspect-[3/1] rounded-xl overflow-hidden">
                                <img
                                    src={formData.backgroundImage}
                                    alt="Background"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => backgroundInputRef.current?.click()}
                                        disabled={uploadingBackground}
                                        className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors flex items-center gap-2"
                                    >
                                        {uploadingBackground ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <CameraIcon />
                                        )}
                                        <span>{t('profile.changeImage', 'Đổi ảnh')}</span>
                                    </button>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, backgroundImage: '' }))}
                                        className="px-4 py-2 bg-red-500/50 backdrop-blur-sm rounded-lg text-white hover:bg-red-500/70 transition-colors flex items-center gap-2"
                                    >
                                        <TrashIcon />
                                        <span>{t('common.delete', 'Xóa')}</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => backgroundInputRef.current?.click()}
                                disabled={uploadingBackground}
                                className="w-full aspect-[3/1] border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-purple-500 transition-colors text-gray-500"
                            >
                                {uploadingBackground ? (
                                    <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <UploadIcon />
                                        <span className="text-sm">{t('profile.uploadBackground', 'Tải ảnh bìa lên')}</span>
                                    </>
                                )}
                            </button>
                        )}
                        <input
                            ref={backgroundInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleBackgroundUpload}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-purple-400"><FileTextIcon /></span>
                        {t('profile.basicInfo', 'Thông tin cơ bản')}
                    </h2>
                    <div className="space-y-4">
                        {/* Bio */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">
                                {t('profile.bio', 'Giới thiệu bản thân')}
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                placeholder={t('profile.bioPlaceholder', 'Viết vài dòng về bản thân...')}
                                rows={3}
                                maxLength={500}
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1 text-right">{formData.bio.length}/500</p>
                        </div>

                        {/* Phone & Location */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                                    <PhoneIcon />
                                    {t('profile.phone', 'Số điện thoại')}
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+84 xxx xxx xxx"
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                                    <MapPinIcon />
                                    {t('profile.location', 'Địa điểm')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder={t('profile.locationPlaceholder', 'VD: TP. Hồ Chí Minh')}
                                    className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Birth Date */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                                <CalendarIcon />
                                {t('profile.birthDate', 'Ngày sinh')}
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                                    className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, showBirthDate: !prev.showBirthDate }))}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                                        formData.showBirthDate
                                            ? 'bg-purple-600/20 border-purple-500 text-purple-400'
                                            : 'bg-gray-700/50 border-gray-600 text-gray-400'
                                    }`}
                                >
                                    {formData.showBirthDate ? <EyeIcon /> : <EyeOffIcon />}
                                    <span className="text-sm">
                                        {formData.showBirthDate ? t('profile.public', 'Công khai') : t('profile.private', 'Riêng tư')}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Skills */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4">
                        {t('profile.skills', 'Kỹ năng')}
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {formData.skills.map((skill, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-300 text-sm"
                            >
                                {skill}
                                <button
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="hover:text-red-400 transition-colors"
                                >
                                    <XIcon />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSkill}
                            onChange={(e) => setNewSkill(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                            placeholder={t('profile.addSkill', 'Thêm kỹ năng mới...')}
                            className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                        />
                        <button
                            onClick={handleAddSkill}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        >
                            <PlusIcon />
                        </button>
                    </div>
                </div>

                {/* Social Links */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="text-purple-400"><LinkIcon /></span>
                        {t('profile.socialLinks', 'Liên kết mạng xã hội')}
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">LinkedIn</label>
                            <input
                                type="url"
                                value={formData.socials.linkedin}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    socials: { ...prev.socials, linkedin: e.target.value }
                                }))}
                                placeholder="https://linkedin.com/in/username"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Behance</label>
                            <input
                                type="url"
                                value={formData.socials.behance}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    socials: { ...prev.socials, behance: e.target.value }
                                }))}
                                placeholder="https://behance.net/username"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">GitHub</label>
                            <input
                                type="url"
                                value={formData.socials.github}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    socials: { ...prev.socials, github: e.target.value }
                                }))}
                                placeholder="https://github.com/username"
                                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Featured Works */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="text-purple-400"><ImageIcon /></span>
                            {t('profile.featuredWorks', 'Tác phẩm nổi bật')}
                        </h2>
                        <button
                            onClick={() => setShowAddWork(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-600/30 transition-colors"
                        >
                            <PlusIcon />
                            <span>{t('profile.addWork', 'Thêm tác phẩm')}</span>
                        </button>
                    </div>

                    {/* Add Work Form */}
                    {showAddWork && (
                        <div className="mb-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">
                                        {t('profile.workImage', 'Hình ảnh')}
                                    </label>
                                    {newWork.image ? (
                                        <div className="relative aspect-video rounded-lg overflow-hidden">
                                            <img
                                                src={newWork.image}
                                                alt="Work preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => setNewWork(prev => ({ ...prev, image: '' }))}
                                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors text-white"
                                            >
                                                <XIcon size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => workImageInputRef.current?.click()}
                                            disabled={uploadingWorkImage}
                                            className="w-full aspect-video border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-purple-500 transition-colors text-gray-500"
                                        >
                                            {uploadingWorkImage ? (
                                                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <UploadIcon />
                                                    <span className="text-sm">
                                                        {t('profile.uploadImage', 'Tải ảnh lên')}
                                                    </span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <input
                                        ref={workImageInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleWorkImageUpload}
                                        className="hidden"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">
                                            {t('profile.workTitle', 'Tên tác phẩm')}
                                        </label>
                                        <input
                                            type="text"
                                            value={newWork.title}
                                            onChange={(e) => setNewWork(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder={t('profile.workTitlePlaceholder', 'VD: Landing Page Design')}
                                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">
                                            {t('profile.workDescription', 'Mô tả')}
                                        </label>
                                        <textarea
                                            value={newWork.description}
                                            onChange={(e) => setNewWork(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder={t('profile.workDescriptionPlaceholder', 'Mô tả ngắn gọn về tác phẩm...')}
                                            rows={2}
                                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 outline-none resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleAddWork}
                                            disabled={!newWork.image || !newWork.title}
                                            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {t('common.add', 'Thêm')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowAddWork(false);
                                                setNewWork({ image: '', title: '', description: '' });
                                            }}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                        >
                                            {t('common.cancel', 'Hủy')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Works Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featuredWorks.map((work, index) => (
                            <div key={index} className="group relative bg-gray-700/30 rounded-xl overflow-hidden border border-gray-600">
                                <div className="aspect-video">
                                    <img
                                        src={work.image}
                                        alt={work.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-3">
                                    <h3 className="font-medium text-white truncate">{work.title}</h3>
                                    {work.description && (
                                        <p className="text-sm text-gray-400 truncate">{work.description}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleRemoveWork(index)}
                                    className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-white"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        ))}
                        {featuredWorks.length === 0 && !showAddWork && (
                            <div className="col-span-full text-center py-8 text-gray-500">
                                {t('profile.noWorks', 'Chưa có tác phẩm nào. Thêm tác phẩm đầu tiên của bạn!')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Attachments */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="text-purple-400"><FileTextIcon /></span>
                            {t('profile.attachments', 'File đính kèm')}
                            <span className="text-sm text-gray-500">({attachments.length}/3)</span>
                        </h2>
                        {attachments.length < 3 && (
                            <button
                                onClick={() => attachmentInputRef.current?.click()}
                                disabled={uploadingAttachment}
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-600/30 transition-colors disabled:opacity-50"
                            >
                                {uploadingAttachment ? (
                                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                )}
                                <span>{t('profile.uploadFile', 'Tải file')}</span>
                            </button>
                        )}
                        <input
                            ref={attachmentInputRef}
                            type="file"
                            onChange={handleAttachmentUpload}
                            className="hidden"
                        />
                    </div>

                    <div className="space-y-2">
                        {attachments.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600"
                            >
                                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center text-purple-400">
                                    <FileTextIcon />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white truncate">{file.filename}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    {t('common.view', 'Xem')}
                                </a>
                                <button
                                    onClick={() => handleRemoveAttachment(index)}
                                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                                >
                                    <TrashIcon size={18} />
                                </button>
                            </div>
                        ))}
                        {attachments.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                {t('profile.noAttachments', 'Chưa có file đính kèm. Bạn có thể tải lên tối đa 3 file.')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Save Button (Bottom) */}
                <div className="flex justify-end gap-4 pb-8">
                    <button
                        onClick={() => navigate('/workflow')}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        {t('common.cancel', 'Hủy')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                        <SaveIcon size={20} />
                        <span>{isSaving ? t('common.saving', 'Đang lưu...') : t('common.saveChanges', 'Lưu thay đổi')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
