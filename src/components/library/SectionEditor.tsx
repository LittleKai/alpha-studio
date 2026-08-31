import { Editor } from '@tinymce/tinymce-react';
import { useTranslation } from '../../i18n/context';
import { useTheme } from '../../theme/context';
import { libraryEditorInit } from './libraryEditorInit';
import { uploadImage } from '../../services/cloudinaryService';
import type { LibrarySection } from '../../services/eventLibraryService';
import { cdnFromUrl } from '../../services/cloudinaryAssets';

const ACCENT = '#7c5cff';

const inputClass =
    'w-full px-3 py-2 text-[15px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none';

/** Nút nhỏ xoá một dòng/ô bên trong khối. */
function RemoveRowButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            title={label}
            aria-label={label}
            className="shrink-0 w-8 h-8 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
        >
            ×
        </button>
    );
}

function AddRowButton({ onClick, label }: { onClick: () => void; label: string }) {
    return (
        <button
            onClick={onClick}
            style={{ color: ACCENT }}
            className="text-sm font-semibold hover:underline cursor-pointer focus:outline-none"
        >
            + {label}
        </button>
    );
}

interface Props {
    section: LibrarySection;
    index: number;
    total: number;
    onChange: (next: LibrarySection) => void;
    onRemove: () => void;
    onMove: (direction: -1 | 1) => void;
}

/**
 * Editor cho MỘT khối thân bài. Mỗi `kind` có một form riêng nhưng dùng chung
 * khung ngoài (tiêu đề khối, nút di chuyển, nút xoá).
 *
 * Mọi thao tác đều tạo object mới rồi gọi `onChange` — state thật nằm ở
 * `LibraryItemForm`, khối này không giữ state riêng.
 */
