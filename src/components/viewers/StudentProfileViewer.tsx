import React, { useState } from 'react';
import { useTranslation } from '../../i18n/context';
import type { FeaturedStudent } from '../../types';
import ImagePreviewModal from '../modals/ImagePreviewModal';

interface StudentProfileViewerProps {
  student: FeaturedStudent;
  onBack: () => void;
}

const StudentProfileViewer: React.FC<StudentProfileViewerProps> = ({ student, onBack }) => {
  const { t } = useTranslation();
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-primary)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-[var(--text-primary)] truncate">{student.name}</h1>
              <p className="text-sm text-[var(--accent-primary)]">{student.role}</p>
            </div>
          </div>
          {student.hired && (
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
              {t('student.hired')}
            </span>
          )}
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-600 to-[var(--accent-primary)]">
        {student.work && (
          <img
            src={student.work}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Avatar & Basic Info */}
        <div className="relative -mt-20 flex flex-col md:flex-row gap-6 items-start md:items-end">
          <div className="w-36 h-36 rounded-2xl border-4 border-[var(--bg-primary)] overflow-hidden bg-[var(--bg-secondary)] shadow-xl">
            <img
              src={student.image}
              alt={student.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 pb-4">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{student.name}</h1>
            <p className="text-lg text-[var(--accent-primary)] font-medium">{student.role}</p>
          </div>

          {/* Social Links */}
          {student.socials && (
            <div className="flex gap-3 pb-4">
              {student.socials.behance && (
                <a
                  href={student.socials.behance}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#1769ff] text-white rounded-xl hover:bg-[#1769ff]/80 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 7h-7v-2h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14h-8.027c.13 3.211 3.483 3.312 4.588 2.029h3.168zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988h-6.466v-14.967h6.953c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 8.061-3.207 8.061zm-3.466-8.988h3.584c2.508 0 2.906-3-.312-3h-3.272v3zm3.391 3h-3.391v3.016h3.341c3.055 0 2.868-3.016.05-3.016z" />
                  </svg>
                </a>
              )}
              {student.socials.linkedin && (
                <a
                  href={student.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#0077b5] text-white rounded-xl hover:bg-[#0077b5]/80 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Bio */}
        {student.bio && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
              {t('student.about')}
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">{student.bio}</p>
          </div>
        )}

        {/* Skills */}
        {student.skills && student.skills.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-3">
              {t('student.skills')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {student.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-xl"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Gallery */}
        {student.gallery && student.gallery.length > 0 && (
          <div className="mt-8 pb-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              {t('student.portfolio')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {student.gallery.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setPreviewImage(img)}
                  className="aspect-square rounded-xl overflow-hidden bg-[var(--bg-secondary)] group"
                >
                  <img
                    src={img}
                    alt={`Work ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured Work */}
        {student.work && (
          <div className="mt-8 pb-8">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
              {t('student.featuredWork')}
            </h2>
            <button
              onClick={() => setPreviewImage(student.work)}
              className="w-full rounded-xl overflow-hidden bg-[var(--bg-secondary)] group"
            >
              <img
                src={student.work}
                alt="Featured work"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </button>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};

export default StudentProfileViewer;
