import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import type { PartnerType } from '../../types';
import { uploadToCloudinary } from '../../services/cloudinaryService';

interface PartnerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PartnerFormData) => void;
}

interface PartnerFormData {
  companyName: string;
  type: PartnerType;
  email: string;
  phone: string;
  website: string;
  location: string;
  description: string;
  specialties: string[];
  logo: string;
}

const SPECIALTIES_OPTIONS = [
  'Event Planning',
  'Stage Design',
  'Lighting',
  'Sound Engineering',
  'Catering',
  'Photography',
  'Videography',
  'Decoration',
  'Printing',
  'Marketing',
];

const PartnerRegistrationModal: React.FC<PartnerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<PartnerFormData>({
    companyName: '',
    type: 'agency',
    email: '',
    phone: '',
    website: '',
    location: '',
    description: '',
    specialties: [],
    logo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Logo upload handler
  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const result = await uploadToCloudinary(file, 'partners/logos');
      if (result.success) {
        setFormData(prev => ({ ...prev, logo: result.url }));
      } else {
        setErrors(prev => ({ ...prev, logo: result.error || 'Upload failed' }));
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, logo: 'Upload failed' }));
    } finally {
      setUploadingLogo(false);
    }
  }, []);

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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = t('partner.required');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('partner.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('partner.invalidEmail');
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('partner.required');
    }
    if (!formData.location.trim()) {
      newErrors.location = t('partner.required');
    }
    if (formData.specialties.length === 0) {
      newErrors.specialties = t('partner.selectSpecialty');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        companyName: '',
        type: 'agency',
        email: '',
        phone: '',
        website: '',
        location: '',
        description: '',
        specialties: [],
        logo: '',
      });
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
      <div className="relative z-10 w-full max-w-xl bg-[var(--bg-primary)] rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-[var(--border-primary)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {t('partner.register')}
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
                {t('partner.companyName')} *
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

            {/* Partner Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {t('partner.type')}
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="agency">{t('partner.agency')}</option>
                <option value="supplier">{t('partner.supplier')}</option>
              </select>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('partner.email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] ${
                    errors.email ? 'border-red-500' : 'border-[var(--border-primary)]'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('partner.phone')} *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] ${
                    errors.phone ? 'border-red-500' : 'border-[var(--border-primary)]'
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Website & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('partner.website')}
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://"
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  {t('partner.location')} *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] ${
                    errors.location ? 'border-red-500' : 'border-[var(--border-primary)]'
                  }`}
                />
                {errors.location && (
                  <p className="text-red-500 text-xs mt-1">{errors.location}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {t('partner.description')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
              />
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                {t('partner.specialties')} *
              </label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES_OPTIONS.map((specialty) => (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => toggleSpecialty(specialty)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      formData.specialties.includes(specialty)
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
              {errors.specialties && (
                <p className="text-red-500 text-xs mt-1">{errors.specialties}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              {t('partner.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
            >
              {t('partner.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerRegistrationModal;
