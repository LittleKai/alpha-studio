import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from '../../i18n/context';
import { Editor } from '@tinymce/tinymce-react';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import {
    getAdminArticles,
    createArticle,
    updateArticle,
    deleteArticle,
    publishArticle,
    unpublishArticle,
    type Article,
    type ArticleFormData,
} from '../../services/articleService';

interface ArticlesAdminTabProps {
    category: 'about' | 'services';
}

const emptyForm: ArticleFormData = {
    title: { vi: '', en: '' },
    excerpt: { vi: '', en: '' },
    content: { vi: '', en: '' },
    thumbnail: '',
    category: 'about',
    tags: [],
    order: 0,
    isFeatured: false,
};

export default function ArticlesAdminTab({ category }: ArticlesAdminTabProps) {
    const { t, language } = useTranslation();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ArticleFormData>({ ...emptyForm, category });
    const [saving, setSaving] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [contentLang, setContentLang] = useState<'vi' | 'en'>('vi');
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

    // Editor refs
    const editorViRef = useRef<any>(null);
    const editorEnRef = useRef<any>(null);

    const loadArticles = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAdminArticles(category, statusFilter || undefined, 1, 100, search || undefined);
            setArticles(res.data);
        } catch (error) {
            console.error('Failed to load articles:', error);
        } finally {
            setLoading(false);
        }
    }, [category, statusFilter, search]);

    useEffect(() => {
        const debounce = setTimeout(loadArticles, 300);
        return () => clearTimeout(debounce);
    }, [loadArticles]);

    const handleCreate = () => {
        setEditingId(null);
        setForm({ ...emptyForm, category });
        setTagInput('');
        setContentLang('vi');
        setShowForm(true);
    };

    const handleEdit = (article: Article) => {
        setEditingId(article._id);
        setForm({
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            thumbnail: article.thumbnail,
            category: article.category,
            tags: article.tags,
            order: article.order,
            isFeatured: article.isFeatured,
        });
        setTagInput('');
        setContentLang('vi');
        setShowForm(true);
    };

    const handleSave = async () => {
        // Sync editor content before saving
        const viContent = editorViRef.current?.getContent() || form.content.vi;
        const enContent = editorEnRef.current?.getContent() || form.content.en;
        const finalForm = {
            ...form,
            content: { vi: viContent, en: enContent },
        };

        if (!finalForm.title.vi || !finalForm.title.en) {
            alert(t('admin.articles.errors.titleRequired'));
            return;
        }
        try {
            setSaving(true);
            if (editingId) {
                await updateArticle(editingId, finalForm);
            } else {
                await createArticle(finalForm);
            }
            setShowForm(false);
            loadArticles();
        } catch (error: any) {
            alert(error.message || 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('admin.articles.deleteConfirm'))) return;
        try {
            await deleteArticle(id);
            loadArticles();
        } catch (error: any) {
            alert(error.message || 'Error');
        }
    };

    const handlePublish = async (id: string) => {
        try {
            await publishArticle(id);
            loadArticles();
        } catch (error: any) {
            alert(error.message || 'Error');
        }
    };

    const handleUnpublish = async (id: string) => {
        try {
            await unpublishArticle(id);
            loadArticles();
        } catch (error: any) {
            alert(error.message || 'Error');
        }
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !form.tags.includes(tag)) {
            setForm({ ...form, tags: [...form.tags, tag] });
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-500/10 text-green-500';
            case 'draft': return 'bg-yellow-500/10 text-yellow-500';
            case 'archived': return 'bg-gray-500/10 text-gray-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        return t(`admin.articles.status.${status}`) || status;
    };

    // TinyMCE image upload handler using Cloudinary (stable ref)
    const handleEditorImageUpload = useCallback((blobInfo: any): Promise<string> => {
        return new Promise(async (resolve, reject) => {
            try {
                const file = blobInfo.blob();
                const result = await uploadToCloudinary(file, 'articles');
                if (result.success) {
                    resolve(result.url);
                } else {
                    reject(result.error || 'Upload failed');
                }
            } catch (error) {
                reject('Image upload failed');
            }
        });
    }, []);

    // Shared TinyMCE config (stable ref to prevent re-init)
    const editorInit = useMemo(() => ({
        height: 400,
        menubar: true,
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'image media link | removeformat | code fullscreen | help',
        images_upload_handler: handleEditorImageUpload,
        automatic_uploads: true,
        file_picker_types: 'image',
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; }',
        branding: false,
        promotion: false,
    }), [handleEditorImageUpload]);

    // Form Modal
    if (showForm) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        {editingId ? t('admin.articles.edit') : t('admin.articles.create')}
                    </h3>
                    <button
                        onClick={() => setShowForm(false)}
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                        {t('admin.articles.cancel')}
                    </button>
                </div>

                {/* Title fields side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">{t('admin.articles.title')} (VI)</label>
                        <input
                            type="text"
                            value={form.title.vi}
                            onChange={(e) => setForm({ ...form, title: { ...form.title, vi: e.target.value } })}
                            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                            placeholder={t('admin.articles.titlePlaceholder')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">{t('admin.articles.title')} (EN)</label>
                        <input
                            type="text"
                            value={form.title.en}
                            onChange={(e) => setForm({ ...form, title: { ...form.title, en: e.target.value } })}
                            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                            placeholder="Title in English"
                        />
                    </div>
                </div>

                {/* Excerpt fields side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">{t('admin.articles.excerpt')} (VI)</label>
                        <textarea
                            value={form.excerpt.vi}
                            onChange={(e) => setForm({ ...form, excerpt: { ...form.excerpt, vi: e.target.value } })}
                            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] h-20 resize-none"
                            placeholder={t('admin.articles.excerptPlaceholder')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">{t('admin.articles.excerpt')} (EN)</label>
                        <textarea
                            value={form.excerpt.en}
                            onChange={(e) => setForm({ ...form, excerpt: { ...form.excerpt, en: e.target.value } })}
                            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] h-20 resize-none"
                            placeholder="Short summary in English"
                        />
                    </div>
                </div>

                {/* Content with TinyMCE - Language tabs */}
                <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-2">{t('admin.articles.content')}</label>
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setContentLang('vi')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                contentLang === 'vi'
                                    ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {t('admin.articles.vietnamese')}
                        </button>
                        <button
                            onClick={() => setContentLang('en')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                contentLang === 'en'
                                    ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {t('admin.articles.english')}
                        </button>
                    </div>

                    {/* Vietnamese Editor */}
                    <div style={{ display: contentLang === 'vi' ? 'block' : 'none' }}>
                        <Editor
                            onInit={(_evt, editor) => { editorViRef.current = editor; }}
                            initialValue={form.content.vi}
                            init={editorInit}
                            tinymceScriptSrc="/tinymce/tinymce.min.js"
                            licenseKey="gpl"
                        />
                    </div>

                    {/* English Editor */}
                    <div style={{ display: contentLang === 'en' ? 'block' : 'none' }}>
                        <Editor
                            onInit={(_evt, editor) => { editorEnRef.current = editor; }}
                            initialValue={form.content.en}
                            init={editorInit}
                            tinymceScriptSrc="/tinymce/tinymce.min.js"
                            licenseKey="gpl"
                        />
                    </div>
                </div>

                {/* Thumbnail upload */}
                <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">{t('admin.articles.thumbnail')}</label>
                    <div className="flex gap-3 items-start">
                        <div className="flex-1">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={form.thumbnail}
                                    onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                                    className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm"
                                    placeholder="https://..."
                                />
                                <label className={`px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-colors flex items-center gap-2 ${
                                    uploadingThumbnail
                                        ? 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
                                        : 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] hover:opacity-90'
                                }`}>
                                    {uploadingThumbnail ? (
                                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    Upload
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploadingThumbnail}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                                setUploadingThumbnail(true);
                                                const result = await uploadToCloudinary(file, 'articles');
                                                if (result.success) {
                                                    setForm((prev) => ({ ...prev, thumbnail: result.url }));
                                                }
                                            } catch (error) {
                                                console.error('Thumbnail upload failed:', error);
                                            } finally {
                                                setUploadingThumbnail(false);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                        {form.thumbnail && (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--border-primary)] flex-shrink-0">
                                <img src={form.thumbnail} alt="" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setForm({ ...form, thumbnail: '' })}
                                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                    &times;
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Shared fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-1">{t('admin.articles.order')}</label>
                        <input
                            type="number"
                            value={form.order}
                            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                        />
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.isFeatured}
                                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                                className="w-4 h-4 rounded"
                            />
                            <span className="text-sm text-[var(--text-primary)]">{t('admin.articles.featured')}</span>
                        </label>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">{t('admin.articles.tags')}</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                            placeholder={t('admin.articles.addTag')}
                        />
                        <button
                            onClick={addTag}
                            className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                        >
                            +
                        </button>
                    </div>
                    {form.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {form.tags.map((tag) => (
                                <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full text-sm">
                                    #{tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-red-500 ml-1">&times;</button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Save buttons */}
                <div className="flex gap-3 pt-4 border-t border-[var(--border-primary)]">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2.5 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? t('admin.articles.saving') : (editingId ? t('admin.articles.update') : t('admin.articles.create'))}
                    </button>
                    <button
                        onClick={() => setShowForm(false)}
                        className="px-6 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-medium rounded-xl hover:opacity-90"
                    >
                        {t('admin.articles.cancel')}
                    </button>
                </div>
            </div>
        );
    }

    // Article List View
    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <input
                    type="text"
                    placeholder={t('admin.articles.searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm"
                >
                    <option value="">{t('admin.articles.allStatus')}</option>
                    <option value="draft">{t('admin.articles.status.draft')}</option>
                    <option value="published">{t('admin.articles.status.published')}</option>
                    <option value="archived">{t('admin.articles.status.archived')}</option>
                </select>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-lg hover:opacity-90 text-sm"
                >
                    + {t('admin.articles.create')}
                </button>
            </div>

            {/* Articles List */}
            {loading ? (
                <p className="text-center text-[var(--text-secondary)] py-8">{t('admin.articles.loading')}</p>
            ) : articles.length === 0 ? (
                <div className="text-center py-12 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
                    <p className="text-[var(--text-secondary)] mb-4">{t('admin.articles.noArticles')}</p>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-lg"
                    >
                        {t('admin.articles.createFirst')}
                    </button>
                </div>
            ) : (
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                    <div className="divide-y divide-[var(--border-primary)]">
                        {articles.map((article) => (
                            <div key={article._id} className="p-4 hover:bg-[var(--bg-secondary)]/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        {article.thumbnail && (
                                            <img
                                                src={article.thumbnail}
                                                alt=""
                                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <h4 className="font-medium text-[var(--text-primary)] truncate">
                                                {article.title[language]}
                                            </h4>
                                            <p className="text-sm text-[var(--text-secondary)] truncate">
                                                {article.excerpt[language] || t('admin.articles.noExcerpt')}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(article.status)}`}>
                                                    {getStatusText(article.status)}
                                                </span>
                                                {article.isFeatured && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-500">
                                                        {t('admin.articles.featured')}
                                                    </span>
                                                )}
                                                <span className="text-xs text-[var(--text-tertiary)]">
                                                    #{article.order}
                                                </span>
                                                <span className="text-xs text-[var(--text-tertiary)]">
                                                    {new Date(article.updatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleEdit(article)}
                                            className="px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                                        >
                                            {t('admin.articles.editBtn')}
                                        </button>
                                        {article.status === 'draft' ? (
                                            <button
                                                onClick={() => handlePublish(article._id)}
                                                className="px-3 py-1.5 text-sm bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20"
                                            >
                                                {t('admin.articles.publish')}
                                            </button>
                                        ) : article.status === 'published' ? (
                                            <button
                                                onClick={() => handleUnpublish(article._id)}
                                                className="px-3 py-1.5 text-sm bg-yellow-500/10 text-yellow-500 rounded-lg hover:bg-yellow-500/20"
                                            >
                                                {t('admin.articles.unpublish')}
                                            </button>
                                        ) : null}
                                        <button
                                            onClick={() => handleDelete(article._id)}
                                            className="px-3 py-1.5 text-sm bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                                        >
                                            {t('admin.articles.delete')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
