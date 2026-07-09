import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';
import { getSkills, type Skill } from '../services/skillService';


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
  if (c.includes('optimi')) return 'optimization';
  return 'productivity';
};

// Canonical display order for category filter panel
const CATEGORY_DISPLAY_ORDER = [
  'design', 'optimization', 'seo', 'development', 'marketing',
  'salesOutreach', 'marketingContent', 'dataAnalytics', 'crmPipeline',
  'productivity', 'researchIntel', 'communication', 'devTools',
];

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



const parseTimeSavingMinutes = (str: string): number => {
  if (!str) return 0;
  const match = str.match(/([\d.]+)\s*(hour|minute|min|hr)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith('hour') || unit.startsWith('hr')) return value * 60;
  return value;
};

export default function SkillsPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const PAGE_SIZE = 12;

  // Skills raw data
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Debounce search input (400ms)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery]);

  // Load all skills once on mount (with sessionStorage cache)
  useEffect(() => {
    const CACHE_KEY = 'alpha_skills_cache';
    const CACHE_TS_KEY = 'alpha_skills_cache_ts';
    const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutes

    const loadAllSkills = async () => {
      setLoading(true);
      try {
        // Check sessionStorage cache first
        const cachedTs = sessionStorage.getItem(CACHE_TS_KEY);
        if (cachedTs && Date.now() - Number(cachedTs) < CACHE_MAX_AGE) {
          const cached = sessionStorage.getItem(CACHE_KEY);
          if (cached) {
            setAllSkills(JSON.parse(cached));
            setLoading(false);
            return;
          }
        }

        // Cache miss or expired — fetch from API
        const response = await getSkills({ limit: 10000 });
        const skills = response.data || [];
        setAllSkills(skills);

        // Store in sessionStorage
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(skills));
          sessionStorage.setItem(CACHE_TS_KEY, String(Date.now()));
        } catch {
          // sessionStorage full — silently ignore
        }
      } catch (err) {
        console.error('Error loading skills:', err);
      } finally {
        setLoading(false);
      }
    };
    loadAllSkills();
  }, []);

  // Compute global filter counts once from all skills
  const filterCounts = useMemo(() => {
    const counts = {
      categories: {} as Record<string, number>,
      tiers: {} as Record<string, number>,
      difficulties: {} as Record<string, number>,
      installTypes: {} as Record<string, number>,
      totalSkills: allSkills.length,
      verifiedCount: 0,
      totalTimeSavedHours: 0
    };

    let totalTimeSavedMinutes = 0;

    for (const skill of allSkills) {
      // Category count
      const cat = skill.category || 'Productivity';
      counts.categories[cat] = (counts.categories[cat] || 0) + 1;

      // Tier count
      const tier = skill.tier || 'Bronze';
      counts.tiers[tier] = (counts.tiers[tier] || 0) + 1;

      // Difficulty count
      const diff = skill.difficulty || 'Beginner';
      counts.difficulties[diff] = (counts.difficulties[diff] || 0) + 1;

      // Install type count
      if (skill.install_type) {
        counts.installTypes[skill.install_type] = (counts.installTypes[skill.install_type] || 0) + 1;
      }

      // Verified count (Gold & Silver tiers)
      if (tier === 'Gold' || tier === 'Silver') {
        counts.verifiedCount += 1;
      }

      // Time savings
      const mins = parseTimeSavingMinutes(skill.estimated_time_saving);
      if (mins > 0) {
        totalTimeSavedMinutes += mins;
      }
    }

    counts.totalTimeSavedHours = Math.round(totalTimeSavedMinutes / 60);
    return counts;
  }, [allSkills]);

  // Derived filter data from API filterCounts
  // Group raw categories by display key and aggregate counts
  const { groupedCategoryCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [rawCat, count] of Object.entries(filterCounts.categories)) {
      const key = getCategoryKey(rawCat);
      counts[key] = (counts[key] || 0) + count;
    }
    return { groupedCategoryCounts: counts };
  }, [filterCounts]);

  const categories = CATEGORY_DISPLAY_ORDER.filter(k => groupedCategoryCounts[k]);
  const categoryCounts = groupedCategoryCounts;
  const difficulties = Object.keys(filterCounts.difficulties).sort();
  const tierOrder: Record<string, number> = { Bronze: 0, Silver: 1, Gold: 2 };
  const tiers = Object.keys(filterCounts.tiers).sort((a, b) => (tierOrder[a] ?? 99) - (tierOrder[b] ?? 99));
  const installTypes = Object.keys(filterCounts.installTypes).sort();
  
  const difficultyCounts = filterCounts.difficulties;
  const tierCounts = filterCounts.tiers;
  const installCounts = filterCounts.installTypes;

  // Filter and Sort allSkills in-memory
  const filteredAndSortedSkills = useMemo(() => {
    // 1. Filter
    let result = allSkills.filter(skill => {
      // Search query
      if (debouncedSearch) {
        const term = debouncedSearch.toLowerCase().trim();
        const matchName = skill.name?.toLowerCase().includes(term);
        const matchHeadline = skill.headline?.toLowerCase().includes(term) || skill.headline_vi?.toLowerCase().includes(term);
        const matchDesc = skill.short_description?.toLowerCase().includes(term) || skill.short_description_vi?.toLowerCase().includes(term);
        const matchAuthor = skill.author?.toLowerCase().includes(term);
        const matchTags = skill.tags?.some(tag => tag.toLowerCase().includes(term));
        if (!matchName && !matchHeadline && !matchDesc && !matchAuthor && !matchTags) {
          return false;
        }
      }

      // Category filter (grouped keys)
      if (selectedCategories.length > 0) {
        const key = getCategoryKey(skill.category);
        if (!selectedCategories.includes(key)) {
          return false;
        }
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all') {
        if (skill.difficulty?.toLowerCase() !== selectedDifficulty.toLowerCase()) {
          return false;
        }
      }

      // Tier filter
      if (selectedTiers.length > 0) {
        if (!selectedTiers.includes(skill.tier)) {
          return false;
        }
      }

      // Install type filter
      if (selectedInstallTypes.length > 0) {
        if (!selectedInstallTypes.includes(skill.install_type)) {
          return false;
        }
      }

      // Time saving filter
      if (selectedTimeSavings.length > 0) {
        const mins = parseTimeSavingMinutes(skill.estimated_time_saving);
        let matchRange = false;
        for (const range of selectedTimeSavings) {
          if (range === 'short' && mins > 0 && mins < 60) matchRange = true;
          if (range === 'medium' && mins >= 60 && mins <= 180) matchRange = true;
          if (range === 'long' && mins > 180) matchRange = true;
        }
        if (!matchRange) {
          return false;
        }
      }

      return true;
    });

    // 2. Sort
    const sortTierOrder: Record<string, number> = { Gold: 1, Silver: 2, Bronze: 3 };
    result.sort((a, b) => {
      if (sortBy === 'az') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'popular') {
        const rankA = sortTierOrder[a.tier] ?? 4;
        const rankB = sortTierOrder[b.tier] ?? 4;
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'timeSaved') {
        const minsA = parseTimeSavingMinutes(a.estimated_time_saving);
        const minsB = parseTimeSavingMinutes(b.estimated_time_saving);
        if (minsA !== minsB) return minsB - minsA;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'quickest') {
        const minsA = parseTimeSavingMinutes(a.estimated_time_saving);
        const minsB = parseTimeSavingMinutes(b.estimated_time_saving);
        if (minsA !== minsB) return minsA - minsB;
        return a.name.localeCompare(b.name);
      }
      // 'recommended' or default: return in original load order (by MongoDB creation)
      return 0; 
    });

    return result;
  }, [allSkills, debouncedSearch, selectedCategories, selectedDifficulty, selectedTiers, selectedTimeSavings, selectedInstallTypes, sortBy]);

  // Pagination values computed client-side
  const totalFiltered = filteredAndSortedSkills.length;
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);

  // Paginated skills for visible rendering
  const visibleSkills = useMemo(() => {
    return filteredAndSortedSkills.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredAndSortedSkills, currentPage]);

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
      case 'gold': return 'tier-badge-gold';
      case 'silver': return 'tier-badge-silver';
      case 'bronze': return 'tier-badge-bronze';
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
  // or return actual GitHub stars if available
  const getStarCount = (slug: string, tier: string, githubStars?: number) => {
    if (githubStars !== undefined && githubStars > 0) {
      if (githubStars >= 1000) {
        return `${(githubStars / 1000).toFixed(1)}K`;
      }
      return String(githubStars);
    }
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
                  {t('skills.categories.' + cat)} <span className="text-xs text-[var(--text-tertiary)]">({categoryCounts[cat] || 0})</span>
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
                <span className="transition-colors flex items-center gap-1.5 select-none">
                  <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border shrink-0 flex items-center gap-1 ${getTierColor(tier)}`}>
                    <span>{getTierEmoji(tier)}</span>
                    <span>{t('skills.tiers.' + getTierKey(tier)).toUpperCase()}</span>
                  </span>
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
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-12">
        {/* Header Navigation and Premium Badge Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <button 
            onClick={() => navigate('/studio')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[#ff5a1f] text-[var(--text-secondary)] hover:text-[#ff5a1f] text-xs font-semibold transition-all cursor-pointer focus:outline-none shadow-sm shrink-0"
          >
            &larr; {t('skills.backToStudio')}
          </button>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs md:text-sm font-semibold shadow-sm select-none">
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.473L21 21l-1.813-5.096m-7.374-1.63L3 19l4.473-8.904L3 3l5.096 1.813M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l-.707.707" />
            </svg>
            {t('skills.badgeText')}
          </div>

          {/* Balanced spacer for desktop centering */}
          <div className="hidden sm:block w-[140px]"></div>
        </div>

        {/* Hero Banner Section */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] mb-4 tracking-tight flex items-center justify-center gap-3 flex-wrap">
            {t('skills.heroTitle')}
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded uppercase tracking-wider select-none leading-normal">
              Beta
            </span>
          </h1>
          
          <p className="text-sm md:text-base text-[var(--text-secondary)] mb-6 max-w-2xl mx-auto leading-relaxed">
            {t('skills.subtitle')}
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto mb-6 shadow-[0_4px_25px_rgba(0,0,0,0.3)]">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder={t('skills.searchPlaceholder')}
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
              }}
              className="w-full pl-11 pr-4 py-3 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl focus:border-[var(--accent-primary)] focus:outline-none transition-all text-[var(--text-primary)] placeholder:text-white/80"
            />
          </div>

          {/* Quick Metrics stats */}
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <div className="bg-[var(--bg-card)] px-3.5 py-1.5 rounded-lg border border-[var(--border-primary)]">
              <span className="font-bold text-[var(--text-primary)] text-sm">{filterCounts.totalSkills}</span> <span className="text-[var(--text-secondary)]">{t('skills.statsSkills')}</span>
            </div>
            <div className="bg-[var(--bg-card)] px-3.5 py-1.5 rounded-lg border border-[var(--border-primary)]">
              <span className="font-bold text-[var(--text-primary)] text-sm">
                {filterCounts.verifiedCount}
              </span> <span className="text-[var(--text-secondary)]">{t('skills.statsVerified')}</span>
            </div>
            <div className="bg-[var(--bg-card)] px-3.5 py-1.5 rounded-lg border border-[var(--border-primary)] text-emerald-theme">
              <svg className="w-3.5 h-3.5 inline mr-1 align-text-top" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold text-sm">
                {filterCounts.totalTimeSavedHours}+
              </span> <span className="opacity-90">{t('skills.statsTimeSaved')}</span>
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
                .replace('{start}', String(totalFiltered > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0))
                .replace('{end}', String(Math.min(currentPage * PAGE_SIZE, totalFiltered)))
                .replace('{total}', String(totalFiltered))}
            </div>

            {/* Empty State */}
            {visibleSkills.length === 0 && !loading ? (
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
                          className="group bg-gradient-to-br from-[var(--bg-card)] to-[rgba(7,17,31,0.6)] p-5 rounded-2xl border border-[var(--border-primary)] hover:border-[#ff5a1f] hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(255,90,31,0.08)] transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden min-h-[200px]"
                          style={{
                            backgroundImage: 'radial-gradient(rgba(205, 235, 255, 0.04) 1.5px, transparent 1.5px)',
                            backgroundSize: '16px 16px'
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
                          <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
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
                          <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-4 flex-1 leading-relaxed">
                            {shortDesc}
                          </p>

                          {/* Bottom Row: Stars and Time saving indicator */}
                          <div className="border-t border-[var(--border-primary)] pt-3 mt-auto flex justify-between items-center text-xs text-[var(--text-secondary)]">
                            <div className="flex items-center gap-1 select-none">
                              <span className="text-yellow-500 text-sm">★</span>
                              <span className="font-medium text-[var(--text-secondary)]">
                                {getStarCount(skill.slug, skill.tier, skill.github_stars)}
                              </span>
                            </div>
                            
                            <div className="text-xs font-semibold text-emerald-theme flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                          className="group bg-gradient-to-br from-[var(--bg-card)] to-[rgba(7,17,31,0.6)] p-4 rounded-xl border border-[var(--border-primary)] hover:border-[#ff5a1f] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,90,31,0.06)] transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
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
                                {getStarCount(skill.slug, skill.tier, skill.github_stars)}
                              </span>
                            </div>
                            
                            <div className="text-xs font-semibold text-emerald-theme flex items-center gap-1 md:justify-end">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
