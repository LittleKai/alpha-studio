import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { getCourses, Course, CourseQueryParams, PaginationInfo } from '../services/courseService';

// Category options
const categories = [
    { value: '', labelKey: 'courseCatalog.allCategories' },
    { value: 'ai-basic', labelKey: 'courseCatalog.categories.aiBasic' },
    { value: 'ai-advanced', labelKey: 'courseCatalog.categories.aiAdvanced' },
    { value: 'ai-studio', labelKey: 'courseCatalog.categories.aiStudio' },
    { value: 'ai-creative', labelKey: 'courseCatalog.categories.aiCreative' }
];

// Level options
const levels = [
    { value: '', labelKey: 'courseCatalog.allLevels' },
    { value: 'beginner', labelKey: 'courseCatalog.levels.beginner' },
    { value: 'intermediate', labelKey: 'courseCatalog.levels.intermediate' },
    { value: 'advanced', labelKey: 'courseCatalog.levels.advanced' }
];

// Sort options
const sortOptions = [
    { value: '-createdAt', labelKey: 'courseCatalog.sortNewest' },
    { value: 'price', labelKey: 'courseCatalog.sortPriceLow' },
    { value: '-price', labelKey: 'courseCatalog.sortPriceHigh' },
    { value: '-enrolledCount', labelKey: 'courseCatalog.sortPopular' }
];

// Category to gradient color mapping
const categoryGradients: Record<string, string> = {
    'ai-basic': 'from-green-600 to-emerald-500',
    'ai-advanced': 'from-purple-600 to-pink-500',
    'ai-studio': 'from-blue-600 to-cyan-500',
    'ai-creative': 'from-orange-500 to-red-500'
};

// Category to icon mapping
const categoryIcons: Record<string, string> = {
    'ai-basic': '',
    'ai-advanced': '',
    'ai-studio': '',
    'ai-creative': ''
};

// Level to translation key mapping
const levelKeys: Record<string, string> = {
    'beginner': 'courseCatalog.levels.beginner',
    'intermediate': 'courseCatalog.levels.intermediate',
    'advanced': 'courseCatalog.levels.advanced'
};

