import { useEffect, useRef, useState } from 'react';
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
    const [open, setOpen] = useState<Record<number, boolean>>({});
    const endRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [steps.length]);

    if (!isRunning && steps.length === 0) return null;

    return (
        <section className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {isRunning ? t('studio.interior.agent.running') : t('studio.interior.agent.title')}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">{steps.length} {t('studio.interior.agent.steps')}</p>
                </div>
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
            <div className="max-h-72 space-y-2 overflow-auto pr-1">
                {steps.map((step) => {
                    const type = toolType(step.tool);
                    const statusClass = step.status === 'ok'
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : step.status === 'error'
                            ? 'border-red-500/40 bg-red-500/10'
                            : 'border-yellow-500/40 bg-yellow-500/10';
                    return (
                        <article key={step.index} className={`rounded-lg border p-3 ${statusClass}`}>
                            <button
                                type="button"
                                onClick={() => setOpen((prev) => ({ ...prev, [step.index]: !prev[step.index] }))}
                                className="flex w-full items-start gap-2 text-left"
                            >
                                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] text-xs font-bold text-[var(--text-secondary)]">
                                    {type === 'read' ? 'i' : type === 'terminal' ? 'ok' : '+'}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-xs font-bold text-[var(--text-primary)]">{step.tool}</span>
                                    <span className="block truncate text-xs italic text-[var(--text-secondary)]">{step.thought}</span>
                                </span>
                                {step.latencyMs != null && <span className="text-[10px] text-[var(--text-tertiary)]">{step.latencyMs}ms</span>}
                                <span className="text-xs text-[var(--text-tertiary)]">{open[step.index] ? 'v' : '>'}</span>
                            </button>
                            {open[step.index] && (
                                <div className="mt-3 grid gap-2 text-xs">
                                    <pre className="max-h-36 overflow-auto rounded-md bg-[var(--bg-card)] p-2 text-[var(--text-secondary)]">{formatJson(step.args)}</pre>
                                    {step.result && <pre className="max-h-36 overflow-auto rounded-md bg-[var(--bg-card)] p-2 text-[var(--text-secondary)]">{formatJson(step.result)}</pre>}
                                </div>
                            )}
                        </article>
                    );
                })}
                <div ref={endRef} />
            </div>
        </section>
    );
}
