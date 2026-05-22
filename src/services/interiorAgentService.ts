import type { CabinetModel, InteriorProject, InteriorVersion } from './interiorService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface AgentStep {
    index: number;
    thought: string;
    tool: string;
    args: Record<string, unknown>;
    result?: AgentToolResult | null;
    latencyMs?: number | null;
    status: 'pending' | 'ok' | 'error';
    model?: string;
    tokens?: { prompt: number; completion: number; total: number } | null;
    error?: string;
}

export interface AgentToolResult {
    ok: boolean;
    data?: unknown;
    error?: string;
}

export interface AgentDonePayload {
    versionIndex: number;
    finalModel: CabinetModel;
    project: InteriorProject;
    version: InteriorVersion;
    totalSteps: number;
    totalTokens: number;
    cost: number;
    balance: number;
}

export interface AgentRunSummary {
    runId: string;
    status: 'paused' | 'error';
    stepsCount: number;
    totalTokens: number;
    userPrompt: string;
    selectedModel: string;
    delegateFlash: boolean;
    startedAt: string;
    lastActiveAt: string;
    abortReason: string;
}

export interface AgentPausedPayload {
    runId: string;
    stepsCount: number;
    reason: string;
}

export interface AgentRunStartedPayload {
    runId: string;
    stepsCount: number;
    resuming: boolean;
}

interface RunAgentOptions {
    token: string;
    projectId: string;
    message: string;
    refImageUrls?: string[];
    model?: string;
    delegateFlash?: boolean;
    onStep: (step: Omit<AgentStep, 'status'>) => void;
    onResult: (index: number, result: AgentToolResult, latencyMs?: number | null) => void;
    onDone: (payload: AgentDonePayload) => void;
    onError: (error: Error) => void;
    onRunStarted?: (payload: AgentRunStartedPayload) => void;
    onPaused?: (payload: AgentPausedPayload) => void;
    signal?: AbortSignal;
}

interface ResumeAgentOptions extends Omit<RunAgentOptions, 'message' | 'refImageUrls' | 'model' | 'delegateFlash'> {
    runId: string;
}

function parseSseBlock(block: string): { event: string; data: unknown } | null {
    const lines = block.split(/\r?\n/);
    let event = '';
    const dataLines: string[] = [];
    for (const line of lines) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (!event) return null;
    const raw = dataLines.join('\n') || '{}';
    return { event, data: JSON.parse(raw) };
}

async function consumeAgentStream(response: Response, options: RunAgentOptions | ResumeAgentOptions): Promise<AgentDonePayload | null> {
    if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Interior agent error');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let donePayload: AgentDonePayload | null = null;
    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\n\n/);
        buffer = blocks.pop() || '';
        for (const block of blocks) {
            if (!block.trim() || block.startsWith(':')) continue;
            const parsed = parseSseBlock(block);
            if (!parsed) continue;
            if (parsed.event === 'run-started') {
                options.onRunStarted?.(parsed.data as AgentRunStartedPayload);
            } else if (parsed.event === 'step') {
                options.onStep(parsed.data as Omit<AgentStep, 'status'>);
            } else if (parsed.event === 'step-result') {
                const payload = parsed.data as { index: number; result: AgentToolResult; latencyMs?: number | null };
                options.onResult(payload.index, payload.result, payload.latencyMs);
            } else if (parsed.event === 'done') {
                donePayload = parsed.data as AgentDonePayload;
                options.onDone(donePayload);
            } else if (parsed.event === 'paused') {
                options.onPaused?.(parsed.data as AgentPausedPayload);
            } else if (parsed.event === 'error') {
                const payload = parsed.data as { message?: string };
                const error = new Error(payload.message || 'Interior agent error');
                options.onError(error);
                throw error;
            }
        }
    }
    return donePayload;
}

export async function runAgent(options: RunAgentOptions): Promise<AgentDonePayload | null> {
    const response = await fetch(`${API_URL}/interior/projects/${options.projectId}/agent`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${options.token}`
        },
        body: JSON.stringify({
            message: options.message,
            refImageUrls: options.refImageUrls || [],
            model: options.model,
            delegateFlash: options.delegateFlash === true
        }),
        signal: options.signal
    });
    return consumeAgentStream(response, options);
}

export async function resumeAgent(options: ResumeAgentOptions): Promise<AgentDonePayload | null> {
    const response = await fetch(`${API_URL}/interior/projects/${options.projectId}/agent/runs/${options.runId}/resume`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${options.token}`
        },
        body: JSON.stringify({}),
        signal: options.signal
    });
    return consumeAgentStream(response, options);
}

export interface AgentRunDetail extends AgentRunSummary {
    steps: Array<{
        index: number;
        thought: string;
        tool: string;
        args: Record<string, unknown>;
        result?: AgentToolResult | null;
        latencyMs?: number | null;
        model?: string;
        tokens?: { prompt: number; completion: number; total: number } | null;
        error?: string;
    }>;
    refImageUrls: string[];
    finalReply: string;
    nextTurnModel: string;
    finishedAt: string | null;
}

export async function getAgentRun(token: string, projectId: string, runId: string): Promise<AgentRunDetail> {
    const response = await fetch(`${API_URL}/interior/projects/${projectId}/agent/runs/${runId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to load agent run');
    return data.data.run as AgentRunDetail;
}

export async function listAgentRuns(token: string, projectId: string): Promise<AgentRunSummary[]> {
    const response = await fetch(`${API_URL}/interior/projects/${projectId}/agent/runs`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to load agent runs');
    return (data.data.runs || []) as AgentRunSummary[];
}
