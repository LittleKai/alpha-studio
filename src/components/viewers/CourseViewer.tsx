import React, { useState } from 'react';
import { useTranslation } from '../../i18n/context';
import type { CourseData } from '../../types';

interface CourseViewerProps {
  course: CourseData;
  onBack: () => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course, onBack }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'syllabus' | 'overview'>('syllabus');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-card-alpha)] backdrop-blur-lg border-b border-[var(--border-primary)] p-4">
        <div className="container mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg md:text-xl font-bold truncate">{course.title}</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 animate-fade-in">
        {/* Left Column: Video Player & Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-[var(--border-primary)] shadow-2xl">
            {/* Mock Video Player UI */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
               <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${course.color || 'from-purple-600 to-pink-500'} flex items-center justify-center blur-2xl opacity-50 absolute`}></div>
               <button className="relative z-10 w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:scale-110 transition-transform group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
               </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-medium">01. {t('landing.course.intro')}</p>
                <div className="w-full h-1 bg-gray-600 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[var(--accent-primary)] w-1/3"></div>
                </div>
            </div>
          </div>

          <div>
             <div className="flex gap-6 border-b border-[var(--border-primary)] mb-4">
                <button
                    onClick={() => setActiveTab('syllabus')}
                    className={`pb-2 text-sm font-semibold transition-colors relative ${activeTab === 'syllabus' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                    {t('landing.course.syllabus')}
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
                 <div className="space-y-2">
                    {(course.syllabus || []).map((lesson, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-xs font-bold text-[var(--text-tertiary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                                    {idx + 1}
                                </div>
                                <div>
                                    <h4 className="font-medium text-[var(--text-primary)]">{lesson.title}</h4>
                                    <p className="text-xs text-[var(--text-secondary)]">Video • {lesson.duration}</p>
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
             ) : (
                 <div className="prose prose-invert max-w-none">
                     <p className="text-[var(--text-secondary)] leading-relaxed">{course.description}</p>
                     <h3 className="text-[var(--text-primary)] font-bold mt-4">{t('landing.course.whatYouLearn')}</h3>
                     <ul className="list-disc pl-5 text-[var(--text-secondary)] space-y-2">
                        <li>{t('landing.course.point1')}</li>
                        <li>{t('landing.course.point2')}</li>
                        <li>{t('landing.course.point3')}</li>
                     </ul>
                 </div>
             )}
          </div>
        </div>

        {/* Right Column: Stats & Instructor (Sidebar) */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-primary)]">
                <div className={`w-full aspect-video rounded-lg bg-gradient-to-br ${course.color || 'from-purple-600 to-pink-500'} mb-4 flex items-center justify-center text-4xl shadow-lg`}>
                    {course.icon || '📚'}
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-[var(--accent-primary)]">Free</span>
                    {course.tag && <span className="px-2 py-1 text-xs font-bold bg-[var(--bg-secondary)] rounded border border-[var(--border-primary)]">{course.tag}</span>}
                </div>

                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)] font-bold shadow-lg shadow-[var(--accent-shadow)] hover:scale-105 transition-transform mb-4 flex items-center justify-center gap-2 group">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    {t('landing.course.startLearning')}
                </button>

                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                    <div className="flex justify-between border-b border-[var(--border-primary)] pb-2">
                        <span>{t('landing.course.duration')}</span>
                        <span className="font-medium text-[var(--text-primary)]">{course.duration} {t('landing.course.hours')}</span>
                    </div>
                    <div className="flex justify-between border-b border-[var(--border-primary)] pb-2">
                        <span>{t('landing.course.lessons')}</span>
                        <span className="font-medium text-[var(--text-primary)]">{course.lessonsCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>{t('landing.course.level')}</span>
                        <span className="font-medium text-[var(--text-primary)]">{t('landing.course.beginner')}</span>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default CourseViewer;
