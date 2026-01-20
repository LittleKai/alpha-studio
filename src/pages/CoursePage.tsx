import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { getCourseBySlug, Course } from '../services/courseService';

// Category to gradient color mapping
const categoryGradients: Record<string, string> = {
    'ai-basic': 'from-green-600 to-emerald-500',
    'ai-advanced': 'from-purple-600 to-pink-500',
    'ai-studio': 'from-blue-600 to-cyan-500',
    'ai-creative': 'from-orange-500 to-red-500'
};

// Category to icon mapping
const categoryIcons: Record<string, string> = {
    'ai-basic': '📚',
    'ai-advanced': '💎',
    'ai-studio': '🎬',
    'ai-creative': '✨'
};

// Level to translation key mapping
const levelKeys: Record<string, string> = {
    'beginner': 'courseCatalog.levels.beginner',
    'intermediate': 'courseCatalog.levels.intermediate',
    'advanced': 'courseCatalog.levels.advanced'
};

const CoursePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'syllabus' | 'overview'>('syllabus');

    // Helper to get localized text
    const getLocalizedText = (text: { vi: string; en: string } | undefined) => {
        if (!text) return '';
        return language === 'vi' ? text.vi : text.en;
    };

    // Format price
    const formatPrice = (price: number) => {
        if (price === 0) return t('courseCatalog.free');
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    useEffect(() => {
        const fetchCourse = async () => {
            if (!slug) {
                setError('Course not found');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const courseData = await getCourseBySlug(slug);
                setCourse(courseData);
            } catch (err) {
                console.error('Failed to fetch course:', err);
                setError(err instanceof Error ? err.message : 'Course not found');
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                    <p className="text-[var(--text-secondary)]">{t('courseCatalog.loading')}</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">📚</div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('courseCatalog.noCourses')}</h2>
                    <p className="text-[var(--text-secondary)]">{error || t('courseCatalog.error')}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:scale-105 transition-all"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        );
    }

    const gradientColor = categoryGradients[course.category] || 'from-purple-600 to-pink-500';
    const icon = categoryIcons[course.category] || '📚';

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[var(--bg-card-alpha)] backdrop-blur-lg border-b border-[var(--border-primary)] p-4">
                <div className="container mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-lg md:text-xl font-bold truncate">{getLocalizedText(course.title)}</h1>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 animate-fade-in">
                {/* Left Column: Video Player & Main Content */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Thumbnail / Video Area */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-[var(--border-primary)] shadow-2xl">
                        {course.thumbnail ? (
                            <img
                                src={course.thumbnail}
                                alt={getLocalizedText(course.title)}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${gradientColor} flex items-center justify-center`}>
                                <span className="text-8xl">{icon}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <button className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:scale-110 transition-transform group">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white fill-current" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white font-medium">01. {t('landing.course.intro')}</p>
                            <div className="w-full h-1 bg-gray-600 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-[var(--accent-primary)] w-0"></div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div>
                        <div className="flex gap-6 border-b border-[var(--border-primary)] mb-4">
                            <button
                                onClick={() => setActiveTab('syllabus')}
                                className={`pb-2 text-sm font-semibold transition-colors relative ${activeTab === 'syllabus' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                {t('course.curriculum')}
                                {activeTab === 'syllabus' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-primary)]"></div>}
                            </button>
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`pb-2 text-sm font-semibold transition-colors relative ${activeTab === 'overview' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            >
                                {t('landing.course.overview')}
                                {activeTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-primary)]"></div>}
                            </button>
                        </div>

                        {activeTab === 'syllabus' ? (
                            <div className="space-y-4">
                                {course.modules && course.modules.length > 0 ? (
                                    course.modules.map((module, moduleIdx) => (
                                        <div key={module.moduleId} className="space-y-2">
                                            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                                <span className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent-primary)]">
                                                    {moduleIdx + 1}
                                                </span>
                                                {getLocalizedText(module.title)}
                                            </h3>
                                            <div className="pl-10 space-y-2">
                                                {module.lessons.map((lesson, lessonIdx) => (
                                                    <div key={lesson.lessonId} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer group">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                                                                {lessonIdx + 1}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-[var(--text-primary)]">{getLocalizedText(lesson.title)}</h4>
                                                                <p className="text-xs text-[var(--text-secondary)]">
                                                                    {lesson.type === 'video' ? '🎬 Video' : lesson.type === 'text' ? '📄 Text' : lesson.type === 'quiz' ? '❓ Quiz' : '📝 Assignment'}
                                                                    {lesson.duration > 0 && ` • ${lesson.duration} ${t('landing.course.minPerLesson')}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="p-2 rounded-full border border-[var(--border-primary)] text-[var(--text-tertiary)] group-hover:bg-[var(--accent-primary)] group-hover:border-[var(--accent-primary)] group-hover:text-white transition-all">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-[var(--text-secondary)]">
                                        <p>{t('courseCatalog.noCourses')}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="prose prose-invert max-w-none space-y-6">
                                <p className="text-[var(--text-secondary)] leading-relaxed">{getLocalizedText(course.description)}</p>

                                {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                                    <>
                                        <h3 className="text-[var(--text-primary)] font-bold mt-4">{t('landing.course.whatYouLearn')}</h3>
                                        <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-2">
                                            {course.learningOutcomes.map((outcome, idx) => (
                                                <li key={idx}>{getLocalizedText(outcome)}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                {course.prerequisites && course.prerequisites.length > 0 && (
                                    <>
                                        <h3 className="text-[var(--text-primary)] font-bold mt-4">Prerequisites</h3>
                                        <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-2">
                                            {course.prerequisites.map((prereq, idx) => (
                                                <li key={idx}>{prereq}</li>
                                            ))}
                                        </ul>
                                    </>
                                )}

                                {course.tags && course.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {course.tags.map((tag, idx) => (
                                            <span key={idx} className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Stats & Instructor (Sidebar) */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                    <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)]">
                        {/* Thumbnail */}
                        {course.thumbnail ? (
                            <img
                                src={course.thumbnail}
                                alt={getLocalizedText(course.title)}
                                className="w-full aspect-video rounded-lg object-cover mb-4 shadow-lg"
                            />
                        ) : (
                            <div className={`w-full aspect-video rounded-lg bg-gradient-to-br ${gradientColor} mb-4 flex items-center justify-center text-4xl shadow-lg`}>
                                {icon}
                            </div>
                        )}

                        {/* Price */}
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                {course.discount > 0 ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-[var(--accent-primary)]">{formatPrice(course.finalPrice)}</span>
                                        <span className="text-sm text-[var(--text-tertiary)] line-through">{formatPrice(course.price)}</span>
                                    </div>
                                ) : (
                                    <span className="text-2xl font-bold text-[var(--accent-primary)]">{formatPrice(course.price)}</span>
                                )}
                            </div>
                            <span className="px-2 py-1 text-xs font-bold bg-[var(--bg-secondary)] rounded border border-[var(--border-primary)]">
                                {t(levelKeys[course.level] || 'courseCatalog.levels.beginner')}
                            </span>
                        </div>

                        {/* Enroll Button */}
                        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)] font-bold shadow-lg shadow-[var(--accent-shadow)] hover:scale-105 transition-transform mb-4 flex items-center justify-center gap-2 group">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            {t('course.enroll')}
                        </button>

                        {/* Course Stats */}
                        <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                            <div className="flex justify-between border-b border-[var(--border-primary)] pb-2">
                                <span>{t('course.duration')}</span>
                                <span className="font-medium text-[var(--text-primary)]">{course.duration} {t('landing.course.hours')}</span>
                            </div>
                            <div className="flex justify-between border-b border-[var(--border-primary)] pb-2">
                                <span>{t('course.modules')}</span>
                                <span className="font-medium text-[var(--text-primary)]">{course.modules?.length || 0}</span>
                            </div>
                            <div className="flex justify-between border-b border-[var(--border-primary)] pb-2">
                                <span>{t('course.lessons')}</span>
                                <span className="font-medium text-[var(--text-primary)]">{course.totalLessons || 0}</span>
                            </div>
                            <div className="flex justify-between border-b border-[var(--border-primary)] pb-2">
                                <span>{t('landing.courses.enrolled')}</span>
                                <span className="font-medium text-[var(--text-primary)]">{course.enrolledCount}</span>
                            </div>
                            {course.rating > 0 && (
                                <div className="flex justify-between">
                                    <span>Rating</span>
                                    <span className="font-medium text-[var(--text-primary)] flex items-center gap-1">
                                        ⭐ {course.rating.toFixed(1)} ({course.reviewCount})
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Instructor Card */}
                    {course.instructor?.name && (
                        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)]">
                            <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-4">Instructor</h3>
                            <div className="flex items-center gap-4">
                                {course.instructor.avatar ? (
                                    <img src={course.instructor.avatar} alt={course.instructor.name} className="w-14 h-14 rounded-full object-cover" />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                        {course.instructor.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-[var(--text-primary)]">{course.instructor.name}</h4>
                                    {course.instructor.bio && (
                                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{course.instructor.bio}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CoursePage;
