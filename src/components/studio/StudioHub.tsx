import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';

interface ToolCard {
  key: 'generate' | 'edit' | 'vocab' | 'interior';
  to: string;
  icon: ReactNode;
}

const TOOLS: ToolCard[] = [
  {
    key: 'generate',
    to: '/studio/generate',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-9 w-9">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-4 3 3 5-6 4 5M4 6h16v12H4z" />
      </svg>
    ),
  },
  {
    key: 'edit',
    to: '/studio/edit',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-9 w-9">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-6M17.5 3.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 8.5-8.5z" />
      </svg>
    ),
  },
  {
    key: 'interior',
    to: '/studio/interior-design',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-9 w-9">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V8l8-4 8 4v12M8 20V10h8v10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14h4M10 17h4M8 10h8" />
      </svg>
    ),
  },
  {
    key: 'vocab',
    to: '/studio/vocab',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" className="h-9 w-9">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M8 13h8M8 17h5" />
      </svg>
    ),
  },
];

export default function StudioHub() {
  const { t } = useTranslation();
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
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map(tool => (
            <button
              key={tool.key}
              onClick={() => navigate(tool.to)}
              className="group glass-card text-left p-6 rounded-2xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col h-full"
            >
              <div className="text-[var(--accent-primary)] mb-4">
                {tool.icon}
              </div>
              <h2 className="text-xl font-bold mb-2 text-[var(--text-primary)]">
                {t(`studio.hub.cards.${tool.key}.title`)}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] flex-1">
                {t(`studio.hub.cards.${tool.key}.desc`)}
              </p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-primary)] group-hover:gap-2 transition-all">
                {t('studio.hub.open')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
