import React, { useState } from 'react';
import { useTranslation } from '../../i18n/context';
import type { CourseData, CourseModule } from '../../types';

interface CourseViewerProps {
  course: CourseData;
  onBack: () => void;
}

const CourseViewer: React.FC<CourseViewerProps> = ({ course, onBack }) => {
  const { t } = useTranslation();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Handle both modules and syllabus formats
  const modules = course.modules || [];
  const syllabus = course.syllabus || [];
  const totalLessons = modules.length > 0
    ? modules.reduce((acc, mod) => acc + mod.lessons.length, 0)
    : syllabus.length;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-primary)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[var(--text-primary)] truncate">{course.title}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{course.tag || course.level}</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)]">
        {course.image && (
          <img
            src={course.image}
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />

        {/* Course Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 bg-[var(--bg-tertiary)]/50 backdrop-blur-sm rounded-full text-[var(--text-primary)] text-sm">
                {course.level || course.tag}
              </span>
              <span className="px-3 py-1 bg-[var(--bg-tertiary)]/50 backdrop-blur-sm rounded-full text-[var(--text-primary)] text-sm">
                {course.duration} {t('landing.course.hours')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-2">{course.title}</h1>
            <p className="text-[var(--text-secondary)]">{course.instructor ? `${t('course.by')} ${course.instructor}` : ''}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[var(--accent-primary)]">{modules.length > 0 ? modules.length : syllabus.length}</div>
            <div className="text-sm text-[var(--text-secondary)]">{t('course.modules')}</div>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[var(--accent-primary)]">{totalLessons}</div>
            <div className="text-sm text-[var(--text-secondary)]">{t('course.lessons')}</div>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-[var(--accent-primary)]">{course.duration}</div>
            <div className="text-sm text-[var(--text-secondary)]">{t('course.duration')}</div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
            {t('course.description')}
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">{course.description}</p>
        </div>

        {/* Modules */}
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
            {t('course.curriculum')}
          </h2>
          <div className="flex flex-col gap-3">
            {modules.length > 0 ? modules.map((module: CourseModule, index: number) => {
              const isExpanded = expandedModules.has(module.id);
              return (
                <div
                  key={module.id}
                  className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 flex items-center justify-center bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-lg font-semibold text-sm">
                        {index + 1}
                      </span>
                      <div className="text-left">
                        <h3 className="font-medium text-[var(--text-primary)]">{module.title}</h3>
                        <p className="text-sm text-[var(--text-tertiary)]">
                          {module.lessons.length} {t('course.lessons')} • {module.duration}
                        </p>
                      </div>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 text-[var(--text-secondary)] transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-[var(--border-primary)]">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lessonIndex}
                          className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-[var(--text-secondary)]">{lesson}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }) : syllabus.map((item, index) => (
              <div
                key={index}
                className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden p-4"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 flex items-center justify-center bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-lg font-semibold text-sm">
                    {index + 1}
                  </span>
                  <div className="text-left flex-1">
                    <h3 className="font-medium text-[var(--text-primary)]">{item.title}</h3>
                    <p className="text-sm text-[var(--text-tertiary)]">{item.duration}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enroll Button */}
        <div className="mt-8">
          <button className="w-full py-3 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)] font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[var(--accent-shadow)]">
            {t('course.enroll')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
