import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import {
    Resource,
    ResourceInput,
    createResource,
    updateResource,
    MAX_FILE_SIZE,
    formatFileSize,
    PreviewImage
} from '../../services/resourceService';
import { TagsInput } from '../shared';
import { uploadImage, uploadFile } from '../../services/cloudinaryService';

interface ResourceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingResource?: Resource | null;
    onSuccess?: (resource: Resource) => void;
}

const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
    isOpen,
    onClose,
    editingResource,
    onSuccess
}) => {
    const { language } = useTranslation();

    const [formData, setFormData] = useState<ResourceInput>({
        title: { vi: '', en: '' },
        description: { vi: '', en: '' },
        resourceType: 'other',
        file: { url: '', filename: '', size: 0 },
        thumbnail: undefined,
        previewImages: [],
        tags: [],
        compatibleSoftware: []
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [softwareInput, setSoftwareInput] = useState('');

    const resourceTypes = [
        { value: 'template', label: 'Template' },
        { value: 'dataset', label: 'Dataset' },
        { value: 'design-asset', label: language === 'vi' ? 'Design Asset' : 'Design Asset' },
        { value: 'project-file', label: language === 'vi' ? 'Project File' : 'Project File' },
        { value: '3d-model', label: '3D Model' },
        { value: 'font', label: 'Font' },
        { value: 'other', label: language === 'vi' ? 'Khác' : 'Other' }
    ];

    useEffect(() => {
        if (editingResource) {
            setFormData({
                title: editingResource.title,
                description: editingResource.description,
                resourceType: editingResource.resourceType,
                file: editingResource.file,
                thumbnail: editingResource.thumbnail,
                previewImages: editingResource.previewImages,
                tags: editingResource.tags,
                compatibleSoftware: editingResource.compatibleSoftware
            });
        } else {
            setFormData({
                title: { vi: '', en: '' },
                description: { vi: '', en: '' },
                resourceType: 'other',
                file: { url: '', filename: '', size: 0 },
                thumbnail: undefined,
                previewImages: [],
                tags: [],
                compatibleSoftware: []
            });
        }
        setError(null);
    }, [editingResource, isOpen]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            setError(language === 'vi'
                ? `Kích thước file không được vượt quá ${formatFileSize(MAX_FILE_SIZE)}`
                : `File size cannot exceed ${formatFileSize(MAX_FILE_SIZE)}`
            );
            return;
        }

        setUploadingFile(true);
        setUploadProgress(0);
        setError(null);

        try {
            const result = await uploadFile(file, (progress) => {
                setUploadProgress(progress);
            });

            setFormData(prev => ({
                ...prev,
                file: {
                    url: result.url,
                    publicId: result.publicId,
                    filename: file.name,
                    format: file.name.split('.').pop() || '',
                    size: file.size,
                    mimeType: file.type
                }
            }));
        } catch (err) {
            console.error('Failed to upload file:', err);
            setError(language === 'vi' ? 'Không thể tải lên file' : 'Failed to upload file');
        } finally {
            setUploadingFile(false);
            setUploadProgress(0);
        }
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploadingImage(true);
        try {
            const file = e.target.files[0];
            const result = await uploadImage(file);

            setFormData(prev => ({
                ...prev,
                thumbnail: {
                    url: result.url,
                    publicId: result.publicId
                }
            }));
        } catch (err) {
            console.error('Failed to upload thumbnail:', err);
            setError(language === 'vi' ? 'Không thể tải lên hình thu nhỏ' : 'Failed to upload thumbnail');
        } finally {
            setUploadingImage(false);
        }
    };

    const handlePreviewUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploadingImage(true);
        try {
            const file = e.target.files[0];
            const result = await uploadImage(file);

            const newPreview: PreviewImage = {
                url: result.url,
                publicId: result.publicId,
                caption: ''
            };

            setFormData(prev => ({
                ...prev,
                previewImages: [...(prev.previewImages || []), newPreview]
            }));
        } catch (err) {
            console.error('Failed to upload preview:', err);
            setError(language === 'vi' ? 'Không thể tải lên hình xem trước' : 'Failed to upload preview');
        } finally {
            setUploadingImage(false);
        }
    };

    const removePreview = (index: number) => {
        setFormData(prev => ({
            ...prev,
            previewImages: prev.previewImages?.filter((_, i) => i !== index) || []
        }));
    };

    const addSoftware = () => {
        if (softwareInput.trim() && !formData.compatibleSoftware?.includes(softwareInput.trim())) {
            setFormData(prev => ({
                ...prev,
                compatibleSoftware: [...(prev.compatibleSoftware || []), softwareInput.trim()]
            }));
            setSoftwareInput('');
        }
    };

    const removeSoftware = (index: number) => {
        setFormData(prev => ({
            ...prev,
            compatibleSoftware: prev.compatibleSoftware?.filter((_, i) => i !== index) || []
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.vi || !formData.title.en) {
            setError(language === 'vi' ? 'Vui lòng nhập tiêu đề cả tiếng Việt và tiếng Anh' : 'Please enter title in both Vietnamese and English');
            return;
        }

        if (!formData.file.url) {
            setError(language === 'vi' ? 'Vui lòng tải lên file' : 'Please upload a file');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            let response;
            if (editingResource) {
                response = await updateResource(editingResource._id, formData);
            } else {
                response = await createResource(formData);
            }

            onSuccess?.(response.data);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save resource');
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
                        {editingResource
                            ? (language === 'vi' ? 'Chỉnh sửa Tài nguyên' : 'Edit Resource')
                            : (language === 'vi' ? 'Tải lên Tài nguyên mới' : 'Upload New Resource')
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

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            {language === 'vi' ? 'File tài nguyên' : 'Resource File'} * (Max {formatFileSize(MAX_FILE_SIZE)})
                        </label>
                        {formData.file.url ? (
                            <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg">
                                <svg className="w-8 h-8 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-[var(--text-primary)] truncate">{formData.file.filename}</p>
                                    <p className="text-xs text-[var(--text-tertiary)]">
                                        {formData.file.format?.toUpperCase()} • {formatFileSize(formData.file.size)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, file: { url: '', filename: '', size: 0 } }))}
                                    className="p-1 text-red-400 hover:text-red-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed border-[var(--border-primary)] rounded-lg cursor-pointer hover:border-[var(--accent-primary)] transition-colors ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploadingFile ? (
                                    <>
                                        <div className="w-8 h-8 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin mb-2" />
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {language === 'vi' ? 'Đang tải lên...' : 'Uploading...'} {uploadProgress}%
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-12 h-12 text-[var(--text-tertiary)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {language === 'vi' ? 'Nhấp để chọn file hoặc kéo thả' : 'Click to select or drag and drop'}
                                        </p>
                                    </>
                                )}
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={uploadingFile}
                                />
                            </label>
                        )}
                    </div>

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

                    {/* Resource Type */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                            {language === 'vi' ? 'Loại tài nguyên' : 'Resource Type'}
                        </label>
                        <select
                            value={formData.resourceType}
                            onChange={(e) => setFormData(prev => ({ ...prev, resourceType: e.target.value }))}
                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            {resourceTypes.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Thumbnail */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            {language === 'vi' ? 'Hình thu nhỏ' : 'Thumbnail'}
                        </label>
                        <div className="flex items-center gap-4">
                            {formData.thumbnail?.url ? (
                                <div className="relative">
                                    <img
                                        src={formData.thumbnail.url}
                                        alt="Thumbnail"
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, thumbnail: undefined }))}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-primary)] rounded-lg cursor-pointer hover:border-[var(--accent-primary)]">
                                    {uploadingImage ? (
                                        <div className="w-6 h-6 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <svg className="w-6 h-6 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            <span className="text-xs text-[var(--text-tertiary)] mt-1">Thumbnail</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailUpload}
                                        className="hidden"
                                        disabled={uploadingImage}
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Preview Images */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            {language === 'vi' ? 'Hình ảnh xem trước' : 'Preview Images'}
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {formData.previewImages?.map((img, index) => (
                                <div key={index} className="relative group">
                                    <img
                                        src={img.url}
                                        alt={`Preview ${index + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePreview(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                            <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-[var(--border-primary)] rounded-lg cursor-pointer hover:border-[var(--accent-primary)]">
                                <svg className="w-6 h-6 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePreviewUpload}
                                    className="hidden"
                                    disabled={uploadingImage}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Compatible Software */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                            {language === 'vi' ? 'Phần mềm tương thích' : 'Compatible Software'}
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={softwareInput}
                                onChange={(e) => setSoftwareInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSoftware())}
                                placeholder="e.g., Photoshop, Blender..."
                                className="flex-1 p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                            />
                            <button
                                type="button"
                                onClick={addSoftware}
                                className="px-4 py-2 bg-[var(--accent-primary)] text-black rounded-lg font-bold"
                            >
                                +
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.compatibleSoftware?.map((software, index) => (
                                <span
                                    key={index}
                                    className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded"
                                >
                                    {software}
                                    <button
                                        type="button"
                                        onClick={() => removeSoftware(index)}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                        </div>
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
                    {(uploadingFile || uploadingImage) ? (
                        <div className="flex items-center gap-2 px-6 py-2 text-[var(--text-secondary)]">
                            <div className="w-4 h-4 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                            <span className="text-sm">
                                {uploadingFile
                                    ? (language === 'vi' ? `Đang tải file... ${uploadProgress}%` : `Uploading file... ${uploadProgress}%`)
                                    : (language === 'vi' ? 'Đang tải ảnh...' : 'Uploading image...')
                                }
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {isSubmitting
                                ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                                : editingResource
                                    ? (language === 'vi' ? 'Cập nhật' : 'Update')
                                    : (language === 'vi' ? 'Tải lên' : 'Upload')
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResourceFormModal;
