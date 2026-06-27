import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';
import { useAuth } from '../auth/context';
import { useTheme } from '../theme/context';
import type { FeaturedStudent } from '../types';
import Login from '../components/ui/Login';
import { getFeaturedCourses, Course } from '../services/courseService';
import { getPartners } from '../services/partnerService';
import type { Partner } from '../services/partnerService';
import { getFeaturedStudents } from '../services/featuredStudentsService';
import { motion } from 'framer-motion';
import Reveal, { RevealItem } from '../components/motion/Reveal';
import HoverSpring from '../components/motion/HoverSpring';
import TextReveal from '../components/motion/TextReveal';
import { ToolShowcaseCard } from '../components/studio/ToolShowcaseCard';



// Category to style mapping (Neon Terminal / Restrained strategy)
const categoryGradients: Record<string, string> = {
    'ai-basic': 'bg-green-950/40 text-green-400 border border-green-500/20',
    'ai-advanced': 'bg-purple-950/40 text-purple-400 border border-purple-500/20',
    'ai-studio': 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20',
    'ai-creative': 'bg-orange-950/40 text-orange-400 border border-orange-500/20'
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

interface WorkflowMapProps {
    t: (key: string) => string;
    theme: string;
}

const WorkflowMap: React.FC<WorkflowMapProps> = ({ t, theme }) => {
    const { language } = useTranslation();
    const isLight = theme === 'light';

    return (
        <div className="relative w-full max-w-[480px] h-[620px] flex items-center justify-center select-none">
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes dash-flow {
                    to {
                        stroke-dashoffset: -20;
                    }
                }
                .animate-dash {
                    stroke-dasharray: 6, 4;
                    animation: dash-flow 0.8s linear infinite;
                }
                .animate-dash-reverse {
                    stroke-dasharray: 6, 4;
                    animation: dash-flow 0.8s linear infinite reverse;
                }
            `}} />
            
            {/* SVG Background Lines - 10 connection lines mirroring example.png (Height 620px) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 480 620" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Top Network Lines */}
                <path d="M240 187 L 240 10" stroke={isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.45)"} strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash-reverse" />
                <path d="M240 187 C 160 187, 77 165, 77 132 L 37 10" stroke={isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.45)"} strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash" />
                <path d="M240 187 C 320 187, 403 165, 403 132 L 443 10" stroke={isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.45)"} strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash-reverse" />
                
                {/* Bottom Network Lines */}
                <path d="M240 433 L 240 610" stroke={isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.45)"} strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash" />
                <path d="M240 433 C 160 433, 77 455, 77 488 L 37 610" stroke={isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.45)"} strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash-reverse" />
                <path d="M240 433 C 320 433, 403 455, 403 488 L 443 610" stroke={isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.45)"} strokeWidth="1.5" strokeDasharray="4 4" className="animate-dash" />
            </svg>

            {/* Top Network - (+) Connect Button */}
            <div className={`absolute top-[185px] lg:top-[175px] left-[190px] w-[100px] h-[24px] rounded-full border flex items-center justify-center gap-1 shadow-sm z-20 transition-all duration-300 ${
                isLight ? 'bg-white border-stone-200/80 text-stone-800' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-3 h-3 text-indigo-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-wider">{t('landing.hero.workflow.btn.connect')}</span>
            </div>

            {/* Bottom Network - (+) Sync Button */}
            <div className={`absolute bottom-[185px] lg:bottom-[175px] left-[190px] w-[100px] h-[24px] rounded-full border flex items-center justify-center gap-1 shadow-sm z-20 transition-all duration-300 ${
                isLight ? 'bg-white border-stone-200/80 text-stone-800' : 'bg-slate-900 border-slate-800 text-white'
            }`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="w-3 h-3 text-emerald-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <span className="text-[10px] font-black uppercase tracking-wider">{t('landing.hero.workflow.btn.sync')}</span>
            </div>

            {/* Top Node Icons - Symmetrical Layout (Height 620px optimized) */}
            {/* Node 1: GPU Server (Top Left - Top) - Official NVIDIA green logo */}
            <div className="absolute top-[15px] left-[15px] w-11 h-11 rounded-full bg-white border border-stone-200/80 shadow-md flex items-center justify-center overflow-hidden hover:scale-110 transition-transform duration-300 z-10" title={t('landing.hero.workflow.node.nvidia')}>
                <img src="/nvidia-logo.jpg" alt="NVIDIA" className="w-8 h-8 object-contain" />
            </div>
            {/* Node 2: B2 Storage (Top Left - Middle) - Backblaze Red-Orange Flame */}
            <div className="absolute top-[110px] left-[55px] w-11 h-11 rounded-full bg-white border border-stone-200/80 shadow-md flex items-center justify-center overflow-hidden hover:scale-110 transition-transform duration-300 z-10" title={t('landing.hero.workflow.node.b2')}>
                <img src="/b2-logo.png" alt="Backblaze B2" className="w-8 h-8 object-contain" />
            </div>
            {/* Node 3: AI Generator (Top Center) - AI Generator Logo */}
            <div className="absolute top-[40px] left-[218px] w-11 h-11 rounded-full bg-white border border-stone-200/80 shadow-md flex items-center justify-center overflow-hidden hover:scale-110 transition-transform duration-300 z-10" title={t('landing.hero.workflow.node.generator')}>
                <img src="/ai-generator.webp" alt="AI Generator" className="w-8 h-8 object-contain" />
            </div>
            {/* Node 4: Google Labs (Top Right - Middle) - Google Labs Flask */}
            <div className="absolute top-[110px] right-[55px] w-11 h-11 rounded-full bg-white border border-stone-200/80 shadow-md flex items-center justify-center overflow-hidden hover:scale-110 transition-transform duration-300 z-10" title={t('landing.hero.workflow.node.labs')}>
                <img src="/google-labs.svg" alt="Google Labs" className="w-8 h-8 object-contain" />
            </div>
            {/* Node 5: TinyMCE Docs (Top Right - Top) - TinyMCE Green Symbol */}
            <div className="absolute top-[15px] right-[15px] w-11 h-11 rounded-full bg-emerald-50 border border-emerald-200 shadow-md flex items-center justify-center hover:scale-110 transition-transform duration-300 z-10" title={t('landing.hero.workflow.node.tinymce')}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#22c55e]">
                    <path d="M7 6h10v3h-3.5v9h-3v-9H7V6z" fill="currentColor" />
                    <circle cx="17" cy="18" r="2.5" fill="currentColor" />
                </svg>
            </div>

            {/* Center Core AI Card - Redesigned to look like a premium SaaS dashboard workflow list with adaptive theme colors, color accents, no Gemini 2.5 Pro subtext and larger text sizes */}
            <div className={`z-10 rounded-2xl border p-5 w-[340px] flex flex-col gap-4 transition-all duration-300 ${
                isLight 
                    ? 'bg-gradient-to-br from-white via-[#fcfbfa] to-[#f8f6f2] border-stone-200/80 shadow-xl' 
                    : 'bg-gradient-to-br from-slate-900 via-slate-900/98 to-indigo-950/30 border-slate-800 shadow-2xl backdrop-blur-md'
            }`}>
                <div className={`flex justify-between items-center pb-2.5 border-b ${isLight ? 'border-stone-100' : 'border-slate-800'}`}>
                    <div className="flex flex-col">
                        <span className={`text-xs md:text-sm font-extrabold uppercase tracking-wide ${isLight ? 'text-stone-800' : 'text-slate-100'}`}>
                            {t('landing.hero.workflow.workspace')}
                        </span>
                        <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-stone-400' : 'text-white'}`}>
                            {t('landing.hero.workflow.subworkspace')}
                        </span>
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer">
                        {t('landing.hero.workflow.btn.newFlow')}
                    </button>
                </div>
                
                {/* Micro Table */}
                <div className="space-y-3">
                    {/* Header line */}
                    <div className={`flex text-[9px] md:text-[10px] font-bold uppercase tracking-wider px-1 ${isLight ? 'text-stone-400' : 'text-white'}`}>
                        <div className="w-[140px]">{t('landing.hero.workflow.header.name')}</div>
                        <div className="w-[80px] text-center">{t('landing.hero.workflow.header.status')}</div>
                        <div className="w-[80px] text-right">{t('landing.hero.workflow.header.integrations')}</div>
                    </div>

                    {/* Row 1 - Language Model (Purple Border Accent) */}
                    <div className={`flex items-center text-xs font-semibold p-2 rounded-lg border transition-colors ${
                        isLight 
                            ? 'bg-purple-50/20 border-purple-100 hover:bg-purple-50/50 text-stone-700' 
                            : 'bg-purple-950/5 border-purple-900/30 hover:bg-purple-950/15 text-slate-200'
                    }`}>
                        <div className="w-[140px] flex flex-col">
                            <span className={`font-bold text-xs md:text-[13px] ${isLight ? 'text-stone-800' : 'text-slate-100'}`}>
                                {t('landing.hero.workflow.task1.title')}
                            </span>
                        </div>
                        <div className="w-[80px] flex justify-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                isLight 
                                    ? 'bg-purple-100/70 border-purple-200 text-purple-700' 
                                    : 'bg-purple-950/40 border-purple-800/50 text-purple-300'
                            }`}>
                                <span className="w-1 h-1 rounded-full bg-purple-500 animate-pulse"></span>
                                {language === 'vi' ? 'Đang chạy' : 'Running'}
                            </span>
                        </div>
                        <div className="w-[80px] flex justify-end -space-x-2">
                            {/* Gemini Icon */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border shadow-sm ${isLight ? 'bg-white border-stone-200/60' : 'bg-slate-900 border-slate-800'}`} title="Gemini (Google)">
                                <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2z" fill="currentColor" />
                                </svg>
                            </div>
                            {/* Claude Icon */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border shadow-sm ${isLight ? 'bg-white border-stone-200/60' : 'bg-slate-900 border-slate-800'}`} title="Claude (Anthropic)">
                                <span className="text-[8px] font-black text-amber-600">C</span>
                            </div>
                            {/* ChatGPT Icon */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border shadow-sm ${isLight ? 'bg-white border-stone-200/60' : 'bg-slate-900 border-slate-800'}`} title="ChatGPT (OpenAI)">
                                <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-emerald-500" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M21.7 10.3a3.5 3.5 0 0 0-.8-2.6 3.6 3.6 0 0 0-1.8-1.5c.2-.5.2-1 0-1.5a3.6 3.6 0 0 0-2.8-2.5c-.5-.1-1 0-1.4.2a3.6 3.6 0 0 0-4.1-1.6 3.6 3.6 0 0 0-2.6 2c-.5-.2-1-.2-1.5 0a3.6 3.6 0 0 0-2.5 2.8c-.1.5 0 1 .2 1.4a3.6 3.6 0 0 0-1.6 4.1 3.6 3.6 0 0 0 2 2.6c-.2.5-.2 1 0 1.5a3.6 3.6 0 0 0 2.8 2.5c.5.1 1 0 1.4-.2a3.6 3.6 0 0 0 4.1 1.6 3.6 3.6 0 0 0 2.6-2c.5.2 1 .2 1.5 0a3.6 3.6 0 0 0 2.5-2.8c.1-.5 0-1-.2-1.4a3.6 3.6 0 0 0 1.6-4.1zm-8.6 8.3l-3.3-1.9.1-.2 2.5-1.4 1.4.8c.3.2.7.2 1 0l2.7-1.6.8 1.4-2.7 1.6-2.5 1.3zm-5.4-3.1l-1-1.7 2.7-1.6.8 1.4-2.5 1.4v.5zm-.9-5.1l-.1-.2.8-1.4 3.3 1.9-.8 1.4-2.5-1.4-.7-.3zm6.3-2.6L12 4.3l1.8 1 1 1.7-2.7 1.6-.1-.1-1.8-1zm4.5 4.8l-2.7 1.6-.8-1.4 2.5-1.4v.5l1 1.7zm-.9-3.2l-.8 1.4-3.3-1.9.8-1.4 2.5 1.4.8.5z" fill="currentColor"/>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Row 2 - Multi-Modal Synth (Cyan Border Accent) */}
                    <div className={`flex items-center text-xs font-semibold p-2 rounded-lg border transition-colors ${
                        isLight 
                            ? 'bg-cyan-50/20 border-cyan-100 hover:bg-cyan-50/50 text-stone-700' 
                            : 'bg-cyan-950/5 border-cyan-900/30 hover:bg-cyan-950/15 text-slate-200'
                    }`}>
                        <div className="w-[140px] flex flex-col">
                            <span className={`font-bold text-xs md:text-[13px] ${isLight ? 'text-stone-800' : 'text-slate-100'}`}>
                                {t('landing.hero.workflow.task2.title')}
                            </span>
                        </div>
                        <div className="w-[80px] flex justify-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                                isLight 
                                    ? 'bg-emerald-100/70 border-emerald-200 text-emerald-700' 
                                    : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                            }`}>
                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                {language === 'vi' ? 'Sẵn sàng' : 'Ready'}
                            </span>
                        </div>
                        <div className="w-[80px] flex justify-end -space-x-2">
                            {/* Midjourney Icon */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border shadow-sm ${isLight ? 'bg-white border-stone-200/60' : 'bg-slate-900 border-slate-800'}`} title="Midjourney">
                                <span className="text-[8px] font-black text-amber-500">M</span>
                            </div>
                            {/* Luma AI Icon */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border shadow-sm ${isLight ? 'bg-white border-stone-200/60' : 'bg-slate-900 border-slate-800'}`} title="Luma AI">
                                <span className="text-[8px] font-black text-rose-500">L</span>
                            </div>
                            {/* Runway Icon */}
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border shadow-sm ${isLight ? 'bg-white border-stone-200/60' : 'bg-slate-900 border-slate-800'}`} title="Runway">
                                <span className="text-[8px] font-black text-stone-700 dark:text-stone-300">R</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Node Icons - 5 icons with REAL logos */}
            {/* Node 6: VocabFlip (Bottom Left - Bottom) - Real App Logo Image */}
            <div className="absolute bottom-[15px] left-[15px] w-11 h-11 rounded-full bg-white border border-stone-200/80 shadow-md flex items-center justify-center overflow-hidden hover:scale-110 transition-transform duration-300 z-10" title="VocabFlip">
                <img src="/vocab/icons/Icon-192.png" alt="VocabFlip" className="w-8 h-8 object-contain" />
            </div>
            {/* Node 7: Alpha CRM (Bottom Left - Middle) - Real App Logo Image */}
            <div className="absolute bottom-[110px] left-[55px] w-11 h-11 rounded-full bg-white border border-stone-200/80 shadow-md flex items-center justify-center overflow-hidden hover:scale-110 transition-transform duration-300 z-10" title="Alpha CRM">
                <img src="/crm-logo.png" alt="Alpha CRM" className="w-7 h-7 object-contain" />
            </div>
            {/* Node 8: Alpha Studio (Bottom Center) - Official Web SVG Logo */}
            <div className="absolute bottom-[40px] left-[218px] w-11 h-11 rounded-full bg-white border border-stone-200/80 shadow-md flex items-center justify-center overflow-hidden hover:scale-110 transition-transform duration-300 z-10" title="Alpha Studio">
                <img src="/alpha-logo-clean.svg" alt="Alpha Studio" className="w-8 h-8 object-contain" />
            </div>
            {/* Node 9: Casso Pay (Bottom Right - Middle) - Casso Pay Logo */}
            <div className="absolute bottom-[110px] right-[55px] w-11 h-11 rounded-full bg-white border border-stone-200/80 shadow-md flex items-center justify-center overflow-hidden hover:scale-110 transition-transform duration-300 z-10" title={t('landing.hero.workflow.node.casso')}>
                <img src="/casso-logo.png" alt="Casso Pay" className="w-8 h-8 object-contain" />
            </div>
            {/* Node 10: Remote VNC (Bottom Right - Bottom) - RealVNC Monitor Control */}
            <div className="absolute bottom-[15px] right-[15px] w-11 h-11 rounded-full bg-indigo-50 border border-indigo-200 shadow-md flex items-center justify-center hover:scale-110 transition-transform duration-300 z-10" title={t('landing.hero.workflow.node.vnc')}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600">
                    <rect x="3" y="4" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2.2" />
                    <path d="M9 20h6m-3-4v4M6 8l3 3-3 3m12-6l-3 3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
};


