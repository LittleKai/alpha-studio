import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import type { Partner, PartnerInput } from '../../services/partnerService';
import { uploadToCloudinary } from '../../services/cloudinaryService';

interface PartnerEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PartnerInput) => Promise<void>;
    partner: Partner;
}

const PARTNER_TYPE_OPTIONS = [
    { value: 'technology', label: 'Technology' },
    { value: 'education', label: 'Education' },
    { value: 'enterprise', label: 'Enterprise' },
    { value: 'startup', label: 'Startup' },
    { value: 'government', label: 'Government' },
    { value: 'other', label: 'Other' },
];

const PartnerEditModal: React.FC<PartnerEditModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    partner,
}) => {
    const { language } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        descriptionVi: '',
        descriptionEn: '',
        logo: '',
        backgroundImage: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        partnerType: 'technology',
        featured: false,
        services: '',
        keyProjects: [] as Array<{ image: string; description: { vi: string; en: string } }>,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingBg, setUploadingBg] = useState(false);
    const [uploadingProjectImage, setUploadingProjectImage] = useState<number | null>(null);

    // Generic image upload handler
    const handleImageUpload = useCallback(async (
        e: React.ChangeEvent<HTMLInputElement>,
        field: string,
        folder: string,
        setUploading: (v: boolean | number | null) => void,
        onSuccess: (url: string) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true as any);
        try {
            const result = await uploadToCloudinary(file, folder);
            if (result.success) {
                onSuccess(result.url);
            } else {
                setErrors(prev => ({ ...prev, [field]: result.error || 'Upload failed' }));
            }
        } catch (err) {
            setErrors(prev => ({ ...prev, [field]: 'Upload failed' }));
        } finally {
            setUploading(false as any);
        }
    }, []);

    // Logo upload handler
    const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        handleImageUpload(e, 'logo', 'partners/logos', (v) => setUploadingLogo(v as boolean), (url) => {
            setFormData(prev => ({ ...prev, logo: url }));
        });
    }, [handleImageUpload]);

    // Background image upload handler
    const handleBgUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        handleImageUpload(e, 'backgroundImage', 'partners/backgrounds', (v) => setUploadingBg(v as boolean), (url) => {
            setFormData(prev => ({ ...prev, backgroundImage: url }));
        });
    }, [handleImageUpload]);

    // Key project image upload handler
    const handleProjectImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingProjectImage(index);
        try {
            const result = await uploadToCloudinary(file, 'partners/projects');
            if (result.success) {
                setFormData(prev => {
                    const updated = [...prev.keyProjects];
                    updated[index] = { ...updated[index], image: result.url };
                    return { ...prev, keyProjects: updated };
                });
            }
        } catch (err) {
            // silent fail
        } finally {
            setUploadingProjectImage(null);
        }
    }, []);

    // Initialize form data when partner changes
    useEffect(() => {
        if (partner) {
            setFormData({
                companyName: partner.companyName || '',
                descriptionVi: partner.description?.vi || '',
                descriptionEn: partner.description?.en || '',
                logo: partner.logo || '',
                backgroundImage: partner.backgroundImage || '',
                website: partner.website || '',
                email: partner.email || '',
                phone: partner.phone || '',
                address: partner.address || '',
                partnerType: partner.partnerType || 'technology',
                featured: partner.featured || false,
                services: partner.services?.join(', ') || '',
                keyProjects: partner.keyProjects || [],
            });
        }
    }, [partner]);

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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: newValue }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.companyName.trim()) {
            newErrors.companyName = language === 'vi' ? 'Tên công ty là bắt buộc' : 'Company name is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const partnerData: PartnerInput = {
                companyName: formData.companyName,
                description: {
                    vi: formData.descriptionVi || formData.descriptionEn,
                    en: formData.descriptionEn || formData.descriptionVi,
                },
                logo: formData.logo,
                backgroundImage: formData.backgroundImage,
                website: formData.website,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                partnerType: formData.partnerType,
                featured: formData.featured,
                services: formData.services.split(',').map(s => s.trim()).filter(s => s),
                keyProjects: formData.keyProjects,
            };

            await onSubmit(partnerData);
            onClose();
        } catch (error) {
            console.error('Error updating partner:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-2xl bg-[var(--bg-primary)] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        {language === 'vi' ? 'Chỉnh sửa đối tác' : 'Edit Partner'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="flex flex-col gap-4">
                        {/* Company Name */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {language === 'vi' ? 'Tên công ty' : 'Company Name'} *
                            </label>
                            <input
                                type="text"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] ${
                                    errors.companyName ? 'border-red-500' : 'border-[var(--border-primary)]'
                                }`}
                            />
                            {errors.companyName && (
                                <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
                            )}
                        </div>

                        {/* Partner Type & Featured */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                    {language === 'vi' ? 'Loại đối tác' : 'Partner Type'}
                                </label>
                                <select
                                    name="partnerType"
                                    value={formData.partnerType}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                >
                                    {PARTNER_TYPE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="featured"
                                        checked={formData.featured}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                                    />
                                    <span className="text-sm font-medium text-[var(--text-primary)]">
                                        {language === 'vi' ? 'Đối tác nổi bật' : 'Featured Partner'}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {language === 'vi' ? 'Mô tả' : 'Description'}
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <textarea
                                    name="descriptionVi"
                                    value={formData.descriptionVi}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Tiếng Việt"
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                />
                                <textarea
                                    name="descriptionEn"
                                    value={formData.descriptionEn}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="English"
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                />
                            </div>
                        </div>

                        {/* Logo */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                Logo
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    name="logo"
                                    value={formData.logo}
                                    onChange={handleChange}
                                    placeholder="https://... or upload"
                                    className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                                <label className={`px-4 py-2 bg-[var(--accent-primary)] text-white font-medium rounded-lg cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {uploadingLogo ? (
                                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        disabled={uploadingLogo}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {formData.logo && (
                                <div className="mt-2 relative inline-block">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                        <img src={formData.logo} alt="Logo preview" className="w-full h-full object-contain p-1" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            {errors.logo && <p className="text-red-500 text-xs mt-1">{errors.logo}</p>}
                        </div>

                        {/* Contact Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                    {language === 'vi' ? 'Số điện thoại' : 'Phone'}
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>
                        </div>

                        {/* Website & Address */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                    Website
                                </label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                    {language === 'vi' ? 'Địa chỉ' : 'Address'}
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>
                        </div>

                        {/* Services */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {language === 'vi' ? 'Dịch vụ (phân cách bằng dấu phẩy)' : 'Services (comma separated)'}
                            </label>
                            <input
                                type="text"
                                name="services"
                                value={formData.services}
                                onChange={handleChange}
                                placeholder={language === 'vi' ? 'VD: Concept, Luxury, Fashion' : 'e.g., Concept, Luxury, Fashion'}
                                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            />
                        </div>

                        {/* Background Image */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {language === 'vi' ? 'Ảnh bìa' : 'Background Image'}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    name="backgroundImage"
                                    value={formData.backgroundImage}
                                    onChange={handleChange}
                                    placeholder="https://... or upload"
                                    className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                                <label className={`px-4 py-2 bg-[var(--accent-primary)] text-white font-medium rounded-lg cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 ${uploadingBg ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {uploadingBg ? (
                                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBgUpload}
                                        disabled={uploadingBg}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            {formData.backgroundImage && (
                                <div className="mt-2 relative inline-block">
                                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                        <img src={formData.backgroundImage} alt="Background preview" className="w-full h-full object-cover" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, backgroundImage: '' }))}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Key Projects */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-[var(--text-primary)]">
                                    {language === 'vi' ? 'Dự án tiêu biểu' : 'Key Projects'}
                                </label>
                                <span className="text-xs text-[var(--text-tertiary)]">
                                    {formData.keyProjects.length}/6
                                </span>
                            </div>
                            <div className="flex flex-col gap-3">
                                {formData.keyProjects.map((project, idx) => (
                                    <div key={idx} className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
                                        <div className="flex items-start gap-3">
                                            {/* Project image */}
                                            <div className="flex-shrink-0">
                                                {project.image ? (
                                                    <div className="relative">
                                                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-[var(--border-primary)]">
                                                            <img src={project.image} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData(prev => {
                                                                    const updated = [...prev.keyProjects];
                                                                    updated[idx] = { ...updated[idx], image: '' };
                                                                    return { ...prev, keyProjects: updated };
                                                                });
                                                            }}
                                                            className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className={`w-20 h-20 rounded-lg border-2 border-dashed border-[var(--border-primary)] flex items-center justify-center cursor-pointer hover:border-[var(--accent-primary)] transition-colors ${uploadingProjectImage === idx ? 'opacity-50' : ''}`}>
                                                        {uploadingProjectImage === idx ? (
                                                            <svg className="w-5 h-5 animate-spin text-[var(--text-tertiary)]" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleProjectImageUpload(e, idx)}
                                                            disabled={uploadingProjectImage === idx}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                            {/* Project description */}
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="text"
                                                    value={project.description.vi}
                                                    onChange={(e) => {
                                                        setFormData(prev => {
                                                            const updated = [...prev.keyProjects];
                                                            updated[idx] = { ...updated[idx], description: { ...updated[idx].description, vi: e.target.value } };
                                                            return { ...prev, keyProjects: updated };
                                                        });
                                                    }}
                                                    placeholder="Mô tả (Tiếng Việt)"
                                                    className="w-full px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                                />
                                                <input
                                                    type="text"
                                                    value={project.description.en}
                                                    onChange={(e) => {
                                                        setFormData(prev => {
                                                            const updated = [...prev.keyProjects];
                                                            updated[idx] = { ...updated[idx], description: { ...updated[idx].description, en: e.target.value } };
                                                            return { ...prev, keyProjects: updated };
                                                        });
                                                    }}
                                                    placeholder="Description (English)"
                                                    className="w-full px-2 py-1.5 text-sm bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                                />
                                            </div>
                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        keyProjects: prev.keyProjects.filter((_, i) => i !== idx)
                                                    }));
                                                }}
                                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {formData.keyProjects.length < 6 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                keyProjects: [...prev.keyProjects, { image: '', description: { vi: '', en: '' } }]
                                            }));
                                        }}
                                        className="w-full py-2 border-2 border-dashed border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>+</span> {language === 'vi' ? 'Thêm dự án' : 'Add Project'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            {language === 'vi' ? 'Hủy' : 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors disabled:opacity-50"
                        >
                            {isSubmitting
                                ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                                : (language === 'vi' ? 'Cập nhật' : 'Update')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PartnerEditModal;
