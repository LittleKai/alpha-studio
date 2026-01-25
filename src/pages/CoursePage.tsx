import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import {
    getCourseBySlug,
    Course,
    Lesson,
    checkEnrollment,
    enrollInCourse,
    getEnrollmentProgress,
    updateLessonProgress,
    EnrollmentProgress,
    LessonProgress,
    getCourseReviews,
    createReview,
    Review,
    getMyReview,
    markReviewHelpful
} from '../services/courseService';

// Declare YouTube Player types
declare global {
    interface Window {
        YT: {
            Player: new (elementId: string, config: {
                videoId: string;
                playerVars?: Record<string, number | string>;
                events?: {
                    onReady?: (event: { target: YTPlayer }) => void;
                    onStateChange?: (event: { data: number }) => void;
                };
            }) => YTPlayer;
            PlayerState: {
                ENDED: number;
                PLAYING: number;
                PAUSED: number;
            };
        };
        onYouTubeIframeAPIReady: () => void;
    }
}

interface YTPlayer {
    getCurrentTime: () => number;
    getDuration: () => number;
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
    playVideo: () => void;
    pauseVideo: () => void;
    destroy: () => void;
}

// Helper to extract YouTube video ID
const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Category mappings
const categoryGradients: Record<string, string> = {
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

const levelKeys: Record<string, string> = {
    'beginner': 'courseCatalog.levels.beginner',
    'intermediate': 'courseCatalog.levels.intermediate',
    'advanced': 'courseCatalog.levels.advanced'
};

const CoursePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const { isAuthenticated, user } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const youtubePlayerRef = useRef<YTPlayer | null>(null);
    const youtubeContainerRef = useRef<HTMLDivElement>(null);
    const [ytApiReady, setYtApiReady] = useState(false);

    // Course state
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Enrollment state
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrollmentProgress, setEnrollmentProgress] = useState<EnrollmentProgress | null>(null);
    const [enrolling, setEnrolling] = useState(false);

    // Lesson state
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');
    const [selectedLessonId, setSelectedLessonId] = useState<string>('');
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

    // UI state
    const [activeTab, setActiveTab] = useState<'syllabus' | 'overview' | 'reviews'>('syllabus');
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    // Review state
    const [reviews, setReviews] = useState<Review[]>([]);
    const [ratingDistribution, setRatingDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    const [myReview, setMyReview] = useState<Review | null>(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [showReviewsDialog, setShowReviewsDialog] = useState(false);

    // Helpers
    const getLocalizedText = (text: { vi: string; en: string } | undefined) => {
        if (!text) return '';
        return language === 'vi' ? text.vi : text.en;
    };

    const formatPrice = (price: number) => {
        if (price === 0) return t('courseCatalog.free');
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Check if lesson is completed
    const isLessonCompleted = useCallback((lessonId: string) => {
        if (!enrollmentProgress) return false;
        return enrollmentProgress.completedLessons.some(l => l.lessonId === lessonId && l.completed);
    }, [enrollmentProgress]);

    // Get lesson progress
    const getLessonProgress = useCallback((lessonId: string): LessonProgress | undefined => {
        if (!enrollmentProgress) return undefined;
        return enrollmentProgress.completedLessons.find(l => l.lessonId === lessonId);
    }, [enrollmentProgress]);

    // Fetch course data
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

                // Expand all modules by default
                if (courseData.modules) {
                    setExpandedModules(new Set(courseData.modules.map(m => m.moduleId)));
                }
            } catch (err) {
                console.error('Failed to fetch course:', err);
                setError(err instanceof Error ? err.message : 'Course not found');
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [slug]);

    // Check enrollment status
    useEffect(() => {
        const checkEnrollmentStatus = async () => {
            if (!isAuthenticated || !course) return;

            try {
                const result = await checkEnrollment(course._id);
                setIsEnrolled(result.enrolled);

                if (result.enrolled) {
                    const progress = await getEnrollmentProgress(course._id);
                    setEnrollmentProgress(progress);

                    // Set initial lesson from progress
                    if (progress.currentLesson.moduleId && progress.currentLesson.lessonId) {
                        setSelectedModuleId(progress.currentLesson.moduleId);
                        setSelectedLessonId(progress.currentLesson.lessonId);
                    } else if (course.modules && course.modules.length > 0) {
                        const firstModule = course.modules[0];
                        if (firstModule.lessons && firstModule.lessons.length > 0) {
                            setSelectedModuleId(firstModule.moduleId);
                            setSelectedLessonId(firstModule.lessons[0].lessonId);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to check enrollment:', err);
            }
        };

        checkEnrollmentStatus();
    }, [isAuthenticated, course]);

    // Update selected lesson when IDs change
    useEffect(() => {
        if (!course || !selectedModuleId || !selectedLessonId) {
            setSelectedLesson(null);
            return;
        }

        const module = course.modules?.find(m => m.moduleId === selectedModuleId);
        if (module) {
            const lesson = module.lessons.find(l => l.lessonId === selectedLessonId);
            setSelectedLesson(lesson || null);
        }
    }, [course, selectedModuleId, selectedLessonId]);

    // Load YouTube IFrame API
    useEffect(() => {
        if (window.YT && window.YT.Player) {
            setYtApiReady(true);
            return;
        }

        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            setYtApiReady(true);
        };

        return () => {
            window.onYouTubeIframeAPIReady = () => {};
        };
    }, []);

    // Handle video end - defined before YouTube player useEffect
    const handleVideoEnded = useCallback(async () => {
        if (!course || !selectedLessonId) return;
        try {
            const progress = await updateLessonProgress(course._id, {
                lessonId: selectedLessonId,
                moduleId: selectedModuleId,
                completed: true
            });
            setEnrollmentProgress(progress);
        } catch (err) {
            console.error('Failed to mark lesson complete:', err);
        }
    }, [course, selectedLessonId, selectedModuleId]);

    // Initialize YouTube player when lesson changes
    useEffect(() => {
        // Cleanup previous player
        if (youtubePlayerRef.current) {
            try {
                youtubePlayerRef.current.destroy();
            } catch (e) {
                console.error('Error destroying YouTube player:', e);
            }
            youtubePlayerRef.current = null;
        }

        if (!ytApiReady || !selectedLesson?.videoUrl) return;

        const videoUrl = selectedLesson.videoUrl;
        const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

        if (!isYouTube) return;

        const videoId = getYouTubeVideoId(videoUrl);
        if (!videoId) return;

        // Wait a bit for the container to be ready
        setTimeout(() => {
            if (!youtubeContainerRef.current) return;

            try {
                youtubePlayerRef.current = new window.YT.Player('youtube-player', {
                    videoId,
                    playerVars: {
                        autoplay: 0,
                        controls: 1,
                        rel: 0,
                        modestbranding: 1,
                    },
                    events: {
                        onStateChange: (event) => {
                            if (event.data === window.YT.PlayerState.ENDED) {
                                handleVideoEnded();
                            }
                        },
                    },
                });
            } catch (e) {
                console.error('Error creating YouTube player:', e);
            }
        }, 100);

        return () => {
            if (youtubePlayerRef.current) {
                try {
                    youtubePlayerRef.current.destroy();
                } catch (e) {
                    console.error('Error destroying YouTube player:', e);
                }
                youtubePlayerRef.current = null;
            }
        };
    }, [ytApiReady, selectedLesson?.videoUrl, selectedLesson?.lessonId, handleVideoEnded]);

    // Skip forward/backward functions
    const handleSkipYouTube = useCallback((seconds: number) => {
        if (!youtubePlayerRef.current) return;
        try {
            const currentTime = youtubePlayerRef.current.getCurrentTime();
            const duration = youtubePlayerRef.current.getDuration();
            const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
            youtubePlayerRef.current.seekTo(newTime, true);
        } catch (e) {
            console.error('Error seeking YouTube video:', e);
        }
    }, []);

    const handleSkipVideo = useCallback((seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
        }
    }, []);

    // Fetch reviews
    useEffect(() => {
        const fetchReviews = async () => {
            if (!course) return;

            try {
                setReviewsLoading(true);
                const response = await getCourseReviews(course._id);
                setReviews(response.data);
                setRatingDistribution(response.ratingDistribution);

                if (isAuthenticated) {
                    const myReviewData = await getMyReview(course._id);
                    setMyReview(myReviewData);
                }
            } catch (err) {
                console.error('Failed to fetch reviews:', err);
            } finally {
                setReviewsLoading(false);
            }
        };

        if (activeTab === 'reviews' || showReviewsDialog) {
            fetchReviews();
        }
    }, [course, activeTab, isAuthenticated, showReviewsDialog]);

    // Handle enrollment
    const handleEnroll = async () => {
        if (!isAuthenticated) {
            // Trigger login modal
            return;
        }

        if (!course) return;

        try {
            setEnrolling(true);
            await enrollInCourse(course._id);
            setIsEnrolled(true);

            const progress = await getEnrollmentProgress(course._id);
            setEnrollmentProgress(progress);

            // Set first lesson
            if (course.modules && course.modules.length > 0) {
                const firstModule = course.modules[0];
                if (firstModule.lessons && firstModule.lessons.length > 0) {
                    setSelectedModuleId(firstModule.moduleId);
                    setSelectedLessonId(firstModule.lessons[0].lessonId);
                }
            }
        } catch (err) {
            console.error('Failed to enroll:', err);
            alert(err instanceof Error ? err.message : 'Failed to enroll');
        } finally {
            setEnrolling(false);
        }
    };

    // Handle lesson selection
    const handleSelectLesson = async (moduleId: string, lessonId: string) => {
        if (!isEnrolled) return;

        setSelectedModuleId(moduleId);
        setSelectedLessonId(lessonId);

        // Update current lesson in backend
        if (course) {
            try {
                await updateLessonProgress(course._id, {
                    lessonId,
                    moduleId
                });
            } catch (err) {
                console.error('Failed to update current lesson:', err);
            }
        }
    };

    // Handle lesson completion
    const handleMarkComplete = async () => {
        if (!course || !selectedLessonId) return;

        try {
            const progress = await updateLessonProgress(course._id, {
                lessonId: selectedLessonId,
                moduleId: selectedModuleId,
                completed: true
            });
            setEnrollmentProgress(progress);
        } catch (err) {
            console.error('Failed to mark lesson complete:', err);
        }
    };

    // Handle video progress
    const handleVideoTimeUpdate = async () => {
        if (!videoRef.current || !course || !selectedLessonId) return;

        const video = videoRef.current;
        const watchedDuration = Math.floor(video.currentTime);
        const lastPosition = Math.floor(video.currentTime);

        // Only update every 10 seconds to avoid too many requests
        if (watchedDuration % 10 === 0) {
            try {
                await updateLessonProgress(course._id, {
                    lessonId: selectedLessonId,
                    watchedDuration,
                    lastPosition
                });
            } catch (err) {
                console.error('Failed to update video progress:', err);
            }
        }
    };

    // Handle review submission
    const handleSubmitReview = async () => {
        if (!course || !reviewComment.trim()) return;

        try {
            setSubmittingReview(true);
            const review = await createReview(course._id, {
                rating: reviewRating,
                comment: reviewComment
            });
            setReviews([review, ...reviews]);
            setMyReview(review);
            setReviewComment('');
        } catch (err) {
            console.error('Failed to submit review:', err);
            alert(err instanceof Error ? err.message : 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Handle mark helpful
    const handleMarkHelpful = async (reviewId: string) => {
        if (!isAuthenticated) return;

        try {
            const result = await markReviewHelpful(reviewId);
            setReviews(reviews.map(r =>
                r._id === reviewId
                    ? { ...r, helpful: { ...r.helpful, count: result.helpfulCount } }
                    : r
            ));
        } catch (err) {
            console.error('Failed to mark helpful:', err);
        }
    };

    // Toggle module expansion
    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    // Loading state
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

    // Error state
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
            {/* Header - Always visible */}
            <header className="sticky top-0 z-40 glass-card border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-4 py-3 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-lg md:text-xl font-bold truncate flex-1">{getLocalizedText(course.title)}</h1>
                    {isEnrolled && enrollmentProgress && (
                        <div className="hidden md:flex items-center gap-2 text-sm">
                            <span className="text-[var(--text-secondary)]">{enrollmentProgress.progress}%</span>
                            <div className="w-24 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--accent-primary)] rounded-full transition-all"
                                    style={{ width: `${enrollmentProgress.progress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 animate-fade-in">
                {/* Left Column: Video Player & Main Content */}
                <div className="flex-1 flex flex-col gap-6">
                    {/* Video Player / Thumbnail Area */}
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-[var(--border-primary)] shadow-2xl bg-black group">
                        {isEnrolled && selectedLesson?.type === 'video' && selectedLesson?.videoUrl ? (
                            <>
                                {/* Check if it's a YouTube/Vimeo URL */}
                                {selectedLesson.videoUrl.includes('youtube.com') || selectedLesson.videoUrl.includes('youtu.be') ? (
                                    <div ref={youtubeContainerRef} className="w-full h-full">
                                        <div id="youtube-player" className="w-full h-full"></div>
                                    </div>
                                ) : selectedLesson.videoUrl.includes('vimeo.com') ? (
                                    <iframe
                                        src={selectedLesson.videoUrl.replace('vimeo.com', 'player.vimeo.com/video')}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <video
                                        ref={videoRef}
                                        key={selectedLesson.videoUrl}
                                        src={selectedLesson.videoUrl}
                                        controls
                                        controlsList="nodownload"
                                        playsInline
                                        preload="metadata"
                                        className="w-full h-full object-contain relative z-10"
                                        onTimeUpdate={handleVideoTimeUpdate}
                                        onEnded={handleVideoEnded}
                                        onError={(e) => console.error('Video error:', e)}
                                    >
                                        <source src={selectedLesson.videoUrl} type="video/mp4" />
                                        <source src={selectedLesson.videoUrl} type="video/webm" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                                {/* Lesson info overlay - pointer-events-none to not block video controls */}
                                <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur rounded-lg text-white text-sm pointer-events-none z-20">
                                    {getLocalizedText(selectedLesson.title)}
                                </div>
                                {/* Skip buttons overlay - for all videos except Vimeo */}
                                {!selectedLesson.videoUrl.includes('vimeo') && (
                                    <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-4 pointer-events-none z-30">
                                        <button
                                            onClick={() => {
                                                if (selectedLesson.videoUrl?.includes('youtube') || selectedLesson.videoUrl?.includes('youtu.be')) {
                                                    handleSkipYouTube(-10);
                                                } else {
                                                    handleSkipVideo(-10);
                                                }
                                            }}
                                            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-black/70"
                                            title="-10s"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                                            </svg>
                                            <span className="absolute -bottom-5 text-xs">10s</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedLesson.videoUrl?.includes('youtube') || selectedLesson.videoUrl?.includes('youtu.be')) {
                                                    handleSkipYouTube(10);
                                                } else {
                                                    handleSkipVideo(10);
                                                }
                                            }}
                                            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto hover:bg-black/70"
                                            title="+10s"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                                            </svg>
                                            <span className="absolute -bottom-5 text-xs">10s</span>
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
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
                                {!isEnrolled && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <button
                                            onClick={handleEnroll}
                                            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:scale-110 transition-transform"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Video Controls Bar - Outside video for better accessibility */}
                    {isEnrolled && selectedLesson && (
                        <div className="flex items-center justify-between glass-card rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-[var(--text-primary)]">{getLocalizedText(selectedLesson.title)}</span>
                                {selectedLesson.type === 'video' && selectedLesson.videoUrl && !selectedLesson.videoUrl.includes('vimeo') && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                if (selectedLesson.videoUrl?.includes('youtube') || selectedLesson.videoUrl?.includes('youtu.be')) {
                                                    handleSkipYouTube(-10);
                                                } else {
                                                    handleSkipVideo(-10);
                                                }
                                            }}
                                            className="px-2 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded text-xs text-[var(--text-secondary)] transition-colors"
                                        >
                                            -10s
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (selectedLesson.videoUrl?.includes('youtube') || selectedLesson.videoUrl?.includes('youtu.be')) {
                                                    handleSkipYouTube(10);
                                                } else {
                                                    handleSkipVideo(10);
                                                }
                                            }}
                                            className="px-2 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded text-xs text-[var(--text-secondary)] transition-colors"
                                        >
                                            +10s
                                        </button>
                                    </div>
                                )}
                            </div>
                            {isLessonCompleted(selectedLesson.lessonId) ? (
                                <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-lg text-xs font-medium">{t('course.completed')}</span>
                            ) : (
                                <button
                                    onClick={handleMarkComplete}
                                    className="px-3 py-1 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
                                >
                                    {t('course.markComplete')}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Documents for selected lesson */}
                    {isEnrolled && selectedLesson && selectedLesson.documents && selectedLesson.documents.length > 0 && (
                        <div className="glass-card rounded-xl p-4">
                            <h4 className="font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                                {t('course.documents')}
                            </h4>
                            <div className="space-y-2">
                                {selectedLesson.documents.map((doc, idx) => (
                                    <a
                                        key={idx}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download
                                        className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--accent-primary)]" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium text-[var(--text-primary)]">{doc.name}</p>
                                                <p className="text-xs text-[var(--text-tertiary)]">{doc.type.toUpperCase()} • {formatFileSize(doc.size)}</p>
                                            </div>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] transition-colors" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div>
                        <div className="flex gap-6 border-b border-[var(--border-primary)] mb-4">
                            {(['syllabus', 'overview', 'reviews'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-2 text-sm font-semibold transition-colors relative ${
                                        activeTab === tab
                                            ? 'text-[var(--accent-primary)]'
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    {tab === 'syllabus' && t('course.curriculum')}
                                    {tab === 'overview' && t('landing.course.overview')}
                                    {tab === 'reviews' && `${t('course.reviews')} (${course.reviewCount})`}
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--accent-primary)]"></div>}
                                </button>
                            ))}
                        </div>

                        {/* Syllabus Tab */}
                        {activeTab === 'syllabus' && (
                            <div className="space-y-4">
                                {course.modules && course.modules.length > 0 ? (
                                    course.modules.map((module, moduleIdx) => (
                                        <div key={module.moduleId} className="glass-card rounded-xl overflow-hidden">
                                            {/* Module Header */}
                                            <button
                                                onClick={() => toggleModule(module.moduleId)}
                                                className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent-primary)]">
                                                        {moduleIdx + 1}
                                                    </span>
                                                    <span className="font-bold text-[var(--text-primary)]">
                                                        {getLocalizedText(module.title)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-[var(--text-tertiary)]">
                                                        {module.lessons.length} {t('course.lessons')}
                                                    </span>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className={`h-5 w-5 text-[var(--text-tertiary)] transition-transform ${expandedModules.has(module.moduleId) ? 'rotate-180' : ''}`}
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </button>

                                            {/* Lessons */}
                                            {expandedModules.has(module.moduleId) && (
                                                <div className="border-t border-[var(--border-primary)]">
                                                    {module.lessons.map((lesson, lessonIdx) => {
                                                        const isSelected = selectedLessonId === lesson.lessonId;
                                                        const isCompleted = isLessonCompleted(lesson.lessonId);

                                                        return (
                                                            <div
                                                                key={lesson.lessonId}
                                                                onClick={() => isEnrolled && handleSelectLesson(module.moduleId, lesson.lessonId)}
                                                                className={`flex items-center justify-between p-4 border-b border-[var(--border-primary)] last:border-b-0 transition-colors ${
                                                                    isEnrolled ? 'cursor-pointer hover:bg-[var(--bg-secondary)]' : 'cursor-not-allowed opacity-60'
                                                                } ${isSelected ? 'bg-[var(--accent-primary)]/10' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-4">
                                                                    {/* Completion indicator */}
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                                        isCompleted
                                                                            ? 'bg-green-500 text-white'
                                                                            : isSelected
                                                                                ? 'bg-[var(--accent-primary)] text-white'
                                                                                : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
                                                                    }`}>
                                                                        {isCompleted ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                        ) : (
                                                                            lessonIdx + 1
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className={`font-medium ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                                                                            {getLocalizedText(lesson.title)}
                                                                        </h4>
                                                                        <p className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                                                                            {lesson.type === 'video' ? '🎬 Video' : lesson.type === 'text' ? '📄 Text' : lesson.type === 'quiz' ? '❓ Quiz' : '📝 Assignment'}
                                                                            {lesson.duration > 0 && ` • ${lesson.duration} ${t('landing.course.minPerLesson')}`}
                                                                            {lesson.documents && lesson.documents.length > 0 && (
                                                                                <span className="text-[var(--accent-primary)]">• 📎 {lesson.documents.length}</span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {!isEnrolled && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-tertiary)]" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-[var(--text-secondary)]">
                                        <p>{t('courseCatalog.noCourses')}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
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

                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <div className="space-y-6">
                                {/* Rating Summary */}
                                <div className="glass-card rounded-xl p-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="text-center">
                                            <div className="text-5xl font-bold text-[var(--text-primary)]">{course.rating.toFixed(1)}</div>
                                            <div className="flex items-center justify-center gap-1 my-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <span key={star} className={star <= Math.round(course.rating) ? 'text-yellow-500' : 'text-gray-600'}>★</span>
                                                ))}
                                            </div>
                                            <p className="text-sm text-[var(--text-secondary)]">{course.reviewCount} {t('course.reviews')}</p>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {[5, 4, 3, 2, 1].map(star => {
                                                const count = ratingDistribution[star] || 0;
                                                const percentage = course.reviewCount > 0 ? (count / course.reviewCount) * 100 : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-2">
                                                        <span className="text-sm w-3">{star}</span>
                                                        <span className="text-yellow-500">★</span>
                                                        <div className="flex-1 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${percentage}%` }} />
                                                        </div>
                                                        <span className="text-sm text-[var(--text-tertiary)] w-8">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Write Review (if enrolled and no existing review) */}
                                {isAuthenticated && isEnrolled && !myReview && (
                                    <div className="glass-card rounded-xl p-6">
                                        <h4 className="font-bold text-[var(--text-primary)] mb-4">{t('course.writeReview')}</h4>
                                        <div className="space-y-4">
                                            {/* Rating */}
                                            <div className="flex items-center gap-2">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <button
                                                        key={star}
                                                        onClick={() => setReviewRating(star)}
                                                        className={`text-2xl transition-colors ${star <= reviewRating ? 'text-yellow-500' : 'text-gray-600 hover:text-yellow-400'}`}
                                                    >
                                                        ★
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Comment */}
                                            <textarea
                                                value={reviewComment}
                                                onChange={(e) => setReviewComment(e.target.value)}
                                                placeholder={t('course.reviewPlaceholder')}
                                                rows={4}
                                                className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                                            />
                                            <button
                                                onClick={handleSubmitReview}
                                                disabled={submittingReview || !reviewComment.trim()}
                                                className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                            >
                                                {submittingReview ? t('common.loading') : t('course.submitReview')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Reviews List */}
                                {reviewsLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-8 h-8 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                                    </div>
                                ) : reviews.length === 0 ? (
                                    <div className="text-center py-8 text-[var(--text-secondary)]">
                                        {t('course.noReviews')}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {reviews.map(review => (
                                            <div key={review._id} className="glass-card rounded-xl p-6">
                                                <div className="flex items-start gap-4">
                                                    {review.user.avatar ? (
                                                        <img src={review.user.avatar} alt={review.user.name} className="w-12 h-12 rounded-full object-cover" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white font-bold">
                                                            {review.user.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h5 className="font-medium text-[var(--text-primary)]">{review.user.name}</h5>
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <div className="flex">
                                                                        {[1, 2, 3, 4, 5].map(star => (
                                                                            <span key={star} className={star <= review.rating ? 'text-yellow-500' : 'text-gray-600'}>★</span>
                                                                        ))}
                                                                    </div>
                                                                    {review.isVerifiedPurchase && (
                                                                        <span className="text-green-500 text-xs">{t('course.verifiedPurchase')}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-sm text-[var(--text-tertiary)]">
                                                                {new Date(review.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-[var(--text-secondary)]">{review.comment}</p>
                                                        {review.reply?.content && (
                                                            <div className="mt-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                                                                <p className="text-sm text-[var(--text-secondary)]">
                                                                    <span className="font-medium text-[var(--accent-primary)]">{t('course.instructorReply')}: </span>
                                                                    {review.reply.content}
                                                                </p>
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => handleMarkHelpful(review._id)}
                                                            className="mt-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center gap-1"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                                            </svg>
                                                            {t('course.helpful')} ({review.helpful.count})
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Stats & Enrollment (Sidebar) */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                    <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)] lg:sticky lg:top-24">
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

                        {/* Enroll / Continue Button */}
                        {isEnrolled ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-[var(--bg-secondary)] rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-[var(--text-secondary)]">{t('course.progress')}</span>
                                        <span className="font-bold text-[var(--accent-primary)]">{enrollmentProgress?.progress || 0}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--accent-primary)] rounded-full transition-all"
                                            style={{ width: `${enrollmentProgress?.progress || 0}%` }}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => selectedLesson && handleSelectLesson(selectedModuleId, selectedLessonId)}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)] font-bold shadow-lg shadow-[var(--accent-shadow)] hover:scale-105 transition-transform flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                    {t('course.continue')}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleEnroll}
                                disabled={enrolling}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)] font-bold shadow-lg shadow-[var(--accent-shadow)] hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {enrolling ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                )}
                                {course.finalPrice > 0 ? t('course.buyNow') : t('course.enrollFree')}
                            </button>
                        )}

                        {/* Course Stats */}
                        <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
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
                            <div className="flex justify-between border-b border-[var(--border-primary)] pb-2">
                                <span>Rating</span>
                                <span className="font-medium text-[var(--text-primary)] flex items-center gap-1">
                                    {course.rating > 0 ? (
                                        <>⭐ {course.rating.toFixed(1)} ({course.reviewCount})</>
                                    ) : (
                                        <span className="text-[var(--text-tertiary)]">{t('course.noReviews')}</span>
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* View Reviews Button */}
                        <button
                            onClick={() => setShowReviewsDialog(true)}
                            className="w-full mt-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)] transition-all flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {t('course.viewReviews')} ({course.reviewCount})
                        </button>
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

            {/* Reviews Dialog */}
            {showReviewsDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowReviewsDialog(false)}
                    />
                    <div className="relative w-full max-w-2xl max-h-[80vh] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Dialog Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
                            <div>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">{t('course.reviews')}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-2xl font-bold text-[var(--accent-primary)]">{course.rating.toFixed(1)}</span>
                                    <div className="flex">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} className={star <= Math.round(course.rating) ? 'text-yellow-500' : 'text-gray-600'}>★</span>
                                        ))}
                                    </div>
                                    <span className="text-sm text-[var(--text-secondary)]">({course.reviewCount} {t('course.reviews')})</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReviewsDialog(false)}
                                className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Dialog Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {reviewsLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="w-8 h-8 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="text-center py-8 text-[var(--text-secondary)]">
                                    {t('course.noReviews')}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {reviews.map(review => (
                                        <div key={review._id} className="p-4 bg-[var(--bg-secondary)] rounded-xl">
                                            <div className="flex items-start gap-3">
                                                {review.user.avatar ? (
                                                    <img src={review.user.avatar} alt={review.user.name} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                        {review.user.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h5 className="font-medium text-[var(--text-primary)] text-sm">{review.user.name}</h5>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex text-sm">
                                                                    {[1, 2, 3, 4, 5].map(star => (
                                                                        <span key={star} className={star <= review.rating ? 'text-yellow-500' : 'text-gray-600'}>★</span>
                                                                    ))}
                                                                </div>
                                                                {review.isVerifiedPurchase && (
                                                                    <span className="text-green-500 text-xs">{t('course.verifiedPurchase')}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-[var(--text-tertiary)]">
                                                            {new Date(review.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{review.comment}</p>
                                                    {review.reply?.content && (
                                                        <div className="mt-2 p-2 bg-[var(--bg-tertiary)] rounded-lg">
                                                            <p className="text-xs text-[var(--text-secondary)]">
                                                                <span className="font-medium text-[var(--accent-primary)]">{t('course.instructorReply')}: </span>
                                                                {review.reply.content}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Dialog Footer */}
                        <div className="p-4 border-t border-[var(--border-primary)]">
                            <button
                                onClick={() => {
                                    setShowReviewsDialog(false);
                                    setActiveTab('reviews');
                                }}
                                className="w-full py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-xl font-medium hover:opacity-90 transition-opacity"
                            >
                                {t('course.writeReview')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursePage;
