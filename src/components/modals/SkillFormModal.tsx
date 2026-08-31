import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import { TagsInput } from '../shared';
import { updateSkill, type SkillDetail } from '../../services/skillService';

// Enum của model Skill ở backend — sai giá trị là 400 từ sanitizeSkillInput
const TIERS = ['Gold', 'Silver', 'Bronze', ''];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', ''];

interface SkillFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Skill đang sửa — thư viện skill là dữ liệu dựng sẵn nên chỉ có luồng sửa */
    editingSkill: SkillDetail | null;
    onSuccess?: (skill: SkillDetail) => void;
}

type FormState = {
    name: string;
    author: string;
    category: string;
    tier: string;
    difficulty: string;
    install_type: string;
    estimated_time_saving: string;
    github_stars: number;
    headline_vi: string;
    headline: string;
    short_description_vi: string;
    short_description: string;
    install_command: string;
    source_repo_url: string;
    url: string;
    source: string;
    works_with: string[];
    tags: string[];
    sections: {
        overview_vi: string;
        overview: string;
        setup_vi: string;
        setup: string;
        usage_vi: string;
        usage: string;
        requirements: string[];
        related_skills: string[];
    };
};

const EMPTY_FORM: FormState = {
    name: '', author: '', category: '', tier: 'Bronze', difficulty: 'Beginner',
    install_type: '', estimated_time_saving: '', github_stars: 0,
    headline_vi: '', headline: '', short_description_vi: '', short_description: '',
    install_command: '', source_repo_url: '', url: '', source: '',
    works_with: [], tags: [],
    sections: {
        overview_vi: '', overview: '', setup_vi: '', setup: '',
        usage_vi: '', usage: '', requirements: [], related_skills: []
    }
};

const INPUT_CLASS = 'w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]';
const TEXTAREA_CLASS = `${INPUT_CLASS} resize-none`;
const LABEL_CLASS = 'block text-sm font-medium text-[var(--text-primary)] mb-1';

// Màu nhấn của thư viện skill — trùng với SkillsPage / SkillDetailPage
const ACCENT = '#ff5a1f';

// Mỗi nhóm trường một tông riêng để form dài không thành một mảng xám
const TONES = {
    basics: ACCENT,
    intro: '#0ea5e9',
    classification: '#10b981',
    install: '#f59e0b',
    tags: '#f43f5e',
    sections: '#8b5cf6'
};

/** Tiêu đề nhóm trường: vạch màu + chữ cùng tông. */
const FormGroup: React.FC<{ tone: string; title: string; className?: string; children: React.ReactNode }> = ({ tone, title, className = '', children }) => (
    <section className={`space-y-4 ${className}`.trim()}>
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: tone }}>
            <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: tone }} />
            {title}
        </h3>
        {children}
    </section>
);

const TIER_BADGES: Record<string, { cls: string; emoji: string }> = {
    gold: { cls: 'tier-badge-gold', emoji: '🏆' },
    silver: { cls: 'tier-badge-silver', emoji: '🥈' },
    bronze: { cls: 'tier-badge-bronze', emoji: '🥉' }
};

const DIFFICULTY_TONES: Record<string, string> = {
    Beginner: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
    Intermediate: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    Advanced: 'bg-rose-500/10 text-rose-500 border-rose-500/30'
};

/** Nhãn trường kèm huy hiệu xem trước giá trị đang chọn. */
const LabelWithBadge: React.FC<{ label: string; badge?: React.ReactNode }> = ({ label, badge }) => (
    <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-1">
        {label}
        {badge}
    </label>
);

