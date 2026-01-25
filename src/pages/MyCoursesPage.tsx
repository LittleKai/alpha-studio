import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import { getMyEnrolledCourses, Enrollment } from '../services/courseService';

// Category color mapping
const categoryColors: Record<string, string> = {
    'ai-basic': 'from-green-600 to-emerald-500',
    'ai-advanced': 'from-purple-600 to-pink-500',
    'ai-studio': 'from-blue-600 to-cyan-500',
    'ai-creative': 'from-orange-500 to-red-500'
};

const categoryIcons: Record<string, string> = {
    'ai-basic': '📚',
    'ai-advanced': '💎',
    'ai-studio': '🎬',
    'ai-creative': '✨'
};

const MyCoursesPage: React.FC = () => {
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const { isAuthenticated } = useAuth();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    // Get localized text
    const getLocalizedText = (text: { vi: string; en: string } | undefined) => {
        if (!text) return '';
        return language === 'vi' ? text.vi : text.en;
    };

    // Fetch enrollments
    useEffect(() => {
        const fetchEnrollments = async () => {
            if (!isAuthenticated) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const data = await getMyEnrolledCourses();
                setEnrollments(data);
            } catch (error) {
                console.error('Failed to fetch enrollments:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEnrollments();
    }, [isAuthenticated]);

    // Filter enrollments
    const filteredEnrollments = enrollments.filter(e => {
        if (filter === 'all') return true;
        if (filter === 'active') return e.status === 'active';
        if (filter === 'completed') return e.status === 'completed';
        return true;
    });

    // Stats
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const inProgressCourses = enrollments.filter(e => e.status === 'active').length;

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                        {t('myCourses.loginRequired')}
                    </h2>
                    <p className="text-[var(--text-secondary)]">
                        {t('myCourses.loginToView')}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:scale-105 transition-all"
                    >
                        {t('common.login')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-40 glass-card border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold">{t('myCourses.title')}</h1>
                        </div>
                        <button
                            onClick={() => navigate('/courses')}
                            className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            {t('myCourses.exploreCourses')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center">
                                <span className="text-2xl">📚</span>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">{t('myCourses.totalCourses')}</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalCourses}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <span className="text-2xl">🎯</span>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">{t('myCourses.inProgress')}</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{inProgressCourses}</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                <span className="text-2xl">✅</span>
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">{t('myCourses.completed')}</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{completedCourses}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'active', 'completed'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                                filter === tab
                                    ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                            }`}
                        >
                            {t(`myCourses.filter.${tab}`)}
                        </button>
                    ))}
                </div>

                {/* Course Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                            <p className="text-[var(--text-secondary)]">{t('common.loading')}</p>
                        </div>
                    </div>
                ) : filteredEnrollments.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📭</div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                            {t('myCourses.noCourses')}
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6">
                            {t('myCourses.startLearning')}
                        </p>
                        <button
                            onClick={() => navigate('/courses')}
                            className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:scale-105 transition-all"
                        >
                            {t('myCourses.browseCourses')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEnrollments.map((enrollment) => {
                            const course = enrollment.course;
                            const gradient = categoryColors[course.category] || 'from-purple-600 to-pink-500';
                            const icon = categoryIcons[course.category] || '📚';

                            return (
                                <div
                                    key={enrollment._id}
                                    onClick={() => navigate(`/courses/${course.slug}`)}
                                    className="glass-card rounded-2xl overflow-hidden cursor-pointer group hover:border-[var(--accent-primary)] transition-all"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video">
                                        {course.thumbnail ? (
                                            <img
                                                src={course.thumbnail}
                                                alt={getLocalizedText(course.title)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                                <span className="text-5xl">{icon}</span>
                                            </div>
                                        )}
                                        {/* Progress Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                            <div className="flex items-center justify-between text-white text-sm mb-1">
                                                <span>{enrollment.progress}% {t('myCourses.complete')}</span>
                                                {enrollment.status === 'completed' && (
                                                    <span className="px-2 py-0.5 bg-green-500 rounded text-xs font-medium">
                                                        {t('myCourses.completed')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[var(--accent-primary)] rounded-full transition-all"
                                                    style={{ width: `${enrollment.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <h3 className="font-bold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
                                            {getLocalizedText(course.title)}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                                            <span className="flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                </svg>
                                                {course.duration}h
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                                </svg>
                                                {course.modules?.length || 0} {t('course.modules')}
                                            </span>
                                        </div>
                                        {/* Last Accessed */}
                                        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                                            {t('myCourses.lastAccessed')}: {new Date(enrollment.lastAccessedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                                        </p>
                                        {/* Continue Button */}
                                        <button className="mt-4 w-full py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                            </svg>
                                            {enrollment.progress > 0 ? t('myCourses.continue') : t('myCourses.start')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyCoursesPage;
