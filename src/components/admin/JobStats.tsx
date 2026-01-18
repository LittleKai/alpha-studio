import React from 'react';
import { useTranslation } from '../../i18n/context';

interface JobStatsProps {
    stats: {
        totalJobs: number;
        publishedJobs: number;
        draftJobs: number;
        closedJobs: number;
        totalApplications: number;
        byCategory: Record<string, number>;
        byJobType: Record<string, number>;
    } | null;
}

const JobStats: React.FC<JobStatsProps> = ({ stats }) => {
    const { t } = useTranslation();

    if (!stats) return null;

    const statCards = [
        {
            label: t('admin.jobs.stats.total'),
            value: stats.totalJobs,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'bg-blue-500/10',
            textColor: 'text-blue-400'
        },
        {
            label: t('admin.jobs.stats.published'),
            value: stats.publishedJobs,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-500/10',
            textColor: 'text-green-400'
        },
        {
            label: t('admin.jobs.stats.closed'),
            value: stats.closedJobs,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'from-red-500 to-pink-500',
            bgColor: 'bg-red-500/10',
            textColor: 'text-red-400'
        },
        {
            label: t('admin.jobs.stats.applications'),
            value: stats.totalApplications,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-500/10',
            textColor: 'text-purple-400'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
                <div
                    key={index}
                    className="glass-card rounded-2xl p-6 relative overflow-hidden group hover:border-[var(--accent-primary)] transition-all"
                >
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500`}></div>
                    <div className="relative z-10">
                        <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center ${stat.textColor} mb-4`}>
                            {stat.icon}
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-[var(--text-primary)]">
                            {stat.value.toLocaleString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default JobStats;
