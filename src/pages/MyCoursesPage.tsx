import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import { getMyEnrolledCourses, Enrollment } from '../services/courseService';
import { localizedText } from '../utils/localized';

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

const SparkleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="sparkle"
  >
    <path
      className="path"
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"
    ></path>
    <path
      className="path"
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.259 15.285L6 14.25Z"
    ></path>
    <path
      className="path"
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.75718 M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"
    ></path>
  </svg>
);

const MyCoursesPage: React.FC = () => {
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const { isAuthenticated } = useAuth();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    // Get localized text
    const getLocalizedText = (text: { vi: string; en: string } | undefined) => localizedText(text, language);

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
                                        <button className="mean-bird-button relative mt-4 w-full py-2 px-4 text-[var(--accent-color)] font-medium rounded-xl flex items-center justify-between pointer-events-none">
                                            <div className="dots_border"></div>
                                            <span className="relative z-10 flex items-center gap-2 text-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                </svg>
                                                {enrollment.progress > 0 ? t('myCourses.continue') : t('myCourses.start')}
                                            </span>
                                            <SparkleIcon />
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
