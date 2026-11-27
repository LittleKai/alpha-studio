import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/context';
import { useTranslation } from '../../i18n/context';
import { useConfirm } from '../ui/ConfirmDialog';
import {
  type LedStudioWorkspaceAssetsSummary,
  type LedStudioWorkspacePurgeResult,
  getLedStudioWorkspaceAssetsSummary,
  createLedStudioWorkspacePurgePreview,
  executeLedStudioWorkspacePurge,
  reconcileLedStudioWorkspaceUploads
} from '../../services/ledStudioService';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function LedStudioWorkspaceAssetsAdminTab() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { confirm } = useConfirm();

  const [summary, setSummary] = useState<LedStudioWorkspaceAssetsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState<LedStudioWorkspacePurgeResult | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLedStudioWorkspaceAssetsSummary(token);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const handlePurge = async () => {
    if (busy || !summary || summary.purgeableCount === 0) return;
    setBusy(true);
    setError('');
    setStatusMessage('');
    try {
      const preview = await createLedStudioWorkspacePurgePreview(token);
      if (preview.totalFiles === 0) {
        setStatusMessage(t('admin.studio.ledAssets.nothingToPurge'));
        await loadSummary();
        return;
      }

      const confirmed = await confirm({
        title: t('admin.studio.ledAssets.confirmTitle'),
        message: t('admin.studio.ledAssets.confirmMessage')
          .replace('{count}', String(preview.totalFiles))
          .replace('{size}', formatBytes(preview.totalBytes)),
        confirmText: t('admin.studio.ledAssets.confirmAction'),
        variant: 'danger'
      });

      if (!confirmed) return;

      const result = await executeLedStudioWorkspacePurge(preview.previewId, token);
      setLastResult(result);
      setStatusMessage(
        t('admin.studio.ledAssets.purgeDone')
          .replace('{deleted}', String(result.deletedCount))
          .replace('{skipped}', String(result.skippedCount))
          .replace('{failed}', String(result.failedCount))
      );
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purge failed');
    } finally {
      setBusy(false);
    }
  };

  const handleReconcile = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await reconcileLedStudioWorkspaceUploads(token);
      setStatusMessage(
        t('admin.studio.ledAssets.reconciled').replace('{count}', String(res.expiredCount))
      );
      await loadSummary();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconcile failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t('admin.studio.ledAssets.title')}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('admin.studio.ledAssets.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || busy}
            onClick={() => void loadSummary()}
            className="px-3 py-2 text-sm rounded-lg border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
          >
            {t('admin.studio.ledAssets.refresh')}
          </button>
          <button
            type="button"
            disabled={loading || busy}
            onClick={() => void handleReconcile()}
            className="px-3 py-2 text-sm rounded-lg border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
          >
            {t('admin.studio.ledAssets.reconcileBtn')}
          </button>
          <button
            type="button"
            disabled={loading || busy || !summary || summary.purgeableCount === 0}
            onClick={() => void handlePurge()}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {t('admin.studio.ledAssets.purgeBtn')}
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-sm text-red-500 dark:text-red-300">
          {error}
        </div>
      )}

      {statusMessage && (
        <div role="status" className="p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)]">
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <div className="text-xs text-[var(--text-secondary)]">{t('admin.studio.ledAssets.referencedLabel')}</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {summary ? summary.referencedCount : '—'}
          </div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">
            {summary ? formatBytes(summary.referencedBytes) : '—'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <div className="text-xs text-[var(--text-secondary)]">{t('admin.studio.ledAssets.purgeableLabel')}</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {summary ? summary.purgeableCount : '—'}
          </div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">
            {summary ? formatBytes(summary.purgeableBytes) : '—'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <div className="text-xs text-[var(--text-secondary)]">{t('admin.studio.ledAssets.expiredUploadsLabel')}</div>
          <div className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {summary ? summary.expiredPendingCount : '—'}
          </div>
        </div>
      </div>

      {lastResult && lastResult.failedItems.length > 0 && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-[var(--bg-secondary)] space-y-2">
          <div className="text-sm font-semibold text-red-500 dark:text-red-300">
            {t('admin.studio.ledAssets.failedItemsTitle')}
          </div>
          <ul className="text-xs text-[var(--text-secondary)] space-y-1">
            {lastResult.failedItems.map((item) => (
              <li key={item.assetId}>
                <code>{item.assetId}</code>: {item.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
