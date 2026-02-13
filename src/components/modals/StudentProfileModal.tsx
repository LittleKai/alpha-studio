import React, { useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import type { FeaturedStudent } from '../../types';

interface StudentProfileModalProps {
  student: FeaturedStudent | null;
  onClose: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose }) => {
  const { t } = useTranslation();

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-2xl bg-[var(--bg-primary)] rounded-2xl overflow-hidden shadow-2xl">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-[var(--accent-primary)] to-orange-600">
          {student.work && (
            <img
              src={student.work}
              alt="Cover"
              className="w-full h-full object-cover opacity-50"
            />
          )}
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Content */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="absolute -top-16 left-6">
            <div className="w-32 h-32 rounded-full border-4 border-[var(--bg-primary)] overflow-hidden bg-[var(--bg-secondary)]">
              <img
                src={student.image}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Hired Badge */}
          {student.hired && (
            <div className="absolute top-4 right-6">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
                {t('student.hired')}
              </span>
            </div>
          )}

          {/* Info */}
          <div className="pt-20">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{student.name}</h2>
            <p className="text-[var(--accent-primary)] font-medium">{student.role}</p>

            {/* Bio */}
            {student.bio && (
              <p className="mt-4 text-[var(--text-secondary)]">{student.bio}</p>
            )}

            {/* Skills */}
            {student.skills && student.skills.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                  {t('student.skills')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {student.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {student.gallery && student.gallery.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                  {t('student.portfolio')}
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {student.gallery.map((img, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden bg-[var(--bg-secondary)]"
                    >
                      <img
                        src={img}
                        alt={`Work ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {student.socials && (
              <div className="mt-6 flex flex-wrap gap-3">
                {student.socials.facebook && (
                  <a
                    href={student.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#1877f2]/20 text-[#1877f2] rounded-lg hover:bg-[#1877f2]/30 transition-colors text-sm font-medium"
                  >
                    Facebook
                  </a>
                )}
                {student.socials.linkedin && (
                  <a
                    href={student.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#0077b5]/20 text-[#0077b5] rounded-lg hover:bg-[#0077b5]/30 transition-colors text-sm font-medium"
                  >
                    LinkedIn
                  </a>
                )}
                {student.socials.custom?.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;
