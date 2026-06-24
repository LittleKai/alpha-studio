import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';

interface Skill {
  source: string;
  url: string;
  slug: string;
  name: string;
  headline: string;
  headline_vi: string;
  short_description: string;
  short_description_vi: string;
  tier: string;
  category: string;
  difficulty: string;
  install_type: string;
  estimated_time_saving: string;
  author: string;
  install_command: string;
  source_repo_url: string;
  works_with: string[];
  tags: string[];
  sections: {
    overview: string;
    overview_vi: string;
    setup: string;
    setup_vi: string;
    usage: string;
    usage_vi: string;
    requirements: string[];
    related_skills: string[];
  };
}

export default function SkillDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t, language } = useTranslation();

  const [skills, setSkills] = useState<Skill[]>([]);
  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'usage'>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/data/skills.json')
      .then(res => res.json())
      .then((data: Skill[]) => {
        setSkills(data);
        const found = data.find(s => s.slug === slug);
        setSkill(found || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading skill detail:', err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <h2 className="text-2xl font-bold mb-4">Skill not found</h2>
        <button onClick={() => navigate('/studio/skills')} className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-xl">
          {t('studio.skills.backToList')}
        </button>
      </div>
    );
  }

  const isVi = language === 'vi';
  const headline = isVi ? skill.headline_vi : skill.headline;
  const description = isVi ? skill.short_description_vi : skill.short_description;
  const overview = isVi ? skill.sections.overview_vi : skill.sections.overview;
  const setup = isVi ? skill.sections.setup_vi : skill.sections.setup;
  const usage = isVi ? skill.sections.usage_vi : skill.sections.usage;

  const handleCopyCommand = () => {
    if (!skill.install_command) return;
    navigator.clipboard.writeText(skill.install_command)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  // Get related skills: same category, maximum 3
  const related = skills
    .filter(s => s.category === skill.category && s.slug !== skill.slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-16">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Navigation */}
        <button 
          onClick={() => navigate('/studio/skills')}
          className="flex items-center gap-2 mb-6 text-sm font-semibold text-[var(--accent-primary)] hover:underline"
        >
          &larr; {t('studio.skills.backToList')}
        </button>

        {/* Content Container */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-8 rounded-2xl border border-[var(--border-primary)]">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] inline-block mb-3">
                {skill.category}
              </span>
              <h1 className="text-3xl font-bold mb-2">{skill.name}</h1>
              <p className="text-lg text-[var(--text-primary)]/80 font-medium mb-4">{headline}</p>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
            </div>

            {/* Tabs */}
            <div className="glass-card rounded-2xl border border-[var(--border-primary)] overflow-hidden">
              <div className="flex border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 py-4 text-center text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'overview' 
                      ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-primary)]/30' 
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t('studio.skills.overview')}
                </button>
                <button
                  onClick={() => setActiveTab('setup')}
                  className={`flex-1 py-4 text-center text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'setup' 
                      ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-primary)]/30' 
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t('studio.skills.setup')}
                </button>
                <button
                  onClick={() => setActiveTab('usage')}
                  className={`flex-1 py-4 text-center text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'usage' 
                      ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] bg-[var(--bg-primary)]/30' 
                      : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {t('studio.skills.usage')}
                </button>
              </div>

              <div className="p-8">
                {activeTab === 'overview' && (
                  <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                    {overview}
                  </div>
                )}
                {activeTab === 'setup' && (
                  <div className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">
                    {setup}
                  </div>
                )}
                {activeTab === 'usage' && (
                  <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-primary)] font-mono text-xs overflow-x-auto text-[var(--text-primary)]">
                    <pre className="whitespace-pre-wrap">{usage}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Metadata Column */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-[var(--border-primary)] space-y-5">
              <h3 className="text-lg font-bold border-b border-[var(--border-primary)] pb-3">Specification</h3>

              {skill.install_command && (
                <div>
                  <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    {t('studio.skills.installCommand')}
                  </h4>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={skill.install_command}
                      className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs font-mono rounded-lg px-3 py-2 text-[var(--text-primary)]"
                    />
                    <button
                      onClick={handleCopyCommand}
                      className="px-3 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {t('studio.skills.author')}
                  </span>
                  <span className="font-medium">{skill.author}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {t('studio.skills.difficulty')}
                  </span>
                  <span className="font-medium">{skill.difficulty || 'General'}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {t('studio.skills.timeSaving')}
                  </span>
                  <span className="font-medium text-[var(--accent-primary)]">{skill.estimated_time_saving || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    {t('studio.skills.tier')}
                  </span>
                  <span className="font-medium">{skill.tier || 'Standard'}</span>
                </div>
              </div>

              {skill.works_with && skill.works_with.length > 0 && (
                <div>
                  <span className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
                    {t('studio.skills.worksWith')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {skill.works_with.map(item => (
                      <span key={item} className="text-xs px-2.5 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {skill.source_repo_url && (
                <div className="pt-2">
                  <a
                    href={skill.source_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center block px-4 py-2.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 border border-[var(--border-primary)] rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t('studio.skills.sourceRepo')} &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Skills */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">{t('studio.skills.relatedSkills')}</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {related.map(s => {
                const sHeadline = isVi ? s.headline_vi : s.headline;
                return (
                  <div
                    key={s.slug}
                    onClick={() => navigate(`/studio/skills/${s.slug}`)}
                    className="glass-card p-5 rounded-xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all cursor-pointer hover:-translate-y-0.5"
                  >
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] mb-2 inline-block">
                      {s.category}
                    </span>
                    <h4 className="font-bold text-base mb-1 line-clamp-1">{s.name}</h4>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{sHeadline}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
