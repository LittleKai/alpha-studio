import React from 'react';
import { useTranslation } from '../../i18n/context';
import type { FeaturedStudent } from '../../types';

interface StudentProfileViewerProps {
  student: FeaturedStudent;
  onBack: () => void;
}

const StudentProfileViewer: React.FC<StudentProfileViewerProps> = ({ student, onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex flex-col animate-fade-in">
        {/* Header / Cover */}
        <div className="relative h-64 md:h-80 bg-gradient-to-r from-purple-900 to-blue-900 overflow-hidden">
            <div className="absolute inset-0 bg-black/30"></div>
            {/* Back Button */}
            <div className="absolute top-4 left-4 md:top-8 md:left-8 z-20">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 py-2 px-4 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-bold">{t('app.back')}</span>
                </button>
            </div>
        </div>

        <div className="container mx-auto px-6 -mt-20 relative z-10 pb-16">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar Card */}
                <div className="w-full md:w-1/3 flex flex-col items-center">
                    <div className="w-40 h-40 rounded-full border-4 border-[var(--bg-primary)] shadow-2xl overflow-hidden mb-4 bg-black">
                        <img src={student.image} alt={student.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 w-full shadow-lg text-center">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{student.name}</h1>
                        <p className="text-[var(--accent-primary)] font-medium mb-4 uppercase tracking-wider text-sm">{student.role}</p>

                        {student.hired && (
                            <div className="inline-block px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold border border-green-500/30 mb-6">
                                {t('landing.showcase.hired')}
                            </div>
                        )}

                        <div className="space-y-3">
                            <button className="w-full py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold rounded-xl hover:opacity-90 transition-all">
                                {t('workflow.profile.hire')}
                            </button>
                            <div className="flex justify-center gap-4 pt-2">
                                {student.socials?.behance && (
                                    <a href={student.socials.behance} target="_blank" rel="noreferrer" className="p-2 bg-[var(--bg-secondary)] rounded-full hover:bg-[var(--accent-primary)] hover:text-black transition-colors">
                                        <span className="font-bold text-xs">Be</span>
                                    </a>
                                )}
                                {student.socials?.linkedin && (
                                    <a href={student.socials.linkedin} target="_blank" rel="noreferrer" className="p-2 bg-[var(--bg-secondary)] rounded-full hover:bg-[var(--accent-primary)] hover:text-black transition-colors">
                                        <span className="font-bold text-xs">in</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Content */}
                <div className="w-full md:w-2/3 space-y-8 mt-4 md:mt-20">
                    <section>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-[var(--accent-primary)] rounded-full"></span>
                            {t('workflow.profile.bio')}
                        </h2>
                        <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                            {student.bio || "No bio available."}
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-[var(--accent-primary)] rounded-full"></span>
                            {t('workflow.profile.skills')}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {student.skills?.map((skill, idx) => (
                                <span key={idx} className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-secondary)] hover:border-[var(--accent-primary)] transition-colors">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-[var(--accent-primary)] rounded-full"></span>
                            {t('workflow.profile.gallery')}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {student.gallery?.map((img, idx) => (
                                <div key={idx} className="group relative aspect-video rounded-xl overflow-hidden border border-[var(--border-primary)] cursor-pointer">
                                    <img src={img} alt={`Project ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    </div>
  );
};

export default StudentProfileViewer;
