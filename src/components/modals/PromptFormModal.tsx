import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { Prompt, PromptInput, createPrompt, updatePrompt, ExampleImage, PromptContent } from '../../services/promptService';
import { TagsInput } from '../shared';
import { uploadImage } from '../../services/cloudinaryService';

interface PromptFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingPrompt?: Prompt | null;
    onSuccess?: (prompt: Prompt) => void;
}

const PromptFormModal: React.FC<PromptFormModalProps> = ({
    isOpen,
    onClose,
    editingPrompt,
    onSuccess
}) => {
    const { language } = useTranslation();

    const [formData, setFormData] = useState<PromptInput>({
        title: { vi: '', en: '' },
        description: { vi: '', en: '' },
        promptContents: [{ label: '', content: '' }], // Start with one prompt
        notes: '',
        category: 'other',
        platform: 'other',
        tags: [],
        exampleImages: []
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const categories = [
        { value: 'image-generation', label: language === 'vi' ? 'Tạo hình ảnh' : 'Image Generation' },
        { value: 'text-generation', label: language === 'vi' ? 'Tạo văn bản' : 'Text Generation' },
        { value: 'code', label: 'Code' },
        { value: 'workflow', label: 'Workflow' },
        { value: 'other', label: language === 'vi' ? 'Khác' : 'Other' }
    ];

    const platforms = [
        { value: 'midjourney', label: 'Midjourney' },
        { value: 'stable-diffusion', label: 'Stable Diffusion' },
        { value: 'dalle', label: 'DALL-E' },
        { value: 'comfyui', label: 'ComfyUI' },
        { value: 'chatgpt', label: 'ChatGPT' },
        { value: 'claude', label: 'Claude' },
        { value: 'other', label: language === 'vi' ? 'Khác' : 'Other' }
    ];

    useEffect(() => {
        if (editingPrompt) {
            // Handle both legacy single prompt and new multiple prompts
            let promptContents: PromptContent[] = [];
            if (editingPrompt.promptContents && editingPrompt.promptContents.length > 0) {
                promptContents = editingPrompt.promptContents;
            } else if (editingPrompt.promptContent) {
                // Legacy support: convert single prompt to array
                promptContents = [{ label: '', content: editingPrompt.promptContent }];
            } else {
                promptContents = [{ label: '', content: '' }];
            }

            setFormData({
                title: editingPrompt.title,
                description: editingPrompt.description,
                promptContents,
                notes: editingPrompt.notes || '',
                category: editingPrompt.category,
                platform: editingPrompt.platform,
                tags: editingPrompt.tags,
                exampleImages: editingPrompt.exampleImages
            });
        } else {
            setFormData({
                title: { vi: '', en: '' },
                description: { vi: '', en: '' },
                promptContents: [{ label: '', content: '' }],
                notes: '',
                category: 'other',
                platform: 'other',
                tags: [],
                exampleImages: []
            });
        }
        setError(null);
    }, [editingPrompt, isOpen]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'input' | 'output') => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploadingImage(true);
        try {
            const file = e.target.files[0];
            const result = await uploadImage(file);

            const newImage: ExampleImage = {
                type,
                url: result.url,
                publicId: result.publicId,
                caption: ''
            };

            setFormData(prev => ({
                ...prev,
                exampleImages: [...(prev.exampleImages || []), newImage]
            }));
        } catch (err) {
            console.error('Failed to upload image:', err);
            setError(language === 'vi' ? 'Không thể tải lên hình ảnh' : 'Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            exampleImages: prev.exampleImages?.filter((_, i) => i !== index) || []
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.vi || !formData.title.en) {
            setError(language === 'vi' ? 'Vui lòng nhập tiêu đề cả tiếng Việt và tiếng Anh' : 'Please enter title in both Vietnamese and English');
            return;
        }

        // Check if at least one prompt has content
        const hasPromptContent = formData.promptContents?.some(p => p.content.trim() !== '');
        if (!hasPromptContent) {
            setError(language === 'vi' ? 'Vui lòng nhập ít nhất một nội dung prompt' : 'Please enter at least one prompt content');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            let response;
            if (editingPrompt) {
                response = await updatePrompt(editingPrompt._id, formData);
            } else {
                response = await createPrompt(formData);
            }

            onSuccess?.(response.data);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save prompt');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        {editingPrompt
                            ? (language === 'vi' ? 'Chỉnh sửa Prompt' : 'Edit Prompt')
                            : (language === 'vi' ? 'Tạo Prompt mới' : 'Create New Prompt')
                        }
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
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

                    {/* Title */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {language === 'vi' ? 'Tiêu đề (Tiếng Việt)' : 'Title (Vietnamese)'} *
                            </label>
                            <input
                                type="text"
                                value={formData.title.vi}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    title: { ...prev.title, vi: e.target.value }
                                }))}
                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {language === 'vi' ? 'Tiêu đề (Tiếng Anh)' : 'Title (English)'} *
                            </label>
                            <input
                                type="text"
                                value={formData.title.en}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    title: { ...prev.title, en: e.target.value }
                                }))}
                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                required
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {language === 'vi' ? 'Mô tả (Tiếng Việt)' : 'Description (Vietnamese)'}
                            </label>
                            <textarea
                                value={formData.description?.vi || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    description: { ...(prev.description || { vi: '', en: '' }), vi: e.target.value }
                                }))}
                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {language === 'vi' ? 'Mô tả (Tiếng Anh)' : 'Description (English)'}
                            </label>
                            <textarea
                                value={formData.description?.en || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    description: { ...(prev.description || { vi: '', en: '' }), en: e.target.value }
                                }))}
                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Category & Platform */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {language === 'vi' ? 'Danh mục' : 'Category'}
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                {language === 'vi' ? 'Nền tảng' : 'Platform'}
                            </label>
                            <select
                                value={formData.platform}
                                onChange={(e) => setFormData(prev => ({ ...prev, platform: e.target.value }))}
                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            >
                                {platforms.map(plat => (
                                    <option key={plat.value} value={plat.value}>{plat.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Multiple Prompts */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-[var(--text-primary)]">
                                {language === 'vi' ? 'Nội dung Prompt' : 'Prompt Content'} *
                            </label>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({
                                    ...prev,
                                    promptContents: [...(prev.promptContents || []), { label: '', content: '' }]
                                }))}
                                className="flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {language === 'vi' ? 'Thêm Prompt' : 'Add Prompt'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.promptContents?.map((prompt, index) => (
                                <div key={index} className="relative bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-4">
                                    {/* Prompt Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-1 rounded">
                                                Prompt {index + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={prompt.label}
                                                onChange={(e) => {
                                                    const newPrompts = [...(formData.promptContents || [])];
                                                    newPrompts[index] = { ...newPrompts[index], label: e.target.value };
                                                    setFormData(prev => ({ ...prev, promptContents: newPrompts }));
                                                }}
                                                placeholder={language === 'vi' ? 'Nhãn (tùy chọn)' : 'Label (optional)'}
                                                className="text-sm bg-transparent border-b border-[var(--border-primary)] focus:border-[var(--accent-primary)] outline-none px-1 py-0.5 text-[var(--text-secondary)]"
                                            />
                                        </div>
                                        {(formData.promptContents?.length || 0) > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newPrompts = formData.promptContents?.filter((_, i) => i !== index) || [];
                                                    setFormData(prev => ({ ...prev, promptContents: newPrompts }));
                                                }}
                                                className="p-1 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                                title={language === 'vi' ? 'Xóa prompt' : 'Remove prompt'}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* Prompt Content */}
                                    <textarea
                                        value={prompt.content}
                                        onChange={(e) => {
                                            const newPrompts = [...(formData.promptContents || [])];
                                            newPrompts[index] = { ...newPrompts[index], content: e.target.value };
                                            setFormData(prev => ({ ...prev, promptContents: newPrompts }));
                                        }}
                                        className="w-full p-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                        rows={4}
                                        maxLength={10000}
                                        placeholder={language === 'vi' ? 'Nhập nội dung prompt...' : 'Enter prompt content...'}
                                    />
                                    <p className="text-xs text-[var(--text-tertiary)] mt-1 text-right">
                                        {prompt.content.length}/10000
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                            {language === 'vi' ? 'Ghi chú thêm' : 'Additional Notes'}
                        </label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                            rows={3}
                            maxLength={5000}
                            placeholder={language === 'vi' ? 'Thêm ghi chú, hướng dẫn sử dụng, tips...' : 'Add notes, usage instructions, tips...'}
                        />
                        <p className="text-xs text-[var(--text-tertiary)] mt-1">
                            {(formData.notes || '').length}/5000
                        </p>
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                            Tags
                        </label>
                        <TagsInput
                            tags={formData.tags || []}
                            onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
                            placeholder={language === 'vi' ? 'Thêm tags...' : 'Add tags...'}
                            maxTags={10}
                        />
                    </div>

                    {/* Example Images */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            {language === 'vi' ? 'Hình ảnh minh họa' : 'Example Images'}
                        </label>
                        <div className="flex flex-wrap gap-3 mb-3">
                            {formData.exampleImages?.map((img, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={img.url}
                                        alt={`Example ${index + 1}`}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                    <span className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                        img.type === 'input' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                                    }`}>
                                        {img.type === 'input' ? 'IN' : 'OUT'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <label className="cursor-pointer px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors">
                                {uploadingImage ? '...' : (language === 'vi' ? '+ Input' : '+ Input')}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'input')}
                                    className="hidden"
                                    disabled={uploadingImage}
                                />
                            </label>
                            <label className="cursor-pointer px-3 py-2 bg-green-500/10 text-green-400 rounded-lg text-sm font-medium hover:bg-green-500/20 transition-colors">
                                {uploadingImage ? '...' : (language === 'vi' ? '+ Output' : '+ Output')}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, 'output')}
                                    className="hidden"
                                    disabled={uploadingImage}
                                />
                            </label>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--border-primary)] flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </button>
                    {uploadingImage ? (
                        <div className="flex items-center gap-2 px-6 py-2 text-[var(--text-secondary)]">
                            <div className="w-4 h-4 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                            <span className="text-sm">{language === 'vi' ? 'Đang tải ảnh...' : 'Uploading image...'}</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {isSubmitting
                                ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                                : editingPrompt
                                    ? (language === 'vi' ? 'Cập nhật' : 'Update')
                                    : (language === 'vi' ? 'Tạo mới' : 'Create')
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PromptFormModal;
