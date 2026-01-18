import React, { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { createJob, updateJob, Job, JobInput } from '../../services/jobService';

interface JobFormProps {
    job: Job | null;
    onClose: () => void;
    onSuccess: () => void;
}

type LanguageTab = 'vi' | 'en';

const JobForm: React.FC<JobFormProps> = ({ job, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const isEditing = !!job;

    // Language tab
    const [activeTab, setActiveTab] = useState<LanguageTab>('vi');

    // Form state
    const [titleVi, setTitleVi] = useState(job?.title?.vi || '');
    const [titleEn, setTitleEn] = useState(job?.title?.en || '');
    const [descriptionVi, setDescriptionVi] = useState(job?.description?.vi || '');
    const [descriptionEn, setDescriptionEn] = useState(job?.description?.en || '');
    const [requirementsVi, setRequirementsVi] = useState(job?.requirements?.vi || '');
    const [requirementsEn, setRequirementsEn] = useState(job?.requirements?.en || '');
    const [benefitsVi, _setBenefitsVi] = useState(job?.benefits?.vi || '');
    const [benefitsEn, _setBenefitsEn] = useState(job?.benefits?.en || '');
    const [location, setLocation] = useState(job?.location || '');
    const [salaryMin, setSalaryMin] = useState(job?.salary?.min || 0);
    const [salaryMax, setSalaryMax] = useState(job?.salary?.max || 0);
    const [salaryCurrency, setSalaryCurrency] = useState(job?.salary?.currency || 'VND');
    const [salaryNegotiable, setSalaryNegotiable] = useState(job?.salary?.negotiable || false);
    const [jobType, setJobType] = useState(job?.jobType || 'full-time');
    const [experienceLevel, setExperienceLevel] = useState(job?.experienceLevel || 'mid');
    const [category, setCategory] = useState(job?.category || 'engineering');
    const [skills, setSkills] = useState<string[]>(job?.skills || []);
    const [skillInput, setSkillInput] = useState('');
    const [applicationDeadline, setApplicationDeadline] = useState(
        job?.applicationDeadline ? job.applicationDeadline.split('T')[0] : ''
    );

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddSkill = useCallback(() => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            setSkills([...skills, skillInput.trim()]);
            setSkillInput('');
        }
    }, [skillInput, skills]);

    const handleRemoveSkill = useCallback((skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    }, [skills]);

    const handleSubmit = useCallback(async (status: 'draft' | 'published') => {
        if (!titleVi.trim() || !titleEn.trim()) {
            setError(t('admin.jobs.form.errors.titleRequired'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data: JobInput = {
                title: { vi: titleVi.trim(), en: titleEn.trim() },
                description: { vi: descriptionVi.trim(), en: descriptionEn.trim() },
                requirements: { vi: requirementsVi.trim(), en: requirementsEn.trim() },
                benefits: { vi: benefitsVi.trim(), en: benefitsEn.trim() },
                location: location.trim(),
                salary: {
                    min: salaryMin,
                    max: salaryMax,
                    currency: salaryCurrency,
                    negotiable: salaryNegotiable
                },
                jobType,
                experienceLevel,
                category,
                skills,
                status,
                applicationDeadline: applicationDeadline || undefined
            };

            if (isEditing) {
                await updateJob(job._id, data);
            } else {
                await createJob(data);
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save job');
        } finally {
            setLoading(false);
        }
    }, [titleVi, titleEn, descriptionVi, descriptionEn, requirementsVi, requirementsEn, benefitsVi, benefitsEn, location, salaryMin, salaryMax, salaryCurrency, salaryNegotiable, jobType, experienceLevel, category, skills, applicationDeadline, isEditing, job, onSuccess, t]);

    const categories = [
        { value: 'engineering', label: t('admin.jobs.categories.engineering') },
        { value: 'design', label: t('admin.jobs.categories.design') },
        { value: 'marketing', label: t('admin.jobs.categories.marketing') },
        { value: 'operations', label: t('admin.jobs.categories.operations') },
        { value: 'hr', label: t('admin.jobs.categories.hr') },
        { value: 'finance', label: t('admin.jobs.categories.finance') },
        { value: 'other', label: t('admin.jobs.categories.other') }
    ];

    const jobTypes = [
        { value: 'full-time', label: t('admin.jobs.types.fullTime') },
        { value: 'part-time', label: t('admin.jobs.types.partTime') },
        { value: 'contract', label: t('admin.jobs.types.contract') },
        { value: 'internship', label: t('admin.jobs.types.internship') },
        { value: 'remote', label: t('admin.jobs.types.remote') }
    ];

    const experienceLevels = [
        { value: 'entry', label: t('admin.jobs.levels.entry') },
        { value: 'junior', label: t('admin.jobs.levels.junior') },
        { value: 'mid', label: t('admin.jobs.levels.mid') },
        { value: 'senior', label: t('admin.jobs.levels.senior') },
        { value: 'lead', label: t('admin.jobs.levels.lead') }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--bg-primary)] rounded-2xl shadow-xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        {isEditing ? t('admin.jobs.editJob') : t('admin.jobs.createJob')}
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
                    {/* Language Tabs */}
                    <div className="flex gap-2 mb-4">
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

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.jobs.form.title')} *
                        </label>
                        {activeTab === 'vi' ? (
                            <input
                                type="text"
                                value={titleVi}
                                onChange={(e) => setTitleVi(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                placeholder={t('admin.jobs.form.titlePlaceholder')}
                            />
                        ) : (
                            <input
                                type="text"
                                value={titleEn}
                                onChange={(e) => setTitleEn(e.target.value)}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                placeholder={t('admin.jobs.form.titlePlaceholder')}
                            />
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.jobs.form.description')}
                        </label>
                        {activeTab === 'vi' ? (
                            <textarea
                                value={descriptionVi}
                                onChange={(e) => setDescriptionVi(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                placeholder={t('admin.jobs.form.descriptionPlaceholder')}
                            />
                        ) : (
                            <textarea
                                value={descriptionEn}
                                onChange={(e) => setDescriptionEn(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                placeholder={t('admin.jobs.form.descriptionPlaceholder')}
                            />
                        )}
                    </div>

                    {/* Requirements */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.jobs.form.requirements')}
                        </label>
                        {activeTab === 'vi' ? (
                            <textarea
                                value={requirementsVi}
                                onChange={(e) => setRequirementsVi(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                placeholder={t('admin.jobs.form.requirementsPlaceholder')}
                            />
                        ) : (
                            <textarea
                                value={requirementsEn}
                                onChange={(e) => setRequirementsEn(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                placeholder={t('admin.jobs.form.requirementsPlaceholder')}
                            />
                        )}
                    </div>

                    {/* Category, Job Type, Experience Level */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t('admin.jobs.form.category')}
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as any)}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t('admin.jobs.form.jobType')}
                            </label>
                            <select
                                value={jobType}
                                onChange={(e) => setJobType(e.target.value as any)}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            >
                                {jobTypes.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                {t('admin.jobs.form.experienceLevel')}
                            </label>
                            <select
                                value={experienceLevel}
                                onChange={(e) => setExperienceLevel(e.target.value as any)}
                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            >
                                {experienceLevels.map(level => (
                                    <option key={level.value} value={level.value}>{level.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.jobs.form.location')}
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            placeholder={t('admin.jobs.form.locationPlaceholder')}
                        />
                    </div>

                    {/* Salary */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.jobs.form.salary')}
                        </label>
                        <div className="grid grid-cols-4 gap-4">
                            <input
                                type="number"
                                value={salaryMin}
                                onChange={(e) => setSalaryMin(parseInt(e.target.value) || 0)}
                                className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                placeholder="Min"
                                disabled={salaryNegotiable}
                            />
                            <input
                                type="number"
                                value={salaryMax}
                                onChange={(e) => setSalaryMax(parseInt(e.target.value) || 0)}
                                className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                placeholder="Max"
                                disabled={salaryNegotiable}
                            />
                            <select
                                value={salaryCurrency}
                                onChange={(e) => setSalaryCurrency(e.target.value)}
                                className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            >
                                <option value="VND">VND</option>
                                <option value="USD">USD</option>
                            </select>
                            <label className="flex items-center gap-2 px-4">
                                <input
                                    type="checkbox"
                                    checked={salaryNegotiable}
                                    onChange={(e) => setSalaryNegotiable(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm text-[var(--text-secondary)]">
                                    {t('admin.jobs.form.negotiable')}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Skills */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.jobs.form.skills')}
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                                className="flex-1 px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                placeholder={t('admin.jobs.form.skillsPlaceholder')}
                            />
                            <button
                                type="button"
                                onClick={handleAddSkill}
                                className="px-4 py-3 bg-[var(--accent-primary)] text-white rounded-xl hover:opacity-90"
                            >
                                {t('admin.jobs.form.addSkill')}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {skills.map(skill => (
                                <span
                                    key={skill}
                                    className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full text-sm flex items-center gap-1"
                                >
                                    {skill}
                                    <button
                                        onClick={() => handleRemoveSkill(skill)}
                                        className="hover:text-red-400"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Application Deadline */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t('admin.jobs.form.deadline')}
                        </label>
                        <input
                            type="date"
                            value={applicationDeadline}
                            onChange={(e) => setApplicationDeadline(e.target.value)}
                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-6 py-3 text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                    >
                        {t('admin.jobs.form.cancel')}
                    </button>
                    <button
                        onClick={() => handleSubmit('draft')}
                        disabled={loading}
                        className="px-6 py-3 text-sm font-medium bg-yellow-500/10 text-yellow-400 rounded-xl hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                    >
                        {loading ? t('admin.jobs.form.saving') : t('admin.jobs.form.saveDraft')}
                    </button>
                    <button
                        onClick={() => handleSubmit('published')}
                        disabled={loading}
                        className="px-6 py-3 text-sm font-medium bg-[var(--accent-primary)] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {loading ? t('admin.jobs.form.saving') : t('admin.jobs.form.publish')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobForm;
