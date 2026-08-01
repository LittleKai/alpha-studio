import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/context';

interface Props {
  onNavigate: (path: string) => void;
  studentCount: number;
  courseCount: number;
}

const ease = [0.16, 1, 0.3, 1] as const;

const HeroSection: React.FC<Props> = ({ onNavigate, studentCount, courseCount }) => {
  const { t } = useTranslation();

  const nodes = [
    { key: 'nvidia', dot: 'live' },
    { key: 'b2', dot: 'live' },
    { key: 'generator', dot: 'busy' },
    { key: 'labs', dot: 'idle' },
  ];

  return (
    <section className="sc-hero" id="top">
      <div className="sc-hero-grid">
        {/* Left — headline */}
        <div className="sc-hero-copy">
          <motion.span
            className="sc-pill"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
          >
            <span className="sc-pill-dot" />{t('landing.hero.badge')}
          </motion.span>

          <h1 className="sc-hero-title">
            <motion.span
              className="sc-hero-line"
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.05 }}
            >
              {t('landing.hero.title1')}
            </motion.span>
            <motion.span
              className="sc-hero-line sc-hero-line-accent"
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.14 }}
            >
              {t('landing.hero.title2')}
            </motion.span>
          </h1>

          <motion.p
            className="sc-hero-sub"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.22 }}
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div
            className="sc-hero-actions"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.3 }}
          >
            <button type="button" className="sc-cta-primary" onClick={() => onNavigate('/studio')}>
              {t('landing.hero.exploreStudio')}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <button type="button" className="sc-cta-ghost" onClick={() => onNavigate('/workflow')}>
              {t('landing.hero.gpuServer')}
            </button>
          </motion.div>

          <motion.dl
            className="sc-hero-stats"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.42 }}
          >
            <div><dt>{studentCount > 0 ? `${studentCount}+` : '1.2K+'}</dt><dd>{t('landing.showcasePage.stats.students')}</dd></div>
            <div><dt>{courseCount > 0 ? `${courseCount}+` : '20+'}</dt><dd>{t('landing.showcasePage.stats.courses')}</dd></div>
            <div><dt>RTX 4090</dt><dd>{t('landing.showcasePage.stats.gpu')}</dd></div>
          </motion.dl>
        </div>

        {/* Right — AI Core Engine terminal */}
        <motion.div
          className="sc-terminal"
          initial={{ opacity: 0, y: 40, rotateX: 8 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.2 }}
        >
          <div className="sc-term-bar">
            <span className="sc-term-lights"><i /><i /><i /></span>
            <span className="sc-term-name">{t('landing.hero.workflow.workspace')}</span>
            <span className="sc-term-badge"><span className="sc-live-dot" />{t('landing.hero.workflow.active')}</span>
          </div>

          <div className="sc-term-body">
            <p className="sc-term-caption">{t('landing.hero.workflow.subworkspace')}</p>

            <ul className="sc-node-list">
              {nodes.map((n) => (
                <li key={n.key} className="sc-node">
                  <span className={`sc-node-dot sc-dot-${n.dot}`} />
                  <span className="sc-node-label">{t(`landing.hero.workflow.node.${n.key}`)}</span>
                  <span className="sc-node-tail">{n.key.toUpperCase()}</span>
                </li>
              ))}
            </ul>

            <div className="sc-task-row">
              <div className="sc-task">
                <span className="sc-task-title">{t('landing.hero.workflow.task1.title')}</span>
                <span className="sc-task-desc">{t('landing.hero.workflow.task1.desc')}</span>
                <span className="sc-task-status sc-status-run">{t('landing.hero.workflow.task1.status')}</span>
              </div>
              <div className="sc-task">
                <span className="sc-task-title">{t('landing.hero.workflow.task2.title')}</span>
                <span className="sc-task-desc">{t('landing.hero.workflow.task2.desc')}</span>
                <span className="sc-task-status sc-status-ready">{t('landing.hero.workflow.task2.status')}</span>
              </div>
            </div>

            <div className="sc-term-foot">
              <span>{t('landing.hero.workflow.footer.active')}</span>
              <button type="button" onClick={() => onNavigate('/workflow')}>{t('landing.hero.workflow.footer.sync')}</button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
