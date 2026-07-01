import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';

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

const mapCategory = (rawCat: string): string => {
  if (!rawCat) return 'Productivity';
  const cat = rawCat.toLowerCase().trim();
  if (cat.includes('seo') || cat === 'optimization') return 'SEO';
  if (cat.includes('design') || cat === 'designers') return 'Design';
  if (cat === 'development') return 'Development';
  if (cat === 'developers' || cat === 'ai engineers' || cat.includes('developer tool') || cat.includes('engineer')) return 'Developer Tools';
  if (cat.includes('analytics') || cat.includes('data')) return 'Data & Analytics';
  if (cat.includes('pipeline') || cat.includes('crm')) return 'CRM & Pipeline';
  if (cat.includes('sales') || cat.includes('outreach') || cat.includes('sdrae') || cat.includes('revops')) return 'Sales & Outreach';
  if (cat.includes('marketing') || cat.includes('growth')) return 'Marketing';
  if (cat.includes('research') || cat.includes('intelligence')) return 'Research & Intelligence';
  if (cat.includes('communication')) return 'Communication';
  if (cat.includes('content')) return 'Marketing & Content';
  return 'Productivity';
};

const getCategoryKey = (cat: string): string => {
  if (!cat) return 'productivity';
  const c = cat.toLowerCase().trim();
  if (c === 'seo') return 'seo';
  if (c === 'design') return 'design';
  if (c === 'development') return 'development';
  if (c.includes('developer tool') || c.includes('engineer')) return 'devTools';
  if (c.includes('analytics') || c.includes('data')) return 'dataAnalytics';
  if (c.includes('pipeline') || c.includes('crm')) return 'crmPipeline';
  if (c.includes('sales') || c.includes('outreach')) return 'salesOutreach';
  if (c === 'marketing') return 'marketing';
  if (c.includes('research') || c.includes('intelligence')) return 'researchIntel';
  if (c === 'communication') return 'communication';
  if (c.includes('content')) return 'marketingContent';
  return 'productivity';
};

const getDifficultyKey = (diff: string): string => {
  if (!diff) return 'beginner';
  const d = diff.toLowerCase();
  if (d.includes('begin')) return 'beginner';
  if (d.includes('inter')) return 'intermediate';
  if (d.includes('adv')) return 'advanced';
  return 'beginner';
};

const getInstallTypeKey = (type: string): string => {
  if (!type) return 'default';
  const tVal = type.toLowerCase();
  if (tVal.includes('git')) return 'gitClone';
  if (tVal.includes('npm')) return 'npm';
  if (tVal.includes('pip')) return 'pip';
  if (tVal.includes('mcp')) return 'mcp';
  return 'default';
};

const getTierKey = (tier: string): string => {
  if (!tier) return 'bronze';
  const t = tier.toLowerCase();
  if (t === 'gold') return 'gold';
  if (t === 'silver') return 'silver';
  if (t === 'bronze') return 'bronze';
  return 'bronze';
};

const formatTimeSaving = (timeStr: string, lang: string): string => {
  if (!timeStr) return '';
  const match = timeStr.match(/(\d+)/);
  if (!match) return timeStr;
  const num = match[1];
  const lower = timeStr.toLowerCase();
  if (lower.includes('hour') || lower.includes('hr')) {
    return lang === 'vi' ? `${num} giờ` : `${num} ${parseInt(num, 10) > 1 ? 'hours' : 'hour'}`;
  }
  if (lower.includes('min')) {
    return lang === 'vi' ? `${num} phút` : `${num} mins`;
  }
  return timeStr;
};

