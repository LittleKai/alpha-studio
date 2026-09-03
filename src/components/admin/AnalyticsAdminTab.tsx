import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/context';
import {
    getAnalyticsOverview,
    getAnalyticsRealtime,
    type AnalyticsOverview,
    type AnalyticsRealtime,
} from '../../services/analyticsService';
import {
    BarList,
    ChartCard,
    ColumnChart,
    DonutChart,
    LineChart,
    StatCard,
    formatNumber,
    type BarRow,
} from './analytics/charts';

const RANGES = [7, 30, 90];

const DEVICE_KEYS: Record<string, string> = {
    desktop: 'admin.analytics.devices.desktop',
    mobile: 'admin.analytics.devices.mobile',
    tablet: 'admin.analytics.devices.tablet',
};

const CHANNEL_KEYS: Record<string, string> = {
    'direct': 'admin.analytics.channels.direct',
    'organic-search': 'admin.analytics.channels.organicSearch',
    'paid-search': 'admin.analytics.channels.paidSearch',
    'paid-social': 'admin.analytics.channels.paidSocial',
    'social': 'admin.analytics.channels.social',
    'referral': 'admin.analytics.channels.referral',
    'email': 'admin.analytics.channels.email',
    'campaign': 'admin.analytics.channels.campaign',
};

