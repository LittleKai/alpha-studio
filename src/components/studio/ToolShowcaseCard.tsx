import React from 'react';

export interface ToolStat {
  bigText: string;
  regularText: string;
}

export interface ToolShowcaseCardProps {
  cardClass: string;
  onClick: () => void;
  logo: React.ReactNode;
  previewImage: string;
  title: string;
  desc: string;
  stats: ToolStat[];
}

export const ToolShowcaseCard: React.FC<ToolShowcaseCardProps> = ({
  cardClass,
  onClick,
  logo,
  previewImage,
  title,
  desc,
  stats,
}) => {
  return (
    <div className={`ecosystem-card ${cardClass}`} onClick={onClick}>
      <div className="top-section">
        <img src={previewImage} alt={`${title} Preview`} className="top-section-preview" />
        <div className="border"></div>
        <div className="icons">
          <div className="logo-container">
            {logo}
          </div>
          <div className="action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </div>
      <div className="bottom-section">
        <div className="title-desc">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
            <span className="title" style={{ marginBottom: 0 }}>{title}</span>
            <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded uppercase tracking-widest leading-none select-none">
              Beta
            </span>
          </div>
          <span className="desc">{desc}</span>
        </div>
        <div className="row">
          {stats.map((stat, index) => (
            <div key={index} className="item">
              <span className="big-text">{stat.bigText}</span>
              <span className="regular-text">{stat.regularText}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
