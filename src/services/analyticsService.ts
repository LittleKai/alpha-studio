import { getAuthHeaders } from './cloudService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const VISITOR_KEY = 'as_visitor_id';
const SESSION_KEY = 'as_session_id';
const ACQUISITION_KEY = 'as_acquisition';

export interface AnalyticsCount {
    key: string;
    views: number;
    visitors: number;
}

export interface AnalyticsDailyPoint {
    date: string;
    views: number;
    visitors: number;
    sessions: number;
}

export interface AnalyticsCampaign {
    source: string;
    medium: string;
    campaign: string;
    views: number;
    visitors: number;
    sessions: number;
    paidClicks: number;
}

export interface AnalyticsSummary {
    pageviews: number;
    visitors: number;
    sessions: number;
    newVisitors: number;
    returningVisitors: number;
    loggedInViews: number;
    bounceRate: number;
    pagesPerSession: number;
    paidSessions: number;
    previous: {
        pageviews: number;
        visitors: number;
        sessions: number;
        newVisitors: number;
        loggedInViews: number;
    };
}

export interface AnalyticsOverview {
    range: { days: number; from: string; to: string };
    summary: AnalyticsSummary;
    daily: AnalyticsDailyPoint[];
    topPages: AnalyticsCount[];
    entryPages: AnalyticsCount[];
    channels: { key: string; views: number; sessions: number }[];
    referrers: AnalyticsCount[];
    campaigns: AnalyticsCampaign[];
    devices: AnalyticsCount[];
    browsers: AnalyticsCount[];
    os: AnalyticsCount[];
    languages: AnalyticsCount[];
    hourly: { hour: number; views: number }[];
    weekday: { weekday: number; views: number }[];
}

export interface AnalyticsRealtime {
    views: number;
    visitors: number;
    pages: AnalyticsCount[];
    since: string;
}

interface Acquisition {
    referrer: string;
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmContent: string;
    utmTerm: string;
    gclid: string;
}

const randomId = (): string => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

const readStore = (store: Storage | undefined, key: string): string | null => {
    try {
        return store?.getItem(key) ?? null;
    } catch {
        return null; // private mode / storage blocked
    }
};

const writeStore = (store: Storage | undefined, key: string, value: string): void => {
    try {
        store?.setItem(key, value);
    } catch {
        /* storage blocked — tracking degrades to one event per pageview */
    }
};

/**
 * Acquisition is captured once per session so every pageview in that session
 * keeps the same attribution, not just the landing one.
 */
const resolveAcquisition = (): Acquisition => {
    const cached = readStore(window.sessionStorage, ACQUISITION_KEY);
    if (cached) {
        try {
            return JSON.parse(cached) as Acquisition;
        } catch {
            /* fall through and re-derive */
        }
    }

    const params = new URLSearchParams(window.location.search);
    const acquisition: Acquisition = {
        referrer: document.referrer || '',
        utmSource: params.get('utm_source') || '',
        utmMedium: params.get('utm_medium') || '',
        utmCampaign: params.get('utm_campaign') || '',
        utmContent: params.get('utm_content') || '',
        utmTerm: params.get('utm_term') || '',
        gclid: params.get('gclid') || params.get('gbraid') || params.get('wbraid') || '',
    };

    writeStore(window.sessionStorage, ACQUISITION_KEY, JSON.stringify(acquisition));
    return acquisition;
};

/**
 * Public fire-and-forget pageview beacon. Never throws, never blocks navigation.
 */
export const trackPageView = (path: string, userId?: string | null): void => {
    if (typeof window === 'undefined') return;

    try {
        let visitorId = readStore(window.localStorage, VISITOR_KEY);
        const isNewVisitor = !visitorId;
        if (!visitorId) {
            visitorId = randomId();
            writeStore(window.localStorage, VISITOR_KEY, visitorId);
        }

        let sessionId = readStore(window.sessionStorage, SESSION_KEY);
        const isSessionStart = !sessionId;
        if (!sessionId) {
            sessionId = randomId();
            writeStore(window.sessionStorage, SESSION_KEY, sessionId);
        }

        const acquisition = resolveAcquisition();

        const payload = {
            ...acquisition,
            visitorId,
            sessionId,
            userId: userId || null,
            path,
            title: document.title || '',
            language: navigator.language || '',
            screenWidth: window.screen?.width || 0,
            isNewVisitor,
            isSessionStart,
        };

        fetch(`${API_URL}/analytics/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        }).catch(() => {
            /* analytics must never surface an error to the visitor */
        });
    } catch {
        /* ignore */
    }
};

/** Admin: full traffic report for the last `days` days. */
export const getAnalyticsOverview = async (days: number): Promise<AnalyticsOverview> => {
    const res = await fetch(`${API_URL}/analytics/overview?days=${days}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch analytics overview');
    const json = await res.json();
    return json.data;
};

/** Admin: visitors active in the last 5 minutes. */
export const getAnalyticsRealtime = async (): Promise<AnalyticsRealtime> => {
    const res = await fetch(`${API_URL}/analytics/realtime`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch realtime analytics');
    const json = await res.json();
    return json.data;
};
