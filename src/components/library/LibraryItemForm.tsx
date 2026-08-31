import { useState, type ReactNode } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import { useTheme } from '../../theme/context';
import { libraryEditorInit } from './libraryEditorInit';
import { uploadImage } from '../../services/cloudinaryService';
import { uploadToB2 } from '../../services/b2StorageService';
import { compressImage } from '../../services/imageCompression';
import SectionEditor from './SectionEditor';
import { cdnFromUrl } from '../../services/cloudinaryAssets';
import {
    createLibraryItem, updateLibraryItem, emptySection,
    ITEM_TYPES, CATEGORIES, INDUSTRIES, OBJECTIVES, KPIS,
    BUDGET_TIERS, VERIFICATIONS, DEPTHS, SECTION_KINDS, ACCESS_LEVELS,
    PRO_MIN_LIFETIME_CREDITS,
    type AccessLevel, type EventLibraryItem, type ItemType,
    type LibrarySection, type SectionKind
} from '../../services/eventLibraryService';

const ACCENT = '#7c5cff';
const B2_FOLDER = 'event-library';

const inputClass =
    'w-full px-3 py-2 text-[15px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none';
const labelClass = 'block text-sm font-semibold text-[var(--text-secondary)] mb-1.5';

// Mỗi khối của form một tông riêng, để form dài không thành một mảng xám
const SECTION_TONES = {
    basics: ACCENT,
    taxonomy: '#10b981',
    media: '#f59e0b',
    body: '#0ea5e9',
    freeContent: '#f43f5e'
};

// Vài chip mang màu riêng để form khớp đúng màu hiển thị ngoài card / trang chi tiết
const PUBLIC_TONE = '#10b981';
const PRO_TONE = '#f59e0b';

/** Tiêu đề khối: vạch màu + chữ cùng tông. */
const SectionHeading = ({ tone, children }: { tone: string; children: ReactNode }) => (
    <h2 className="flex items-center gap-2 text-[15px] font-bold uppercase tracking-wider" style={{ color: tone }}>
        <span className="w-1.5 h-4 rounded-full shrink-0" style={{ backgroundColor: tone }} />
        {children}
    </h2>
);

/** Trạng thái form — phẳng, khớp gần đúng shape gửi lên API. */
interface FormState {
    itemType: ItemType;
    visibility: 'public' | 'private';
    ownership: 'platform' | 'user';
    accessLevel: AccessLevel;
    verification: string;
    title: { vi: string; en: string };
    summary: { vi: string; en: string };
    content: { vi: string; en: string };
    coverImage: string;
    category: string;
    depth: string;
    budgetTier: string;
    industries: string[];
    objectives: string[];
    kpis: string[];
    tagsText: string;
    metrics: { label: string; value: string }[];
    attachments: EventLibraryItem['attachments'];
    sections: LibrarySection[];
}

function toFormState(item?: EventLibraryItem | null): FormState {
    return {
        itemType: item?.itemType || 'case_study',
        visibility: item?.visibility || 'private',
        ownership: item?.ownership || 'user',
        accessLevel: item?.accessLevel || 'public',
        verification: item?.verification || 'unverified',
        title: { vi: item?.title.vi || '', en: item?.title.en || '' },
        summary: { vi: item?.summary.vi || '', en: item?.summary.en || '' },
        content: { vi: item?.content?.vi || '', en: item?.content?.en || '' },
        coverImage: item?.coverImage || '',
        category: item?.category || 'other',
        depth: item?.depth || 'basic',
        budgetTier: item?.budgetTier || '',
        industries: item?.industries || [],
        objectives: item?.objectives || [],
        kpis: item?.kpis || [],
        tagsText: (item?.tags || []).join(', '),
        metrics: item?.metrics || [],
        attachments: item?.attachments || [],
        sections: item?.sections || []
    };
}

const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value];