export default function AnalyticsAdminTab() {
    const { t } = useTranslation();

    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AnalyticsOverview | null>(null);
    const [realtime, setRealtime] = useState<AnalyticsRealtime | null>(null);

    const loadOverview = useCallback(async (range: number) => {
        try {
            setLoading(true);
            setError(null);
            setData(await getAnalyticsOverview(range));
        } catch (err) {
            console.error('Failed to load analytics overview:', err);
            setError(t('admin.analytics.loadError'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    const loadRealtime = useCallback(async () => {
        try {
            setRealtime(await getAnalyticsRealtime());
        } catch (err) {
            console.error('Failed to load realtime analytics:', err);
        }
    }, []);

    useEffect(() => {
        loadOverview(days);
    }, [days, loadOverview]);

    useEffect(() => {
        loadRealtime();
        const timer = window.setInterval(loadRealtime, 30000);
        return () => window.clearInterval(timer);
    }, [loadRealtime]);

    if (loading && !data) {
        return <p className="text-sm text-[var(--text-secondary)] py-10 text-center">{t('admin.analytics.loading')}</p>;
    }

    if (error && !data) {
        return (
            <div className="text-center py-10">
                <p className="text-sm text-rose-500 mb-3">{error}</p>
                <button
                    onClick={() => loadOverview(days)}
                    className="px-3 py-1.5 text-sm rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                >
                    {t('admin.analytics.retry')}
                </button>
            </div>
        );
    }

    if (!data) return null;

    const { summary, daily } = data;
    const labels = daily.map((d) => d.date);

    const channelRows: BarRow[] = data.channels.map((c) => ({
        label: CHANNEL_KEYS[c.key] ? t(CHANNEL_KEYS[c.key], c.key) : c.key,
        value: c.sessions,
    }));

    const deviceRows: BarRow[] = data.devices.map((d) => ({
        label: DEVICE_KEYS[d.key] ? t(DEVICE_KEYS[d.key], d.key) : d.key,
        value: d.views,
    }));

    const hourLabels = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
    const hourValues = hourLabels.map((_, h) => data.hourly.find((x) => x.hour === h)?.views || 0);

    const weekdayLabels = (t('admin.analytics.weekdayShort', 'T2,T3,T4,T5,T6,T7,CN')).split(',');
    const weekdayValues = weekdayLabels.map((_, i) => data.weekday.find((x) => x.weekday === i + 1)?.views || 0);

    return (
        <div className="space-y-5">
            {/* Header: range picker + live counter */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t('admin.analytics.title')}</h2>
                    <p className="text-sm text-[var(--text-secondary)]">{t('admin.analytics.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/40">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                            {formatNumber(realtime?.visitors || 0)}
                        </span>
                        <span className="text-xs text-emerald-700/80 dark:text-emerald-200/80">
                            {t('admin.analytics.realtime.online')}
                        </span>
                    </div>
                    <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                        {RANGES.map((range) => (
                            <button
                                key={range}
                                onClick={() => setDays(range)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                    days === range
                                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-semibold'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                {t('admin.analytics.rangeDays').replace('{{days}}', String(range))}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { loadOverview(days); loadRealtime(); }}
                        disabled={loading}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] disabled:opacity-50"
                    >
                        {loading ? t('admin.analytics.loading') : t('admin.analytics.refresh')}
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label={t('admin.analytics.kpi.visitors')}
                    value={formatNumber(summary.visitors)}
                    current={summary.visitors}
                    previous={summary.previous.visitors}
                    hint={t('admin.analytics.kpi.vsPrevious')}
                    accent="#0ea5e9"
                />
                <StatCard
                    label={t('admin.analytics.kpi.pageviews')}
                    value={formatNumber(summary.pageviews)}
                    current={summary.pageviews}
                    previous={summary.previous.pageviews}
                    hint={t('admin.analytics.kpi.vsPrevious')}
                    accent="#a855f7"
                />
                <StatCard
                    label={t('admin.analytics.kpi.sessions')}
                    value={formatNumber(summary.sessions)}
                    current={summary.sessions}
                    previous={summary.previous.sessions}
                    hint={t('admin.analytics.kpi.vsPrevious')}
                    accent="#22c55e"
                />
                <StatCard
                    label={t('admin.analytics.kpi.paidSessions')}
                    value={formatNumber(summary.paidSessions)}
                    hint={t('admin.analytics.kpi.paidSessionsHint')}
                    accent="#f59e0b"
                />
                <StatCard
                    label={t('admin.analytics.kpi.newVisitors')}
                    value={formatNumber(summary.newVisitors)}
                    current={summary.newVisitors}
                    previous={summary.previous.newVisitors}
                    hint={`${formatNumber(summary.returningVisitors)} ${t('admin.analytics.kpi.returning')}`}
                    accent="#14b8a6"
                />
                <StatCard
                    label={t('admin.analytics.kpi.pagesPerSession')}
                    value={summary.pagesPerSession.toFixed(1)}
                    hint={t('admin.analytics.kpi.pagesPerSessionHint')}
                    accent="#ec4899"
                />
                <StatCard
                    label={t('admin.analytics.kpi.bounceRate')}
                    value={`${summary.bounceRate.toFixed(1)}%`}
                    hint={t('admin.analytics.kpi.bounceRateHint')}
                    accent="#ef4444"
                />
                <StatCard
                    label={t('admin.analytics.kpi.loggedInViews')}
                    value={formatNumber(summary.loggedInViews)}
                    current={summary.loggedInViews}
                    previous={summary.previous.loggedInViews}
                    hint={t('admin.analytics.kpi.loggedInViewsHint')}
                    accent="#64748b"
                />
            </div>

            {/* Traffic trend */}
            <ChartCard title={t('admin.analytics.trend.title')} hint={t('admin.analytics.trend.hint')}>
                <LineChart
                    labels={labels}
                    series={[
                        { label: t('admin.analytics.kpi.pageviews'), color: '#a855f7', values: daily.map((d) => d.views) },
                        { label: t('admin.analytics.kpi.visitors'), color: '#0ea5e9', values: daily.map((d) => d.visitors) },
                        { label: t('admin.analytics.kpi.sessions'), color: '#22c55e', values: daily.map((d) => d.sessions) },
                    ]}
                />
            </ChartCard>

            {/* Acquisition */}
            <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title={t('admin.analytics.channelsTitle')} hint={t('admin.analytics.channelsHint')}>
                    <DonutChart
                        rows={channelRows}
                        emptyText={t('admin.analytics.empty')}
                        centerLabel={t('admin.analytics.bySessions')}
                    />
                </ChartCard>
                <ChartCard title={t('admin.analytics.referrersTitle')} hint={t('admin.analytics.referrersHint')}>
                    <BarList
                        rows={data.referrers.map((r) => ({ label: r.key, value: r.views }))}
                        emptyText={t('admin.analytics.emptyReferrers')}
                        color="#22c55e"
                    />
                </ChartCard>
            </div>

            {/* Campaigns — the Google Ads table */}
            <ChartCard title={t('admin.analytics.campaigns.title')} hint={t('admin.analytics.campaigns.hint')}>
                {data.campaigns.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)] py-6 text-center">
                        {t('admin.analytics.campaigns.empty')}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                                    <th className="py-2 pr-3 font-medium">{t('admin.analytics.campaigns.campaign')}</th>
                                    <th className="py-2 px-3 font-medium">{t('admin.analytics.campaigns.source')}</th>
                                    <th className="py-2 px-3 font-medium">{t('admin.analytics.campaigns.medium')}</th>
                                    <th className="py-2 px-3 font-medium text-right">{t('admin.analytics.kpi.sessions')}</th>
                                    <th className="py-2 px-3 font-medium text-right">{t('admin.analytics.kpi.visitors')}</th>
                                    <th className="py-2 px-3 font-medium text-right">{t('admin.analytics.kpi.pageviews')}</th>
                                    <th className="py-2 pl-3 font-medium text-right">{t('admin.analytics.campaigns.paidClicks')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.campaigns.map((c) => (
                                    <tr
                                        key={`${c.source}-${c.medium}-${c.campaign}`}
                                        className="border-b border-[var(--border-primary)] last:border-0"
                                    >
                                        <td className="py-2 pr-3 text-[var(--text-primary)] font-medium">{c.campaign}</td>
                                        <td className="py-2 px-3 text-[var(--text-secondary)]">{c.source}</td>
                                        <td className="py-2 px-3">
                                            <span className="px-2 py-0.5 rounded text-xs bg-amber-500/15 dark:bg-amber-500/25 border border-amber-500/40 text-amber-800 dark:text-amber-200">
                                                {c.medium}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-right text-[var(--text-primary)]">{formatNumber(c.sessions)}</td>
                                        <td className="py-2 px-3 text-right text-[var(--text-secondary)]">{formatNumber(c.visitors)}</td>
                                        <td className="py-2 px-3 text-right text-[var(--text-secondary)]">{formatNumber(c.views)}</td>
                                        <td className="py-2 pl-3 text-right text-[var(--text-secondary)]">{formatNumber(c.paidClicks)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </ChartCard>

            {/* Content */}
            <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title={t('admin.analytics.topPagesTitle')} hint={t('admin.analytics.topPagesHint')}>
                    <BarList
                        rows={data.topPages.map((p) => ({
                            label: p.key,
                            value: p.views,
                            sublabel: `${formatNumber(p.visitors)} ${t('admin.analytics.kpi.visitors').toLowerCase()}`,
                        }))}
                        emptyText={t('admin.analytics.empty')}
                        color="#0ea5e9"
                    />
                </ChartCard>
                <ChartCard title={t('admin.analytics.entryPagesTitle')} hint={t('admin.analytics.entryPagesHint')}>
                    <BarList
                        rows={data.entryPages.map((p) => ({ label: p.key, value: p.views }))}
                        emptyText={t('admin.analytics.empty')}
                        color="#a855f7"
                    />
                </ChartCard>
            </div>

            {/* Audience */}
            <div className="grid lg:grid-cols-3 gap-4">
                <ChartCard title={t('admin.analytics.devicesTitle')}>
                    <DonutChart
                        rows={deviceRows}
                        emptyText={t('admin.analytics.empty')}
                        centerLabel={t('admin.analytics.byPageviews')}
                    />
                </ChartCard>
                <ChartCard title={t('admin.analytics.browsersTitle')}>
                    <BarList
                        rows={data.browsers.map((b) => ({ label: b.key, value: b.views }))}
                        emptyText={t('admin.analytics.empty')}
                        color="#14b8a6"
                    />
                </ChartCard>
                <ChartCard title={t('admin.analytics.osTitle')}>
                    <BarList
                        rows={data.os.map((o) => ({ label: o.key, value: o.views }))}
                        emptyText={t('admin.analytics.empty')}
                        color="#ec4899"
                    />
                </ChartCard>
            </div>

            {/* Timing + live pages */}
            <div className="grid lg:grid-cols-2 gap-4">
                <ChartCard title={t('admin.analytics.hourlyTitle')} hint={t('admin.analytics.hourlyHint')}>
                    <ColumnChart labels={hourLabels} values={hourValues} color="#a855f7" />
                </ChartCard>
                <ChartCard title={t('admin.analytics.weekdayTitle')} hint={t('admin.analytics.weekdayHint')}>
                    <ColumnChart labels={weekdayLabels} values={weekdayValues} color="#0ea5e9" />
                </ChartCard>
            </div>

            <ChartCard title={t('admin.analytics.realtime.title')} hint={t('admin.analytics.realtime.hint')}>
                <BarList
                    rows={(realtime?.pages || []).map((p) => ({ label: p.key, value: p.views }))}
                    emptyText={t('admin.analytics.realtime.empty')}
                    color="#22c55e"
                />
            </ChartCard>
        </div>
    );
}