const CoursesPage: React.FC = () => {
    const { t, language } = useTranslation();

    // State
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('');
    const [level, setLevel] = useState('');
    const [sortBy, setSortBy] = useState('-createdAt');
    const [currentPage, setCurrentPage] = useState(1);

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1); // Reset to first page on search
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch courses
    const fetchCourses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params: CourseQueryParams = {
                status: 'published',
                page: currentPage,
                limit: 9,
                sort: sortBy
            };

            if (debouncedSearch) params.search = debouncedSearch;
            if (category) params.category = category;
            if (level) params.level = level;

            const response = await getCourses(params);
            setCourses(response.data);
            setPagination(response.pagination);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
            setError(err instanceof Error ? err.message : 'Failed to load courses');
        } finally {
            setLoading(false);
        }
    }, [currentPage, sortBy, debouncedSearch, category, level]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    // Helper to get localized text
    const getLocalizedText = (text: { vi: string; en: string }) => {
        return language === 'vi' ? text.vi : text.en;
    };

    // Format price in credits
    const formatPrice = (price: number) => {
        if (price === 0) return t('courseCatalog.free');
        return `${price.toLocaleString()} Credits`;
    };

    // Handle filter changes
    const handleCategoryChange = (value: string) => {
        setCategory(value);
        setCurrentPage(1);
    };

    const handleLevelChange = (value: string) => {
        setLevel(value);
        setCurrentPage(1);
    };

    const handleSortChange = (value: string) => {
        setSortBy(value);
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <div className="bg-[var(--bg-secondary)]/50 border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-6 py-12">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-4">
                            {t('courseCatalog.title')}
                        </h1>
                        <p className="text-lg text-[var(--text-secondary)]">
                            {t('courseCatalog.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="sticky top-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('courseCatalog.searchPlaceholder')}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                            />
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-wrap gap-3">
                            {/* Category Filter */}
                            <select
                                value={category}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer"
                            >
                                {categories.map(cat => (
                                    <option key={cat.value} value={cat.value}>{t(cat.labelKey)}</option>
                                ))}
                            </select>

                            {/* Level Filter */}
                            <select
                                value={level}
                                onChange={(e) => handleLevelChange(e.target.value)}
                                className="px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer"
                            >
                                {levels.map(lvl => (
                                    <option key={lvl.value} value={lvl.value}>{t(lvl.labelKey)}</option>
                                ))}
                            </select>

                            {/* Sort */}
                            <select
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer"
                            >
                                {sortOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-8">
                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                            <p className="text-[var(--text-secondary)]">{t('courseCatalog.loading')}</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center space-y-4">
                            <p className="text-red-400">{t('courseCatalog.error')}</p>
                            <button
                                onClick={fetchCourses}
                                className="py-2 px-4 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold text-sm hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all"
                            >
                                {t('courseCatalog.retry')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !error && courses.length === 0 && (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center space-y-4">
                            <div className="text-6xl mb-4">📚</div>
                            <p className="text-xl font-bold text-[var(--text-primary)]">{t('courseCatalog.noCourses')}</p>
                            <p className="text-[var(--text-secondary)]">{t('courseCatalog.tryAdjustFilters')}</p>
                        </div>
                    </div>
                )}

                {/* Courses Grid */}
                {!loading && !error && courses.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map(course => (
                                <Link
                                    key={course._id}
                                    to={`/courses/${course.slug}`}
                                    className="group glass-card rounded-[24px] overflow-hidden hover:bg-[var(--bg-card)] transition-all duration-500 cursor-pointer relative flex flex-col h-full"
                                >
                                    {/* Thumbnail */}
                                    {course.thumbnail ? (
                                        <div className="relative h-48 overflow-hidden">
                                            <img
                                                src={course.thumbnail}
                                                alt={getLocalizedText(course.title)}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent opacity-60"></div>
                                            {/* Level Badge */}
                                            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[var(--bg-tertiary)]/80 backdrop-blur-sm border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary)]">
                                                {t(levelKeys[course.level] || 'courseCatalog.levels.beginner')}
                                            </span>
                                            {/* Price Badge */}
                                            <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[var(--accent-primary)] text-[var(--text-on-accent)] text-[11px] font-black">
                                                {course.discount > 0 ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="line-through opacity-70">{formatPrice(course.price)}</span>
                                                        {formatPrice(course.finalPrice)}
                                                    </span>
                                                ) : formatPrice(course.price)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className={`relative h-48 bg-gradient-to-br ${categoryGradients[course.category] || 'from-purple-600 to-pink-500'} flex items-center justify-center`}>
                                            <span className="text-6xl">{categoryIcons[course.category] || '📚'}</span>
                                            {/* Level Badge */}
                                            <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-white">
                                                {t(levelKeys[course.level] || 'courseCatalog.levels.beginner')}
                                            </span>
                                            {/* Price Badge */}
                                            <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white text-[var(--accent-primary)] text-[11px] font-black">
                                                {course.discount > 0 ? formatPrice(course.finalPrice) : formatPrice(course.price)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="space-y-3 flex-grow">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
                                                {getLocalizedText(course.title)}
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                                                {getLocalizedText(course.description)}
                                            </p>
                                        </div>

                                        {/* Instructor */}
                                        {course.instructor?.name && (
                                            <div className="flex items-center gap-2 mt-4">
                                                {course.instructor.avatar ? (
                                                    <img src={course.instructor.avatar} alt={course.instructor.name} className="w-6 h-6 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] text-xs font-bold">
                                                        {course.instructor.name.charAt(0)}
                                                    </div>
                                                )}
                                                <span className="text-xs text-[var(--text-tertiary)]">{t('course.by')} {course.instructor.name}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-tertiary)]">
                                            <div className="flex gap-4">
                                                <span>⏱ {course.duration}h</span>
                                                <span>📚 {course.totalLessons} {t('landing.course.lessons')}</span>
                                            </div>
                                            <span>👥 {course.enrolledCount}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.pages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-12">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] font-bold text-sm hover:border-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t('courseCatalog.pagination.prev')}
                                </button>
                                <span className="text-sm text-[var(--text-secondary)]">
                                    {t('courseCatalog.pagination.page')} {currentPage} {t('courseCatalog.pagination.of')} {pagination.pages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                                    disabled={currentPage === pagination.pages}
                                    className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] font-bold text-sm hover:border-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {t('courseCatalog.pagination.next')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CoursesPage;
