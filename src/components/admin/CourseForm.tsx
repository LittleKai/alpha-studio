import React, { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import {
    createCourse,
    updateCourse,
    Course,
    CourseInput,
    Module,
    Lesson,
    LearningOutcome
} from '../../services/courseService';
import ModuleEditor from './ModuleEditor';

interface CourseFormProps {
    course: Course | null;
    onClose: () => void;
    onSuccess: () => void;
}

type LanguageTab = 'vi' | 'en';

const CourseForm: React.FC<CourseFormProps> = ({ course, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const isEditing = !!course;

    // Language tab
    const [activeTab, setActiveTab] = useState<LanguageTab>('vi');

    // Form state
    const [titleVi, setTitleVi] = useState(course?.title.vi || '');
    const [titleEn, setTitleEn] = useState(course?.title.en || '');
    const [descriptionVi, setDescriptionVi] = useState(course?.description.vi || '');
    const [descriptionEn, setDescriptionEn] = useState(course?.description.en || '');
    const [category, setCategory] = useState(course?.category || 'ai-basic');
    const [thumbnail, setThumbnail] = useState(course?.thumbnail || '');
    const [duration, setDuration] = useState(course?.duration || 0);
    const [level, setLevel] = useState(course?.level || 'beginner');
    const [price, setPrice] = useState(course?.price || 0);
    const [discount, setDiscount] = useState(course?.discount || 0);
    const [instructorName, setInstructorName] = useState(course?.instructor?.name || '');
    const [instructorAvatar, setInstructorAvatar] = useState(course?.instructor?.avatar || '');
    const [instructorBio, setInstructorBio] = useState(course?.instructor?.bio || '');
    const [tags, setTags] = useState<string[]>(course?.tags || []);
    const [tagInput, setTagInput] = useState('');
    const [prerequisites, setPrerequisites] = useState<string[]>(course?.prerequisites || []);
    const [prerequisiteInput, setPrerequisiteInput] = useState('');
    const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>(
        course?.learningOutcomes || []
    );
    const [modules, setModules] = useState<Module[]>(course?.modules || []);

    // UI state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'basic' | 'content' | 'pricing' | 'modules'>('basic');

    // Handlers
    const handleAddTag = useCallback(() => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    }, [tagInput, tags]);

    const handleRemoveTag = useCallback((tag: string) => {
        setTags(tags.filter(t => t !== tag));
    }, [tags]);

    const handleAddPrerequisite = useCallback(() => {
        if (prerequisiteInput.trim() && !prerequisites.includes(prerequisiteInput.trim())) {
            setPrerequisites([...prerequisites, prerequisiteInput.trim()]);
            setPrerequisiteInput('');
        }
    }, [prerequisiteInput, prerequisites]);

    const handleRemovePrerequisite = useCallback((prereq: string) => {
        setPrerequisites(prerequisites.filter(p => p !== prereq));
    }, [prerequisites]);

    const handleAddLearningOutcome = useCallback(() => {
        setLearningOutcomes([...learningOutcomes, { vi: '', en: '' }]);
    }, [learningOutcomes]);

    const handleUpdateLearningOutcome = useCallback((index: number, lang: 'vi' | 'en', value: string) => {
        const updated = [...learningOutcomes];
        updated[index] = { ...updated[index], [lang]: value };
        setLearningOutcomes(updated);
    }, [learningOutcomes]);

    const handleRemoveLearningOutcome = useCallback((index: number) => {
        setLearningOutcomes(learningOutcomes.filter((_, i) => i !== index));
    }, [learningOutcomes]);

    const handleSubmit = useCallback(async (status: 'draft' | 'published') => {
        // Validation
        if (!titleVi.trim() || !titleEn.trim()) {
            setError(t('admin.courses.form.errors.titleRequired'));
            return;
        }

        if (!category) {
            setError(t('admin.courses.form.errors.categoryRequired'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data: CourseInput = {
                title: { vi: titleVi.trim(), en: titleEn.trim() },
                description: { vi: descriptionVi.trim(), en: descriptionEn.trim() },
                category,
                thumbnail,
                duration,
                level,
                price,
                discount,
                status,
                instructor: {
                    name: instructorName,
                    avatar: instructorAvatar,
                    bio: instructorBio
                },
                modules,
                tags,
                prerequisites,
                learningOutcomes: learningOutcomes.filter(lo => lo.vi || lo.en)
            };

            if (isEditing && course) {
                await updateCourse(course._id, data);
            } else {
                await createCourse(data);
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save course');
        } finally {
            setLoading(false);
        }
    }, [
        titleVi, titleEn, descriptionVi, descriptionEn, category, thumbnail,
        duration, level, price, discount, instructorName, instructorAvatar,
        instructorBio, modules, tags, prerequisites, learningOutcomes,
        isEditing, course, onSuccess, t
    ]);

    const sections = [
        { id: 'basic', label: t('admin.courses.form.basicInfo'), icon: '📋' },
        { id: 'content', label: t('admin.courses.form.content'), icon: '📝' },
        { id: 'pricing', label: t('admin.courses.form.pricing'), icon: '💰' },
        { id: 'modules', label: t('admin.courses.form.modules'), icon: '📚' },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-40 glass-card border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                            {isEditing ? t('admin.courses.editCourse') : t('admin.courses.createNew')}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleSubmit('draft')}
                            disabled={loading}
                            className="px-6 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50"
                        >
                            {t('admin.courses.form.saveDraft')}
                        </button>
                        <button
                            onClick={() => handleSubmit('published')}
                            disabled={loading}
                            className="px-6 py-2.5 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? t('admin.courses.form.saving') : t('admin.courses.form.publishCourse')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                        {error}
                        <button onClick={() => setError(null)} className="ml-4 underline">
                            {t('admin.courses.dismiss')}
                        </button>
                    </div>
                )}

                <div className="flex gap-8">
                    {/* Sidebar Navigation */}
                    <div className="w-64 flex-shrink-0">
                        <div className="glass-card rounded-2xl p-4 sticky top-28">
                            <nav className="space-y-2">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id as typeof activeSection)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                                            activeSection === section.id
                                                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                                        }`}
                                    >
                                        <span>{section.icon}</span>
                                        <span className="font-medium">{section.label}</span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="flex-1 min-w-0">
                        {/* Language Tabs */}
                        {(activeSection === 'basic' || activeSection === 'content') && (
                            <div className="flex gap-2 mb-6">
                                <button
                                    onClick={() => setActiveTab('vi')}
                                    className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                                        activeTab === 'vi'
                                            ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                                    }`}
                                >
                                    🇻🇳 Tiếng Việt
                                </button>
                                <button
                                    onClick={() => setActiveTab('en')}
                                    className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                                        activeTab === 'en'
                                            ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                                    }`}
                                >
                                    🇺🇸 English
                                </button>
                            </div>
                        )}

                        {/* Basic Info Section */}
                        {activeSection === 'basic' && (
                            <div className="glass-card rounded-2xl p-6 space-y-6">
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                    {t('admin.courses.form.basicInfo')}
                                </h2>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        {t('admin.courses.form.title')} *
                                    </label>
                                    {activeTab === 'vi' ? (
                                        <input
                                            type="text"
                                            value={titleVi}
                                            onChange={(e) => setTitleVi(e.target.value)}
                                            placeholder={t('admin.courses.form.titlePlaceholder')}
                                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={titleEn}
                                            onChange={(e) => setTitleEn(e.target.value)}
                                            placeholder={t('admin.courses.form.titlePlaceholder')}
                                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        />
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        {t('admin.courses.form.description')}
                                    </label>
                                    {activeTab === 'vi' ? (
                                        <textarea
                                            value={descriptionVi}
                                            onChange={(e) => setDescriptionVi(e.target.value)}
                                            rows={4}
                                            placeholder={t('admin.courses.form.descriptionPlaceholder')}
                                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                        />
                                    ) : (
                                        <textarea
                                            value={descriptionEn}
                                            onChange={(e) => setDescriptionEn(e.target.value)}
                                            rows={4}
                                            placeholder={t('admin.courses.form.descriptionPlaceholder')}
                                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                        />
                                    )}
                                </div>

                                {/* Category & Level */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            {t('admin.courses.form.category')} *
                                        </label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value as Course['category'])}
                                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        >
                                            <option value="ai-basic">{t('admin.courses.categories.aiBasic')}</option>
                                            <option value="ai-advanced">{t('admin.courses.categories.aiAdvanced')}</option>
                                            <option value="ai-studio">{t('admin.courses.categories.aiStudio')}</option>
                                            <option value="ai-creative">{t('admin.courses.categories.aiCreative')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            {t('admin.courses.form.level')}
                                        </label>
                                        <select
                                            value={level}
                                            onChange={(e) => setLevel(e.target.value as Course['level'])}
                                            className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        >
                                            <option value="beginner">{t('admin.courses.levels.beginner')}</option>
                                            <option value="intermediate">{t('admin.courses.levels.intermediate')}</option>
                                            <option value="advanced">{t('admin.courses.levels.advanced')}</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Thumbnail */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        {t('admin.courses.form.thumbnail')}
                                    </label>
                                    <input
                                        type="text"
                                        value={thumbnail}
                                        onChange={(e) => setThumbnail(e.target.value)}
                                        placeholder={t('admin.courses.form.thumbnailPlaceholder')}
                                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                    {thumbnail && (
                                        <div className="mt-3 w-40 h-24 rounded-lg overflow-hidden bg-[var(--bg-secondary)]">
                                            <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>

                                {/* Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                        {t('admin.courses.form.duration')}
                                    </label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                        min={0}
                                        className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Content Section */}
                        {activeSection === 'content' && (
                            <div className="space-y-6">
                                {/* Instructor */}
                                <div className="glass-card rounded-2xl p-6">
                                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
                                        {t('admin.courses.form.instructor')}
                                    </h2>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                                    {t('admin.courses.form.instructorName')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={instructorName}
                                                    onChange={(e) => setInstructorName(e.target.value)}
                                                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                                    {t('admin.courses.form.instructorAvatar')}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={instructorAvatar}
                                                    onChange={(e) => setInstructorAvatar(e.target.value)}
                                                    placeholder="URL"
                                                    className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                                {t('admin.courses.form.instructorBio')}
                                            </label>
                                            <textarea
                                                value={instructorBio}
                                                onChange={(e) => setInstructorBio(e.target.value)}
                                                rows={3}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="glass-card rounded-2xl p-6">
                                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
                                        {t('admin.courses.form.tags')}
                                    </h2>
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                                            placeholder={t('admin.courses.form.addTag')}
                                            className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        />
                                        <button
                                            onClick={handleAddTag}
                                            className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-xl"
                                        >
                                            {t('admin.courses.form.add')}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full text-sm flex items-center gap-2"
                                            >
                                                {tag}
                                                <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-400">
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Prerequisites */}
                                <div className="glass-card rounded-2xl p-6">
                                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">
                                        {t('admin.courses.form.prerequisites')}
                                    </h2>
                                    <div className="flex gap-2 mb-4">
                                        <input
                                            type="text"
                                            value={prerequisiteInput}
                                            onChange={(e) => setPrerequisiteInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddPrerequisite()}
                                            placeholder={t('admin.courses.form.addPrerequisite')}
                                            className="flex-1 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        />
                                        <button
                                            onClick={handleAddPrerequisite}
                                            className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-xl"
                                        >
                                            {t('admin.courses.form.add')}
                                        </button>
                                    </div>
                                    <ul className="space-y-2">
                                        {prerequisites.map((prereq) => (
                                            <li
                                                key={prereq}
                                                className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg"
                                            >
                                                <span className="text-[var(--text-primary)]">{prereq}</span>
                                                <button
                                                    onClick={() => handleRemovePrerequisite(prereq)}
                                                    className="text-[var(--text-tertiary)] hover:text-red-400"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Learning Outcomes */}
                                <div className="glass-card rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                            {t('admin.courses.form.learningOutcomes')}
                                        </h2>
                                        <button
                                            onClick={handleAddLearningOutcome}
                                            className="px-4 py-2 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-xl text-sm font-medium"
                                        >
                                            + {t('admin.courses.form.addOutcome')}
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {learningOutcomes.map((outcome, index) => (
                                            <div key={index} className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                                                        #{index + 1}
                                                    </span>
                                                    <button
                                                        onClick={() => handleRemoveLearningOutcome(index)}
                                                        className="text-[var(--text-tertiary)] hover:text-red-400"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        value={outcome.vi}
                                                        onChange={(e) => handleUpdateLearningOutcome(index, 'vi', e.target.value)}
                                                        placeholder="Tiếng Việt"
                                                        className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={outcome.en}
                                                        onChange={(e) => handleUpdateLearningOutcome(index, 'en', e.target.value)}
                                                        placeholder="English"
                                                        className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pricing Section */}
                        {activeSection === 'pricing' && (
                            <div className="glass-card rounded-2xl p-6 space-y-6">
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                    {t('admin.courses.form.pricing')}
                                </h2>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            {t('admin.courses.form.price')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={price}
                                                onChange={(e) => setPrice(Number(e.target.value))}
                                                min={0}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] pr-16"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                                                VND
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            {t('admin.courses.form.discount')}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={discount}
                                                onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                                                min={0}
                                                max={100}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] pr-10"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                                                %
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Price Preview */}
                                <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                                        {t('admin.courses.form.pricePreview')}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {discount > 0 ? (
                                            <>
                                                <span className="text-2xl font-bold text-[var(--accent-primary)]">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Math.round(price * (1 - discount / 100)))}
                                                </span>
                                                <span className="text-lg text-[var(--text-tertiary)] line-through">
                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price)}
                                                </span>
                                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-sm font-bold rounded">
                                                    -{discount}%
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-2xl font-bold text-[var(--text-primary)]">
                                                {price > 0
                                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price)
                                                    : t('admin.courses.free')
                                                }
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Modules Section */}
                        {activeSection === 'modules' && (
                            <ModuleEditor
                                modules={modules}
                                onChange={setModules}
                            />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CourseForm;
