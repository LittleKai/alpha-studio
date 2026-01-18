import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CourseViewer from '../components/viewers/CourseViewer';
import type { CourseData } from '../types';

// Static course data (same as in App.tsx - will be replaced with API calls later)
const staticCourses: CourseData[] = [
    {
        id: "ai-creative-event",
        title: "AI Creative for Event Design",
        tag: "Trending",
        description: "End-to-end process from brainstorming ideas, building moodboards to creating professional Key Visuals with Midjourney & Stable Diffusion.",
        duration: "16",
        lessonsCount: 14,
        progress: 0,
        icon: "✨",
        color: "from-purple-600 to-pink-500",
        syllabus: [
            { title: "Prompting Mindset for Event Concept", duration: "25:00" },
            { title: "Building Moodboard & Styleframe", duration: "45:00" },
            { title: "Developing Multi-channel Key Visual", duration: "60:00" },
            { title: "Inpainting Techniques for Extending Context", duration: "40:00" },
        ]
    },
    {
        id: "ai-pro-design",
        title: "AI Design Expert 2026",
        tag: "Pro Course",
        description: "Master Midjourney, Stable Diffusion and advanced in-painting techniques to create event Key Visuals in 30 seconds.",
        duration: "18",
        lessonsCount: 12,
        progress: 0,
        icon: "💎",
        color: "from-blue-600 to-cyan-500",
        syllabus: [
            { title: "Creative Thinking in AI Era", duration: "20:00" },
            { title: "Mastering Midjourney: Basic to Advanced", duration: "45:00" },
            { title: "Stable Diffusion: Control Every Pixel", duration: "60:00" },
            { title: "Integrating AI into Print Design Workflow", duration: "40:00" },
        ]
    },
    {
        id: "ai-motion-vfx",
        title: "Event Video & VFX with AI",
        tag: "Motion",
        description: "Transform static images into 3D cinematic films. Apply Runway Gen-3, Luma Dream Machine for LED screen visuals.",
        duration: "14",
        lessonsCount: 10,
        progress: 0,
        icon: "🎬",
        color: "from-cyan-500 to-blue-400",
        syllabus: [
            { title: "Video AI Overview: The Motion Revolution", duration: "15:00" },
            { title: "Luma Dream Machine: Surreal Motion", duration: "40:00" },
            { title: "Runway Gen-3: Direct with Words", duration: "50:00" },
        ]
    },
    {
        id: "ai-stage-lighting",
        title: "Stage & Lighting with AI",
        tag: "3D Stage",
        description: "Design 3D stage layouts, simulate lighting and fireworks effects professionally with AI only.",
        duration: "10",
        lessonsCount: 8,
        progress: 0,
        icon: "🎆",
        color: "from-blue-700 to-indigo-600",
        syllabus: [
            { title: "Creating 3D Stage Structures", duration: "30:00" },
            { title: "Simulating Dynamic Lighting Effects", duration: "45:00" },
            { title: "High-quality Rendering for Proposals", duration: "40:00" },
        ]
    }
];

const CoursePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<CourseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // For now, find course from static data
        // TODO: Replace with API call using getCourseBySlug
        const foundCourse = staticCourses.find(c => c.id === slug);

        if (foundCourse) {
            setCourse(foundCourse);
            setError(null);
        } else {
            setError('Course not found');
        }
        setLoading(false);
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                    <p className="text-[var(--text-secondary)]">Loading course...</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Course Not Found</h2>
                    <p className="text-[var(--text-secondary)]">{error || 'The course you are looking for does not exist.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:scale-105 transition-all"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    return <CourseViewer course={course} onBack={() => navigate('/')} />;
};

export default CoursePage;
