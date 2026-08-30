import { useState } from 'react';
import { useTranslation } from '../../i18n/context';
import {
    publishProjectToLibrary, publishDocumentToLibrary,
    ITEM_TYPES, CATEGORIES, INDUSTRIES, OBJECTIVES, DEPTHS,
    type ItemType, type EventLibraryItem
} from '../../services/eventLibraryService';

const ACCENT = '#7c5cff';

export interface PublishSource {
    /** Đăng cả dự án (case study) hay chỉ một tài liệu đính kèm */
    kind: 'project' | 'document';
    id: string;
    /** Tên gợi ý sẵn trong ô tiêu đề */
    name: string;
    /** Mô tả/ghi chú gợi ý sẵn */
    summary?: string;
}

/**
 * Đăng một dự án hoặc tài liệu trong Workflow lên Thư viện sự kiện. Bản ghi tạo
 * ra thuộc về tài khoản người đăng — mặc định riêng tư, người đăng tự chọn công
 * khai.
 */
export default function PublishToLibraryModal({
    source,
    onClose,
    onPublished,
}: {
    source: PublishSource;
    onClose: () => void;
    onPublished?: (item: EventLibraryItem) => void;
}) {
    const { t } = useTranslation();

    const [itemType, setItemType] = useState<ItemType>(source.kind === 'project' ? 'case_study' : 'template');
    const [visibility, setVisibility] = useState<'private' | 'public'>('private');
    const [category, setCategory] = useState<string>('other');
    const [depth, setDepth] = useState<string>('basic');
    const [title, setTitle] = useState(source.name);
    const [summary, setSummary] = useState(source.summary || '');
    const [industries, setIndustries] = useState<string[]>([]);
    const [objectives, setObjectives] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const toggle = (list: string[], value: string, set: (next: string[]) => void) =>
        set(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError(t('eventLibrary.publish.titleRequired'));
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const overrides = {
                itemType, visibility, category, depth,
                title: title.trim(), summary: summary.trim(),
                industries, objectives
            };
            const item = source.kind === 'project'
                ? await publishProjectToLibrary(source.id, overrides)
                : await publishDocumentToLibrary(source.id, overrides);
            onPublished?.(item);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('eventLibrary.publish.failed'));
            setSubmitting(false);
        }
    };

    const chip = (active: boolean) =>
        `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none border ${
            active
                ? 'text-white border-transparent'
                : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative z-10 w-full max-w-2xl max-h-[88vh] overflow-y-auto custom-scrollbar bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-primary)]">
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)] sticky top-0 bg-[var(--bg-card)] z-10">
                    <div>
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">{t('eventLibrary.publish.title')}</h2>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{t('eventLibrary.publish.subtitle')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded-lg cursor-pointer"
                        aria-label="Close"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                            {t('eventLibrary.publish.itemTitle')}
                        </label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                            {t('eventLibrary.publish.itemSummary')}
                        </label>
                        <textarea
                            value={summary}
                            onChange={e => setSummary(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                            {t('eventLibrary.publish.itemType')}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {ITEM_TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setItemType(type)}
                                    style={itemType === type ? { backgroundColor: ACCENT } : undefined}
                                    className={chip(itemType === type)}
                                >
                                    {t('eventLibrary.types.' + type)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                            {t('eventLibrary.publish.visibility')}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {(['private', 'public'] as const).map(value => (
                                <button
                                    key={value}
                                    onClick={() => setVisibility(value)}
                                    style={visibility === value ? { backgroundColor: ACCENT } : undefined}
                                    className={chip(visibility === value)}
                                >
                                    {t('eventLibrary.publish.visibilities.' + value)}
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-2">
                            {t('eventLibrary.publish.visibilities.' + visibility + 'Hint')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                                {t('eventLibrary.category')}
                            </label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
                            >
                                {CATEGORIES.map(value => (
                                    <option key={value} value={value}>{t('eventLibrary.categories.' + value)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                                {t('eventLibrary.depth')}
                            </label>
                            <select
                                value={depth}
                                onChange={e => setDepth(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none cursor-pointer"
                            >
                                {DEPTHS.map(value => (
                                    <option key={value} value={value}>{t('eventLibrary.depths.' + value)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                            {t('eventLibrary.industry')}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {INDUSTRIES.map(value => (
                                <button
                                    key={value}
                                    onClick={() => toggle(industries, value, setIndustries)}
                                    style={industries.includes(value) ? { backgroundColor: ACCENT } : undefined}
                                    className={chip(industries.includes(value))}
                                >
                                    {t('eventLibrary.industries.' + value)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                            {t('eventLibrary.objective')}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {OBJECTIVES.map(value => (
                                <button
                                    key={value}
                                    onClick={() => toggle(objectives, value, setObjectives)}
                                    style={objectives.includes(value) ? { backgroundColor: ACCENT } : undefined}
                                    className={chip(objectives.includes(value))}
                                >
                                    {t('eventLibrary.objectives.' + value)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 p-6 border-t border-[var(--border-primary)] sticky bottom-0 bg-[var(--bg-card)]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                    >
                        {t('eventLibrary.publish.cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        style={{ backgroundColor: ACCENT }}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {submitting ? t('eventLibrary.publish.publishing') : t('eventLibrary.publish.submit')}
                    </button>
                </div>
            </div>
        </div>
    );
}
