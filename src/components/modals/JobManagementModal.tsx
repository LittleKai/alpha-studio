import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import type { Job, JobInput } from '../../services/jobService';

interface JobManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: JobInput) => Promise<void>;
    editingJob?: Job | null;
}

const CATEGORY_OPTIONS = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'operations', label: 'Operations' },
    { value: 'hr', label: 'HR' },
    { value: 'finance', label: 'Finance' },
    { value: 'other', label: 'Other' },
];

const JOB_TYPE_OPTIONS = [
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
    { value: 'remote', label: 'Remote' },
];

const EXPERIENCE_OPTIONS = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'junior', label: 'Junior' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' },
];

const JobManagementModal: React.FC<JobManagementModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    editingJob,
}) => {
    const { t, language } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<{
        titleVi: string;
        titleEn: string;
        descriptionVi: string;
        descriptionEn: string;
        requirementsVi: string;
        requirementsEn: string;
        benefitsVi: string;
        benefitsEn: string;
        location: string;
        salaryMin: string;
        salaryMax: string;
        salaryCurrency: string;
        salaryNegotiable: boolean;
        jobType: string;
        experienceLevel: string;
        category: string;
        skills: string;
        applicationDeadline: string;
    }>({
        titleVi: '',
        titleEn: '',
        descriptionVi: '',
        descriptionEn: '',
        requirementsVi: '',
        requirementsEn: '',
        benefitsVi: '',
        benefitsEn: '',
        location: '',
        salaryMin: '',
        salaryMax: '',
        salaryCurrency: 'VND',
        salaryNegotiable: true,
        jobType: 'full-time',
        experienceLevel: 'entry',
        category: 'other',
        skills: '',
        applicationDeadline: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Reset form when modal opens or editing job changes
    useEffect(() => {
        if (isOpen) {
            if (editingJob) {
                setFormData({
                    titleVi: editingJob.title?.vi || '',
                    titleEn: editingJob.title?.en || '',
                    descriptionVi: editingJob.description?.vi || '',
                    descriptionEn: editingJob.description?.en || '',
                    requirementsVi: editingJob.requirements?.vi || '',
                    requirementsEn: editingJob.requirements?.en || '',
                    benefitsVi: editingJob.benefits?.vi || '',
                    benefitsEn: editingJob.benefits?.en || '',
                    location: editingJob.location || '',
                    salaryMin: editingJob.salary?.min?.toString() || '',
                    salaryMax: editingJob.salary?.max?.toString() || '',
                    salaryCurrency: editingJob.salary?.currency || 'VND',
                    salaryNegotiable: editingJob.salary?.negotiable ?? true,
                    jobType: editingJob.jobType || 'full-time',
                    experienceLevel: editingJob.experienceLevel || 'entry',
                    category: editingJob.category || 'other',
                    skills: editingJob.skills?.join(', ') || '',
                    applicationDeadline: editingJob.applicationDeadline?.split('T')[0] || '',
                });
            } else {
                setFormData({
                    titleVi: '',
                    titleEn: '',
                    descriptionVi: '',
                    descriptionEn: '',
                    requirementsVi: '',
                    requirementsEn: '',
                    benefitsVi: '',
                    benefitsEn: '',
                    location: '',
                    salaryMin: '',
                    salaryMax: '',
                    salaryCurrency: 'VND',
                    salaryNegotiable: true,
                    jobType: 'full-time',
                    experienceLevel: 'entry',
                    category: 'other',
                    skills: '',
                    applicationDeadline: '',
                });
            }
            setErrors({});
        }
    }, [isOpen, editingJob]);

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

        if (!formData.titleVi.trim() && !formData.titleEn.trim()) {
            newErrors.title = t('job.titleRequired') || 'Title is required (at least one language)';
        }
        if (!formData.location.trim()) {
            newErrors.location = t('job.locationRequired') || 'Location is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const jobData: JobInput = {
                title: {
                    vi: formData.titleVi || formData.titleEn,
                    en: formData.titleEn || formData.titleVi,
                },
                description: {
                    vi: formData.descriptionVi,
                    en: formData.descriptionEn,
                },
                requirements: {
                    vi: formData.requirementsVi,
                    en: formData.requirementsEn,
                },
                benefits: {
                    vi: formData.benefitsVi,
                    en: formData.benefitsEn,
                },
                location: formData.location,
                salary: {
                    min: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
                    max: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
                    currency: formData.salaryCurrency,
                    negotiable: formData.salaryNegotiable,
                },
                jobType: formData.jobType,
                experienceLevel: formData.experienceLevel,
                category: formData.category,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
                applicationDeadline: formData.applicationDeadline || undefined,
            };

            await onSubmit(jobData);
            onClose();
        } catch (error) {
            console.error('Error submitting job:', error);
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
                        {editingJob ? (t('job.edit') || 'Edit Job') : (t('job.create') || 'Create New Job')}
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
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {t('job.title') || 'Job Title'} *
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    name="titleVi"
                                    placeholder="Tiếng Việt"
                                    value={formData.titleVi}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] ${
                                        errors.title ? 'border-red-500' : 'border-[var(--border-primary)]'
                                    }`}
                                />
                                <input
                                    type="text"
                                    name="titleEn"
                                    placeholder="English"
                                    value={formData.titleEn}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] ${
                                        errors.title ? 'border-red-500' : 'border-[var(--border-primary)]'
                                    }`}
                                />
                            </div>
                            {errors.title && (
                                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                            )}
                        </div>

                        {/* Category, Job Type, Experience */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                    {t('job.category') || 'Category'}
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                >
                                    {CATEGORY_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                    {t('job.type') || 'Job Type'}
                                </label>
                                <select
                                    name="jobType"
                                    value={formData.jobType}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                >
                                    {JOB_TYPE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                    {t('job.experience') || 'Experience'}
                                </label>
                                <select
                                    name="experienceLevel"
                                    value={formData.experienceLevel}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                >
                                    {EXPERIENCE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {t('job.location') || 'Location'} *
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g., Ho Chi Minh City, Vietnam"
                                className={`w-full px-3 py-2 bg-[var(--bg-secondary)] border rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] ${
                                    errors.location ? 'border-red-500' : 'border-[var(--border-primary)]'
                                }`}
                            />
                            {errors.location && (
                                <p className="text-red-500 text-xs mt-1">{errors.location}</p>
                            )}
                        </div>

                        {/* Salary */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {t('job.salary') || 'Salary Range'}
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                <input
                                    type="number"
                                    name="salaryMin"
                                    placeholder="Min"
                                    value={formData.salaryMin}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                                <input
                                    type="number"
                                    name="salaryMax"
                                    placeholder="Max"
                                    value={formData.salaryMax}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                                <select
                                    name="salaryCurrency"
                                    value={formData.salaryCurrency}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                >
                                    <option value="VND">VND</option>
                                    <option value="USD">USD</option>
                                </select>
                                <label className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="salaryNegotiable"
                                        checked={formData.salaryNegotiable}
                                        onChange={handleChange}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-[var(--text-secondary)]">{t('job.negotiable') || 'Negotiable'}</span>
                                </label>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {t('job.description') || 'Description'}
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                <textarea
                                    name={language === 'vi' ? 'descriptionVi' : 'descriptionEn'}
                                    value={language === 'vi' ? formData.descriptionVi : formData.descriptionEn}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder={language === 'vi' ? 'Mô tả công việc...' : 'Job description...'}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                />
                            </div>
                        </div>

                        {/* Requirements */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {t('job.requirements') || 'Requirements'}
                            </label>
                            <textarea
                                name={language === 'vi' ? 'requirementsVi' : 'requirementsEn'}
                                value={language === 'vi' ? formData.requirementsVi : formData.requirementsEn}
                                onChange={handleChange}
                                rows={3}
                                placeholder={language === 'vi' ? 'Yêu cầu công việc...' : 'Job requirements...'}
                                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                            />
                        </div>

                        {/* Benefits */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {t('job.benefits') || 'Benefits'}
                            </label>
                            <textarea
                                name={language === 'vi' ? 'benefitsVi' : 'benefitsEn'}
                                value={language === 'vi' ? formData.benefitsVi : formData.benefitsEn}
                                onChange={handleChange}
                                rows={2}
                                placeholder={language === 'vi' ? 'Quyền lợi...' : 'Benefits...'}
                                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                            />
                        </div>

                        {/* Skills */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {t('job.skills') || 'Skills (comma separated)'}
                            </label>
                            <input
                                type="text"
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                placeholder="e.g., React, TypeScript, Node.js"
                                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            />
                        </div>

                        {/* Application Deadline */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {t('job.deadline') || 'Application Deadline'}
                            </label>
                            <input
                                type="date"
                                name="applicationDeadline"
                                value={formData.applicationDeadline}
                                onChange={handleChange}
                                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                            {t('common.cancel') || 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors disabled:opacity-50"
                        >
                            {isSubmitting
                                ? (t('common.saving') || 'Saving...')
                                : editingJob
                                    ? (t('common.update') || 'Update')
                                    : (t('common.create') || 'Create')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JobManagementModal;