const SkillFormModal: React.FC<SkillFormModalProps> = ({ isOpen, onClose, editingSkill, onSuccess }) => {
    const { t } = useTranslation();
    const { token } = useAuth();

    const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (editingSkill) {
            setFormData({
                name: editingSkill.name || '',
                author: editingSkill.author || '',
                category: editingSkill.category || '',
                tier: editingSkill.tier || '',
                difficulty: editingSkill.difficulty || '',
                install_type: editingSkill.install_type || '',
                estimated_time_saving: editingSkill.estimated_time_saving || '',
                github_stars: editingSkill.github_stars || 0,
                headline_vi: editingSkill.headline_vi || '',
                headline: editingSkill.headline || '',
                short_description_vi: editingSkill.short_description_vi || '',
                short_description: editingSkill.short_description || '',
                install_command: editingSkill.install_command || '',
                source_repo_url: editingSkill.source_repo_url || '',
                url: editingSkill.url || '',
                source: editingSkill.source || '',
                works_with: editingSkill.works_with || [],
                tags: editingSkill.tags || [],
                sections: {
                    overview_vi: editingSkill.sections?.overview_vi || '',
                    overview: editingSkill.sections?.overview || '',
                    setup_vi: editingSkill.sections?.setup_vi || '',
                    setup: editingSkill.sections?.setup || '',
                    usage_vi: editingSkill.sections?.usage_vi || '',
                    usage: editingSkill.sections?.usage || '',
                    requirements: editingSkill.sections?.requirements || [],
                    related_skills: editingSkill.sections?.related_skills || []
                }
            });
        } else {
            setFormData(EMPTY_FORM);
        }
        setError(null);
    }, [editingSkill, isOpen]);

    const setField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    const setSection = <K extends keyof FormState['sections']>(field: K, value: FormState['sections'][K]) =>
        setFormData(prev => ({ ...prev, sections: { ...prev.sections, [field]: value } }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSkill || !token) return;

        if (!formData.name.trim()) {
            setError(t('workflow.skillsAdmin.errors.nameRequired'));
            return;
        }
        if (!formData.category.trim()) {
            setError(t('workflow.skillsAdmin.errors.categoryRequired'));
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const response = await updateSkill(editingSkill.slug, formData, token);
            onSuccess?.(response.data);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('workflow.skillsAdmin.errors.saveFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !editingSkill) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div
                    className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between gap-3"
                    style={{ background: `linear-gradient(135deg, ${ACCENT}1f, transparent 65%)` }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                            style={{ backgroundColor: `${ACCENT}26`, border: `1px solid ${ACCENT}59` }}
                        >
                            🧠
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-bold truncate" style={{ color: ACCENT }}>
                                {t('workflow.skillsAdmin.editTitle')}
                            </h2>
                            <p
                                className="text-xs font-mono truncate px-1.5 py-0.5 rounded inline-block"
                                style={{ backgroundColor: `${ACCENT}14`, color: ACCENT }}
                            >
                                /{editingSkill.slug}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        aria-label={t('workflow.skillsAdmin.cancel')}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <FormGroup tone={TONES.basics} title={t('workflow.skillsAdmin.groups.basics')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.name')} <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setField('name', e.target.value)}
                                    className={INPUT_CLASS}
                                    required
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.author')}</label>
                                <input
                                    type="text"
                                    value={formData.author}
                                    onChange={e => setField('author', e.target.value)}
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </FormGroup>

                    <FormGroup tone={TONES.intro} title={t('workflow.skillsAdmin.groups.intro')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.headlineVi')}</label>
                                <textarea
                                    value={formData.headline_vi}
                                    onChange={e => setField('headline_vi', e.target.value)}
                                    className={TEXTAREA_CLASS}
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.headlineEn')}</label>
                                <textarea
                                    value={formData.headline}
                                    onChange={e => setField('headline', e.target.value)}
                                    className={TEXTAREA_CLASS}
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Mô tả ngắn vi / en */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.shortDescVi')}</label>
                                <textarea
                                    value={formData.short_description_vi}
                                    onChange={e => setField('short_description_vi', e.target.value)}
                                    className={TEXTAREA_CLASS}
                                    rows={3}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.shortDescEn')}</label>
                                <textarea
                                    value={formData.short_description}
                                    onChange={e => setField('short_description', e.target.value)}
                                    className={TEXTAREA_CLASS}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </FormGroup>

                    <FormGroup tone={TONES.classification} title={t('workflow.skillsAdmin.groups.classification')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.category')} <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={e => setField('category', e.target.value)}
                                    className={INPUT_CLASS}
                                    required
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.installType')}</label>
                                <input
                                    type="text"
                                    value={formData.install_type}
                                    onChange={e => setField('install_type', e.target.value)}
                                    className={INPUT_CLASS}
                                    placeholder="Git Clone / npm / pip / MCP"
                                />
                            </div>
                            <div>
                                <LabelWithBadge
                                    label={t('workflow.skillsAdmin.fields.tier')}
                                    badge={TIER_BADGES[formData.tier.toLowerCase()] && (
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${TIER_BADGES[formData.tier.toLowerCase()].cls}`}>
                                            <span>{TIER_BADGES[formData.tier.toLowerCase()].emoji}</span>
                                            <span>{formData.tier}</span>
                                        </span>
                                    )}
                                />
                                <select
                                    value={formData.tier}
                                    onChange={e => setField('tier', e.target.value)}
                                    className={INPUT_CLASS}
                                >
                                    {TIERS.map(tier => (
                                        <option key={tier || 'none'} value={tier}>
                                            {tier || t('workflow.skillsAdmin.fields.none')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <LabelWithBadge
                                    label={t('workflow.skillsAdmin.fields.difficulty')}
                                    badge={formData.difficulty && (
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${DIFFICULTY_TONES[formData.difficulty] || ''}`}>
                                            {formData.difficulty}
                                        </span>
                                    )}
                                />
                                <select
                                    value={formData.difficulty}
                                    onChange={e => setField('difficulty', e.target.value)}
                                    className={INPUT_CLASS}
                                >
                                    {DIFFICULTIES.map(diff => (
                                        <option key={diff || 'none'} value={diff}>
                                            {diff || t('workflow.skillsAdmin.fields.none')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.timeSaving')}</label>
                                <input
                                    type="text"
                                    value={formData.estimated_time_saving}
                                    onChange={e => setField('estimated_time_saving', e.target.value)}
                                    className={INPUT_CLASS}
                                    placeholder="2 hours / 30 minutes"
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.githubStars')}</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={formData.github_stars}
                                    onChange={e => setField('github_stars', Number(e.target.value))}
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>
                    </FormGroup>

                    <FormGroup tone={TONES.install} title={t('workflow.skillsAdmin.groups.install')}>
                        <div>
                            <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.installCommand')}</label>
                            <input
                                type="text"
                                value={formData.install_command}
                                onChange={e => setField('install_command', e.target.value)}
                                className={`${INPUT_CLASS} font-mono text-sm`}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.sourceRepoUrl')}</label>
                                <input
                                    type="url"
                                    value={formData.source_repo_url}
                                    onChange={e => setField('source_repo_url', e.target.value)}
                                    className={INPUT_CLASS}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.url')}</label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={e => setField('url', e.target.value)}
                                    className={INPUT_CLASS}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.source')}</label>
                            <input
                                type="text"
                                value={formData.source}
                                onChange={e => setField('source', e.target.value)}
                                className={INPUT_CLASS}
                            />
                        </div>
                    </FormGroup>

                    <FormGroup tone={TONES.tags} title={t('workflow.skillsAdmin.groups.tags')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.worksWith')}</label>
                                <TagsInput
                                    tags={formData.works_with}
                                    onChange={tags => setField('works_with', tags)}
                                    placeholder={t('workflow.skillsAdmin.fields.worksWithPlaceholder')}
                                    maxTags={12}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.tags')}</label>
                                <TagsInput
                                    tags={formData.tags}
                                    onChange={tags => setField('tags', tags)}
                                    placeholder={t('workflow.skillsAdmin.fields.tagsPlaceholder')}
                                    maxTags={15}
                                />
                            </div>
                        </div>
                    </FormGroup>

                    {/* Nội dung chi tiết */}
                    <FormGroup
                        tone={TONES.sections}
                        title={t('workflow.skillsAdmin.sectionsTitle')}
                        className="pt-6 border-t border-[var(--border-primary)]"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.overviewVi')}</label>
                                <textarea
                                    value={formData.sections.overview_vi}
                                    onChange={e => setSection('overview_vi', e.target.value)}
                                    className={TEXTAREA_CLASS}
                                    rows={6}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.overviewEn')}</label>
                                <textarea
                                    value={formData.sections.overview}
                                    onChange={e => setSection('overview', e.target.value)}
                                    className={TEXTAREA_CLASS}
                                    rows={6}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.setupVi')}</label>
                                <textarea
                                    value={formData.sections.setup_vi}
                                    onChange={e => setSection('setup_vi', e.target.value)}
                                    className={`${TEXTAREA_CLASS} font-mono text-sm`}
                                    rows={6}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.setupEn')}</label>
                                <textarea
                                    value={formData.sections.setup}
                                    onChange={e => setSection('setup', e.target.value)}
                                    className={`${TEXTAREA_CLASS} font-mono text-sm`}
                                    rows={6}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.usageVi')}</label>
                                <textarea
                                    value={formData.sections.usage_vi}
                                    onChange={e => setSection('usage_vi', e.target.value)}
                                    className={`${TEXTAREA_CLASS} font-mono text-sm`}
                                    rows={6}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.usageEn')}</label>
                                <textarea
                                    value={formData.sections.usage}
                                    onChange={e => setSection('usage', e.target.value)}
                                    className={`${TEXTAREA_CLASS} font-mono text-sm`}
                                    rows={6}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.requirements')}</label>
                                <TagsInput
                                    tags={formData.sections.requirements}
                                    onChange={tags => setSection('requirements', tags)}
                                    placeholder={t('workflow.skillsAdmin.fields.requirementsPlaceholder')}
                                    maxTags={15}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>{t('workflow.skillsAdmin.fields.relatedSkills')}</label>
                                <TagsInput
                                    tags={formData.sections.related_skills}
                                    onChange={tags => setSection('related_skills', tags)}
                                    placeholder={t('workflow.skillsAdmin.fields.relatedSkillsPlaceholder')}
                                    maxTags={15}
                                />
                            </div>
                        </div>
                    </FormGroup>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border-primary)] flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        {t('workflow.skillsAdmin.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{ backgroundColor: ACCENT }}
                        className="px-6 py-2.5 text-white font-bold rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {isSubmitting ? t('workflow.skillsAdmin.saving') : t('workflow.skillsAdmin.update')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SkillFormModal;
