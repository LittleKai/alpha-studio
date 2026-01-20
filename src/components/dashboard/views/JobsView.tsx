import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../i18n/context';
import { useAuth } from '../../../auth/context';
import { getJobs, createJob, updateJob, deleteJob, publishJob, closeJob } from '../../../services/jobService';
import type { Job, JobInput } from '../../../services/jobService';
import JobManagementModal from '../../modals/JobManagementModal';

interface JobsViewProps {
    searchQuery: string;
}

const JobsView: React.FC<JobsViewProps> = ({ searchQuery }) => {
    const { t, language } = useTranslation();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin' || user?.role === 'mod';

    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showJobModal, setShowJobModal] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = {};
            // Admin/mod can see all jobs, regular users only see published
            if (!isAdmin) {
                params.status = 'published';
            }
            if (categoryFilter !== 'all') params.category = categoryFilter;
            if (jobTypeFilter !== 'all') params.jobType = jobTypeFilter;
            if (searchQuery) params.search = searchQuery;

            const response = await getJobs(params);
            setJobs(response.data);
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError(err instanceof Error ? err.message : 'Failed to load jobs');
        } finally {
            setIsLoading(false);
        }
    }, [categoryFilter, jobTypeFilter, searchQuery, isAdmin]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    const handleCreateJob = async (data: JobInput) => {
        try {
            await createJob(data);
            await fetchJobs();
            setShowJobModal(false);
        } catch (err) {
            console.error('Error creating job:', err);
            throw err;
        }
    };

    const handleUpdateJob = async (data: JobInput) => {
        if (!editingJob) return;
        try {
            await updateJob(editingJob._id, data);
            await fetchJobs();
            setEditingJob(null);
            setShowJobModal(false);
        } catch (err) {
            console.error('Error updating job:', err);
            throw err;
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        if (!confirm(t('job.confirmDelete') || 'Are you sure you want to delete this job?')) return;
        try {
            await deleteJob(jobId);
            await fetchJobs();
        } catch (err) {
            console.error('Error deleting job:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete job');
        }
    };

    const handlePublishJob = async (jobId: string) => {
        try {
            await publishJob(jobId);
            await fetchJobs();
        } catch (err) {
            console.error('Error publishing job:', err);
            alert(err instanceof Error ? err.message : 'Failed to publish job');
        }
    };

    const handleCloseJob = async (jobId: string) => {
        try {
            await closeJob(jobId);
            await fetchJobs();
        } catch (err) {
            console.error('Error closing job:', err);
            alert(err instanceof Error ? err.message : 'Failed to close job');
        }
    };

    const getLocalizedText = (obj: { vi: string; en: string } | undefined): string => {
        if (!obj) return '';
        return language === 'vi' ? obj.vi || obj.en : obj.en || obj.vi;
    };

    const formatSalary = (job: Job): string => {
        if (!job.salary?.min && !job.salary?.max) {
            return job.salary?.negotiable ? (t('job.negotiable') || 'Negotiable') : '';
        }
        const currency = job.salary.currency || 'VND';
        const min = job.salary.min?.toLocaleString();
        const max = job.salary.max?.toLocaleString();
        if (min && max) return `${min} - ${max} ${currency}`;
        if (min) return `${t('job.from') || 'From'} ${min} ${currency}`;
        if (max) return `${t('job.upTo') || 'Up to'} ${max} ${currency}`;
        return '';
    };

    const getCategoryColor = (category: string): string => {
        const colors: Record<string, string> = {
            engineering: 'bg-blue-500/20 text-blue-400',
            design: 'bg-purple-500/20 text-purple-400',
            marketing: 'bg-pink-500/20 text-pink-400',
            operations: 'bg-orange-500/20 text-orange-400',
            hr: 'bg-green-500/20 text-green-400',
            finance: 'bg-yellow-500/20 text-yellow-400',
            other: 'bg-gray-500/20 text-gray-400',
        };
        return colors[category] || colors.other;
    };

    const getJobTypeColor = (jobType: string): string => {
        const colors: Record<string, string> = {
            'full-time': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'part-time': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            contract: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            internship: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            remote: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        };
        return colors[jobType] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    const getStatusBadge = (status: string): { color: string; label: string } => {
        const badges: Record<string, { color: string; label: string }> = {
            draft: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Draft' },
            published: { color: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Published' },
            closed: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Closed' },
        };
        return badges[status] || badges.draft;
    };

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return language === 'vi' ? `${diffMins} phút trước` : `${diffMins}m ago`;
        if (diffHours < 24) return language === 'vi' ? `${diffHours} giờ trước` : `${diffHours}h ago`;
        if (diffDays < 30) return language === 'vi' ? `${diffDays} ngày trước` : `${diffDays}d ago`;
        return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
    };

    const formatDeadline = (dateString: string | null): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
    };

    const getExperienceLabel = (level: string): string => {
        const labels: Record<string, { vi: string; en: string }> = {
            fresher: { vi: 'Fresher', en: 'Fresher' },
            junior: { vi: 'Junior', en: 'Junior' },
            mid: { vi: 'Mid-level', en: 'Mid-level' },
            senior: { vi: 'Senior', en: 'Senior' },
            lead: { vi: 'Lead', en: 'Lead' },
            manager: { vi: 'Manager', en: 'Manager' },
        };
        return labels[level]?.[language] || level;
    };

    const getExperienceColor = (level: string): string => {
        const colors: Record<string, string> = {
            fresher: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            junior: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            mid: 'bg-green-500/10 text-green-400 border-green-500/20',
            senior: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            lead: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            manager: 'bg-red-500/10 text-red-400 border-red-500/20',
        };
        return colors[level] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    };

    return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                        {t('workflow.jobs.title') || 'Sàn việc làm'}
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        {t('workflow.jobs.subtitle') || 'Tìm kiếm cơ hội việc làm phù hợp với bạn'}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => {
                            setEditingJob(null);
                            setShowJobModal(true);
                        }}
                        className="bg-[var(--accent-primary)] text-black font-bold px-6 py-2.5 rounded-lg shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                    >
                        <span>+</span> {t('workflow.jobs.add') || 'Đăng việc làm'}
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                    <option value="all">{t('job.allCategories') || 'All Categories'}</option>
                    <option value="engineering">Engineering</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="operations">Operations</option>
                    <option value="hr">HR</option>
                    <option value="finance">Finance</option>
                    <option value="other">Other</option>
                </select>
                <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                    className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                    <option value="all">{t('job.allTypes') || 'All Types'}</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="remote">Remote</option>
                </select>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center">
                    {error}
                    <button onClick={fetchJobs} className="ml-4 underline hover:no-underline">
                        {t('common.retry') || 'Retry'}
                    </button>
                </div>
            )}

            {/* Jobs Grid */}
            {!isLoading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {jobs.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-[var(--text-tertiary)]">
                            {t('workflow.jobs.noJobs') || 'Chưa có việc làm nào được đăng tải'}
                        </div>
                    ) : (
                        jobs.map((job) => {
                            const statusBadge = getStatusBadge(job.status);
                            return (
                                <div
                                    key={job._id}
                                    className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 hover:border-[var(--accent-primary)] transition-all shadow-lg group flex flex-col h-full"
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-wrap gap-2">
                                            <div className={`${getJobTypeColor(job.jobType)} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border`}>
                                                {job.jobType.replace('-', ' ')}
                                            </div>
                                            <div className={`${getExperienceColor(job.experienceLevel)} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border`}>
                                                {getExperienceLabel(job.experienceLevel)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isAdmin && (
                                                <span className={`${statusBadge.color} px-2 py-0.5 rounded text-[10px] font-bold border`}>
                                                    {statusBadge.label}
                                                </span>
                                            )}
                                            <span className="text-xs text-[var(--text-tertiary)]">
                                                {formatTimeAgo(job.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors">
                                        {getLocalizedText(job.title)}
                                    </h3>

                                    {/* Company & Salary */}
                                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                                            {job.location || 'Remote'}
                                        </span>
                                        {formatSalary(job) && (
                                            <>
                                                <span className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full"></span>
                                                <span className="text-xs text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded">
                                                    {formatSalary(job)}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-[var(--text-secondary)] mb-6 line-clamp-3 flex-grow">
                                        {getLocalizedText(job.description)}
                                    </p>

                                    {/* Skills */}
                                    {job.skills && job.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {job.skills.slice(0, 3).map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="text-[10px] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] px-2 py-1 rounded border border-[var(--border-primary)]"
                                                >
                                                    #{skill}
                                                </span>
                                            ))}
                                            {job.skills.length > 3 && (
                                                <span className="text-[10px] text-[var(--text-tertiary)] px-2 py-1">
                                                    +{job.skills.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="mt-auto pt-4 border-t border-[var(--border-primary)]">
                                        <div className="flex justify-between items-center mb-4 text-xs text-[var(--text-tertiary)]">
                                            <div className="flex items-center gap-2">
                                                <span className={`${getCategoryColor(job.category)} px-2 py-0.5 rounded text-[10px] font-bold`}>
                                                    {job.category}
                                                </span>
                                                {job.applicationDeadline && (
                                                    <span>• {language === 'vi' ? 'Hạn' : 'Due'}: {formatDeadline(job.applicationDeadline)}</span>
                                                )}
                                            </div>
                                            <span>{job.applicationCount || 0} {language === 'vi' ? 'ứng viên' : 'applicants'}</span>
                                        </div>

                                        {/* Admin Actions */}
                                        {isAdmin ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingJob(job);
                                                        setShowJobModal(true);
                                                    }}
                                                    className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)] flex items-center justify-center gap-2"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                    </svg>
                                                    {language === 'vi' ? 'Sửa' : 'Edit'}
                                                </button>
                                                {job.status !== 'published' ? (
                                                    <button
                                                        onClick={() => handlePublishJob(job._id)}
                                                        className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all bg-emerald-500 text-white hover:bg-emerald-600"
                                                    >
                                                        {language === 'vi' ? 'Đăng' : 'Publish'}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCloseJob(job._id)}
                                                        className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                                                    >
                                                        {language === 'vi' ? 'Đóng' : 'Close'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteJob(job._id)}
                                                    className="p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                                                    title={language === 'vi' ? 'Xóa' : 'Delete'}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <button className="w-full py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90">
                                                {t('workflow.jobs.apply') || 'Ứng tuyển ngay'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Job Management Modal */}
            <JobManagementModal
                isOpen={showJobModal}
                onClose={() => {
                    setShowJobModal(false);
                    setEditingJob(null);
                }}
                onSubmit={editingJob ? handleUpdateJob : handleCreateJob}
                editingJob={editingJob}
            />
        </div>
    );
};

export default JobsView;
