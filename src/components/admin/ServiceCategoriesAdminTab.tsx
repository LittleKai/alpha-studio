import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { useConfirm } from '../ui/ConfirmDialog';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import { cdnFromUrl } from '../../services/cloudinaryAssets';
import { localizedText, fillLocalized } from '../../utils/localized';
import {
    getAdminServiceCategories,
    createServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,
    SERVICE_ACCENTS,
    type ServiceCategory,
    type ServiceCategoryFormData,
    type ServiceAccent,
} from '../../services/serviceCategoryService';

const emptyForm: ServiceCategoryFormData = {
    title: { vi: '', en: '' },
    description: { vi: '', en: '' },
    coverImage: '',
    icon: '',
    accent: 'violet',
    order: 0,
    status: 'published',
};

/** Ô màu xem trước cho từng accent — khớp SECTION_PALETTES của SectionRenderer. */
const ACCENT_SWATCH: Record<ServiceAccent, string> = {
    violet: 'bg-violet-500',
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
};

const inputClass =
    'w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]';
const labelClass = 'block text-sm text-[var(--text-secondary)] mb-1';

/** Quản lý phân mục của trang /services — admin/mod tự thêm dịch vụ mới. */
export default function ServiceCategoriesAdminTab() {
    const { t, language } = useTranslation();
    const { confirm: confirmDialog } = useConfirm();
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ServiceCategoryFormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setCategories(await getAdminServiceCategories());
        } catch (error) {
            console.error('Failed to load service categories:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const handleEdit = (cat: ServiceCategory) => {
        setEditingId(cat._id);
        setForm({
            title: cat.title,
            description: cat.description,
            coverImage: cat.coverImage,
            icon: cat.icon,
            accent: cat.accent,
            order: cat.order,
            status: cat.status,
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.title.vi.trim()) {
            alert(t('admin.serviceCategories.errors.titleRequired'));
            return;
        }
        const payload: ServiceCategoryFormData = {
            ...form,
            title: fillLocalized(form.title.vi, form.title.en),
            description: fillLocalized(form.description.vi, form.description.en),
        };
        try {
            setSaving(true);
            if (editingId) {
                await updateServiceCategory(editingId, payload);
            } else {
                await createServiceCategory(payload);
            }
            setShowForm(false);
            load();
        } catch (error: any) {
            alert(error.message || 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirmDialog({ message: t('admin.serviceCategories.deleteConfirm'), variant: 'danger' })) return;
        try {
            await deleteServiceCategory(id);
            load();
        } catch (error: any) {
            alert(error.message || 'Error');
        }
    };

    if (showForm) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        {editingId ? t('admin.serviceCategories.edit') : t('admin.serviceCategories.create')}
                    </h3>
                    <button
                        onClick={() => setShowForm(false)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                        {t('admin.articles.cancel')}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>{t('admin.serviceCategories.title')} (VI)</label>
                        <input
                            type="text"
                            value={form.title.vi}
                            onChange={(e) => setForm({ ...form, title: { ...form.title, vi: e.target.value } })}
                            className={inputClass}
                            placeholder={t('admin.serviceCategories.titlePlaceholder')}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t('admin.serviceCategories.title')} (EN)</label>
                        <input
                            type="text"
                            value={form.title.en}
                            onChange={(e) => setForm({ ...form, title: { ...form.title, en: e.target.value } })}
                            className={inputClass}
                            placeholder="Name in English"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>{t('admin.serviceCategories.description')} (VI)</label>
                        <textarea
                            value={form.description.vi}
                            onChange={(e) => setForm({ ...form, description: { ...form.description, vi: e.target.value } })}
                            className={`${inputClass} h-20 resize-none`}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t('admin.serviceCategories.description')} (EN)</label>
                        <textarea
                            value={form.description.en}
                            onChange={(e) => setForm({ ...form, description: { ...form.description, en: e.target.value } })}
                            className={`${inputClass} h-20 resize-none`}
                        />
                    </div>
                </div>

                {/* Ảnh bìa */}
                <div>
                    <label className={labelClass}>{t('admin.serviceCategories.cover')}</label>
                    <div className="flex gap-3 items-start">
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={form.coverImage}
                                onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                                className={`${inputClass} text-sm`}
                                placeholder="https://..."
                            />
                            <label className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-colors flex items-center gap-2 ${uploading
                                ? 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
                                : 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] hover:opacity-90'}`}>
                                {uploading
                                    ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                    : 'Upload'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploading}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        try {
                                            setUploading(true);
                                            const result = await uploadToCloudinary(file, 'service-categories', 'cover');
                                            if (result.success) setForm(prev => ({ ...prev, coverImage: result.url }));
                                        } catch (error) {
                                            console.error('Cover upload failed:', error);
                                        } finally {
                                            setUploading(false);
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </label>
                        </div>
                        {form.coverImage && (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--border-primary)] flex-shrink-0">
                                <img src={cdnFromUrl(form.coverImage, 'w_320')} alt="" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setForm({ ...form, coverImage: '' })}
                                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className={labelClass}>{t('admin.serviceCategories.icon')}</label>
                        <input
                            type="text"
                            value={form.icon}
                            maxLength={8}
                            onChange={(e) => setForm({ ...form, icon: e.target.value })}
                            className={inputClass}
                            placeholder="⭐"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t('admin.serviceCategories.accent')}</label>
                        <div className="flex gap-2 pt-1.5">
                            {SERVICE_ACCENTS.map(accent => (
                                <button
                                    key={accent}
                                    onClick={() => setForm({ ...form, accent })}
                                    title={accent}
                                    aria-label={accent}
                                    aria-pressed={form.accent === accent}
                                    className={`w-7 h-7 rounded-full ${ACCENT_SWATCH[accent]} transition-transform ${form.accent === accent
                                        ? 'ring-2 ring-offset-2 ring-[var(--accent-primary)] ring-offset-[var(--bg-primary)] scale-110'
                                        : 'opacity-60 hover:opacity-100'}`}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>{t('admin.serviceCategories.order')}</label>
                        <input
                            type="number"
                            value={form.order}
                            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t('admin.serviceCategories.statusLabel')}</label>
                        <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value as 'published' | 'hidden' })}
                            className={inputClass}
                        >
                            <option value="published">{t('admin.serviceCategories.status.published')}</option>
                            <option value="hidden">{t('admin.serviceCategories.status.hidden')}</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? t('admin.articles.saving') : t('admin.articles.update')}
                    </button>
                    <button
                        onClick={() => setShowForm(false)}
                        className="px-6 py-2.5 border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-lg hover:text-[var(--text-primary)]"
                    >
                        {t('admin.articles.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--text-secondary)]">{t('admin.serviceCategories.hint')}</p>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-lg hover:opacity-90 text-sm whitespace-nowrap"
                >
                    + {t('admin.serviceCategories.create')}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                </div>
            ) : categories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-primary)] py-16 text-center text-[var(--text-secondary)]">
                    {t('admin.serviceCategories.empty')}
                </div>
            ) : (
                <div className="space-y-2">
                    {categories.map(cat => (
                        <div
                            key={cat._id}
                            className="flex items-center gap-4 p-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl"
                        >
                            {cat.coverImage ? (
                                <img src={cdnFromUrl(cat.coverImage, 'w_160')} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-2xl flex-shrink-0" aria-hidden="true">
                                    {cat.icon || '◆'}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`w-2.5 h-2.5 rounded-full ${ACCENT_SWATCH[cat.accent]}`} aria-hidden="true" />
                                    <h4 className="font-bold text-[var(--text-primary)] truncate">{localizedText(cat.title, language)}</h4>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cat.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                        {t(`admin.serviceCategories.status.${cat.status}`)}
                                    </span>
                                    <span className="text-xs text-[var(--text-tertiary)]">#{cat.order}</span>
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] truncate">/services?cat={cat.slug}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleEdit(cat)}
                                    className="px-3 py-1.5 text-sm border border-[var(--border-primary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                                >
                                    {t('admin.articles.editBtn')}
                                </button>
                                <button
                                    onClick={() => handleDelete(cat._id)}
                                    className="px-3 py-1.5 text-sm border border-red-500/30 rounded-lg text-red-500 hover:bg-red-500/10"
                                >
                                    {t('admin.articles.delete')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