export default function LibraryItemForm({
    item,
    onSaved,
    onCancel,
    readOnly = false,
}: {
    /** Bỏ trống = tạo mới */
    item?: EventLibraryItem | null;
    onSaved: (saved: EventLibraryItem) => void;
    onCancel: () => void;
    /**
     * Chỉ xem — dùng cho mục mẫu ghim đầu danh sách. `fieldset[disabled]` khoá
     * mọi input/select/button bên trong; TinyMCE nằm trong iframe nên phải khoá
     * riêng bằng prop `disabled`. Nút Lưu bị ẩn hẳn.
     */
    readOnly?: boolean;
}) {
    const { t } = useTranslation();
    const { user, token } = useAuth();
    const { theme } = useTheme();
    const isAdmin = user?.role === 'admin';

    const [form, setForm] = useState<FormState>(() => toFormState(item));
    // Song ngữ chỉ ở cấp mục (tiêu đề/mô tả/nội dung) — gõ từng ngôn ngữ một
    const [lang, setLang] = useState<'vi' | 'en'>('vi');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState('');
    const [error, setError] = useState('');

    const set = (patch: Partial<FormState>) => setForm(prev => ({ ...prev, ...patch }));

    const chip = (active: boolean) =>
        `px-3 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer focus:outline-none border ${
            active
                ? 'text-white border-transparent'
                : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`;
    const chipStyle = (active: boolean, tone: string = ACCENT) => (active ? { backgroundColor: tone } : undefined);

    const chipRow = (
        values: readonly string[],
        selected: string[],
        key: keyof FormState,
        i18nPrefix: string
    ) => (
        <div className="flex flex-wrap gap-1.5">
            {values.map(value => (
                <button
                    key={value}
                    onClick={() => set({ [key]: toggle(selected, value) } as Partial<FormState>)}
                    style={chipStyle(selected.includes(value))}
                    className={chip(selected.includes(value))}
                >
                    {t(`${i18nPrefix}.${value}`)}
                </button>
            ))}
        </div>
    );

    const handleCover = async (file: File) => {
        setUploading('cover');
        try {
            const { url } = await uploadImage(file, 'cover');
            set({ coverImage: url });
        } catch (err) {
            setError(err instanceof Error ? err.message : t('eventLibrary.editor.uploadFailed'));
        } finally {
            setUploading('');
        }
    };

    // Tài liệu/video đi B2 theo quy ước upload của dự án; ảnh nhỏ đi Cloudinary
    const handleAttachments = async (files: File[]) => {
        if (!token) return;
        setUploading('files');
        try {
            const uploaded = await Promise.all(files.map(async picked => {
                // Tệp tài liệu giữ nguyên; ảnh được resize + chuyển WebP trước khi lên B2
                const file = await compressImage(picked, 'attachment');
                const result = await uploadToB2(file, B2_FOLDER, token);
                return {
                    name: file.name,
                    url: result.url,
                    fileKey: result.key,
                    size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                    mime: file.type
                };
            }));
            set({ attachments: [...form.attachments, ...uploaded] });
        } catch (err) {
            setError(err instanceof Error ? err.message : t('eventLibrary.editor.uploadFailed'));
        } finally {
            setUploading('');
        }
    };

    const handleSave = async () => {
        const titleVi = form.title.vi.trim();
        const titleEn = form.title.en.trim();
        if (!titleVi && !titleEn) {
            setError(t('eventLibrary.publish.titleRequired'));
            return;
        }

        setSaving(true);
        setError('');
        try {
            // Quy ước i18n của dự án: ngôn ngữ trống thì lấy ngôn ngữ kia
            const payload = {
                itemType: form.itemType,
                visibility: form.visibility,
                verification: form.verification,
                title: { vi: titleVi || titleEn, en: titleEn || titleVi },
                summary: { vi: form.summary.vi || form.summary.en, en: form.summary.en || form.summary.vi },
                content: { vi: form.content.vi || form.content.en, en: form.content.en || form.content.vi },
                coverImage: form.coverImage,
                category: form.category,
                depth: form.depth,
                budgetTier: form.budgetTier,
                industries: form.industries,
                objectives: form.objectives,
                kpis: form.kpis,
                tags: form.tagsText.split(',').map(s => s.trim()).filter(Boolean),
                metrics: form.metrics.filter(m => m.value.trim()),
                attachments: form.attachments,
                sections: form.sections,
                ...(isAdmin && { ownership: form.ownership, accessLevel: form.accessLevel })
            } as Partial<EventLibraryItem>;

            const saved = item
                ? await updateLibraryItem(item._id, payload)
                : await createLibraryItem(payload);
            onSaved(saved);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('eventLibrary.publish.failed'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            <fieldset disabled={readOnly} className="space-y-5 m-0 p-0 border-0 min-w-0">
            {/* ─── Thông tin cơ bản ─── */}
            <section className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <SectionHeading tone={SECTION_TONES.basics}>{t('eventLibrary.editor.basics')}</SectionHeading>
                    <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-primary)]">
                        {(['vi', 'en'] as const).map(code => (
                            <button
                                key={code}
                                onClick={() => setLang(code)}
                                style={lang === code ? { backgroundColor: ACCENT, color: '#fff' } : undefined}
                                className={`px-2.5 py-1 rounded text-xs font-bold uppercase cursor-pointer ${lang === code ? '' : 'text-[var(--text-tertiary)]'}`}
                            >
                                {code}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className={labelClass}>{t('eventLibrary.publish.itemTitle')} ({lang.toUpperCase()})</label>
                    <input
                        value={form.title[lang]}
                        onChange={e => set({ title: { ...form.title, [lang]: e.target.value } })}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass}>{t('eventLibrary.publish.itemSummary')} ({lang.toUpperCase()})</label>
                    <textarea
                        value={form.summary[lang]}
                        onChange={e => set({ summary: { ...form.summary, [lang]: e.target.value } })}
                        rows={2}
                        className={`${inputClass} resize-none`}
                    />
                </div>

                <div>
                    <label className={labelClass}>{t('eventLibrary.publish.itemType')}</label>
                    <div className="flex flex-wrap gap-1.5">
                        {ITEM_TYPES.map(type => (
                            <button
                                key={type}
                                onClick={() => set({ itemType: type })}
                                style={chipStyle(form.itemType === type)}
                                className={chip(form.itemType === type)}
                            >
                                {t('eventLibrary.types.' + type)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>{t('eventLibrary.publish.visibility')}</label>
                        <div className="flex gap-1.5">
                            {(['private', 'public'] as const).map(value => (
                                <button
                                    key={value}
                                    onClick={() => set({ visibility: value })}
                                    style={chipStyle(form.visibility === value, value === 'public' ? PUBLIC_TONE : ACCENT)}
                                    className={chip(form.visibility === value)}
                                >
                                    {t('eventLibrary.publish.visibilities.' + value)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {isAdmin && (
                        <div>
                            <label className={labelClass}>{t('eventLibrary.editor.ownership')}</label>
                            <div className="flex gap-1.5">
                                {(['user', 'platform'] as const).map(value => (
                                    <button
                                        key={value}
                                        onClick={() => set({ ownership: value })}
                                        style={chipStyle(form.ownership === value)}
                                        className={chip(form.ownership === value)}
                                    >
                                        {t('eventLibrary.editor.ownerships.' + value)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div>
                        <label className={labelClass}>{t('eventLibrary.editor.accessLevel')}</label>
                        <div className="flex gap-1.5">
                            {ACCESS_LEVELS.map(value => (
                                <button
                                    key={value}
                                    onClick={() => set({ accessLevel: value })}
                                    style={chipStyle(form.accessLevel === value, value === 'pro' ? PRO_TONE : ACCENT)}
                                    className={chip(form.accessLevel === value)}
                                >
                                    {t('eventLibrary.accessLevels.' + value)}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
                            {form.accessLevel === 'pro'
                                ? t('eventLibrary.editor.accessLevelProHint').replace('{credits}', String(PRO_MIN_LIFETIME_CREDITS))
                                : t('eventLibrary.editor.accessLevelPublicHint')}
                        </p>
                    </div>
                )}
            </section>

            {/* ─── Phân loại ─── */}
            <section className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 space-y-4">
                <SectionHeading tone={SECTION_TONES.taxonomy}>{t('eventLibrary.editor.taxonomy')}</SectionHeading>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>{t('eventLibrary.category')}</label>
                        <select value={form.category} onChange={e => set({ category: e.target.value })} className={`${inputClass} cursor-pointer`}>
                            {CATEGORIES.map(v => <option key={v} value={v}>{t('eventLibrary.categories.' + v)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>{t('eventLibrary.depth')}</label>
                        <select value={form.depth} onChange={e => set({ depth: e.target.value })} className={`${inputClass} cursor-pointer`}>
                            {DEPTHS.map(v => <option key={v} value={v}>{t('eventLibrary.depths.' + v)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>{t('eventLibrary.budget')}</label>
                        <select value={form.budgetTier} onChange={e => set({ budgetTier: e.target.value })} className={`${inputClass} cursor-pointer`}>
                            <option value="">—</option>
                            {BUDGET_TIERS.map(v => <option key={v} value={v}>{t('eventLibrary.budgetTiers.' + v)}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>{t('eventLibrary.industry')}</label>
                    {chipRow(INDUSTRIES, form.industries, 'industries', 'eventLibrary.industries')}
                </div>
                <div>
                    <label className={labelClass}>{t('eventLibrary.objective')}</label>
                    {chipRow(OBJECTIVES, form.objectives, 'objectives', 'eventLibrary.objectives')}
                </div>
                <div>
                    <label className={labelClass}>{t('eventLibrary.kpi')}</label>
                    {chipRow(KPIS, form.kpis, 'kpis', 'eventLibrary.kpis')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>{t('eventLibrary.editor.tags')}</label>
                        <input
                            value={form.tagsText}
                            onChange={e => set({ tagsText: e.target.value })}
                            placeholder={t('eventLibrary.editor.tagsHint')}
                            className={inputClass}
                        />
                    </div>
                    {isAdmin && (
                        <div>
                            <label className={labelClass}>{t('eventLibrary.verification')}</label>
                            <select value={form.verification} onChange={e => set({ verification: e.target.value })} className={`${inputClass} cursor-pointer`}>
                                {VERIFICATIONS.map(v => <option key={v} value={v}>{t('eventLibrary.verifications.' + v)}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Ảnh bìa, dải số liệu, file đính kèm ─── */}
            <section className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 space-y-4">
                <SectionHeading tone={SECTION_TONES.media}>{t('eventLibrary.editor.media')}</SectionHeading>

                <div className="flex items-start gap-4">
                    {form.coverImage
                        ? <img src={cdnFromUrl(form.coverImage, 'w_320')} alt="" className="w-40 h-24 object-cover rounded-lg border border-[var(--border-primary)]" />
                        : <div className="w-40 h-24 rounded-lg border border-dashed border-[var(--border-primary)]" />}
                    <div className="space-y-2">
                        <label className="inline-block px-3 py-1.5 rounded-lg text-sm font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] cursor-pointer">
                            {uploading === 'cover' ? t('eventLibrary.editor.uploading') : t('eventLibrary.editor.pickCover')}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleCover(f); }}
                            />
                        </label>
                        {form.coverImage && (
                            <button onClick={() => set({ coverImage: '' })} className="block text-sm text-red-500 hover:underline cursor-pointer">
                                {t('eventLibrary.editor.removeCover')}
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <label className={labelClass}>{t('eventLibrary.editor.cardMetrics')}</label>
                    <div className="space-y-2">
                        {form.metrics.map((metric, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    value={metric.value}
                                    onChange={e => set({ metrics: form.metrics.map((m, idx) => idx === i ? { ...m, value: e.target.value } : m) })}
                                    placeholder={t('eventLibrary.editor.metricValue')}
                                    className={`${inputClass} w-28`}
                                />
                                <input
                                    value={metric.label}
                                    onChange={e => set({ metrics: form.metrics.map((m, idx) => idx === i ? { ...m, label: e.target.value } : m) })}
                                    placeholder={t('eventLibrary.editor.metricLabel')}
                                    className={`${inputClass} flex-1`}
                                />
                                <button
                                    onClick={() => set({ metrics: form.metrics.filter((_, idx) => idx !== i) })}
                                    className="w-8 h-8 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 cursor-pointer"
                                    aria-label={t('eventLibrary.editor.removeRow')}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => set({ metrics: [...form.metrics, { label: '', value: '' }] })}
                            style={{ color: ACCENT }}
                            className="text-sm font-semibold hover:underline cursor-pointer"
                        >
                            + {t('eventLibrary.editor.addMetric')}
                        </button>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1.5">{t('eventLibrary.editor.cardMetricsHint')}</p>
                </div>

                <div>
                    <label className={labelClass}>{t('eventLibrary.detail.attachments')}</label>
                    <div className="space-y-2">
                        {form.attachments.map((att, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                <span className="flex-1 text-[15px] text-[var(--text-primary)] truncate">{att.name}</span>
                                <span className="text-sm text-[var(--text-tertiary)] shrink-0">{att.size}</span>
                                <button
                                    onClick={() => set({ attachments: form.attachments.filter((_, idx) => idx !== i) })}
                                    className="w-7 h-7 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 cursor-pointer shrink-0"
                                    aria-label={t('eventLibrary.editor.removeRow')}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        <label className="inline-block px-3 py-1.5 rounded-lg text-sm font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] cursor-pointer">
                            {uploading === 'files' ? t('eventLibrary.editor.uploading') : `+ ${t('eventLibrary.editor.addFiles')}`}
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                onChange={e => { const files = Array.from(e.target.files || []); e.target.value = ''; if (files.length) handleAttachments(files); }}
                            />
                        </label>
                    </div>
                </div>
            </section>

            {/* ─── Thân bài: khối ─── */}
            <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <SectionHeading tone={SECTION_TONES.body}>{t('eventLibrary.editor.body')}</SectionHeading>
                    <span className="text-xs text-[var(--text-tertiary)]">{t('eventLibrary.editor.bodyHint')}</span>
                </div>

                {form.sections.map((section, i) => (
                    <SectionEditor
                        key={i}
                        section={section}
                        index={i}
                        total={form.sections.length}
                        onChange={next => set({ sections: form.sections.map((s, idx) => idx === i ? next : s) })}
                        onRemove={() => set({ sections: form.sections.filter((_, idx) => idx !== i) })}
                        readOnly={readOnly}
                        onMove={dir => {
                            const target = i + dir;
                            if (target < 0 || target >= form.sections.length) return;
                            const next = [...form.sections];
                            [next[i], next[target]] = [next[target], next[i]];
                            set({ sections: next });
                        }}
                    />
                ))}

                <div className="rounded-2xl border border-dashed border-[var(--border-primary)] p-4">
                    <p className={labelClass}>{t('eventLibrary.editor.addSection')}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {SECTION_KINDS.map(kind => (
                            <button
                                key={kind}
                                onClick={() => set({ sections: [...form.sections, emptySection(kind as SectionKind)] })}
                                className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                            >
                                + {t('eventLibrary.sectionKinds.' + kind)}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── Nội dung tự do song ngữ (tuỳ chọn) ─── */}
            <section className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 space-y-2">
                <SectionHeading tone={SECTION_TONES.freeContent}>
                    {t('eventLibrary.editor.freeContent')} ({lang.toUpperCase()})
                </SectionHeading>
                <p className="text-xs text-[var(--text-tertiary)]">{t('eventLibrary.editor.freeContentHint')}</p>
                <Editor
                    // Đổi theme phải dựng lại editor: TinyMCE không đổi skin sau khi khởi tạo
                    key={theme}
                    tinymceScriptSrc="/tinymce/tinymce.min.js"
                    value={form.content[lang]}
                    onEditorChange={(html: string) => set({ content: { ...form.content, [lang]: html } })}
                    licenseKey="gpl"
                    disabled={readOnly}
                    init={libraryEditorInit(theme, 240, {
                        promptBox: t('eventLibrary.editor.promptBox'),
                        promptBoxPlaceholder: t('eventLibrary.editor.promptBoxPlaceholder')
                    })}
                />
            </section>
            </fieldset>

            {error && (
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">{error}</div>
            )}

            <div className="flex items-center justify-end gap-2 sticky bottom-0 py-3 bg-[var(--bg-primary)]">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg text-[15px] font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                    {readOnly ? t('eventLibrary.editor.backToList') : t('eventLibrary.publish.cancel')}
                </button>
                {!readOnly && (
                    <button
                        onClick={handleSave}
                        disabled={saving || !!uploading}
                        style={{ backgroundColor: ACCENT }}
                        className="px-5 py-2 rounded-lg text-[15px] font-semibold text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {saving ? t('eventLibrary.publish.publishing') : t('eventLibrary.editor.save')}
                    </button>
                )}
            </div>
        </div>
    );
}
