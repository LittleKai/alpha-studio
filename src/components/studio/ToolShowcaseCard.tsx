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
          <span className="title">{title}</span>
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
