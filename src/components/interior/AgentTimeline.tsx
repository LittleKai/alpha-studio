import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/context';
import type { AgentStep } from '../../services/interiorAgentService';

interface AgentTimelineProps {
    steps: AgentStep[];
    isRunning: boolean;
    onStop?: () => void;
}

function toolType(tool: string): 'read' | 'terminal' | 'mutate' {
    if (tool.endsWith('.preview') || tool.startsWith('template.') || tool.startsWith('skill.')) return 'read';
    if (tool === 'model.commit' || tool === 'model.abort') return 'terminal';
    return 'mutate';
}

function formatJson(value: unknown): string {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

export default function AgentTimeline({ steps, isRunning, onStop }: AgentTimelineProps) {
    const { t } = useTranslation();
    const [manualOpen, setManualOpen] = useState<Record<number, boolean>>({});
    const [expanded, setExpanded] = useState(false);
    const endRef = useRef<HTMLDivElement | null>(null);

    // Auto-collapse summary view when run finishes; auto-expand when a new run starts.
    useEffect(() => {
        if (isRunning) setExpanded(true);
        else if (steps.length > 0) setExpanded(false);
    }, [isRunning]);

    // While running, keep view scrolled to the latest step.
    useEffect(() => {
        if (isRunning && expanded) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [steps.length, isRunning, expanded]);

    const latestIndex = steps.length - 1;
    const errorCount = useMemo(() => steps.filter((s) => s.status === 'error').length, [steps]);
    const totalLatency = useMemo(() => steps.reduce((sum, s) => sum + (s.latencyMs || 0), 0), [steps]);
    const totalTokens = useMemo(
        () => steps.reduce((sum, s) => sum + (s.tokens?.total || 0), 0),
        [steps]
    );

    if (!isRunning && steps.length === 0) return null;

    // Decide which step's details to auto-show: while running, the most recent
    // step is in flight or just completed — show its thought + payload inline.
    // After completion the timeline collapses entirely until the user opens it.
    const isStepOpen = (step: AgentStep) => {
        if (manualOpen[step.index] !== undefined) return manualOpen[step.index];
        if (isRunning && step.index === latestIndex) return true;
        return false;
    };

    return (
        <section className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="flex items-center gap-2 text-left"
                    aria-expanded={expanded}
                >
                    <span className={`inline-flex h-2 w-2 rounded-full ${isRunning ? 'animate-pulse bg-yellow-400' : errorCount > 0 ? 'bg-red-400' : 'bg-emerald-400'}`} />
                    <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">
                            {isRunning ? t('studio.interior.agent.running') : t('studio.interior.agent.title')}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)]">
                            {steps.length} {t('studio.interior.agent.steps')}
                            {totalLatency > 0 && ` · ${Math.round(totalLatency / 1000)}s`}
                            {totalTokens > 0 && ` · ${totalTokens.toLocaleString()} tokens`}
                            {errorCount > 0 && ` · ${errorCount} error`}
                        </p>
                    </div>
                    <span className="text-xs text-[var(--text-tertiary)]">{expanded ? '▼' : '▶'}</span>
                </button>
                {isRunning && onStop && (
                    <button
                        type="button"
                        onClick={onStop}
                        className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                    >
                        {t('studio.interior.agent.stop')}
                    </button>
                )}
            </div>

            {expanded && (
                <div className="max-h-72 space-y-2 overflow-auto pr-1">
                    {steps.map((step) => {
                        const type = toolType(step.tool);
                        const statusClass = step.status === 'ok'
                            ? 'border-emerald-500/40 bg-emerald-500/10'
                            : step.status === 'error'
                                ? 'border-red-500/40 bg-red-500/10'
                                : 'border-yellow-500/40 bg-yellow-500/10';
                        const open = isStepOpen(step);
                        return (
                            <article key={step.index} className={`rounded-lg border p-3 ${statusClass}`}>
                                <button
                                    type="button"
                                    onClick={() => setManualOpen((prev) => ({ ...prev, [step.index]: !open }))}
                                    className="flex w-full items-start gap-2 text-left"
                                >
                                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-xs font-bold text-[var(--text-secondary)]">
                                        {type === 'read' ? 'i' : type === 'terminal' ? 'ok' : '+'}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-xs font-bold text-[var(--text-primary)]">{step.tool}</span>
                                        <span className="block truncate text-xs italic text-[var(--text-secondary)]">{step.thought}</span>
                                        {(step.model || step.tokens) && (
                                            <span className="mt-0.5 block text-[10px] text-[var(--text-tertiary)]">
                                                {step.model && <span>{step.model}</span>}
                                                {step.tokens && step.tokens.total > 0 && (
                                                    <span> · {step.tokens.total} tk</span>
                                                )}
                                            </span>
                                        )}
                                    </span>
                                    {step.latencyMs != null && <span className="text-[10px] text-[var(--text-tertiary)]">{step.latencyMs}ms</span>}
                                    <span className="text-xs text-[var(--text-tertiary)]">{open ? '▼' : '▶'}</span>
                                </button>
                                {open && (
                                    <div className="mt-3 grid gap-2 text-xs">
                                        <pre className="max-h-36 overflow-auto rounded-md bg-[var(--bg-card)] p-2 text-[var(--text-secondary)]">{formatJson(step.args)}</pre>
                                        {step.result && <pre className="max-h-36 overflow-auto rounded-md bg-[var(--bg-card)] p-2 text-[var(--text-secondary)]">{formatJson(step.result)}</pre>}
                                        {step.error && (
                                            <p className="rounded-md border border-red-500/40 bg-red-500/10 p-2 text-red-200">{step.error}</p>
                                        )}
                                    </div>
                                )}
                            </article>
                        );
                    })}
                    <div ref={endRef} />
                </div>
            )}
        </section>
    );
}
