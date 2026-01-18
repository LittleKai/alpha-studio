import React from 'react';
import { useTranslation } from '../../i18n/context';

interface PartnerStatsProps {
    stats: {
        totalPartners: number;
        publishedPartners: number;
        draftPartners: number;
        archivedPartners: number;
        featuredPartners: number;
        byType: Record<string, number>;
    } | null;
}

const PartnerStats: React.FC<PartnerStatsProps> = ({ stats }) => {
    const { t } = useTranslation();

    if (!stats) return null;

    const statCards = [
        {
            label: t('admin.partners.stats.total'),
            value: stats.totalPartners,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'bg-blue-500/10',
            textColor: 'text-blue-400'
        },
        {
            label: t('admin.partners.stats.published'),
            value: stats.publishedPartners,
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
            label: t('admin.partners.stats.draft'),
            value: stats.draftPartners,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'bg-yellow-500/10',
            textColor: 'text-yellow-400'
        },
        {
            label: t('admin.partners.stats.featured'),
            value: stats.featuredPartners,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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

export default PartnerStats;
