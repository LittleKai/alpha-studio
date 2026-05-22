const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export type CabinetModel = Record<string, unknown>;

export interface InteriorUsage {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
}

export interface InteriorVersion {
    _id: string;
    index: number;
    parentIndex: number | null;
    userPrompt: string;
    refImageUrls?: string[];
    modelJson: CabinetModel;
    aiReply: string;
    askForInfo: boolean;
    isRollback?: boolean;
    rollbackTargetIndex?: number | null;
    aiModel?: string | null;
    usage?: InteriorUsage | null;
    proposalText?: string | null;
    createdAt: string;
}

export type InteriorChatStage = 'proposal' | 'apply';

export interface InteriorProposalQuestion {
    question: string;
    options: string[];
}

export interface InteriorProposalStructured {
    observation: string;
    understanding: string;
    proposedChanges: string[];
    questions: InteriorProposalQuestion[];
}

export interface InteriorProposalResult {
    stage: 'proposal';
    proposalText: string;
    structured: InteriorProposalStructured;
    refImageUrls: string[];
    message: string;
    aiModel: string | null;
    usage: InteriorUsage | null;
    cost: number;
    balance: number;
}

export interface InteriorApplyResult {
    stage: 'apply';
    project: InteriorProject;
    version: InteriorVersion;
    cost: number;
    balance: number;
    meta?: {
        newInlineTemplates?: string[];
        droppedTemplates?: Array<{ id: string; category: string; reason: string }>;
    };
}

export type InteriorChatResult = InteriorProposalResult | InteriorApplyResult;

export type InteriorModel = 'gemini-3-flash-preview' | 'gemini-3.1-pro-preview';
export const INTERIOR_MODELS: InteriorModel[] = ['gemini-3-flash-preview', 'gemini-3.1-pro-preview'];
export const INTERIOR_DEFAULT_MODEL: InteriorModel = 'gemini-3.1-pro-preview';

export interface InteriorProject {
    _id: string;
    userId: string;
    name: string;
    currentVersionIndex: number;
    versions: InteriorVersion[];
    agentRunActive?: boolean | null;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface InteriorProjectListResult {
    projects: InteriorProject[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export class InteriorApiError extends Error {
    status: number;
    data: unknown;

    constructor(message: string, status: number, data: unknown) {
        super(message);
        this.name = 'InteriorApiError';
        this.status = status;
        this.data = data;
    }
}

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}/interior${path}`, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(init.headers || {})
        }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
        throw new InteriorApiError(data.message || 'Interior API error', response.status, data);
    }
    return data.data as T;
}

export function listInteriorProjects(token: string) {
    return request<InteriorProjectListResult>('/projects', token);
}

export function createInteriorProject(token: string, name?: string) {
    return request<{ project: InteriorProject }>('/projects', token, {
        method: 'POST',
        body: JSON.stringify({ name })
    });
}

export function getInteriorProject(token: string, projectId: string) {
    return request<{ project: InteriorProject }>(`/projects/${projectId}`, token);
}

export function renameInteriorProject(token: string, projectId: string, name: string) {
    return request<{ project: InteriorProject }>(`/projects/${projectId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ name })
    });
}

export function deleteInteriorProject(token: string, projectId: string) {
    return request<{ deleted: boolean }>(`/projects/${projectId}`, token, {
        method: 'DELETE'
    });
}

export function sendInteriorMessage(
    token: string,
    projectId: string,
    payload: {
        message: string;
        refImageUrls?: string[];
        expectedCurrentVersionIndex?: number;
        model?: InteriorModel;
        stage?: InteriorChatStage;
        proposalText?: string;
    }
) {
    return request<InteriorChatResult>(`/projects/${projectId}/chat`, token, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export function rollbackInteriorProject(token: string, projectId: string, targetVersionId: string) {
    return request<{ project: InteriorProject }>(`/projects/${projectId}/rollback`, token, {
        method: 'POST',
        body: JSON.stringify({ targetVersionId })
    });
}

export interface InteriorAgentStepLog {
    index: number;
    thought: string;
    tool: string;
    args: Record<string, unknown>;
    result?: { ok: boolean; data?: unknown; error?: string } | null;
    latencyMs?: number | null;
    model?: string;
    tokens?: { prompt: number; completion: number; total: number } | null;
    error?: string;
}

export interface InteriorAiLog {
    _id: string;
    kind?: 'chat' | 'agent';
    userId: { _id: string; name?: string; email?: string } | string | null;
    projectId: string;
    createdAt: string;
    // chat-kind fields
    stage?: 'proposal' | 'apply';
    model?: string;
    versionIndex?: number | null;
    prompt?: string;
    refImageUrls?: string[];
    rawResponse?: string;
    parsedReply?: string;
    latencyMs?: number | null;
    usage?: InteriorUsage | null;
    status?: 'ok' | 'parse-failed' | 'validation-failed' | 'upstream-error' | 'committed' | 'paused' | 'aborted' | 'error' | 'maxSteps' | 'running';
    errorMessage?: string;
    // agent-kind fields
    stepsCount?: number;
    totalTokens?: number;
    userPrompt?: string;
    selectedModel?: string;
    delegateFlash?: boolean;
    steps?: InteriorAgentStepLog[];
    finalReply?: string;
    abortReason?: string;
    startedAt?: string;
    finishedAt?: string | null;
    lastActiveAt?: string;
}

export function listInteriorAiLogs(token: string, params: {
    projectId?: string;
    userId?: string;
    stage?: 'proposal' | 'apply';
    status?: 'ok' | 'parse-failed' | 'validation-failed' | 'upstream-error';
    limit?: number;
} = {}) {
    const search = new URLSearchParams();
    if (params.projectId) search.set('projectId', params.projectId);
    if (params.userId) search.set('userId', params.userId);
    if (params.stage) search.set('stage', params.stage);
    if (params.status) search.set('status', params.status);
    if (params.limit) search.set('limit', String(params.limit));
    const query = search.toString();
    return request<{ logs: InteriorAiLog[] }>(`/admin/logs${query ? `?${query}` : ''}`, token);
}
