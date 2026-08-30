import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';
import StudioBackButton from '../components/studio/StudioBackButton';
import { FilterGroup, FilterCheckbox, FilterRadio, FilterCount } from '../components/library/FilterGroup';
import LibraryToolbar from '../components/library/LibraryToolbar';
import LibraryPagination from '../components/library/LibraryPagination';
import MobileFilterDrawer from '../components/library/MobileFilterDrawer';
import { getSkills, type Skill } from '../services/skillService';

// Màu nhấn của thư viện Kỹ năng AI — truyền xuống các component lọc dùng chung
const ACCENT = '#ff5a1f';


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

const getCategoryBadgeClass = (category: string): string => {
  const key = getCategoryKey(category);
  switch (key) {
    case 'design': return 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/25';
    case 'development':
    case 'devTools': return 'bg-sky-500/10 text-sky-500 dark:text-sky-400 border-sky-500/25';
    case 'marketing':
    case 'marketingContent': return 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/25';
    case 'seo':
    case 'optimization': return 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/25';
    case 'productivity':
    case 'crmPipeline':
    case 'salesOutreach': return 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/25';
    default: return 'bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-500/25';
  }
};

const getDifficultyBadgeClass = (diff: string): string => {
  const key = getDifficultyKey(diff);
  switch (key) {
    case 'beginner': return 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/25';
    case 'intermediate': return 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/25';
    case 'advanced': return 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/25';
    default: return 'bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 border-yellow-500/25';
  }
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const PAGE_SIZE = 12;

  // Skills raw data
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize from searchParams — mọi bộ lọc đều nằm trong URL nên trạng thái
  // đang xem luôn chia sẻ / tải lại / bấm Back được
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialSearch = searchParams.get('search') || '';
  const initialCat = searchParams.get('category') ? searchParams.get('category')!.split(',') : [];
  const initialTiers = searchParams.get('tier') ? searchParams.get('tier')!.split(',') : [];
  const initialDifficulty = searchParams.get('difficulty') || 'all';
  const initialTimeSavings = searchParams.get('timeSaving') ? searchParams.get('timeSaving')!.split(',') : [];
  const initialInstallTypes = searchParams.get('install_type') ? searchParams.get('install_type')!.split(',') : [];
  const initialSort = (searchParams.get('sort') as any) || 'recommended';

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCat);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(initialDifficulty);
  const [selectedTiers, setSelectedTiers] = useState<string[]>(initialTiers);
  const [selectedTimeSavings, setSelectedTimeSavings] = useState<string[]>(initialTimeSavings);
  const [selectedInstallTypes, setSelectedInstallTypes] = useState<string[]>(initialInstallTypes);
  
  // Sort, View & Pagination State
  const [sortBy, setSortBy] = useState<'recommended' | 'popular' | 'timeSaved' | 'quickest' | 'recent' | 'az'>(initialSort);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(initialPage > 0 ? initialPage : 1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Debounce search input (400ms)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Chỉ về trang 1 khi từ khoá thật sự đổi — nếu không, mở URL có sẵn ?page=3
  // (hoặc bấm Back về trang 3) sẽ bị kéo về trang 1 sau 400ms.
  const lastAppliedSearchRef = useRef(initialSearch);
  useEffect(() => {
    searchTimerRef.current = setTimeout(() => {
      if (lastAppliedSearchRef.current === searchQuery) return;
      lastAppliedSearchRef.current = searchQuery;
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery]);

  // Sync state to URL search parameters — mỗi lần đổi bộ lọc/sắp xếp là một
  // entry lịch sử riêng để nút Back của trình duyệt trả về đúng trạng thái
  // trước đó. Riêng ô tìm kiếm chỉ ghi đè (replace) để gõ phím không đẻ ra
  // hàng chục entry.
  const isFirstRender = useRef(true);
  const prevSearchRef = useRef(initialSearch);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', String(currentPage));
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (selectedCategories.length > 0) params.set('category', selectedCategories.join(','));
    if (selectedTiers.length > 0) params.set('tier', selectedTiers.join(','));
    if (selectedDifficulty !== 'all') params.set('difficulty', selectedDifficulty);
    if (selectedTimeSavings.length > 0) params.set('timeSaving', selectedTimeSavings.join(','));
    if (selectedInstallTypes.length > 0) params.set('install_type', selectedInstallTypes.join(','));
    if (sortBy !== 'recommended') params.set('sort', sortBy);

    // URL đã đúng (thường là do vừa bấm Back/Forward) thì không điều hướng nữa
    const nextQs = params.toString();
    if (nextQs === window.location.search.replace(/^\?/, '')) return;

    const searchChanged = prevSearchRef.current !== debouncedSearch;
    prevSearchRef.current = debouncedSearch;
    setSearchParams(params, { replace: searchChanged });
  }, [
    currentPage, debouncedSearch, selectedCategories, selectedTiers,
    selectedDifficulty, selectedTimeSavings, selectedInstallTypes, sortBy,
    setSearchParams
  ]);

  // URL → state: bấm Back/Forward chỉ đổi query string, không remount trang nên
  // phải đọc lại bộ lọc từ URL. Chỉ set khi lệch để không tạo vòng lặp với
  // effect state → URL ở trên.
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCat = searchParams.get('category') || '';
    const urlTier = searchParams.get('tier') || '';
    const urlDifficulty = searchParams.get('difficulty') || 'all';
    const urlTimeSaving = searchParams.get('timeSaving') || '';
    const urlInstallType = searchParams.get('install_type') || '';
    const urlSort = searchParams.get('sort') || 'recommended';
    const urlPage = parseInt(searchParams.get('page') || '1', 10) || 1;

    lastAppliedSearchRef.current = urlSearch;
    setSearchQuery(prev => (prev === urlSearch ? prev : urlSearch));
    setDebouncedSearch(prev => (prev === urlSearch ? prev : urlSearch));
    setSelectedCategories(prev => (prev.join(',') === urlCat ? prev : urlCat ? urlCat.split(',') : []));
    setSelectedTiers(prev => (prev.join(',') === urlTier ? prev : urlTier ? urlTier.split(',') : []));
    setSelectedDifficulty(prev => (prev === urlDifficulty ? prev : urlDifficulty));
    setSelectedTimeSavings(prev => (prev.join(',') === urlTimeSaving ? prev : urlTimeSaving ? urlTimeSaving.split(',') : []));
    setSelectedInstallTypes(prev => (prev.join(',') === urlInstallType ? prev : urlInstallType ? urlInstallType.split(',') : []));
    setSortBy(prev => (prev === urlSort ? prev : (urlSort as typeof prev)));
    setCurrentPage(prev => (prev === urlPage ? prev : urlPage));
  }, [searchParams]);

  // Load all skills once on mount (with sessionStorage cache)
  useEffect(() => {
    const CACHE_KEY = 'alpha_skills_cache_v3';
    const CACHE_TS_KEY = 'alpha_skills_cache_ts_v3';
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
        const starsA = a.github_stars ?? 0;
        const starsB = b.github_stars ?? 0;
        if (starsA !== starsB) return starsB - starsA;
        
        // Fallback to tier rank
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
      
      // 'recommended' or default: Tier rank first (Gold > Silver > Bronze), then stars descending
      const rankA = sortTierOrder[a.tier] ?? 4;
      const rankB = sortTierOrder[b.tier] ?? 4;
      if (rankA !== rankB) return rankA - rankB;
      
      const starsA = a.github_stars ?? 0;
      const starsB = b.github_stars ?? 0;
      if (starsA !== starsB) return starsB - starsA;
      
      return a.name.localeCompare(b.name);
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

  // Return actual GitHub stars if available, formatted cleanly
  const getStarCount = (repoUrl: string, githubStars?: number) => {
    if (!repoUrl || !repoUrl.startsWith('http')) return null;
    
    // Ignore dummy placeholder repos (newsnotfound, copy-editing, popsicle)
    const lowerRepo = repoUrl.toLowerCase();
    if (lowerRepo.includes('newsnotfound') || lowerRepo.includes('copy-editing') || lowerRepo.includes('popsicle')) {
      return null;
    }

    const stars = githubStars ?? 0;
    if (stars >= 1000) {
      return `${(stars / 1000).toFixed(1)}K`;
    }
    return String(stars);
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
        <h2 className="text-lg font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
          <span className="w-1.5 h-4 rounded-full bg-orange-500" />
          {t('skills.filters')}
        </h2>

        {(selectedCategories.length > 0 || selectedDifficulty !== 'all' || selectedTiers.length > 0 || selectedTimeSavings.length > 0 || selectedInstallTypes.length > 0 || searchQuery !== '') && (
          <button
            onClick={handleResetFilters}
            style={{ color: ACCENT }}
            className="text-xs hover:underline font-semibold focus-visible:outline-none cursor-pointer"
          >
            {t('skills.resetFilters')}
          </button>
        )}
      </div>

      <FilterGroup title={t('skills.category')} maxHeight={240} accent="#ff5a1f">
        {categories.map(cat => (
          <FilterCheckbox
            key={cat}
            accent={ACCENT}
            checked={selectedCategories.includes(cat)}
            onChange={() => handleCategoryToggle(cat)}
          >
            {t('skills.categories.' + cat)} <FilterCount value={categoryCounts[cat] || 0} />
          </FilterCheckbox>
        ))}
      </FilterGroup>

      <FilterGroup title={t('skills.difficulty')} accent="#eab308">
        <FilterRadio
          name="difficulty"
          accent={ACCENT}
          checked={selectedDifficulty === 'all'}
          onChange={() => { setSelectedDifficulty('all'); setCurrentPage(1); }}
        >
          {t('skills.allLevels')}
        </FilterRadio>
        {difficulties.map(diff => (
          <FilterRadio
            key={diff}
            name="difficulty"
            accent={ACCENT}
            checked={selectedDifficulty.toLowerCase() === diff.toLowerCase()}
            onChange={() => { setSelectedDifficulty(diff); setCurrentPage(1); }}
          >
            {t('skills.difficulties.' + getDifficultyKey(diff))} <FilterCount value={difficultyCounts[diff] || 0} />
          </FilterRadio>
        ))}
      </FilterGroup>

      <FilterGroup title={t('skills.qualityTier')} accent="#a855f7">
        {tiers.map(tier => (
          <FilterCheckbox
            key={tier}
            accent={ACCENT}
            checked={selectedTiers.includes(tier)}
            onChange={() => handleTierToggle(tier)}
          >
            <span className="inline-flex items-center gap-1.5 align-middle">
              <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border shrink-0 flex items-center gap-1 ${getTierColor(tier)}`}>
                <span>{getTierEmoji(tier)}</span>
                <span>{t('skills.tiers.' + getTierKey(tier)).toUpperCase()}</span>
              </span>
              <FilterCount value={tierCounts[tier] || 0} />
            </span>
          </FilterCheckbox>
        ))}
      </FilterGroup>

      <FilterGroup title={t('skills.timeSavings')} accent="#10b981">
        {(['short', 'medium', 'long'] as const).map(range => (
          <FilterCheckbox
            key={range}
            accent={ACCENT}
            checked={selectedTimeSavings.includes(range)}
            onChange={() => handleTimeToggle(range)}
          >
            {range === 'short' && t('skills.timeRangeShort')}
            {range === 'medium' && t('skills.timeRangeMedium')}
            {range === 'long' && t('skills.timeRangeLong')}
          </FilterCheckbox>
        ))}
      </FilterGroup>

      {installTypes.length > 0 && (
        <FilterGroup title={t('skills.installTypeTitle')} accent="#06b6d4">
          {installTypes.map(type => (
            <FilterCheckbox
              key={type}
              accent={ACCENT}
              checked={selectedInstallTypes.includes(type)}
              onChange={() => handleInstallToggle(type)}
            >
              {t('skills.installTypes.' + getInstallTypeKey(type))} <FilterCount value={installCounts[type] || 0} />
            </FilterCheckbox>
          ))}
        </FilterGroup>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20">
      <SEOHead title={t('skills.title')} description={t('skills.subtitle')} path="/studio/ai-skills" />
      <StudioBackButton to="/studio" />
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-12">
        {/* Header Navigation and Premium Badge Row */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs md:text-sm font-semibold shadow-sm select-none">
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.473L21 21l-1.813-5.096m-7.374-1.63L3 19l4.473-8.904L3 3l5.096 1.813M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l-.707.707" />
            </svg>
            {t('skills.badgeText')}
          </div>
        </div>

        {/* Hero Banner Section */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <img
            src="/skills-logo.png"
            alt="AI Skills Hub"
            className="w-20 h-20 md:w-24 md:h-24 rounded-3xl shadow-xl mx-auto mb-5 object-contain"
          />
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight flex items-center justify-center gap-3 flex-wrap bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 dark:from-orange-400 dark:via-amber-300 dark:to-rose-400 bg-clip-text text-transparent">
            {t('skills.heroTitle')}
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded uppercase tracking-wider select-none leading-normal">
              Beta
            </span>
          </h1>
          
          <p className="text-sm md:text-base text-[var(--text-secondary)] mb-6 max-w-2xl mx-auto leading-relaxed">
            {t('skills.subtitle')}
          </p>

          {/* Search bar */}
          <div className="relative max-w-xl mx-auto mb-6">
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
              className="w-full pl-11 pr-4 py-3.5 text-base bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl focus:border-orange-500 focus:outline-none transition-all text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] shadow-sm"
            />
          </div>

          {/* Quick Metrics stats */}
          <div className="flex flex-wrap justify-center gap-4 text-xs">
            <div className="bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-orange-500/25 bg-orange-500/5 shadow-sm">
              <span className="font-bold text-orange-600 dark:text-orange-400 text-sm">{filterCounts.totalSkills}</span> <span className="text-[var(--text-secondary)]">{t('skills.statsSkills')}</span>
            </div>
            <div className="bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-amber-500/25 bg-amber-500/5 shadow-sm">
              <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                {filterCounts.verifiedCount}
              </span> <span className="text-[var(--text-secondary)]">{t('skills.statsVerified')}</span>
            </div>
            <div className="bg-[var(--bg-card)] px-4 py-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 shadow-sm">
              <svg className="w-3.5 h-3.5 inline mr-1 align-text-top text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {filterCounts.totalTimeSavedHours}+
              </span> <span className="text-[var(--text-secondary)]">{t('skills.statsTimeSaved')}</span>
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
            
            <LibraryToolbar
              sortLabel={t('skills.sortLabel')}
              sortOptions={[
                { value: 'recommended', label: t('skills.sortRecommended') },
                { value: 'popular', label: t('skills.sortPopular') },
                { value: 'timeSaved', label: t('skills.sortTimeSaved') },
                { value: 'quickest', label: t('skills.sortQuickest') },
                { value: 'recent', label: t('skills.sortRecent') },
                { value: 'az', label: t('skills.sortAZ') },
              ]}
              sort={sortBy}
              onSortChange={(value) => setSortBy(value as typeof sortBy)}
              viewLabel={t('skills.viewLabel')}
              view={viewMode}
              onViewChange={setViewMode}
              accent={ACCENT}
            />
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
                          onClick={() => navigate(`/studio/ai-skills/${skill.slug}`)}
                          className="group bg-gradient-to-br from-[var(--bg-card)] to-[rgba(7,17,31,0.6)] p-5 rounded-2xl border border-[var(--border-primary)] hover:border-orange-500/60 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(255,90,31,0.1)] transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden min-h-[200px]"
                          style={{
                            backgroundImage: 'radial-gradient(rgba(205, 235, 255, 0.04) 1.5px, transparent 1.5px)',
                            backgroundSize: '16px 16px'
                          }}
                        >
                          {/* Card Top Title Row */}
                          <div className="flex justify-between items-start gap-3 mb-1">
                            <div className="min-w-0">
                              <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors truncate">
                                {skill.name}
                              </h3>
                              <span className="text-xs text-[var(--text-tertiary)] font-mono">
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
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border ${getCategoryBadgeClass(skill.category)}`}>
                              {t('skills.categories.' + getCategoryKey(skill.category))}
                            </span>
                            {skill.difficulty && (
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border ${getDifficultyBadgeClass(skill.difficulty)}`}>
                                {t('skills.difficulties.' + getDifficultyKey(skill.difficulty))}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          <p className="text-[15px] text-[var(--text-secondary)] line-clamp-3 mb-4 flex-1 leading-relaxed">
                            {shortDesc}
                          </p>

                          {/* Bottom Row: Stars and Time saving indicator */}
                          <div className="border-t border-[var(--border-primary)] pt-3 mt-auto flex justify-between items-center text-xs text-[var(--text-secondary)]">
                            {getStarCount(skill.source_repo_url, skill.github_stars) ? (
                              <div className="flex items-center gap-1 select-none">
                                <span className="text-yellow-500 text-sm">★</span>
                                <span className="font-semibold text-[var(--text-secondary)]">
                                  {getStarCount(skill.source_repo_url, skill.github_stars)}
                                </span>
                              </div>
                            ) : (
                              <div />
                            )}
                            
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
                          onClick={() => navigate(`/studio/ai-skills/${skill.slug}`)}
                          className="group bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-primary)] hover:border-orange-500/60 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,90,31,0.08)] transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
                        >
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border ${getCategoryBadgeClass(skill.category)}`}>
                                {t('skills.categories.' + getCategoryKey(skill.category))}
                              </span>
                              {skill.tier && (
                                <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${getTierColor(skill.tier)}`}>
                                  <span>{getTierEmoji(skill.tier)}</span>
                                  <span>{t('skills.tiers.' + getTierKey(skill.tier)).toUpperCase()}</span>
                                </span>
                              )}
                              {skill.difficulty && (
                                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border ${getDifficultyBadgeClass(skill.difficulty)}`}>
                                  {t('skills.difficulties.' + getDifficultyKey(skill.difficulty))}
                                </span>
                              )}
                            </div>

                            <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors truncate">
                              {skill.name} <span className="text-xs font-normal text-[var(--text-tertiary)] font-mono">@{skill.author}</span>
                            </h3>

                            {headline && (
                              <h4 className="text-sm font-medium text-[var(--text-secondary)] line-clamp-1">
                                {headline}
                              </h4>
                            )}

                            <p className="text-[15px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                              {shortDesc}
                            </p>
                          </div>

                          <div className="flex md:flex-col items-between md:items-end justify-between w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-[var(--border-primary)] text-xs text-[var(--text-secondary)] gap-3">
                            {getStarCount(skill.source_repo_url, skill.github_stars) ? (
                              <div className="flex items-center gap-1.5 md:justify-end select-none">
                                <span className="text-yellow-500 text-sm">★</span>
                                <span className="font-bold text-[var(--text-primary)]">
                                  {getStarCount(skill.source_repo_url, skill.github_stars)}
                                </span>
                              </div>
                            ) : (
                              <div className="md:h-5" />
                            )}
                            
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

                <LibraryPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onChange={(page) => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 350, behavior: 'smooth' });
                  }}
                  prevLabel={t('skills.prevPage')}
                  nextLabel={t('skills.nextPage')}
                  accent={ACCENT}
                />
              </div>
            )}

          </main>
        </div>
      </div>

      {/* Mobile filter FAB + drawer (shared with the event library page) */}
      <MobileFilterDrawer open={isMobileFilterOpen} onToggle={setIsMobileFilterOpen} accent={ACCENT}>
        {filtersContent}
      </MobileFilterDrawer>
    </div>
  );
}
