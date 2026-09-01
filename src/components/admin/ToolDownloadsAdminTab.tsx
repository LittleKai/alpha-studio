import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { useConfirm } from '../ui/ConfirmDialog';
import {
    getToolDownloadStats,
    updateToolDownloadCount,
    resetToolDownloadCount,
    type ToolDownloadInfo,
    type ToolDownloadSummary,
    type ToolDownloadActivity,
    type ToolDownloadPlatformStats,
} from '../../services/toolDownloadService';

const TOOL_LOGOS: Record<string, { logo: string; to: string; color: string; bg: string; border: string }> = {
    vietyaku: {
        logo: '/vietyaku-logo.png',
        to: '/studio/vietyaku',
        color: 'text-rose-500 dark:text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
    },
    vocabflip: {
        logo: '/vocab/icons/Icon-192.png',
        to: '/studio/vocab',
        color: 'text-emerald-500 dark:text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
    },
    crm: {
        logo: '/crm-logo.png',
        to: '/studio/crm/subscription',
        color: 'text-blue-500 dark:text-blue-400',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
    },
};

export default function ToolDownloadsAdminTab() {
    const { t, language } = useTranslation();
    const { confirm } = useConfirm();

    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<ToolDownloadSummary | null>(null);
    const [tools, setTools] = useState<ToolDownloadInfo[]>([]);
    const [activities, setActivities] = useState<ToolDownloadActivity[]>([]);
    const [editingTool, setEditingTool] = useState<ToolDownloadInfo | null>(null);
    const [editForm, setEditForm] = useState<{
        totalDownloads: number;
        windows: number;
        android: number;
        mac: number;
        linux: number;
        other: number;
    }>({
        totalDownloads: 0,
        windows: 0,
        android: 0,
        mac: 0,
        linux: 0,
        other: 0,
    });
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getToolDownloadStats();
            setSummary(data.summary);
            setTools(data.tools);
            setActivities(data.recentActivities || []);
        } catch (error) {
            console.error('Failed to load tool download stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenEdit = (tool: ToolDownloadInfo) => {
        setEditingTool(tool);
        setEditForm({
            totalDownloads: tool.totalDownloads,
            windows: tool.platforms?.windows || 0,
            android: tool.platforms?.android || 0,
            mac: tool.platforms?.mac || 0,
            linux: tool.platforms?.linux || 0,
            other: tool.platforms?.other || 0,
        });
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTool) return;

        try {
            setSaving(true);
            const platforms: Partial<ToolDownloadPlatformStats> = {
                windows: Math.max(0, Number(editForm.windows) || 0),
                android: Math.max(0, Number(editForm.android) || 0),
                mac: Math.max(0, Number(editForm.mac) || 0),
                linux: Math.max(0, Number(editForm.linux) || 0),
                other: Math.max(0, Number(editForm.other) || 0),
            };
            const total = Math.max(0, Number(editForm.totalDownloads) || 0);

            await updateToolDownloadCount(editingTool.toolId, {
                totalDownloads: total,
                platforms,
            });

            setEditingTool(null);
            await loadData();
        } catch (error: any) {
            console.error('Failed to update download count:', error);
            alert(error.message || t('admin.toolDownloads.saveError'));
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async (tool: ToolDownloadInfo) => {
        const ok = await confirm({
            title: t('admin.toolDownloads.resetConfirmTitle') || 'Đặt lại số lượt tải?',
            message: (t('admin.toolDownloads.resetConfirmMessage') || 'Bạn có chắc chắn muốn đặt lại lượt tải của {{tool}} về 0?').replace('{{tool}}', tool.toolName),
            variant: 'danger',
        });
        if (!ok) return;

        try {
            setSaving(true);
            await resetToolDownloadCount(tool.toolId);
            setEditingTool(null);
            await loadData();
        } catch (error: any) {
            console.error('Failed to reset count:', error);
            alert(error.message || t('admin.toolDownloads.saveError'));
        } finally {
            setSaving(false);
        }
    };

    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return t('admin.toolDownloads.neverDownloaded');
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return t('admin.toolDownloads.neverDownloaded');
        return date.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatRelativeTime = (dateStr?: string | null) => {
        if (!dateStr) return t('admin.toolDownloads.neverDownloaded');
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return t('admin.toolDownloads.neverDownloaded');

        const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
        if (diffSec < 60) return language === 'vi' ? 'Vừa xong' : 'Just now';
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return language === 'vi' ? `${diffMin} phút trước` : `${diffMin}m ago`;
        const diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return language === 'vi' ? `${diffHour} giờ trước` : `${diffHour}h ago`;
        const diffDay = Math.floor(diffHour / 24);
        if (diffDay < 30) return language === 'vi' ? `${diffDay} ngày trước` : `${diffDay}d ago`;
        return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
    };

    return (
        <div className="space-y-6">
            {/* Header with Title & Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                        {t('admin.toolDownloads.title')}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {t('admin.toolDownloads.subtitle')}
                    </p>
                </div>
                <button
                    onClick={loadData}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer shadow-sm w-fit"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18v3" />
                    </svg>
                    <span>{t('admin.toolDownloads.refresh')}</span>
                </button>
            </div>

            {/* Overview Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Downloads */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                            {t('admin.toolDownloads.totalAll')}
                        </span>
                        <div className="h-9 w-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                            </svg>
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-black text-[var(--text-primary)]">
                        {loading ? '...' : (summary?.totalDownloads || 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                        {t('admin.toolDownloads.totalAllDesc') || 'Toàn bộ công cụ trên Studio'}
                    </p>
                </div>

                {/* Windows Downloads */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                            {t('admin.toolDownloads.windowsTotal')}
                        </span>
                        <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center">
                            <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M0 3.45 9.75 2.1v9.45H0V3.45Zm0 9h9.75v9.45L0 20.55v-8.1ZM11.25 1.9 24 0v11.55H11.25V1.9Zm0 10.55H24V24l-12.75-1.9v-9.65Z" />
                            </svg>
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-black text-sky-500">
                        {loading ? '...' : (summary?.windowsDownloads || 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                        {t('admin.toolDownloads.windowsTotalDesc') || 'Bản cài đặt Windows (.ZIP / .EXE)'}
                    </p>
                </div>

                {/* Android Downloads */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                            {t('admin.toolDownloads.androidTotal')}
                        </span>
                        <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.523 15.3l1.816 3.146a.5.5 0 01-.173.682.5.5 0 01-.682-.172L16.63 15.75c-1.42.617-2.992.95-4.63.95s-3.21-.333-4.63-.95L5.516 18.8a.5.5 0 01-.682.173.5.5 0 01-.173-.682l1.816-3.146C3.722 13.784 2 11.082 2 8h20c0 3.082-1.722 5.784-4.477 7.3zM7 6a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
                            </svg>
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-black text-emerald-500">
                        {loading ? '...' : (summary?.androidDownloads || 0).toLocaleString()}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                        {t('admin.toolDownloads.androidTotalDesc') || 'Gói ứng dụng Android (.APK)'}
                    </p>
                </div>

                {/* Top Tool */}
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 relative overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                            {t('admin.toolDownloads.topTool')}
                        </span>
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                            <span className="text-base">👑</span>
                        </div>
                    </div>
                    <p className="mt-3 text-2xl font-black text-amber-500 truncate">
                        {loading ? '...' : (summary?.topTool ? summary.topTool.toolName : '—')}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                        {summary?.topTool
                            ? `${summary.topTool.count.toLocaleString()} ${t('admin.toolDownloads.downloadsCount') || 'lượt tải'}`
                            : (t('admin.toolDownloads.noData') || 'Chưa có lượt tải')}
                    </p>
                </div>
            </div>

            {/* Per-Tool Detailed Cards */}
            <div className="space-y-4">
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                    {t('admin.toolDownloads.toolsBreakdown') || 'Chi tiết theo từng công cụ'}
                </h4>

                {loading ? (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-12 text-center text-sm text-[var(--text-secondary)]">
                        {t('admin.studio.loading')}
                    </div>
                ) : tools.length === 0 ? (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-12 text-center text-sm text-[var(--text-tertiary)]">
                        {t('admin.toolDownloads.noData')}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {tools.map((tool) => {
                            const meta = TOOL_LOGOS[tool.toolId] || {
                                logo: '/skills-logo.png',
                                to: '/studio',
                                color: 'text-violet-500 dark:text-violet-400',
                                bg: 'bg-violet-500/10',
                                border: 'border-violet-500/30',
                            };

                            const win = tool.platforms?.windows || 0;
                            const apk = tool.platforms?.android || 0;

                            return (
                                <div
                                    key={tool.toolId}
                                    className="glass-card rounded-2xl p-5 sm:p-6 border border-[var(--border-primary)] shadow-sm hover:border-[var(--accent-primary)]/50 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Tool Header */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`w-12 h-12 rounded-2xl border ${meta.border} ${meta.bg} p-2 flex items-center justify-center shrink-0`}>
                                                    <img src={meta.logo} alt={tool.toolName} className="w-full h-full object-contain rounded-lg" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h5 className="text-lg font-black text-[var(--text-primary)]">
                                                            {tool.toolName}
                                                        </h5>
                                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] uppercase">
                                                            {tool.toolId}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                                                        {t('admin.toolDownloads.lastDownloaded')}: <span className="text-[var(--text-secondary)] font-medium">{formatRelativeTime(tool.lastDownloadedAt)}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Big count badge */}
                                            <div className="text-right shrink-0">
                                                <span className="text-2xl font-black text-[var(--text-primary)] block">
                                                    {tool.totalDownloads.toLocaleString()}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                                                    {t('admin.toolDownloads.downloadsCount') || 'Lượt tải'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Platform Breakdown Pills */}
                                        <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border-primary)]">
                                            <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/70 border border-[var(--border-primary)]/60 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <svg className="h-4 w-4 text-sky-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M0 3.45 9.75 2.1v9.45H0V3.45Zm0 9h9.75v9.45L0 20.55v-8.1ZM11.25 1.9 24 0v11.55H11.25V1.9Zm0 10.55H24V24l-12.75-1.9v-9.65Z" />
                                                    </svg>
                                                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Windows</span>
                                                </div>
                                                <span className="text-sm font-black text-[var(--text-primary)]">{win.toLocaleString()}</span>
                                            </div>

                                            <div className="p-3 rounded-xl bg-[var(--bg-secondary)]/70 border border-[var(--border-primary)]/60 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M17.523 15.3l1.816 3.146a.5.5 0 01-.173.682.5.5 0 01-.682-.172L16.63 15.75c-1.42.617-2.992.95-4.63.95s-3.21-.333-4.63-.95L5.516 18.8a.5.5 0 01-.682.173.5.5 0 01-.173-.682l1.816-3.146C3.722 13.784 2 11.082 2 8h20c0 3.082-1.722 5.784-4.477 7.3zM7 6a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
                                                    </svg>
                                                    <span className="text-xs font-semibold text-[var(--text-secondary)]">Android APK</span>
                                                </div>
                                                <span className="text-sm font-black text-[var(--text-primary)]">{apk.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action footer */}
                                    <div className="mt-5 pt-3 border-t border-[var(--border-primary)]/50 flex items-center justify-between gap-3">
                                        <a
                                            href={meta.to}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] flex items-center gap-1 transition-colors"
                                        >
                                            <span>{t('admin.toolDownloads.viewToolPage') || 'Trang tải công cụ'}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEdit(tool)}
                                                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--accent-primary)]/15 border border-[var(--border-primary)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer shadow-sm"
                                            >
                                                ✏️ {t('admin.toolDownloads.editCounts') || 'Chỉnh sửa'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Recent Download Activity Timeline */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-bold text-[var(--text-primary)]">
                        {t('admin.toolDownloads.recentActivity')}
                    </h4>
                    <span className="text-xs text-[var(--text-tertiary)]">
                        {activities.length} {t('admin.toolDownloads.recentCount') || 'lượt tải gần nhất'}
                    </span>
                </div>

                {activities.length === 0 ? (
                    <p className="text-center text-xs text-[var(--text-tertiary)] py-8">
                        {t('admin.toolDownloads.noRecentActivity') || 'Chưa có hoạt động tải nào được ghi nhận.'}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--border-primary)] text-[var(--text-tertiary)] uppercase text-[10px] tracking-wider">
                                    <th className="py-2.5 px-3">{t('admin.toolDownloads.tool') || 'Công cụ'}</th>
                                    <th className="py-2.5 px-3">{t('admin.toolDownloads.platform') || 'Nền tảng'}</th>
                                    <th className="py-2.5 px-3">{t('admin.toolDownloads.version') || 'Phiên bản'}</th>
                                    <th className="py-2.5 px-3 text-right">{t('admin.toolDownloads.time') || 'Thời gian'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-primary)]/50 text-[var(--text-primary)]">
                                {activities.map((act, index) => (
                                    <tr key={index} className="hover:bg-[var(--bg-secondary)]/40 transition-colors">
                                        <td className="py-2.5 px-3 font-bold">
                                            <span className="inline-flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                                                {act.toolName}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                act.platform === 'windows'
                                                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                                                    : act.platform === 'android'
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                            }`}>
                                                {act.platform}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-[11px] text-[var(--text-secondary)]">
                                            {act.version ? `v${act.version}` : '—'}
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-[var(--text-secondary)]">
                                            {formatDateTime(act.downloadedAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit / Calibrate Modal */}
            {editingTool && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setEditingTool(null)}
                >
                    <div
                        className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-black text-[var(--text-primary)]">
                                {t('admin.toolDownloads.editTitle')} - {editingTool.toolName}
                            </h4>
                            <button
                                type="button"
                                onClick={() => setEditingTool(null)}
                                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] text-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mb-5">
                            {t('admin.toolDownloads.editDesc') || 'Điều chỉnh số liệu thống kê lượt tải thực tế hoặc đồng bộ từ số liệu cũ.'}
                        </p>

                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">
                                    {t('admin.toolDownloads.totalAll')}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editForm.totalDownloads}
                                    onChange={(e) => setEditForm({ ...editForm, totalDownloads: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                    className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">
                                        Windows
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.windows}
                                        onChange={(e) => setEditForm({ ...editForm, windows: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                        className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">
                                        Android APK
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editForm.android}
                                        onChange={(e) => setEditForm({ ...editForm, android: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                                        className="w-full px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-sm font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--border-primary)] flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => handleReset(editingTool)}
                                    disabled={saving}
                                    className="px-3.5 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                                >
                                    {t('admin.toolDownloads.resetBtn') || 'Đặt lại về 0'}
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditingTool(null)}
                                        className="px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all cursor-pointer"
                                    >
                                        {t('admin.articles.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-5 py-2 text-xs font-bold bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {saving ? t('admin.articles.saving') : t('admin.articles.update')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
