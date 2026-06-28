import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { ToolShowcaseCard } from './ToolShowcaseCard';

interface ToolCard {
  key: 'generate' | 'edit' | 'vocab' | 'interior' | 'crm' | 'skills';
  to: string;
  cardClass: string;
  logo: ReactNode;
  previewImage: string;
  getStats: (language: string) => { bigText: string; regularText: string }[];
}

const TOOLS: ToolCard[] = [
  /*
  {
    key: 'generate',
    to: '/studio/generate',
    cardClass: 'generate-card',
    logo: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-4 3 3 5-6 4 5M4 6h16v12H4z" />
      </svg>
    ),
    previewImage: '/generate-preview.jpg',
    getStats: (lang) => [
      { bigText: 'Fast', regularText: lang === 'vi' ? 'Tốc độ' : 'Speed' },
      { bigText: '4K', regularText: lang === 'vi' ? 'Chất lượng' : 'Quality' },
      { bigText: 'Pro', regularText: lang === 'vi' ? 'Mô hình' : 'Model' },
    ],
  },
  {
    key: 'edit',
    to: '/studio/edit',
    cardClass: 'edit-card',
    logo: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-6M17.5 3.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 8.5-8.5z" />
      </svg>
    ),
    previewImage: '/edit-preview.jpg',
    getStats: (lang) => [
      { bigText: 'Smart', regularText: lang === 'vi' ? 'Chọn vùng' : 'Masking' },
      { bigText: 'AI-Erase', regularText: lang === 'vi' ? 'Xóa vật' : 'Erase' },
      { bigText: 'Canvas', regularText: lang === 'vi' ? 'Vô hạn' : 'Infinite' },
    ],
  },
  */
  {
    key: 'crm',
    to: '/studio/crm/subscription',
    cardClass: 'crm-card',
    logo: <img src="/crm-logo.png" alt="Alpha CRM" />,
    previewImage: '/crm-preview.png',
    getStats: (lang) => [
      { bigText: '100+', regularText: lang === 'vi' ? 'Chiến dịch' : 'Campaigns' },
      { bigText: '14 Ngày', regularText: lang === 'vi' ? 'Dùng thử' : 'Trial' },
      { bigText: 'Web/App', regularText: lang === 'vi' ? 'Đa nền tảng' : 'Platform' },
    ],
  },
  {
    key: 'interior',
    to: '/studio/interior-design',
    cardClass: 'interior-card',
    logo: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V8l8-4 8 4v12M8 20V10h8v10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14h4M10 17h4M8 10h8" />
      </svg>
    ),
    previewImage: '/interior-preview.png',
    getStats: (lang) => [
      { bigText: '3D', regularText: lang === 'vi' ? 'Không gian' : 'Space' },
      { bigText: 'AI-Render', regularText: lang === 'vi' ? 'Vật liệu' : 'Materials' },
      { bigText: 'Scale', regularText: lang === 'vi' ? 'Chính xác' : 'Precision' },
    ],
  },
  {
    key: 'vocab',
    to: '/studio/vocab',
    cardClass: 'vocab-card',
    logo: <img src="/vocab/icons/Icon-192.png" alt="VocabFlip" />,
    previewImage: '/images/vocab/vocab-preview.png',
    getStats: (lang) => [
      { bigText: 'Smart', regularText: lang === 'vi' ? 'Học từ vựng' : 'Study' },
      { bigText: 'Win/Apk', regularText: lang === 'vi' ? 'Hỗ trợ' : 'Supports' },
      { bigText: 'Shared', regularText: lang === 'vi' ? 'Thư viện' : 'Library' },
    ],
  },
  {
    key: 'skills',
    to: '/studio/skills',
    cardClass: 'skills-card',
    logo: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-white">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    previewImage: '/skills-preview.png',
    getStats: (lang) => [
      { bigText: '20+', regularText: lang === 'vi' ? 'Thực chiến' : 'Skills' },
      { bigText: 'Daily', regularText: lang === 'vi' ? 'Cập nhật' : 'Updates' },
      { bigText: 'AI-Gen', regularText: lang === 'vi' ? 'Tài nguyên' : 'Resources' },
    ],
  },
];

export default function StudioHub() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <main className="container mx-auto px-4 py-10 max-w-6xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-clip-text text-transparent drop-shadow-sm">
            {t('studio.hub.title')}
          </h1>
          <p className="mt-3 text-base md:text-lg text-[var(--text-secondary)]">
            {t('studio.hub.subtitle')}
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            {language === 'vi' 
              ? 'Tất cả dự án và công cụ đang trong giai đoạn Thử nghiệm (Beta)' 
              : 'All projects and tools are currently in Beta (Experimental) phase'}
          </div>
        </header>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map(tool => (
            <ToolShowcaseCard
              key={tool.key}
              cardClass={tool.cardClass}
              onClick={() => navigate(tool.to)}
              logo={tool.logo}
              previewImage={tool.previewImage}
              title={t(`studio.hub.cards.${tool.key}.title`)}
              desc={t(`studio.hub.cards.${tool.key}.desc`)}
              stats={tool.getStats(language)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
