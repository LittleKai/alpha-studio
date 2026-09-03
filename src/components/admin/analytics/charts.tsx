import React, { useMemo, useState } from 'react';

/**
 * Lightweight inline-SVG chart primitives for the traffic dashboard.
 * No charting dependency: the bundle stays small and everything inherits
 * the theme through CSS custom properties.
 */

export const SERIES_COLORS = ['#0ea5e9', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6', '#ec4899', '#64748b'];

export const formatNumber = (value: number): string => new Intl.NumberFormat('vi-VN').format(Math.round(value || 0));

export const percent = (part: number, total: number): number => (total > 0 ? (part / total) * 100 : 0);

interface CardProps {
    title: string;
    hint?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const ChartCard: React.FC<CardProps> = ({ title, hint, action, children, className = '' }) => (
    <div className={`glass-card rounded-xl border border-[var(--border-primary)] p-4 ${className}`}>
        <div className="flex items-start justify-between gap-3 mb-4">
            <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
                {hint && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{hint}</p>}
            </div>
            {action}
        </div>
        {children}
    </div>
);

interface StatCardProps {
    label: string;
    value: string;
    previous?: number;
    current?: number;
    hint?: string;
    accent?: string;
}

/** KPI tile with a period-over-period delta badge. */
export const StatCard: React.FC<StatCardProps> = ({ label, value, previous, current, hint, accent = '#0ea5e9' }) => {
    const hasDelta = typeof previous === 'number' && typeof current === 'number';
    const delta = hasDelta && previous! > 0 ? ((current! - previous!) / previous!) * 100 : null;
    const up = (delta ?? 0) >= 0;

    return (
        <div className="glass-card rounded-xl border border-[var(--border-primary)] p-4">
            <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
                <p className="text-xs font-medium text-[var(--text-secondary)]">{label}</p>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {delta !== null && (
                    <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                            up
                                ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200'
                                : 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/25 dark:text-rose-200'
                        }`}
                    >
                        {up ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
                    </span>
                )}
                {hint && <span className="text-xs text-[var(--text-secondary)]">{hint}</span>}
            </div>
        </div>
    );
};

export interface LineSeries {
    label: string;
    color: string;
    values: number[];
}

interface LineChartProps {
    labels: string[];
    series: LineSeries[];
    height?: number;
}

/** Multi-series area/line chart with a hover crosshair. */
export const LineChart: React.FC<LineChartProps> = ({ labels, series, height = 240 }) => {
    const [hover, setHover] = useState<number | null>(null);

    const width = 1000;
    const padding = { top: 12, right: 12, bottom: 26, left: 44 };
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;

    const max = useMemo(() => {
        const peak = Math.max(1, ...series.flatMap((s) => s.values));
        const step = Math.pow(10, Math.floor(Math.log10(peak)));
        return Math.ceil(peak / step) * step;
    }, [series]);

    const count = labels.length;
    const xAt = (i: number) => padding.left + (count <= 1 ? plotW / 2 : (i / (count - 1)) * plotW);
    const yAt = (v: number) => padding.top + plotH - (v / max) * plotH;

    const gridLines = [0, 0.25, 0.5, 0.75, 1];
    const tickEvery = Math.max(1, Math.ceil(count / 8));

    return (
        <div className="relative">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full"
                style={{ height }}
                preserveAspectRatio="none"
                onMouseLeave={() => setHover(null)}
            >
                {gridLines.map((g) => (
                    <g key={g}>
                        <line
                            x1={padding.left}
                            x2={width - padding.right}
                            y1={padding.top + plotH * g}
                            y2={padding.top + plotH * g}
                            stroke="var(--border-primary)"
                            strokeWidth={1}
                        />
                        <text
                            x={padding.left - 8}
                            y={padding.top + plotH * g + 4}
                            textAnchor="end"
                            fontSize={11}
                            fill="var(--text-secondary)"
                        >
                            {formatNumber(max * (1 - g))}
                        </text>
                    </g>
                ))}

                {series.map((s) => {
                    const line = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(v)}`).join(' ');
                    const area = `${line} L ${xAt(count - 1)} ${padding.top + plotH} L ${xAt(0)} ${padding.top + plotH} Z`;
                    return (
                        <g key={s.label}>
                            <path d={area} fill={s.color} opacity={0.12} />
                            <path d={line} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
                        </g>
                    );
                })}

                {labels.map((label, i) =>
                    i % tickEvery === 0 ? (
                        <text
                            key={label}
                            x={xAt(i)}
                            y={height - 6}
                            textAnchor="middle"
                            fontSize={11}
                            fill="var(--text-secondary)"
                        >
                            {label.slice(5)}
                        </text>
                    ) : null
                )}

                {hover !== null && (
                    <g>
                        <line
                            x1={xAt(hover)}
                            x2={xAt(hover)}
                            y1={padding.top}
                            y2={padding.top + plotH}
                            stroke="var(--text-secondary)"
                            strokeDasharray="4 4"
                        />
                        {series.map((s) => (
                            <circle key={s.label} cx={xAt(hover)} cy={yAt(s.values[hover])} r={4} fill={s.color} />
                        ))}
                    </g>
                )}

                {labels.map((label, i) => (
                    <rect
                        key={`hit-${label}`}
                        x={xAt(i) - plotW / Math.max(1, count) / 2}
                        y={padding.top}
                        width={plotW / Math.max(1, count)}
                        height={plotH}
                        fill="transparent"
                        onMouseEnter={() => setHover(i)}
                    />
                ))}
            </svg>

            <div className="flex flex-wrap gap-4 mt-2">
                {series.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5">
                        <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-xs text-[var(--text-secondary)]">{s.label}</span>
                    </div>
                ))}
            </div>

            {hover !== null && (
                <div className="absolute top-0 right-0 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] backdrop-blur px-3 py-2 text-xs pointer-events-none">
                    <p className="font-semibold text-[var(--text-primary)] mb-1">{labels[hover]}</p>
                    {series.map((s) => (
                        <p key={s.label} className="text-[var(--text-secondary)]">
                            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: s.color }} />
                            {s.label}: <strong className="text-[var(--text-primary)]">{formatNumber(s.values[hover])}</strong>
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
};

export interface BarRow {
    label: string;
    value: number;
    sublabel?: string;
}

interface BarListProps {
    rows: BarRow[];
    emptyText: string;
    color?: string;
    valueSuffix?: string;
}

/** Ranked horizontal bars — top pages, referrers, browsers. */
export const BarList: React.FC<BarListProps> = ({ rows, emptyText, color = '#0ea5e9', valueSuffix }) => {
    if (!rows.length) {
        return <p className="text-sm text-[var(--text-secondary)] py-6 text-center">{emptyText}</p>;
    }
    const max = Math.max(...rows.map((r) => r.value), 1);

    return (
        <div className="space-y-2">
            {rows.map((row) => (
                <div key={row.label} className="relative rounded-lg overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 rounded-lg"
                        style={{ width: `${percent(row.value, max)}%`, backgroundColor: color, opacity: 0.18 }}
                    />
                    <div className="relative flex items-center justify-between gap-3 px-2.5 py-1.5">
                        <span className="text-sm text-[var(--text-primary)] truncate" title={row.label}>
                            {row.label}
                            {row.sublabel && <span className="text-xs text-[var(--text-secondary)] ml-2">{row.sublabel}</span>}
                        </span>
                        <span className="text-sm font-semibold text-[var(--text-primary)] shrink-0">
                            {formatNumber(row.value)}
                            {valueSuffix}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

interface DonutProps {
    rows: BarRow[];
    emptyText: string;
    centerLabel: string;
}

/** Donut breakdown with an inline legend (devices, channels). */
export const DonutChart: React.FC<DonutProps> = ({ rows, emptyText, centerLabel }) => {
    const total = rows.reduce((sum, r) => sum + r.value, 0);
    if (!total) {
        return <p className="text-sm text-[var(--text-secondary)] py-6 text-center">{emptyText}</p>;
    }

    const radius = 60;
    const stroke = 18;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    return (
        <div className="flex items-center gap-5 flex-wrap">
            <svg viewBox="0 0 160 160" className="w-36 h-36 shrink-0 -rotate-90">
                {rows.map((row, i) => {
                    const length = (row.value / total) * circumference;
                    const dash = `${length} ${circumference - length}`;
                    const el = (
                        <circle
                            key={row.label}
                            cx={80}
                            cy={80}
                            r={radius}
                            fill="none"
                            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                            strokeWidth={stroke}
                            strokeDasharray={dash}
                            strokeDashoffset={-offset}
                        />
                    );
                    offset += length;
                    return el;
                })}
            </svg>
            <div className="flex-1 min-w-[140px] space-y-1.5">
                <p className="text-xs text-[var(--text-secondary)] mb-2">{centerLabel}</p>
                {rows.map((row, i) => (
                    <div key={row.label} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                            />
                            <span className="text-sm text-[var(--text-primary)] truncate">{row.label}</span>
                        </div>
                        <span className="text-sm text-[var(--text-secondary)] shrink-0">
                            {percent(row.value, total).toFixed(0)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface ColumnChartProps {
    labels: string[];
    values: number[];
    color?: string;
}

/** Compact column chart used for the hour-of-day and weekday distributions. */
export const ColumnChart: React.FC<ColumnChartProps> = ({ labels, values, color = '#a855f7' }) => {
    const max = Math.max(...values, 1);
    return (
        <div className="flex items-end gap-1 h-32">
            {values.map((value, i) => (
                <div key={labels[i]} className="flex-1 flex flex-col items-center gap-1 group" title={`${labels[i]}: ${formatNumber(value)}`}>
                    <div className="w-full flex items-end h-24">
                        <div
                            className="w-full rounded-t transition-all"
                            style={{
                                height: `${Math.max(2, percent(value, max))}%`,
                                backgroundColor: color,
                                opacity: value ? 0.75 : 0.2,
                            }}
                        />
                    </div>
                    <span className="text-[10px] text-[var(--text-secondary)] truncate w-full text-center">{labels[i]}</span>
                </div>
            ))}
        </div>
    );
};
