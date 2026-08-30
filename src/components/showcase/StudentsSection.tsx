import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Reveal, { RevealItem } from '../motion/Reveal';
import { useTranslation } from '../../i18n/context';
import type { FeaturedStudent } from '../../types';
import { cdnFromUrl } from '../../services/cloudinaryAssets';

interface Props {
  students: FeaturedStudent[];
  loading: boolean;
  onNavigate: (path: string) => void;
}

const StudentsSection: React.FC<Props> = ({ students, loading, onNavigate }) => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="sc-section" id="students">
      <div className="sc-container">
        <div className="sc-sec-head sc-sec-head-center">
          <div>
            <h2 className="sc-sec-title">{t('landing.showcase.title')}</h2>
            <p className="sc-sec-sub">{t('landing.showcase.subtitle')}</p>
          </div>
        </div>

        {loading ? (
          <div className="sc-loader"><span className="sc-spin" /></div>
        ) : (
          <Reveal staggerChildren={0.09} className="sc-students-grid">
            {students.map((student, idx) => (
              <RevealItem key={idx}>
                <Link to={`/users/${student.id}`} className="student-card group">
                  <div
                    className="contact-btn"
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      if (student.socials?.linkedin) window.open(student.socials.linkedin, '_blank');
                      else if (student.socials?.facebook) window.open(student.socials.facebook, '_blank');
                      else navigate(`/users/${student.id}`);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>

                  {student.hired && <div className="hired-badge">{t('landing.showcase.hired')}</div>}

                  <div className="profile-pic">
                    {(student.backgroundImage || student.work) ? (
                      <img src={cdnFromUrl(student.backgroundImage || student.work, 'w_640')} alt="Work" />
                    ) : (
                      <div className="fallback-pic"><span>🎨</span></div>
                    )}
                  </div>

                  <div className="student-avatar-pic">
                    {student.image ? (
                      <img src={cdnFromUrl(student.image, 'w_256')} alt={student.name} />
                    ) : (
                      <div className="avatar-fallback"><span>{student.name.charAt(0).toUpperCase()}</span></div>
                    )}
                  </div>

                  <div className="bottom">
                    <div className="content">
                      <span className="name">{student.name}</span>
                      <span className="role-text">{student.role}</span>
                      <span className="about-me line-clamp-2">
                        {student.bio || (language === 'vi'
                          ? 'Học viên tiêu biểu tại Alpha Studio với nhiều tác phẩm xuất sắc.'
                          : 'Featured student at Alpha Studio with outstanding works.')}
                      </span>
                      {student.skills && student.skills.length > 0 && (
                        <div className="skills-container">
                          {student.skills.slice(0, 3).map((skill, sIdx) => (
                            <span key={sIdx} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="bottom-bottom">
                      <button className="view-profile-btn">{t('landing.showcase.viewProfile')}</button>
                    </div>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </Reveal>
        )}

        <div className="sc-sec-cta">
          <button type="button" className="sc-cta-ghost" onClick={() => onNavigate('/workflow')}>
            {t('landing.showcase.cta')}
          </button>
        </div>
      </div>
    </section>
  );
};

export default StudentsSection;