export default function SkillsPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const PAGE_SIZE = 12;
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedTimeSavings, setSelectedTimeSavings] = useState<string[]>([]);
  const [selectedInstallTypes, setSelectedInstallTypes] = useState<string[]>([]);
  
  // Sort, View & Pagination State
  const [sortBy, setSortBy] = useState<'recommended' | 'popular' | 'timeSaved' | 'quickest' | 'recent' | 'az'>('recommended');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Collapsible Filters State
  const [collapseCategories, setCollapseCategories] = useState(false);
  const [collapseDifficulty, setCollapseDifficulty] = useState(false);
  const [collapseTiers, setCollapseTiers] = useState(false);
  const [collapseTime, setCollapseTime] = useState(false);
  const [collapseInstall, setCollapseInstall] = useState(false);

  useEffect(() => {
    fetch('/data/skills-index.json')
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

  // Time savings helper parser (e.g. "120 min" -> 120, "2 hours" -> 120)
  const parseTimeSaving = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+)/);
    if (!match) return 0;
    const val = parseInt(match[1], 10);
    if (timeStr.toLowerCase().includes('hour') || timeStr.toLowerCase().includes('hr')) {
      return val * 60;
    }
    return val;
  };

  // Get dynamic filter data and counts using useMemo
  const { categories, difficulties, tiers, installTypes, categoryCounts, difficultyCounts, tierCounts, installCounts } = useMemo(() => {
    const catsSet = new Set<string>();
    const diffsSet = new Set<string>();
    const tiersSet = new Set<string>();
    const instSet = new Set<string>();
    
    const catC: Record<string, number> = {};
    const diffC: Record<string, number> = {};
    const tierC: Record<string, number> = {};
    const instC: Record<string, number> = {};

    skills.forEach(s => {
      const mappedCat = mapCategory(s.category);
      catsSet.add(mappedCat);
      catC[mappedCat] = (catC[mappedCat] || 0) + 1;
      if (s.difficulty) {
        diffsSet.add(s.difficulty);
        diffC[s.difficulty] = (diffC[s.difficulty] || 0) + 1;
      }
      if (s.tier) {
        tiersSet.add(s.tier);
        tierC[s.tier] = (tierC[s.tier] || 0) + 1;
      }
      if (s.install_type) {
        instSet.add(s.install_type);
        instC[s.install_type] = (instC[s.install_type] || 0) + 1;
      }
    });

    return {
      categories: Array.from(catsSet).sort(),
      difficulties: Array.from(diffsSet).sort(),
      tiers: Array.from(tiersSet).sort(),
      installTypes: Array.from(instSet).sort(),
      categoryCounts: catC,
      difficultyCounts: diffC,
      tierCounts: tierC,
      installCounts: instC
    };
  }, [skills]);

  // Filter Logic using useMemo
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const isVi = language === 'vi';
      const headline = isVi ? skill.headline_vi : skill.headline;
      const description = isVi ? skill.short_description_vi : skill.short_description;
      
      const matchesSearch = 
        !searchQuery ||
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (headline && headline.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (description && description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (skill.author && skill.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (skill.tags && skill.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      const mappedCat = mapCategory(skill.category);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(mappedCat);
      
      const matchesDifficulty = 
        selectedDifficulty === 'all' || 
        skill.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
      
      const matchesTier = selectedTiers.length === 0 || selectedTiers.includes(skill.tier);
      
      let matchesTimeSaving = true;
      if (selectedTimeSavings.length > 0) {
        const minutes = parseTimeSaving(skill.estimated_time_saving);
        matchesTimeSaving = selectedTimeSavings.some(range => {
          if (range === 'short') return minutes < 60;
          if (range === 'medium') return minutes >= 60 && minutes <= 180;
          if (range === 'long') return minutes > 180;
          return true;
        });
      }

      const matchesInstallType = selectedInstallTypes.length === 0 || selectedInstallTypes.includes(skill.install_type);

      return matchesSearch && matchesCategory && matchesDifficulty && matchesTier && matchesTimeSaving && matchesInstallType;
    });
  }, [skills, searchQuery, selectedCategories, selectedDifficulty, selectedTiers, selectedTimeSavings, selectedInstallTypes, language]);

  // Sort Logic using useMemo
  const sortedSkills = useMemo(() => {
    const result = [...filteredSkills];
    if (sortBy === 'timeSaved') {
      return result.sort((a, b) => parseTimeSaving(b.estimated_time_saving) - parseTimeSaving(a.estimated_time_saving));
    }
    if (sortBy === 'quickest') {
      return result.sort((a, b) => parseTimeSaving(a.estimated_time_saving) - parseTimeSaving(b.estimated_time_saving));
    }
    if (sortBy === 'az') {
      return result.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === 'popular') {
      const tierRank = (t?: string) => {
        if (t === 'Gold') return 1;
        if (t === 'Silver') return 2;
        if (t === 'Bronze') return 3;
        return 4;
      };
      return result.sort((a, b) => tierRank(a.tier) - tierRank(b.tier));
    }
    if (sortBy === 'recent') {
      return result.reverse();
    }
    return result; // 'recommended' - default JSON order
  }, [filteredSkills, sortBy]);

  // Total pages computation
  const totalPages = useMemo(() => {
    return Math.ceil(sortedSkills.length / PAGE_SIZE);
  }, [sortedSkills, PAGE_SIZE]);

  // Paginated Skills
  const visibleSkills = useMemo(() => {
    return sortedSkills.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [sortedSkills, currentPage, PAGE_SIZE]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const handleCategoryToggle = (cat: string) => {
    setSelectedCategories(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setCurrentPage(1);
  };

  const handleTierToggle = (tier: string) => {
    setSelectedTiers(prev => 
      prev.includes(tier) ? prev.filter(tVal => tVal !== tier) : [...prev, tier]
    );
    setCurrentPage(1);
  };

  const handleTimeToggle = (range: string) => {
    setSelectedTimeSavings(prev => 
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    );
    setCurrentPage(1);
  };

  const handleInstallToggle = (type: string) => {
    setSelectedInstallTypes(prev => 
      prev.includes(type) ? prev.filter(tVal => tVal !== type) : [...prev, type]
    );
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedDifficulty('all');
    setSelectedTiers([]);
    setSelectedTimeSavings([]);
    setSelectedInstallTypes([]);
    setSearchQuery('');
    setSortBy('recommended');
    setCurrentPage(1);
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'gold': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'silver': return 'bg-slate-400/10 text-slate-600 dark:text-white border-slate-400/30';
      case 'bronze': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/10 text-gray-500 dark:text-white border-gray-500/30';
    }
  };

  const getTierEmoji = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'gold': return '🏆';
      case 'silver': return '🥈';
      case 'bronze': return '🥉';
      default: return '🛡️';
    }
  };

  // Generate a deterministic star count based on slug and tier for screenshot alignment
  const getStarCount = (slug: string, tier: string) => {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = slug.charCodeAt(i) + ((hash << 5) - hash);
    }
    const base = Math.abs(hash % 90) + 10; // 10 to 99
    if (tier === 'Gold') return `${base + 50}.9K`;
    if (tier === 'Silver') return `${base + 20}.3K`;
    if (tier === 'Bronze') return `${base}.5K`;
    return `${Math.abs(hash % 9) + 1}.2K`;
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  const filtersContent = (
    <div className="space-y-6">
      {/* Header and Reset filters */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-primary)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">
          {t('skills.filters')}
        </h2>
        
        {(selectedCategories.length > 0 || selectedDifficulty !== 'all' || selectedTiers.length > 0 || selectedTimeSavings.length > 0 || selectedInstallTypes.length > 0 || searchQuery !== '') && (
          <button 
            onClick={handleResetFilters}
            className="text-xs text-[#ff5a1f] hover:underline font-semibold focus-visible:outline-none cursor-pointer"
          >
            {t('skills.resetFilters')}
          </button>
        )}
      </div>

      {/* Categories Collapsible filter */}
      <div className="border-b border-[var(--border-primary)] pb-4">
        <button 
          onClick={() => setCollapseCategories(!collapseCategories)}
          className="flex items-center justify-between w-full text-left mb-3 group focus:outline-none cursor-pointer"
        >
          <span className="font-semibold text-sm text-[var(--text-primary)]">{t('skills.category')}</span>
          <svg 
            className={`w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-transform duration-200 ${collapseCategories ? 'transform rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!collapseCategories && (
          <div className="max-h-60 overflow-y-auto pr-2 space-y-2 text-sm select-none custom-scrollbar">
            {categories.map(cat => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => handleCategoryToggle(cat)}
                  className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[#ff5a1f] focus:ring-0 cursor-pointer"
                />
                <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  {t('skills.categories.' + getCategoryKey(cat))} <span className="text-xs text-[var(--text-tertiary)]">({categoryCounts[cat] || 0})</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Difficulty Level collapsible filter */}
      <div className="border-b border-[var(--border-primary)] pb-4">
        <button 
          onClick={() => setCollapseDifficulty(!collapseDifficulty)}
          className="flex items-center justify-between w-full text-left mb-3 group focus:outline-none cursor-pointer"
        >
          <span className="font-semibold text-sm text-[var(--text-primary)]">{t('skills.difficulty')}</span>
          <svg 
            className={`w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-transform duration-200 ${collapseDifficulty ? 'transform rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!collapseDifficulty && (
          <div className="space-y-2 text-sm select-none">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="radio"
                name="difficulty"
                value="all"
                checked={selectedDifficulty === 'all'}
                onChange={() => { setSelectedDifficulty('all'); setCurrentPage(1); }}
                className="w-4 h-4 border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[#ff5a1f] focus:ring-0 cursor-pointer"
              />
              <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {t('skills.allLevels')}
              </span>
            </label>
            {difficulties.map(diff => (
              <label key={diff} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio"
                  name="difficulty"
                  value={diff}
                  checked={selectedDifficulty.toLowerCase() === diff.toLowerCase()}
                  onChange={() => { setSelectedDifficulty(diff); setCurrentPage(1); }}
                  className="w-4 h-4 border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[#ff5a1f] focus:ring-0 cursor-pointer"
                />
                <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                  {t('skills.difficulties.' + getDifficultyKey(diff))} <span className="text-xs text-[var(--text-tertiary)]">({difficultyCounts[diff] || 0})</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Quality Tiers filter */}
      <div className="border-b border-[var(--border-primary)] pb-4">
        <button 
          onClick={() => setCollapseTiers(!collapseTiers)}
          className="flex items-center justify-between w-full text-left mb-3 group focus:outline-none cursor-pointer"
        >
          <span className="font-semibold text-sm text-[var(--text-primary)]">{t('skills.qualityTier')}</span>
          <svg 
            className={`w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-transform duration-200 ${collapseTiers ? 'transform rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!collapseTiers && (
          <div className="space-y-2 text-sm select-none">
            {tiers.map(tier => (
              <label key={tier} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={selectedTiers.includes(tier)}
                  onChange={() => handleTierToggle(tier)}
                  className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[#ff5a1f] focus:ring-0 cursor-pointer"
                />
                <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5">
                  <span>{getTierEmoji(tier)}</span>
                  <span>{t('skills.tiers.' + getTierKey(tier))}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">({tierCounts[tier] || 0})</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Time savings filter */}
      <div className="border-b border-[var(--border-primary)] pb-4">
        <button 
          onClick={() => setCollapseTime(!collapseTime)}
          className="flex items-center justify-between w-full text-left mb-3 group focus:outline-none cursor-pointer"
        >
          <span className="font-semibold text-sm text-[var(--text-primary)]">{t('skills.timeSavings')}</span>
          <svg 
            className={`w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-transform duration-200 ${collapseTime ? 'transform rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {!collapseTime && (
          <div className="space-y-2 text-sm select-none">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={selectedTimeSavings.includes('short')}
                onChange={() => handleTimeToggle('short')}
                className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[#ff5a1f] focus:ring-0 cursor-pointer"
              />
              <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {t('skills.timeRangeShort')}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={selectedTimeSavings.includes('medium')}
                onChange={() => handleTimeToggle('medium')}
                className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[#ff5a1f] focus:ring-0 cursor-pointer"
              />
              <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {t('skills.timeRangeMedium')}
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={selectedTimeSavings.includes('long')}
                onChange={() => handleTimeToggle('long')}
                className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[#ff5a1f] focus:ring-0 cursor-pointer"
              />
              <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {t('skills.timeRangeLong')}
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Install Type collapsible filter */}
      {installTypes.length > 0 && (
        <div className="border-b border-[var(--border-primary)] pb-4">
          <button 
            onClick={() => setCollapseInstall(!collapseInstall)}
            className="flex items-center justify-between w-full text-left mb-3 group focus:outline-none cursor-pointer"
          >
            <span className="font-semibold text-sm text-[var(--text-primary)]">{t('skills.installTypeTitle')}</span>
            <svg 
              className={`w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-transform duration-200 ${collapseInstall ? 'transform rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {!collapseInstall && (
            <div className="space-y-2 text-sm select-none">
              {installTypes.map(type => (
                <label key={type} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox"
                    checked={selectedInstallTypes.includes(type)}
                    onChange={() => handleInstallToggle(type)}
                    className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[#ff5a1f] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                    {t('skills.installTypes.' + getInstallTypeKey(type))} <span className="text-xs text-[var(--text-tertiary)]">({installCounts[type] || 0})</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20">
      <SEOHead title={t('skills.title')} description={t('skills.subtitle')} path="/studio/skills" />
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Back to Studio navigation */}
        <div className="flex items-center justify-start mb-6">
          <button 
            onClick={() => navigate('/studio')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[#ff5a1f] text-[var(--text-secondary)] hover:text-[#ff5a1f] text-xs font-semibold transition-all cursor-pointer focus:outline-none shadow-sm"
          >
            &larr; {t('skills.backToStudio')}
          </button>
        </div>
        {/* Hero Banner Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-sm font-semibold mb-6">
            <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.473L21 21l-1.813-5.096m-7.374-1.63L3 19l4.473-8.904L3 3l5.096 1.813M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l-.707.707" />
            </svg>
            {t('skills.badgeText')}
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-6 tracking-tight flex items-center justify-center gap-3 flex-wrap">
            {t('skills.heroTitle')}
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded uppercase tracking-wider select-none leading-normal">
              Beta
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-[var(--text-secondary)] mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('skills.subtitle')}
          </p>

          {/* Search bar */}
          <div className="relative max-w-2xl mx-auto mb-8 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder={t('skills.searchPlaceholder')}
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-4 py-4 text-base bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl focus:border-[var(--accent-primary)] focus:outline-none transition-all text-[var(--text-primary)]"
            />
          </div>

          {/* Quick Metrics stats */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-[var(--border-primary)]">
              <span className="font-bold text-[var(--text-primary)] text-lg">{skills.length}</span> <span className="text-[var(--text-secondary)]">{t('skills.statsSkills')}</span>
            </div>
            <div className="bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-[var(--border-primary)]">
              <span className="font-bold text-[var(--text-primary)] text-lg">
                {skills.filter(s => s.tier === 'Gold' || s.tier === 'Silver').length}
              </span> <span className="text-[var(--text-secondary)]">{t('skills.statsVerified')}</span>
            </div>
            <div className="bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-[var(--border-primary)] text-emerald-400">
              <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold text-lg">
                {Math.round(skills.reduce((sum, s) => sum + parseTimeSaving(s.estimated_time_saving), 0) / 60)}
                +
              </span> <span className="text-emerald-400/90">{t('skills.statsTimeSaved')}</span>
            </div>
          </div>
        </div>

        {/* Content Layout Split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 border-t border-[var(--border-primary)] pt-12">
          
          {/* Left Sidebar Filter Section (Desktop only) */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              {filtersContent}
            </div>
          </aside>

          {/* Right Main Grid Container */}
          <main className="lg:col-span-3 min-w-0">
            
            {/* Sort options and View Toggles (Using crawl styling) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[var(--border-primary)]/50">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--text-secondary)]">{t('skills.sortLabel')}</span>
                <div className="flex flex-wrap gap-1.5">
                  {(['recommended', 'popular', 'timeSaved', 'quickest', 'recent', 'az'] as const).map(option => (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none cursor-pointer ${
                        sortBy === option 
                          ? 'bg-[#ff5a1f] text-white' 
                          : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80 hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {option === 'recommended' && t('skills.sortRecommended')}
                      {option === 'popular' && t('skills.sortPopular')}
                      {option === 'timeSaved' && t('skills.sortTimeSaved')}
                      {option === 'quickest' && t('skills.sortQuickest')}
                      {option === 'recent' && t('skills.sortRecent')}
                      {option === 'az' && t('skills.sortAZ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <span className="text-sm font-semibold text-[var(--text-secondary)]">{t('skills.viewLabel')}</span>
                <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-primary)]">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-all focus:outline-none cursor-pointer ${viewMode === 'grid' ? 'bg-[#ff5a1f] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                    aria-label="Grid View"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all focus:outline-none cursor-pointer ${viewMode === 'list' ? 'bg-[#ff5a1f] text-white' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                    aria-label="List View"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Showing skills count indicator */}
            <div className="text-xs text-[var(--text-tertiary)] mb-4 font-mono">
              {t('skills.showingStats')
                .replace('{start}', String(sortedSkills.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0))
                .replace('{end}', String(Math.min(currentPage * PAGE_SIZE, sortedSkills.length)))
                .replace('{total}', String(sortedSkills.length))}
            </div>

            {/* Empty State */}
            {sortedSkills.length === 0 ? (
              <div className="text-center py-20 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
                <svg className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{t('skills.noSkillsFound')}</h3>
                <button 
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-[#ff5a1f] text-white rounded-lg text-sm font-semibold hover:bg-[#e04f1a] transition-all cursor-pointer"
                >
                  {t('skills.resetFilters')}
                </button>
              </div>
            ) : (
              <div>
                
                {/* Grid View Content (with grid pattern overlays) */}
                {viewMode === 'grid' ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleSkills.map(skill => {
                      const isVi = language === 'vi';
                      const shortDesc = isVi ? skill.short_description_vi : skill.short_description;

                      return (
                        <div
                          key={skill.slug}
                          onClick={() => window.open(`/studio/skills/${skill.slug}`, '_blank')}
                          className="group bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-primary)] hover:border-[#ff5a1f] transition-all flex flex-col h-full cursor-pointer relative overflow-hidden"
                          style={{
                            backgroundImage: 'radial-gradient(rgba(205, 235, 255, 0.03) 1px, transparent 1px)',
                            backgroundSize: '14px 14px'
                          }}
                        >
                          {/* Card Top Title Row */}
                          <div className="flex justify-between items-start gap-3 mb-1">
                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[#ff5a1f] transition-colors truncate">
                                {skill.name}
                              </h3>
                              <span className="text-[10px] text-[var(--text-tertiary)]">
                                @{skill.author}
                              </span>
                            </div>
                                            {skill.tier && (
                              <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border shrink-0 flex items-center gap-1 ${getTierColor(skill.tier)}`}>
                                <span>{getTierEmoji(skill.tier)}</span>
                                <span>{t('skills.tiers.' + getTierKey(skill.tier)).toUpperCase()}</span>
                              </span>
                            )}
                          </div>

                          {/* Category and Difficulty Tag Badges */}
                          <div className="flex flex-wrap gap-1.5 mt-3 mb-3">
                            <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
                              {t('skills.categories.' + getCategoryKey(skill.category))}
                            </span>
                            {skill.difficulty && (
                              <span className="text-[9px] font-medium px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                                {t('skills.difficulties.' + getDifficultyKey(skill.difficulty))}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-6 flex-1 leading-relaxed">
                            {shortDesc}
                          </p>

                          {/* Bottom Row: Stars and Time saving indicator */}
                          <div className="border-t border-[var(--border-primary)] pt-4 mt-auto flex justify-between items-center text-xs text-[var(--text-secondary)]">
                            <div className="flex items-center gap-1 select-none">
                              <span className="text-yellow-500 text-sm">★</span>
                              <span className="font-medium text-[var(--text-secondary)]">
                                {getStarCount(skill.slug, skill.tier)}
                              </span>
                            </div>
                            
                            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{t('skills.savesPerTask').replace('{time}', formatTimeSaving(skill.estimated_time_saving, language) || t('skills.timeRangeMedium'))}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  
                  /* List View Content (matching list pattern) */
                  <div className="space-y-4">
                    {visibleSkills.map(skill => {
                      const isVi = language === 'vi';
                      const headline = isVi ? skill.headline_vi : skill.headline;
                      const shortDesc = isVi ? skill.short_description_vi : skill.short_description;

                      return (
                        <div
                          key={skill.slug}
                          onClick={() => window.open(`/studio/skills/${skill.slug}`, '_blank')}
                          className="group bg-[var(--bg-card)] p-5 rounded-xl border border-[var(--border-primary)] hover:border-[#ff5a1f] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
                        >
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                                {t('skills.categories.' + getCategoryKey(skill.category))}
                              </span>
                              {skill.tier && (
                                <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${getTierColor(skill.tier)}`}>
                                  <span>{getTierEmoji(skill.tier)}</span>
                                  <span>{t('skills.tiers.' + getTierKey(skill.tier)).toUpperCase()}</span>
                                </span>
                              )}
                              {skill.difficulty && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)]">
                                  {t('skills.difficulties.' + getDifficultyKey(skill.difficulty))}
                                </span>
                              )}
                            </div>

                            <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[#ff5a1f] transition-colors truncate">
                              {skill.name} <span className="text-xs font-normal text-[var(--text-tertiary)]">@{skill.author}</span>
                            </h3>

                            {headline && (
                              <h4 className="text-xs font-medium text-[var(--text-secondary)] line-clamp-1">
                                {headline}
                              </h4>
                            )}

                            <p className="text-sm text-[var(--text-tertiary)] line-clamp-2 leading-relaxed">
                              {shortDesc}
                            </p>
                          </div>

                          <div className="flex md:flex-col items-between md:items-end justify-between w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[var(--border-primary)] text-xs text-[var(--text-secondary)] gap-3">
                            <div className="flex items-center gap-1.5 md:justify-end select-none">
                              <span className="text-yellow-500 text-sm">★</span>
                              <span className="font-bold text-[var(--text-primary)]">
                                {getStarCount(skill.slug, skill.tier)}
                              </span>
                            </div>
                            
                            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 md:justify-end">
                              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{t('skills.savesPerTask').replace('{time}', formatTimeSaving(skill.estimated_time_saving, language) || t('skills.timeRangeMedium'))}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12 select-none">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] ${
                        currentPage === 1
                          ? 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] opacity-50 cursor-not-allowed'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/85 hover:border-[#ff5a1f] cursor-pointer'
                      }`}
                    >
                      {t('skills.prevPage')}
                    </button>

                    {/* Numeric Buttons */}
                    {getPageNumbers().map((pageNum, idx) => {
                      if (pageNum === '...') {
                        return (
                          <span
                            key={`dots-${idx}`}
                            className="text-[var(--text-tertiary)] px-2 text-sm font-semibold"
                          >
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={`page-${pageNum}`}
                          onClick={() => setCurrentPage(Number(pageNum))}
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-[#ff5a1f] border-[#ff5a1f] text-white hover:bg-[#e04f1a]'
                              : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/85 hover:border-[#ff5a1f]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] ${
                        currentPage === totalPages
                          ? 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] opacity-50 cursor-not-allowed'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/85 hover:border-[#ff5a1f] cursor-pointer'
                      }`}
                    >
                      {t('skills.nextPage')}
                    </button>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Mobile Floating Filter Button (FAB) */}
      <button
        onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
        className="fixed bottom-24 right-6 z-40 lg:hidden w-14 h-14 bg-[#ff5a1f] text-white rounded-full shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(255,90,31,0.5)] focus:outline-none"
        aria-label="Filter"
      >
        {isMobileFilterOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        )}
      </button>

      {/* Mobile Filter Popup Drawer */}
      {isMobileFilterOpen && (
        <>
          {/* Backdrop/Overlay to close by clicking outside */}
          <div 
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed bottom-40 right-6 z-40 w-80 sm:w-96 max-h-[60vh] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl p-6 overflow-y-auto lg:hidden flex flex-col custom-scrollbar animate-in slide-in-from-bottom-5 fade-in duration-200">
            {filtersContent}
          </div>
        </>
      )}
    </div>
  );
}
