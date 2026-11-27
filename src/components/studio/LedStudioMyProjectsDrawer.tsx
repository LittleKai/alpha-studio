import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/context';
import { useTranslation } from '../../i18n/context';
import { useConfirm } from '../ui/ConfirmDialog';
import {
  type LedStudioProjectRecord,
  type LedStudioWorkspaceProjectsState,
  listLedStudioWorkspaceProjects,
  deleteLedStudioWorkspaceProject,
  listLedStudioProjects
} from '../../services/ledStudioService';

interface Props {
  open: boolean;
  onClose: () => void;
  activeProjectId: string | null;
  onOpenWorkspaceProject: (projectId: string) => void;
  onOpenLegacyProject: (projectId: string) => void;
  onCreateNewProject: () => void;
  onProjectDeleted?: (projectId: string) => void;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function LedStudioMyProjectsDrawer({
  open,
  onClose,
  activeProjectId,
  onOpenWorkspaceProject,
  onOpenLegacyProject,
  onCreateNewProject,
  onProjectDeleted
}: Props) {
  const { token } = useAuth();
  const { t, language } = useTranslation();
  const { confirm } = useConfirm();

  const [state, setState] = useState<LedStudioWorkspaceProjectsState | null>(null);
  const [legacyProjects, setLegacyProjects] = useState<LedStudioProjectRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [ws, legacy] = await Promise.all([
        listLedStudioWorkspaceProjects(token),
        listLedStudioProjects(token).catch(() => [])
      ]);
      setState(ws);
      setLegacyProjects(legacy);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (open) {
      void refresh();
    }
  }, [open, refresh]);

  if (!open) return null;

  const isFull = Boolean(state && state.usedSlots >= state.maxSlots);

  const handleDelete = async (projectId: string, revision: number, title: string) => {
    const ok = await confirm({
      title: t('studio.ledStudio.myProjects.deleteTitle'),
      message: t('studio.ledStudio.myProjects.deleteConfirm').replace('{title}', title),
      confirmText: t('studio.ledStudio.myProjects.deleteAction'),
      variant: 'danger'
    });
    if (!ok) return;

    setDeletingId(projectId);
    setError('');
    try {
      await deleteLedStudioWorkspaceProject(projectId, revision, token);
      onProjectDeleted?.(projectId);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="w-full max-w-md h-full bg-[var(--bg-primary)] border-l border-[var(--border-primary)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        aria-label={t('studio.ledStudio.myProjects.title')}
      >
        <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              {t('studio.ledStudio.myProjects.title')}{' '}
              {state && (
                <span className="text-sm font-semibold text-[var(--accent-primary)]">
                  ({state.usedSlots}/{state.maxSlots})
                </span>
              )}
            </h2>
            {state && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {t('studio.ledStudio.myProjects.storageUsage')
                  .replace('{used}', formatBytes(state.usedBytes))
                  .replace('{max}', formatBytes(state.maxBytes))}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isFull}
              onClick={() => {
                onCreateNewProject();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent-primary)] text-[var(--text-on-accent)] disabled:opacity-40"
            >
              {t('studio.ledStudio.myProjects.newBtn')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          <div className="p-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)] leading-relaxed">
            {t('studio.ledStudio.myProjects.autosaveInfo')}
          </div>

          {isFull && (
            <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-xs text-red-500 dark:text-red-300">
              {t('studio.ledStudio.myProjects.quotaFullHint')}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-xs text-red-500 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-sm text-[var(--text-secondary)] py-6 text-center">
              {t('studio.ledStudio.myProjects.loading')}
            </div>
          ) : state && state.projects.length === 0 ? (
            <div className="text-sm text-[var(--text-secondary)] py-6 text-center">
              {t('studio.ledStudio.myProjects.empty')}
            </div>
          ) : (
            <ul className="space-y-2">
              {state?.projects.map((p) => {
                const isActive = activeProjectId === p.id;
                return (
                  <li
                    key={p.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      isActive
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                        : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {p.title}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                          rev {p.revision} · {new Date(p.updatedAt).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN')}
                        </div>
                        {p.hasLocalOnlyMedia && (
                          <div className="text-[11px] text-[var(--text-secondary)] mt-1">
                            {t('studio.ledStudio.myProjects.localOnlyMediaBadge')}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onOpenWorkspaceProject(p.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--accent-primary)] text-[var(--text-on-accent)]"
                        >
                          {t('studio.ledStudio.myProjects.openBtn')}
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === p.id}
                          onClick={() => void handleDelete(p.id, p.revision, p.title)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-red-500/40 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {t('studio.ledStudio.myProjects.deleteAction')}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {legacyProjects.length > 0 && (
            <div className="pt-3 border-t border-[var(--border-primary)] space-y-2">
              <div className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                {t('studio.ledStudio.myProjects.legacyTitle')}
              </div>
              <ul className="space-y-2">
                {legacyProjects.map((lp) => (
                  <li
                    key={lp._id}
                    className="p-2.5 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--text-primary)] truncate">{lp.title}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {new Date(lp.updatedAt).toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenLegacyProject(lp._id);
                        onClose();
                      }}
                      className="px-2 py-1 text-xs rounded border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]"
                    >
                      {t('studio.ledStudio.myProjects.openBtn')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
