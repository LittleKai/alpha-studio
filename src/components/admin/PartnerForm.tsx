import React, { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { createPartner, updatePartner, Partner, PartnerInput } from '../../services/partnerService';
import { uploadToCloudinary } from '../../services/cloudinaryService';

interface PartnerFormProps {
    partner: Partner | null;
    onClose: () => void;
    onSuccess: () => void;
}

type LanguageTab = 'vi' | 'en';

const PartnerForm: React.FC<PartnerFormProps> = ({ partner, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const isEditing = !!partner;

    // Language tab
    const [activeTab, setActiveTab] = useState<LanguageTab>('vi');

    // Form state
    const [companyName, setCompanyName] = useState(partner?.companyName || '');
    const [descriptionVi, setDescriptionVi] = useState(partner?.description?.vi || '');
    const [descriptionEn, setDescriptionEn] = useState(partner?.description?.en || '');
    const [logo, setLogo] = useState(partner?.logo || '');
    const [website, setWebsite] = useState(partner?.website || '');
    const [email, setEmail] = useState(partner?.email || '');
    const [phone, setPhone] = useState(partner?.phone || '');
    const [address, setAddress] = useState(partner?.address || '');
    const [partnerType, setPartnerType] = useState(partner?.partnerType || 'technology');
    const [featured, setFeatured] = useState(partner?.featured || false);
    const [order, setOrder] = useState(partner?.order || 0);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // File upload handler
    const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingLogo(true);
        try {
            const result = await uploadToCloudinary(file, 'partners/logos');
            if (result.success) {
                setLogo(result.url);
            } else {
                setError(result.error || 'Failed to upload logo');
            }
        } catch (err) {
            setError('Failed to upload logo');
        } finally {
            setUploadingLogo(false);
        }
    }, []);

    const handleSubmit = useCallback(async (status: 'draft' | 'published') => {
        if (!companyName.trim()) {
            setError(t('admin.partners.form.errors.nameRequired'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data: PartnerInput = {
                companyName: companyName.trim(),
                description: {
                    vi: descriptionVi.trim(),
                    en: descriptionEn.trim()
                },
                logo: logo.trim(),
                website: website.trim(),
                email: email.trim(),
                phone: phone.trim(),
                address: address.trim(),
                partnerType,
                featured,
                order,
                status
            };

            if (isEditing) {
                await updatePartner(partner._id, data);
            } else {
                await createPartner(data);
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save partner');
        } finally {
            setLoading(false);
        }
    }, [companyName, descriptionVi, descriptionEn, logo, website, email, phone, address, partnerType, featured, order, isEditing, partner, onSuccess, t]);

    const partnerTypes = [
        { value: 'technology', label: t('admin.partners.types.technology') },
        { value: 'education', label: t('admin.partners.types.education') },
        { value: 'enterprise', label: t('admin.partners.types.enterprise') },
        { value: 'startup', label: t('admin.partners.types.startup') },
        { value: 'government', label: t('admin.partners.types.government') },
        { value: 'other', label: t('admin.partners.types.other') }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--bg-primary)] rounded-2xl shadow-xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        {isEditing ? t('admin.partners.editPartner') : t('admin.partners.createPartner')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                        {error}
                    </div>
                )}

                {/* Form */}
                <div className="p-6 space-y-6">
                    {/* Company Name */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.partners.form.companyName')} *
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            placeholder={t('admin.partners.form.companyNamePlaceholder')}
                        />
                    </div>

                    {/* Description - Language Tabs */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.partners.form.description')}
                        </label>
                        <div className="flex gap-2 mb-3">
                            <button
                                onClick={() => setActiveTab('vi')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    activeTab === 'vi'
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                }`}
                            >
                                Tiếng Việt
                            </button>
                            <button
                                onClick={() => setActiveTab('en')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    activeTab === 'en'
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                                }`}
                            >
                                English
                            </button>
                        </div>
                        {activeTab === 'vi' ? (
                            <textarea
                                value={descriptionVi}
                                onChange={(e) => setDescriptionVi(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                placeholder={t('admin.partners.form.descriptionPlaceholder')}
                            />
                        ) : (
                            <textarea
                                value={descriptionEn}
                                onChange={(e) => setDescriptionEn(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                placeholder={t('admin.partners.form.descriptionPlaceholder')}
                            />
                        )}
                    </div>

                    {/* Partner Type */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.partners.form.partnerType')}
                        </label>
                        <select
                            value={partnerType}
                            onChange={(e) => setPartnerType(e.target.value as any)}
                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            {partnerTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Logo URL */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.partners.form.logo')}
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="url"
                                value={logo}
                                onChange={(e) => setLogo(e.target.value)}
                                className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                placeholder="https://example.com/logo.png"
                            />
                            <label className={`px-4 py-3 bg-[var(--accent-primary)] text-white font-medium rounded-xl cursor-pointer hover:opacity-90 transition-opacity flex items-center gap-2 ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploadingLogo ? (
                                    <>
                                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                        </svg>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Upload
                                    </>
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
                        {logo && (
                            <div className="mt-3 relative inline-block">
                                <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                    <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setLogo('')}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Website & Email */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t('admin.partners.form.website')}
                            </label>
                            <input
                                type="url"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                placeholder="https://example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t('admin.partners.form.email')}
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                placeholder="contact@example.com"
                            />
                        </div>
                    </div>

                    {/* Phone & Address */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t('admin.partners.form.phone')}
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                placeholder="+84 123 456 789"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t('admin.partners.form.order')}
                            </label>
                            <input
                                type="number"
                                value={order}
                                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.partners.form.address')}
                        </label>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            placeholder={t('admin.partners.form.addressPlaceholder')}
                        />
                    </div>

                    {/* Featured */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="featured"
                            checked={featured}
                            onChange={(e) => setFeatured(e.target.checked)}
                            className="w-5 h-5 rounded border-[var(--border-primary)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
                        />
                        <label htmlFor="featured" className="text-sm font-medium text-[var(--text-primary)]">
                            {t('admin.partners.form.featured')}
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                    >
                        {t('admin.partners.form.cancel')}
                    </button>
                    <button
                        onClick={() => handleSubmit('draft')}
                        disabled={loading}
                        className="px-6 py-3 text-sm font-medium bg-yellow-500/10 text-yellow-400 rounded-xl hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                    >
                        {loading ? t('admin.partners.form.saving') : t('admin.partners.form.saveDraft')}
                    </button>
                    <button
                        onClick={() => handleSubmit('published')}
                        disabled={loading}
                        className="px-6 py-3 text-sm font-medium bg-[var(--accent-primary)] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? t('admin.partners.form.saving') : t('admin.partners.form.publish')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PartnerForm;
