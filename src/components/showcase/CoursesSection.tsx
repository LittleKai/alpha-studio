import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Reveal from '../motion/Reveal';
import { useTranslation } from '../../i18n/context';
import type { Course } from '../../services/courseService';

interface Props {
  courses: Course[];
  loading: boolean;
  getLocalizedText: (t: { vi: string; en: string }) => string;
  formatPrice: (p: number) => string;
}

const categoryIcons: Record<string, string> = {
  'ai-basic': '📚', 'ai-advanced': '💎', 'ai-studio': '🎬', 'ai-creative': '✨',
};

const levelKeys: Record<string, string> = {
  beginner: 'courseCatalog.levels.beginner',
  intermediate: 'courseCatalog.levels.intermediate',
  advanced: 'courseCatalog.levels.advanced',
};

const CoursesSection: React.FC<Props> = ({ courses, loading, getLocalizedText, formatPrice }) => {
  const { t } = useTranslation();
  const [feature, ...rest] = courses;

  const priceOf = (c: Course) => (c.discount > 0 ? formatPrice(c.finalPrice) : formatPrice(c.price));

  return (
    <section className="sc-section" id="courses">
      <div className="sc-container">
        <div className="sc-sec-head">
          <div>
            <h2 className="sc-sec-title">{t('landing.courses.title')}</h2>
            <p className="sc-sec-sub">{t('landing.courses.subtitle')}</p>
          </div>
          <Link to="/courses" className="sc-sec-link">
            {t('landing.courses.viewAll')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>

        {loading ? (
          <div className="sc-loader"><span className="sc-spin" /></div>
        ) : courses.length === 0 ? (
          <p className="sc-empty">{t('landing.courses.noCourses')}</p>
        ) : (
          <div className="sc-courses-layout">
            {feature && (
              <Reveal y={24} className="sc-course-feature">
                <Link to={`/courses/${feature.slug}`} className="sc-feature-card">
                  <div className="sc-feature-media">
                    <img src={feature.thumbnail} alt={getLocalizedText(feature.title)} loading="lazy" />
                    <div className="sc-feature-scrim" />
                    <span className="sc-cat-chip">{categoryIcons[feature.category] || '🎓'} {t(levelKeys[feature.level])}</span>
                  </div>
                  <div className="sc-feature-body">
                    <h3 className="sc-feature-title">{getLocalizedText(feature.title)}</h3>
                    <p className="sc-feature-desc">{getLocalizedText(feature.description)}</p>
                    <div className="sc-feature-meta">
                      <span className="sc-price">{priceOf(feature)}</span>
                      <span className="sc-dot-sep">·</span>
                      <span>{feature.enrolledCount} {t('landing.courses.enrolled')}</span>
                      <span className="sc-dot-sep">·</span>
                      <span>{feature.totalLessons} {t('landing.course.lessons')}</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            )}

            {rest.length > 0 && (
              <div className="sc-course-rail" role="list">
                {rest.map((c, i) => (
                  <motion.div
                    key={c._id}
                    role="listitem"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link to={`/courses/${c.slug}`} className="sc-rail-card">
                      <div className="sc-rail-thumb">
                        <img src={c.thumbnail} alt={getLocalizedText(c.title)} loading="lazy" />
                        <span className="sc-rail-cat">{categoryIcons[c.category] || '🎓'}</span>
                      </div>
                      <div className="sc-rail-body">
                        <h4 className="sc-rail-title">{getLocalizedText(c.title)}</h4>
                        <div className="sc-rail-meta">
                          <span className="sc-price">{priceOf(c)}</span>
                          <span>{c.enrolledCount} {t('landing.courses.enrolled')}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
                <Link to="/courses" className="sc-rail-more">
                  <span>{t('landing.courses.viewAll')}</span>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CoursesSection;
