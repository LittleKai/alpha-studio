import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import type { Partner, PartnerInput } from '../../services/partnerService';

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
    const { t, language } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        companyName: '',
        descriptionVi: '',
        descriptionEn: '',
        logo: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        partnerType: 'technology',
        featured: false,
        skills: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize form data when partner changes
    useEffect(() => {
        if (partner) {
            setFormData({
                companyName: partner.companyName || '',
                descriptionVi: partner.description?.vi || '',
                descriptionEn: partner.description?.en || '',
                logo: partner.logo || '',
                website: partner.website || '',
                email: partner.email || '',
                phone: partner.phone || '',
                address: partner.address || '',
                partnerType: partner.partnerType || 'technology',
                featured: partner.featured || false,
                skills: partner.skills?.join(', ') || '',
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
                website: formData.website,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                partnerType: formData.partnerType,
                featured: formData.featured,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
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

                        {/* Logo URL */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                Logo URL
                            </label>
                            <input
                                type="url"
                                name="logo"
                                value={formData.logo}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            />
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

                        {/* Skills */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {language === 'vi' ? 'Kỹ năng (phân cách bằng dấu phẩy)' : 'Skills (comma separated)'}
                            </label>
                            <input
                                type="text"
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                placeholder={language === 'vi' ? 'VD: Concept, Luxury, Fashion' : 'e.g., Concept, Luxury, Fashion'}
                                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            />
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
