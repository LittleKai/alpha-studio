import React from 'react';
import Reveal, { RevealItem } from '../motion/Reveal';
import { useTranslation } from '../../i18n/context';

interface Props {
  onNavigate: (path: string) => void;
}

const ToolsSection: React.FC<Props> = ({ onNavigate }) => {
  const { t } = useTranslation();

  const tools = [
    {
      id: 'crm', path: '/crm', icon: '🗂️', size: 'lg',
      art: 'linear-gradient(135deg, var(--sc-accent), var(--sc-accent-2))',
      tags: ['Clients', 'Billing', 'Automation'],
    },
    {
      id: 'vocab', path: '/studio/vocab', icon: '🃏', size: 'sm',
      art: 'linear-gradient(135deg, var(--sc-accent-2), var(--sc-accent))',
      tags: ['Flashcards'],
    },
    {
      id: 'skills', path: '/studio/ai-skills', icon: '🧠', size: 'sm',
      art: 'linear-gradient(135deg, var(--sc-accent), var(--sc-accent-2))',
      tags: ['Prompts', 'Workflows'],
    },
  ];

  return (
    <section className="sc-section sc-section-alt" id="tools">
      <div className="sc-container">
        <div className="sc-sec-head sc-sec-head-center">
          <div>
            <h2 className="sc-sec-title">{t('landing.toolsShowcase.title')}</h2>
            <p className="sc-sec-sub">{t('landing.toolsShowcase.subtitle')}</p>
          </div>
        </div>

        <Reveal staggerChildren={0.1} className="sc-tools-bento">
          {tools.map((tool) => (
            <RevealItem key={tool.id} className={`sc-tool-cell sc-tool-${tool.size}`}>
              <button
                type="button"
                className="sc-tool-card"
                onClick={() => onNavigate(tool.path)}
              >
                <div className="sc-tool-art" style={{ background: tool.art }} aria-hidden="true">
                  <span className="sc-tool-icon">{tool.icon}</span>
                </div>
                <div className="sc-tool-body">
                  <h3 className="sc-tool-title">{t(`landing.toolsShowcase.${tool.id}.title`)}</h3>
                  <p className="sc-tool-desc">{t(`landing.toolsShowcase.${tool.id}.desc`)}</p>
                  <div className="sc-tool-tags">
                    {tool.tags.map((tag) => <span key={tag} className="sc-tag">{tag}</span>)}
                  </div>
                  <span className="sc-tool-link">
                    {t('landing.toolsShowcase.explore')}
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </div>
              </button>
            </RevealItem>
          ))}
        </Reveal>
      </div>
    </section>
  );
};

export default ToolsSection;
