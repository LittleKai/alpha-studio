import React, { useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { Job } from '../../services/jobService';

interface JobCardProps {
    job: Job;
    onEdit: (job: Job) => void;
    onDelete: (id: string) => void;
    onPublish: (id: string) => void;
    onClose: (id: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({
    job,
    onEdit,
    onDelete,
    onPublish,
    onClose
}) => {
    const { t, language } = useTranslation();

    const title = language === 'vi' ? job.title?.vi : job.title?.en;
    const description = language === 'vi' ? job.description?.vi : job.description?.en;

    const getCategoryLabel = useCallback((category: string) => {
        const labels: Record<string, string> = {
            'engineering': t('admin.jobs.categories.engineering'),
            'design': t('admin.jobs.categories.design'),
            'marketing': t('admin.jobs.categories.marketing'),
            'operations': t('admin.jobs.categories.operations'),
            'hr': t('admin.jobs.categories.hr'),
            'finance': t('admin.jobs.categories.finance'),
            'other': t('admin.jobs.categories.other'),
        };
        return labels[category] || category;
    }, [t]);

    const getJobTypeLabel = useCallback((type: string) => {
        const labels: Record<string, string> = {
            'full-time': t('admin.jobs.types.fullTime'),
            'part-time': t('admin.jobs.types.partTime'),
            'contract': t('admin.jobs.types.contract'),
            'internship': t('admin.jobs.types.internship'),
            'remote': t('admin.jobs.types.remote'),
        };
        return labels[type] || type;
    }, [t]);

    const getStatusColor = useCallback((status: string) => {
        switch (status) {
            case 'published':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'draft':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'closed':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    }, []);

    const formatSalary = useCallback((salary: Job['salary']) => {
        if (!salary) return t('admin.jobs.salaryNegotiable');
        const { min, max, currency, negotiable } = salary;
        if (negotiable) return t('admin.jobs.salaryNegotiable');
        if (min && max) {
            return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`;
        }
        if (min) return `${min.toLocaleString()}+ ${currency}`;
        if (max) return `${t('admin.jobs.upTo')} ${max.toLocaleString()} ${currency}`;
        return t('admin.jobs.salaryNegotiable');
    }, [t]);

    return (
        <div className="glass-card rounded-2xl overflow-hidden group hover:border-[var(--accent-primary)] transition-all duration-300">
            <div className="p-5">
                {/* Status & Category */}
                <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(job.status)}`}>
                        {t(`admin.jobs.status.${job.status}`)}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                        {getCategoryLabel(job.category)}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
                    {title || t('admin.jobs.untitled')}
                </h3>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 whitespace-pre-line">
                    {description || t('admin.jobs.noDescription')}
                </p>

                {/* Info */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded">
                        {getJobTypeLabel(job.jobType)}
                    </span>
                    {job.location && (
                        <span className="px-2 py-1 text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {job.location}
                        </span>
                    )}
                </div>

                {/* Salary */}
                <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                    {formatSalary(job.salary)}
                </div>

                {/* Applications Count */}
                <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)] mb-4">
                    <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        {job.applicationCount} {t('admin.jobs.applications')}
                    </span>
                    {job.skills && job.skills.length > 0 && (
                        <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
                            </svg>
                            {job.skills.length} {t('admin.jobs.skills')}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-primary)]">
                    <button
                        onClick={() => onEdit(job)}
                        className="flex-1 py-2 px-3 text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        {t('admin.jobs.edit')}
                    </button>

                    {job.status === 'draft' && (
                        <button
                            onClick={() => onPublish(job._id)}
                            className="flex-1 py-2 px-3 text-sm font-medium bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {t('admin.jobs.publish')}
                        </button>
                    )}

                    {job.status === 'published' && (
                        <button
                            onClick={() => onClose(job._id)}
                            className="flex-1 py-2 px-3 text-sm font-medium bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {t('admin.jobs.close')}
                        </button>
                    )}

                    <button
                        onClick={() => onDelete(job._id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobCard;
