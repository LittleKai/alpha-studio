import React, { useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { Course } from '../../services/courseService';

interface CourseCardProps {
    course: Course;
    onEdit: (course: Course) => void;
    onDelete: (id: string) => void;
    onPublish: (id: string) => void;
    onUnpublish: (id: string) => void;
    onArchive: (id: string) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
    course,
    onEdit,
    onDelete,
    onPublish,
    onUnpublish,
    onArchive
}) => {
    const { t, language } = useTranslation();

    const title = language === 'vi' ? course.title.vi : course.title.en;
    const description = language === 'vi' ? course.description.vi : course.description.en;

    const getCategoryLabel = useCallback((category: string) => {
        const labels: Record<string, string> = {
            'ai-basic': t('admin.courses.categories.aiBasic'),
            'ai-advanced': t('admin.courses.categories.aiAdvanced'),
            'ai-studio': t('admin.courses.categories.aiStudio'),
            'ai-creative': t('admin.courses.categories.aiCreative'),
        };
        return labels[category] || category;
    }, [t]);

    const getLevelLabel = useCallback((level: string) => {
        const labels: Record<string, string> = {
            'beginner': t('admin.courses.levels.beginner'),
            'intermediate': t('admin.courses.levels.intermediate'),
            'advanced': t('admin.courses.levels.advanced'),
        };
        return labels[level] || level;
    }, [t]);

    const getStatusColor = useCallback((status: string) => {
        switch (status) {
            case 'published':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'draft':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'archived':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    }, []);

    const formatPrice = useCallback((price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(price);
    }, []);

    return (
        <div className="glass-card rounded-2xl overflow-hidden group hover:border-[var(--accent-primary)] transition-all duration-300">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-[var(--bg-secondary)]">
                {course.thumbnail ? (
                    <img
                        src={course.thumbnail}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${getStatusColor(course.status)}`}>
                        {t(`admin.courses.${course.status}`)}
                    </span>
                </div>

                {/* Discount Badge */}
                {course.discount > 0 && (
                    <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-500 text-white">
                            -{course.discount}%
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Category & Level */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20">
                        {getCategoryLabel(course.category)}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                        {getLevelLabel(course.level)}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4">
                    {description || t('admin.courses.noDescription')}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)] mb-4">
                    <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                        </svg>
                        {course.duration}h
                    </span>
                    <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        {course.totalLessons} {t('admin.courses.lessons')}
                    </span>
                    <span className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        {course.enrolledCount}
                    </span>
                    {course.rating > 0 && (
                        <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {course.rating.toFixed(1)}
                        </span>
                    )}
                </div>

                {/* Price */}
                <div className="flex items-center gap-2 mb-4">
                    {course.discount > 0 ? (
                        <>
                            <span className="text-lg font-bold text-[var(--accent-primary)]">
                                {formatPrice(course.finalPrice)}
                            </span>
                            <span className="text-sm text-[var(--text-tertiary)] line-through">
                                {formatPrice(course.price)}
                            </span>
                        </>
                    ) : (
                        <span className="text-lg font-bold text-[var(--text-primary)]">
                            {course.price > 0 ? formatPrice(course.price) : t('admin.courses.free')}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-primary)]">
                    <button
                        onClick={() => onEdit(course)}
                        className="flex-1 py-2 px-3 text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        {t('admin.courses.edit')}
                    </button>

                    {course.status === 'draft' && (
                        <button
                            onClick={() => onPublish(course._id)}
                            className="flex-1 py-2 px-3 text-sm font-medium bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {t('admin.courses.publish')}
                        </button>
                    )}

                    {course.status === 'published' && (
                        <button
                            onClick={() => onUnpublish(course._id)}
                            className="flex-1 py-2 px-3 text-sm font-medium bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                            </svg>
                            {t('admin.courses.unpublish')}
                        </button>
                    )}

                    <div className="relative group/menu">
                        <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>
                        <div className="absolute right-0 bottom-full mb-2 w-40 py-1 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                            {course.status !== 'archived' && (
                                <button
                                    onClick={() => onArchive(course._id)}
                                    className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
                                >
                                    {t('admin.courses.archive')}
                                </button>
                            )}
                            <button
                                onClick={() => onDelete(course._id)}
                                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                                {t('admin.courses.deleteCourse')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
