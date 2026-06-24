import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
}

export default function SkillsPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedTier, setSelectedTier] = useState('');

  useEffect(() => {
    fetch('/data/skills.json')
      .then(res => res.json())
      .then(data => {
        setSkills(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading skills:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Extract unique categories, difficulties, tiers
  const categories = Array.from(new Set(skills.map(s => s.category).filter(Boolean)));
  const difficulties = Array.from(new Set(skills.map(s => s.difficulty).filter(Boolean)));
  const tiers = Array.from(new Set(skills.map(s => s.tier).filter(Boolean)));

  // Filter Logic
  const filteredSkills = skills.filter(skill => {
    const isVi = language === 'vi';
    const headline = isVi ? skill.headline_vi : skill.headline;
    const description = isVi ? skill.short_description_vi : skill.short_description;
    
    const matchesSearch = 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = !selectedCategory || skill.category === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || skill.difficulty === selectedDifficulty;
    const matchesTier = !selectedTier || skill.tier === selectedTier;

    return matchesSearch && matchesCategory && matchesDifficulty && matchesTier;
  });

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'gold': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'silver': return 'bg-slate-400/10 text-slate-300 border-slate-400/30';
      case 'bronze': return 'bg-orange-700/10 text-orange-400 border-orange-700/30';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-16">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/studio')}
          className="flex items-center gap-2 mb-6 text-sm font-semibold text-[var(--accent-primary)] hover:underline"
        >
          &larr; {t('app.back')}
        </button>

        {/* Title */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent pb-2">
            {t('studio.skills.title')}
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            {t('studio.skills.subtitle')}
          </p>
        </header>

        {/* Filters Panel */}
        <div className="glass-card p-6 rounded-2xl border border-[var(--border-primary)] mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder={t('studio.skills.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">{t('studio.skills.allCategories')}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">{t('studio.skills.allDifficulties')}</option>
              {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
              className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] col-span-2 sm:col-span-1 focus:outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">{t('studio.skills.tier')} (All)</option>
              {tiers.map(tOption => <option key={tOption} value={tOption}>{tOption}</option>)}
            </select>
          </div>
        </div>

        {/* Skills Grid */}
        {filteredSkills.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            {t('studio.skills.noSkillsFound')}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSkills.map(skill => {
              const isVi = language === 'vi';
              const headline = isVi ? skill.headline_vi : skill.headline;
              const shortDesc = isVi ? skill.short_description_vi : skill.short_description;

              return (
                <div
                  key={skill.slug}
                  onClick={() => navigate(`/studio/skills/${skill.slug}`)}
                  className="group glass-card p-6 rounded-2xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col h-full cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                      {skill.category}
                    </span>
                    {skill.tier && (
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${getTierColor(skill.tier)}`}>
                        {skill.tier.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--accent-primary)] transition-colors line-clamp-1">
                    {skill.name}
                  </h3>

                  <h4 className="text-sm font-semibold mb-3 text-[var(--text-primary)]/80 line-clamp-2">
                    {headline}
                  </h4>

                  <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-4 flex-1">
                    {shortDesc}
                  </p>

                  <div className="border-t border-[var(--border-primary)] pt-4 mt-auto flex justify-between items-center text-xs text-[var(--text-secondary)]">
                    <div>
                      {t('studio.skills.timeSaving')}: <span className="font-semibold text-[var(--text-primary)]">{skill.estimated_time_saving || 'N/A'}</span>
                    </div>
                    <div className="text-right">
                      By <span className="font-semibold text-[var(--text-primary)]">{skill.author}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