const LandingPage: React.FC = () => {
    const { t, language } = useTranslation();
    const { isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    // Login dialog state (for content CTAs)
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

    // Courses state
    const [courses, setCourses] = useState<Course[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState<string | null>(null);

    // Partners state
    const [partners, setPartners] = useState<Partner[]>([]);
    const [partnersLoading, setPartnersLoading] = useState(true);

    // Featured students state
    const [featuredStudents, setFeaturedStudents] = useState<FeaturedStudent[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(true);

    // Fetch featured courses
    useEffect(() => {
        const loadCourses = async () => {
            try {
                setCoursesLoading(true);
                setCoursesError(null);
                const response = await getFeaturedCourses(6);
                setCourses(response.data);
            } catch (err) {
                console.error('Failed to fetch courses:', err);
                setCoursesError(err instanceof Error ? err.message : 'Failed to load courses');
            } finally {
                setCoursesLoading(false);
            }
        };
        loadCourses();
    }, []);

    // Fetch featured partners
    useEffect(() => {
        const loadPartners = async () => {
            try {
                setPartnersLoading(true);
                const response = await getPartners({ featured: true, status: 'published', limit: 10, sort: 'order' });
                setPartners(response.data);
            } catch (err) {
                console.error('Failed to fetch partners:', err);
            } finally {
                setPartnersLoading(false);
            }
        };
        loadPartners();
    }, []);

    // Fetch featured students
    useEffect(() => {
        const loadStudents = async () => {
            try {
                setStudentsLoading(true);
                const data = await getFeaturedStudents();
                setFeaturedStudents(data);
            } catch (err) {
                console.error('Failed to fetch featured students:', err);
            } finally {
                setStudentsLoading(false);
            }
        };
        loadStudents();
    }, []);

    // Helper to get localized text
    const getLocalizedText = (text: { vi: string; en: string }) => {
        return language === 'vi' ? text.vi : text.en;
    };

    // Format price in credits
    const formatPrice = (price: number) => {
        if (price === 0) return t('landing.courses.free');
        return `${price.toLocaleString()} Credits`;
    };

    const handleLoginSuccess = () => {
        setShowLoginDialog(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
            setPendingNavigation(null);
        }
    };

    const handleCloseLoginDialog = () => {
        setShowLoginDialog(false);
        setPendingNavigation(null);
    };

    const navigateToProtectedPage = (path: string) => {
        if (isAuthenticated) {
            navigate(path);
        } else {
            setPendingNavigation(path);
            setShowLoginDialog(true);
        }
    };

    const desc = language === 'vi'
        ? 'Học AI thực chiến cùng Alpha Studio. Khóa học AI sáng tạo, công cụ AI Studio chuyên nghiệp, và cộng đồng freelancer hàng đầu Việt Nam.'
        : 'Master AI with Alpha Studio. Creative AI courses, professional AI Studio tools, and Vietnam\'s top freelancer community.';

    const landingJsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                name: 'Alpha Studio',
                url: 'https://giaiphapsangtao.com',
                logo: {
                    '@type': 'ImageObject',
                    url: 'https://giaiphapsangtao.com/alpha-logo-2.png'
                }
            },
            {
                '@type': 'WebSite',
                name: 'Alpha Studio',
                url: 'https://giaiphapsangtao.com',
                potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                        '@type': 'EntryPoint',
                        urlTemplate: 'https://giaiphapsangtao.com/courses?search={search_term_string}'
                    },
                    'query-input': 'required name=search_term_string'
                }
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="Alpha Studio — AI Academy & Training Hub"
                description={desc}
                path="/"
                jsonLd={landingJsonLd}
            />
            {/* Hero Section - Original Adaptive Background Color matching system theme */}
            <section className="relative py-16 md:py-24 px-6 overflow-hidden border-b border-[var(--border-primary)] bg-[var(--bg-primary)] transition-colors duration-300">
                {/* CSS Adaptive Grid Background */}
                <div className={`absolute inset-0 bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] -z-10`} style={{
                    ['--grid-color' as any]: theme === 'light' ? '#e5e5e0' : 'rgba(255,255,255,0.04)'
                }}></div>
                
                {/* Vibrant Soft Glow Spots */}
                <div className={`absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-[150px] -z-10 animate-pulse`} style={{ 
                    animationDuration: '8s',
                    backgroundColor: theme === 'light' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(97, 232, 255, 0.05)'
                }}></div>
                <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[150px] -z-10 animate-pulse`} style={{ 
                    animationDuration: '10s',
                    backgroundColor: theme === 'light' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(59, 130, 246, 0.05)'
                }}></div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-16 items-center">
                    {/* Left text and buttons (Adaptive theme optimized typography) */}
                    <Reveal staggerChildren={0.12} delay={0.05} className="lg:col-span-7 flex flex-col items-center text-center space-y-8 z-10 w-full">
                        <RevealItem y={15}>
                            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border shadow-sm ${
                                theme === 'light' 
                                    ? 'bg-slate-200/70 border-slate-300 text-slate-700' 
                                    : 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                            }`}>
                                <span className={`premium-blinking-dot ${theme === 'light' ? 'bg-indigo-600' : 'bg-[var(--accent-primary)]'}`}></span>
                                <span className="text-sm font-bold">{t('landing.hero.badge')}</span>
                            </div>
                        </RevealItem>

                        <RevealItem tag="h1" y={20} className={`text-5xl md:text-7xl xl:text-8xl font-black leading-[1.1] tracking-tight ${
                            theme === 'light' ? 'text-slate-900' : 'text-[var(--text-primary)]'
                        }`}>
                            <TextReveal text={t('landing.hero.title1')} delay={0.05} /> <br />
                            <span className={theme === 'light' ? 'text-indigo-600' : 'text-[var(--accent-primary)]'}>
                                <TextReveal text={t('landing.hero.title2')} delay={0.25} />
                            </span>
                        </RevealItem>

                        <RevealItem tag="p" y={20} className={`text-lg md:text-xl font-medium leading-relaxed ${
                            theme === 'light' ? 'text-slate-600' : 'text-[var(--text-secondary)]'
                        }`}>
                            {t('landing.hero.subtitle')}
                        </RevealItem>

                        <RevealItem y={20} className="flex flex-wrap justify-center gap-5 pt-2 w-full">
                            <HoverSpring scale={1.03} y={-2} className="inline-block">
                                <button onClick={() => navigate('/studio')} className={`py-4 px-10 font-black text-base rounded-xl shadow-lg transition-all duration-300 cursor-pointer ${
                                    theme === 'light' 
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                                        : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-[var(--text-on-accent)]'
                                }`}>
                                    {t('landing.hero.exploreStudio')}
                                </button>
                            </HoverSpring>
                            <HoverSpring scale={1.03} y={-2} className="inline-block">
                                <button onClick={() => navigateToProtectedPage('/server')} className={`py-4 px-10 font-black text-base rounded-xl transition-all duration-300 cursor-pointer shadow-md ${
                                    theme === 'light' 
                                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400' 
                                        : 'glass-card border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
                                }`}>
                                    {t('landing.hero.gpuServer')}
                                </button>
                            </HoverSpring>
                        </RevealItem>
                    </Reveal>

                    {/* Right Interactive Workflow Connect Map */}
                    <div className="lg:col-span-5 w-full flex justify-center lg:justify-end z-10 mt-12 lg:-my-24">
                        <WorkflowMap t={t} theme={theme} />
                    </div>
                </div>
            </section>

            {/* Featured Courses Section */}
            <section className="py-10 bg-[var(--bg-secondary)]/50 border-t border-[var(--border-primary)]">
                <div className="container mx-auto px-6">
                    <Reveal y={20} className="flex justify-between items-end mb-16">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-[var(--text-primary)]">{t('landing.courses.title')}</h2>
                            <p className="text-[var(--text-secondary)]">{t('landing.courses.subtitle')}</p>
                        </div>
                        <div className="hidden md:block">
                            <Link to="/courses" className="text-[11px] font-bold text-[var(--accent-primary)] border-b border-[var(--accent-primary)] pb-1 cursor-pointer hover:opacity-80 transition-opacity">
                                {t('landing.courses.viewAll')}
                            </Link>
                        </div>
                    </Reveal>

                    {/* Loading State */}
                    {coursesLoading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                                <p className="text-[var(--text-secondary)]">{t('landing.courses.loading')}</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {coursesError && !coursesLoading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center space-y-4">
                                <p className="text-red-400">{t('landing.courses.error')}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="py-2 px-4 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold text-sm hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all"
                                >
                                    {t('common.retry')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* No Courses State */}
                    {!coursesLoading && !coursesError && courses.length === 0 && (
                        <div className="flex items-center justify-center py-20">
                            <p className="text-[var(--text-secondary)]">{t('landing.courses.noCourses')}</p>
                        </div>
                    )}

                    {/* Courses Grid */}
                    {!coursesLoading && !coursesError && courses.length > 0 && (
                        <Reveal staggerChildren={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map(course => (
                                <RevealItem key={course._id}>
                                    <HoverSpring scale={1.02} y={-6} className="h-full">
                                        <Link
                                            to={`/courses/${course.slug}`}
                                            className="group glass-card rounded-xl overflow-hidden hover:bg-[var(--bg-card)] transition-all duration-500 cursor-pointer relative flex flex-col h-full"
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
                                                        {course.discount > 0 ? formatPrice(course.finalPrice) : formatPrice(course.price)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className={`relative h-48 ${categoryGradients[course.category] || 'bg-slate-900 border-b border-[var(--border-primary)]'} flex items-center justify-center`}>
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

                                                <div className="mt-4">
                                                    <span className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold text-sm border border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all flex items-center justify-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                        </svg>
                                                        {t('landing.course.startLearning')}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-tertiary)]">
                                                    <div className="flex gap-4">
                                                        <span>⏱ {course.duration} {t('landing.course.hours')}</span>
                                                        <span>📚 {course.totalLessons} {t('landing.course.lessons')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {course.rating > 0 ? (
                                                            <span className="flex items-center gap-1 text-yellow-400">
                                                                ⭐ {course.rating.toFixed(1)}
                                                                <span className="text-[var(--text-tertiary)]">({course.reviewCount})</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-[var(--text-tertiary)]">⭐ —</span>
                                                        )}
                                                        <span>👥 {course.enrolledCount} {t('landing.courses.enrolled')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </HoverSpring>
                                </RevealItem>
                            ))}
                        </Reveal>
                    )}

                    {/* Mobile View All Link */}
                    <div className="md:hidden mt-8 text-center">
                        <Link to="/courses" className="py-3 px-8 rounded-full border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all text-sm font-bold text-[var(--accent-primary)]">
                            {t('landing.courses.viewAll')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Tools Showcase Section */}
            <section className="py-10 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-primary)]/5 rounded-full blur-[160px] -z-10"></div>
                <div className="container mx-auto px-6">
                    <Reveal y={20} className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl font-black text-[var(--text-primary)]">
                            {t('landing.toolsShowcase.title')}
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
                            {t('landing.toolsShowcase.subtitle')}
                        </p>
                    </Reveal>

                    <Reveal staggerChildren={0.12} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Alpha CRM Card */}
                        <RevealItem className="h-full">
                            <ToolShowcaseCard
                                cardClass="crm-card"
                                onClick={() => navigate('/studio/crm/subscription')}
                                logo={<img src="/crm-logo.png" alt="Alpha CRM" />}
                                previewImage="/crm-preview.png"
                                title={t('landing.toolsShowcase.crm.title')}
                                desc={t('landing.toolsShowcase.crm.desc')}
                                stats={[
                                    { bigText: '100+', regularText: language === 'vi' ? 'Chiến dịch' : 'Campaigns' },
                                    { bigText: '14 Ngày', regularText: language === 'vi' ? 'Dùng thử' : 'Trial' },
                                    { bigText: 'Web/App', regularText: language === 'vi' ? 'Đa nền tảng' : 'Platform' }
                                ]}
                            />
                        </RevealItem>

                        {/* VocabFlip Card */}
                        <RevealItem className="h-full">
                            <ToolShowcaseCard
                                cardClass="vocab-card"
                                onClick={() => navigate('/studio/vocab')}
                                logo={<img src="/vocab/icons/Icon-192.png" alt="VocabFlip" />}
                                previewImage="/images/vocab/vocab-preview.png"
                                title={t('landing.toolsShowcase.vocab.title')}
                                desc={t('landing.toolsShowcase.vocab.desc')}
                                stats={[
                                    { bigText: 'Smart', regularText: language === 'vi' ? 'Học từ vựng' : 'Study' },
                                    { bigText: 'Win/Apk', regularText: language === 'vi' ? 'Hỗ trợ' : 'Supports' },
                                    { bigText: 'Shared', regularText: language === 'vi' ? 'Thư viện' : 'Library' }
                                ]}
                            />
                        </RevealItem>

                        {/* AI Skills Library Card */}
                        <RevealItem className="h-full">
                            <ToolShowcaseCard
                                cardClass="skills-card"
                                onClick={() => navigate('/studio/skills')}
                                logo={
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-white">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                }
                                previewImage="/skills-preview.jpg"
                                title={t('landing.toolsShowcase.skills.title')}
                                desc={t('landing.toolsShowcase.skills.desc')}
                                stats={[
                                    { bigText: '20+', regularText: language === 'vi' ? 'Thực chiến' : 'Skills' },
                                    { bigText: 'Daily', regularText: language === 'vi' ? 'Cập nhật' : 'Updates' },
                                    { bigText: 'AI-Gen', regularText: language === 'vi' ? 'Tài nguyên' : 'Resources' }
                                ]}
                            />
                        </RevealItem>
                    </Reveal>
                </div>
            </section>

            {/* Student Showcase Section */}
            <section className="py-10 border-t border-[var(--border-primary)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10"></div>
                <div className="container mx-auto px-6">
                    <Reveal y={20} className="text-center mb-10 space-y-4">
                        <h2 className="text-4xl font-black text-[var(--text-primary)]">{t('landing.showcase.title')}</h2>
                        <p className="text-[var(--text-secondary)]">{t('landing.showcase.subtitle')}</p>
                    </Reveal>

                    {studentsLoading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-10 h-10 border-3 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                        </div>
                    ) : (
                        <Reveal staggerChildren={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredStudents.map((student, idx) => (
                                <RevealItem key={idx}>
                                    <Link to={`/users/${student.id}`} className="student-card group">
                                        {/* Contact Button */}
                                        <div 
                                            className="contact-btn" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (student.socials?.linkedin) {
                                                    window.open(student.socials.linkedin, '_blank');
                                                } else if (student.socials?.facebook) {
                                                    window.open(student.socials.facebook, '_blank');
                                                } else {
                                                    navigate(`/users/${student.id}`);
                                                }
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                <polyline points="22,6 12,13 2,6"></polyline>
                                            </svg>
                                        </div>

                                        {/* Hired badge */}
                                        {student.hired && (
                                            <div className="hired-badge">
                                                {t('landing.showcase.hired')}
                                            </div>
                                        )}

                                        {/* Profile Pic: Student work image (Main background) */}
                                        <div className="profile-pic">
                                            {(student.backgroundImage || student.work) ? (
                                                <img src={student.backgroundImage || student.work} alt="Work" />
                                            ) : (
                                                <div className="fallback-pic">
                                                    <span>🎨</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Student Avatar: Circular avatar overlay, only visible when hovered */}
                                        <div className="student-avatar-pic">
                                            {student.image ? (
                                                <img src={student.image} alt={student.name} />
                                            ) : (
                                                <div className="avatar-fallback">
                                                    <span>{student.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom Slide Up Content */}
                                        <div className="bottom">
                                            <div className="content">
                                                <span className="name">{student.name}</span>
                                                <span className="role-text">{student.role}</span>
                                                <span className="about-me line-clamp-2">
                                                    {student.bio || (language === 'vi' ? 'Học viên tiêu biểu tại Alpha Studio với nhiều tác phẩm xuất sắc.' : 'Featured student at Alpha Studio with outstanding works.')}
                                                </span>
                                                {/* Skills tags */}
                                                {student.skills && student.skills.length > 0 && (
                                                    <div className="skills-container">
                                                        {student.skills.slice(0, 3).map((skill, sIdx) => (
                                                            <span key={sIdx} className="skill-tag">{skill}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="bottom-bottom">
                                                <button className="view-profile-btn">
                                                    {t('landing.showcase.viewProfile')}
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                </RevealItem>
                            ))}
                        </Reveal>
                    )}

                    <Reveal y={20} delay={0.1} className="mt-12 text-center">
                        <HoverSpring scale={1.05} y={-2} className="inline-block">
                            <button onClick={() => navigateToProtectedPage('/workflow')} className="liquid-cta-hover py-3 px-8 rounded-full border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300 text-sm font-bold text-[var(--accent-primary)]">
                                {t('landing.showcase.cta')}
                            </button>
                        </HoverSpring>
                    </Reveal>
                </div>
            </section>

            {/* Strategic Partners Section */}
            <section className="py-10 bg-[var(--bg-secondary)]/50 border-y border-[var(--border-primary)]">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                        <Reveal y={20} className="w-full md:w-1/3 space-y-4 text-center md:text-left">
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">{t('landing.partners.title')}</h2>
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                                {t('landing.partners.subtitle')}
                            </p>
                            <button onClick={() => navigateToProtectedPage('/workflow')} className="text-[var(--accent-primary)] text-sm font-bold inline-flex items-center gap-2 hover:underline">
                                {t('landing.partners.join')} →
                            </button>
                        </Reveal>
                        <div className="w-full md:w-2/3">
                            {partnersLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                                </div>
                            ) : partners.length === 0 ? (
                                <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">
                                    {language === 'vi' ? 'Chưa có đối tác nào' : 'No partners yet'}
                                </div>
                            ) : (
                                <Reveal staggerChildren={0.08} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                    {partners.map((partner) => (
                                        <RevealItem key={partner._id}>
                                            <HoverSpring scale={1.05} y={-4}>
                                                <Link
                                                    to={`/partners/${partner.slug}`}
                                                    className="relative group cursor-pointer aspect-square rounded-2xl overflow-hidden border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all duration-300 block"
                                                >
                                                    <div className="absolute inset-0">
                                                        <img src={partner.backgroundImage || partner.logo || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop"} alt={partner.companyName} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent"></div>
                                                    </div>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                                                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)]/50 backdrop-blur-md flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                                                            {partner.logo && partner.logo.startsWith('http') ? (
                                                                <img src={partner.logo} alt={partner.companyName} className="w-full h-full object-contain p-1" />
                                                            ) : (
                                                                <span className="text-2xl">{partner.logo || '🤝'}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors line-clamp-2">{partner.companyName}</span>
                                                    </div>
                                                </Link>
                                            </HoverSpring>
                                        </RevealItem>
                                    ))}
                                </Reveal>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Showcase */}
            <section className="py-10">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <Reveal staggerChildren={0.12} className="space-y-6">
                        <RevealItem tag="h2" y={20} className="text-4xl md:text-5xl font-black text-[var(--text-primary)]">
                            {t('landing.features.title')} <span className="text-[var(--accent-primary)]">{t('landing.features.highlight')}</span>
                        </RevealItem>
                        <RevealItem tag="p" y={20} className="text-lg text-[var(--text-secondary)] leading-relaxed">
                            {t('landing.features.description')}
                        </RevealItem>
                        <RevealItem tag="ul" y={20} className="space-y-4">
                            {[
                                t('landing.features.item1'),
                                t('landing.features.item2'),
                                t('landing.features.item3'),
                                t('landing.features.item4')
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-[var(--text-primary)] font-bold">
                                    <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] text-xs">✓</div>
                                    {item}
                                </li>
                            ))}
                        </RevealItem>
                        <RevealItem y={20}>
                            <HoverSpring scale={1.05} y={-2} className="inline-block">
                                <button onClick={() => navigateToProtectedPage('/workflow')} className="liquid-cta-hover py-4 px-10 glass-card rounded-2xl text-[var(--accent-primary)] font-black hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all duration-300">
                                    {t('landing.features.cta')}
                                </button>
                            </HoverSpring>
                        </RevealItem>
                    </Reveal>
                    <Reveal y={30} scale={0.95} className="relative">
                        <div className="aspect-square glass-card rounded-[40px] flex items-center justify-center p-12 overflow-hidden shadow-2xl">
                            <div className="grid grid-cols-2 gap-4 w-full">
                                {[1, 2, 3, 4].map(i => (
                                    <motion.div 
                                        key={i} 
                                        whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                                        className={`h-40 rounded-3xl bg-[var(--bg-tertiary)]/30 border border-[var(--border-primary)] flex items-center justify-center text-4xl cursor-pointer hover:bg-[var(--accent-primary)]/10 transition-colors`}
                                    >
                                        {i === 1 ? '🎨' : i === 2 ? '📂' : i === 3 ? '⚙️' : '💻'}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[var(--accent-primary)] rounded-full blur-[60px] opacity-30"></div>
                    </Reveal>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] mt-auto">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src="/alpha-logo-animated.svg" alt="Alpha Studio" className="h-8 w-8 rounded-lg object-contain" />
                        <span className="text-sm font-bold text-[var(--text-primary)] tracking-widest">ALPHA STUDIO ACADEMY</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">
                        © 2026 {t('landing.footer.copyright')}
                    </p>
                </div>
            </footer>

            {/* Login Dialog */}
            {showLoginDialog && (
                <Login onLoginSuccess={handleLoginSuccess} onClose={handleCloseLoginDialog} />
            )}
        </>
    );
};

export default LandingPage;