export default function SectionEditor({ section, index, total, onChange, onRemove, onMove }: Props) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const set = (patch: Partial<LibrarySection>) => onChange({ ...section, ...patch });

    // Cập nhật phần tử thứ `i` của một mảng con trong khối
    const patchAt = <T,>(list: T[], i: number, patch: Partial<T>): T[] =>
        list.map((item, idx) => (idx === i ? { ...item, ...patch } : item));

    const body = () => {
        switch (section.kind) {
            case 'richText':
                return (
                    <Editor
                        // Đổi theme phải dựng lại editor: TinyMCE không đổi skin sau khi khởi tạo
                        key={theme}
                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                        value={section.html || ''}
                        onEditorChange={(content: string) => set({ html: content })}
                        licenseKey="gpl"
                        init={libraryEditorInit(theme)}
                    />
                );

            case 'keyValue': {
                const rows = section.rows || [];
                return (
                    <div className="space-y-2">
                        {rows.map((row, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    value={row.label}
                                    onChange={e => set({ rows: patchAt(rows, i, { label: e.target.value }) })}
                                    placeholder={t('eventLibrary.editor.rowLabel')}
                                    className={`${inputClass} flex-1`}
                                />
                                <input
                                    value={row.value}
                                    onChange={e => set({ rows: patchAt(rows, i, { value: e.target.value }) })}
                                    placeholder={t('eventLibrary.editor.rowValue')}
                                    className={`${inputClass} flex-[2]`}
                                />
                                <RemoveRowButton onClick={() => set({ rows: rows.filter((_, idx) => idx !== i) })} label={t('eventLibrary.editor.removeRow')} />
                            </div>
                        ))}
                        <AddRowButton onClick={() => set({ rows: [...rows, { label: '', value: '' }] })} label={t('eventLibrary.editor.addRow')} />
                    </div>
                );
            }

            case 'metrics': {
                const metrics = section.metrics || [];
                return (
                    <div className="space-y-2">
                        {metrics.map((metric, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    value={metric.value}
                                    onChange={e => set({ metrics: patchAt(metrics, i, { value: e.target.value }) })}
                                    placeholder={t('eventLibrary.editor.metricValue')}
                                    className={`${inputClass} w-28`}
                                />
                                <input
                                    value={metric.label}
                                    onChange={e => set({ metrics: patchAt(metrics, i, { label: e.target.value }) })}
                                    placeholder={t('eventLibrary.editor.metricLabel')}
                                    className={`${inputClass} flex-1`}
                                />
                                <input
                                    value={metric.note}
                                    onChange={e => set({ metrics: patchAt(metrics, i, { note: e.target.value }) })}
                                    placeholder={t('eventLibrary.editor.metricNote')}
                                    className={`${inputClass} flex-1`}
                                />
                                <RemoveRowButton onClick={() => set({ metrics: metrics.filter((_, idx) => idx !== i) })} label={t('eventLibrary.editor.removeRow')} />
                            </div>
                        ))}
                        <AddRowButton onClick={() => set({ metrics: [...metrics, { label: '', value: '', note: '' }] })} label={t('eventLibrary.editor.addMetric')} />
                    </div>
                );
            }

            case 'bulletGroups': {
                const groups = section.groups || [];
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {groups.map((group, gi) => (
                            <div key={gi} className="rounded-xl border border-[var(--border-primary)] p-3 space-y-2">
                                <div className="flex gap-2 items-center">
                                    <input
                                        value={group.title}
                                        onChange={e => set({ groups: patchAt(groups, gi, { title: e.target.value }) })}
                                        placeholder={t('eventLibrary.editor.groupTitle')}
                                        className={`${inputClass} flex-1 font-semibold`}
                                    />
                                    <RemoveRowButton onClick={() => set({ groups: groups.filter((_, idx) => idx !== gi) })} label={t('eventLibrary.editor.removeGroup')} />
                                </div>
                                {group.items.map((item, ii) => (
                                    <div key={ii} className="flex gap-2 items-center">
                                        <input
                                            value={item}
                                            onChange={e => set({
                                                groups: patchAt(groups, gi, {
                                                    items: group.items.map((v, idx) => (idx === ii ? e.target.value : v))
                                                })
                                            })}
                                            placeholder={t('eventLibrary.editor.bulletItem')}
                                            className={`${inputClass} flex-1`}
                                        />
                                        <RemoveRowButton
                                            onClick={() => set({ groups: patchAt(groups, gi, { items: group.items.filter((_, idx) => idx !== ii) }) })}
                                            label={t('eventLibrary.editor.removeRow')}
                                        />
                                    </div>
                                ))}
                                <AddRowButton
                                    onClick={() => set({ groups: patchAt(groups, gi, { items: [...group.items, ''] }) })}
                                    label={t('eventLibrary.editor.addBullet')}
                                />
                            </div>
                        ))}
                        <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border-primary)] p-3 min-h-[80px]">
                            <AddRowButton onClick={() => set({ groups: [...groups, { title: '', items: [''] }] })} label={t('eventLibrary.editor.addGroup')} />
                        </div>
                    </div>
                );
            }

            case 'steps': {
                const steps = section.steps || [];
                return (
                    <div className="space-y-2">
                        {steps.map((step, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <span
                                    className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                                    style={{ backgroundColor: ACCENT }}
                                >
                                    {i + 1}
                                </span>
                                <input
                                    value={step.title}
                                    onChange={e => set({ steps: patchAt(steps, i, { title: e.target.value }) })}
                                    placeholder={t('eventLibrary.editor.stepTitle')}
                                    className={`${inputClass} flex-1`}
                                />
                                <input
                                    value={step.desc}
                                    onChange={e => set({ steps: patchAt(steps, i, { desc: e.target.value }) })}
                                    placeholder={t('eventLibrary.editor.stepDesc')}
                                    className={`${inputClass} flex-[2]`}
                                />
                                <RemoveRowButton onClick={() => set({ steps: steps.filter((_, idx) => idx !== i) })} label={t('eventLibrary.editor.removeRow')} />
                            </div>
                        ))}
                        <AddRowButton onClick={() => set({ steps: [...steps, { title: '', desc: '' }] })} label={t('eventLibrary.editor.addStep')} />
                    </div>
                );
            }

            case 'quote':
                return (
                    <div className="space-y-2">
                        <textarea
                            value={section.quote || ''}
                            onChange={e => set({ quote: e.target.value })}
                            rows={3}
                            placeholder={t('eventLibrary.editor.quoteText')}
                            className={`${inputClass} resize-none`}
                        />
                        <input
                            value={section.quoteBy || ''}
                            onChange={e => set({ quoteBy: e.target.value })}
                            placeholder={t('eventLibrary.editor.quoteBy')}
                            className={inputClass}
                        />
                    </div>
                );

            case 'gallery': {
                const images = section.images || [];
                return (
                    <div className="space-y-3">
                        {images.length > 0 && (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                {images.map((url, i) => (
                                    <div key={i} className="relative group">
                                        <img src={cdnFromUrl(url, 'w_240')} alt="" className="w-full h-20 object-cover rounded-lg border border-[var(--border-primary)]" />
                                        <button
                                            onClick={() => set({ images: images.filter((_, idx) => idx !== i) })}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            aria-label={t('eventLibrary.editor.removeRow')}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <label className="inline-block text-sm font-semibold cursor-pointer hover:underline" style={{ color: ACCENT }}>
                            + {t('eventLibrary.editor.addImages')}
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={async e => {
                                    const files = Array.from(e.target.files || []);
                                    e.target.value = '';
                                    const uploaded = await Promise.all(files.map(f => uploadImage(f, 'content').then(r => r.url).catch(() => '')));
                                    set({ images: [...images, ...uploaded.filter(Boolean)] });
                                }}
                            />
                        </label>
                    </div>
                );
            }

            case 'linkedItems': {
                const links = section.links || [];
                return (
                    <div className="space-y-2">
                        <p className="text-xs text-[var(--text-tertiary)]">{t('eventLibrary.editor.linkHint')}</p>
                        {links.map((link, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    value={link.slug}
                                    onChange={e => set({ links: patchAt(links, i, { slug: e.target.value }) })}
                                    placeholder={t('eventLibrary.editor.linkSlug')}
                                    className={`${inputClass} flex-1 font-mono`}
                                />
                                <input
                                    value={link.label}
                                    onChange={e => set({ links: patchAt(links, i, { label: e.target.value }) })}
                                    placeholder={t('eventLibrary.editor.linkLabel')}
                                    className={`${inputClass} flex-1`}
                                />
                                <RemoveRowButton onClick={() => set({ links: links.filter((_, idx) => idx !== i) })} label={t('eventLibrary.editor.removeRow')} />
                            </div>
                        ))}
                        <AddRowButton onClick={() => set({ links: [...links, { slug: '', label: '' }] })} label={t('eventLibrary.editor.addLink')} />
                    </div>
                );
            }
        }
    };

    return (
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-4 space-y-3">
            <div className="flex items-center gap-2">
                <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: ACCENT, color: '#fff' }}
                >
                    {index + 1}
                </span>
                <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shrink-0"
                    style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}
                >
                    {t('eventLibrary.sectionKinds.' + section.kind)}
                </span>
                <input
                    value={section.title}
                    onChange={e => set({ title: e.target.value })}
                    placeholder={t('eventLibrary.editor.sectionTitle')}
                    className={`${inputClass} flex-1 font-semibold`}
                />
                <button
                    onClick={() => onMove(-1)}
                    disabled={index === 0}
                    className="w-8 h-8 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label={t('eventLibrary.editor.moveUp')}
                >
                    ↑
                </button>
                <button
                    onClick={() => onMove(1)}
                    disabled={index === total - 1}
                    className="w-8 h-8 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label={t('eventLibrary.editor.moveDown')}
                >
                    ↓
                </button>
                <RemoveRowButton onClick={onRemove} label={t('eventLibrary.editor.removeSection')} />
            </div>
            {body()}
        </div>
    );
}
