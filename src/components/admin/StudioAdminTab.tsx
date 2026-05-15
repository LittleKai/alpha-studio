import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { getAuthHeaders } from '../../services/cloudService';
import type { StudioAdminSettings } from '../../services/adminService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function StudioAdminTab() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState<StudioAdminSettings>({
        useApiForStudio: false,
        useApiForImage: false,
        useApiForVideo: false,
        useApiForEdit: false,
        useOpenClawForChat: true,
        gcliBotModel: 'gemini-3.1-flash-lite',
        geminiApiKey: '',
        videoApiKey: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/settings`, {
                headers: getAuthHeaders()
            });
            const data = await res.json();
            if (data.success) {
                setSettings({
                    useApiForStudio: data.data.useApiForStudio || false,
                    useApiForImage: data.data.useApiForImage || false,
                    useApiForVideo: data.data.useApiForVideo || false,
                    useApiForEdit: data.data.useApiForEdit || false,
                    useOpenClawForChat: data.data.useOpenClawForChat ?? true,
                    gcliBotModel: data.data.gcliBotModel || 'gemini-3.1-flash-lite',
                    geminiApiKey: data.data.geminiApiKey || '',
                    videoApiKey: data.data.videoApiKey || ''
                });
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const res = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({ settings })
            });
            const data = await res.json();
            if (data.success) {
                alert(t('admin.studio.saveSuccess'));
            } else {
                alert(data.message || t('admin.studio.saveError'));
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert(t('admin.studio.systemError'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">{t('admin.studio.title')}</h3>

            {loading ? (
                <p className="text-[var(--text-secondary)]">{t('admin.studio.loading')}</p>
            ) : (
                <div className="space-y-6">
                    <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.useOpenClawForChat}
                                onChange={(e) => setSettings({ ...settings, useOpenClawForChat: e.target.checked })}
                                className="w-5 h-5 accent-[var(--accent-primary)]"
                            />
                            <div>
                                <span className="font-bold text-[var(--text-primary)]">{t('admin.studio.chatProviderTitle')}</span>
                                <p className="text-sm text-[var(--text-secondary)]">{t('admin.studio.chatProviderDesc')}</p>
                            </div>
                        </label>

                        {!settings.useOpenClawForChat && (
                            <div className="mt-4 pl-8">
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                    {t('admin.studio.gcliBotModelLabel')}
                                </label>
                                <p className="text-xs text-[var(--text-secondary)] mb-2">{t('admin.studio.gcliBotModelDesc')}</p>
                                <select
                                    value={settings.gcliBotModel}
                                    onChange={(e) => setSettings({ ...settings, gcliBotModel: e.target.value })}
                                    className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                                >
                                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite ({t('admin.studio.modelDefault')})</option>
                                    <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Master toggle */}
                    <div className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.useApiForStudio}
                                onChange={(e) => setSettings({ ...settings, useApiForStudio: e.target.checked })}
                                className="w-5 h-5 accent-[var(--accent-primary)]"
                            />
                            <div>
                                <span className="font-bold text-[var(--text-primary)]">Bật sử dụng API ngoài cho Studio</span>
                                <p className="text-sm text-[var(--text-secondary)]">Kích hoạt cái này để cho phép các tab hiển thị tùy chọn API. Tắt cái này sẽ chạy Flow Agent mặc định cho tất cả mọi thứ.</p>
                            </div>
                        </label>
                    </div>

                    {settings.useApiForStudio && (
                        <div className="pl-6 space-y-6 border-l-2 border-[var(--border-primary)]">

                            {/* Gemini API Key cho Image và Edit */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                    Gemini API Key (Cho Image và Edit)
                                </label>
                                <input
                                    type="password"
                                    value={settings.geminiApiKey}
                                    onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] mb-2"
                                    placeholder="AIzaSy..."
                                />

                                <div className="flex gap-6 mt-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.useApiForImage}
                                            onChange={(e) => setSettings({ ...settings, useApiForImage: e.target.checked })}
                                            className="w-4 h-4 accent-[var(--accent-primary)]"
                                        />
                                        <span className="text-[var(--text-primary)]">Áp dụng cho Tab Image</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.useApiForEdit}
                                            onChange={(e) => setSettings({ ...settings, useApiForEdit: e.target.checked })}
                                            className="w-4 h-4 accent-[var(--accent-primary)]"
                                        />
                                        <span className="text-[var(--text-primary)]">Áp dụng cho Tab Edit</span>
                                    </label>
                                </div>
                            </div>

                            <hr className="border-[var(--border-primary)]" />

                            {/* Video API Key */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                    Video API Key (Tuỳ chọn nếu cần Key khác)
                                </label>
                                <p className="text-xs text-[var(--text-secondary)] mb-2">
                                    Nếu để trống, sẽ sử dụng Flow Agent mặc định hoặc bị ẩn nếu API Video chưa sẵn sàng.
                                </p>
                                <input
                                    type="password"
                                    value={settings.videoApiKey}
                                    onChange={(e) => setSettings({ ...settings, videoApiKey: e.target.value })}
                                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] mb-2"
                                    placeholder="Key API riêng cho Video..."
                                />

                                <div className="flex gap-6 mt-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.useApiForVideo}
                                            onChange={(e) => setSettings({ ...settings, useApiForVideo: e.target.checked })}
                                            className="w-4 h-4 accent-[var(--accent-primary)]"
                                        />
                                        <span className="text-[var(--text-primary)]">Áp dụng cho Tab Video</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                        {saving ? t('admin.studio.saving') : t('admin.studio.save')}
                    </button>
                </div>
            )}
        </div>
    );
}
