import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';
import StudioBackButton from '../components/studio/StudioBackButton';
import { FilterGroup, FilterCheckbox, FilterRadio, FilterCount } from '../components/library/FilterGroup';
import LibraryToolbar from '../components/library/LibraryToolbar';
import LibraryPagination from '../components/library/LibraryPagination';
import MobileFilterDrawer from '../components/library/MobileFilterDrawer';
import { EventLibraryGridCard, EventLibraryListRow } from '../components/library/EventLibraryCard';
import { useAuth } from '../auth/context';
import {
    getLibraryItems, getLibraryStats, markLibraryItemUsed,
    ITEM_TYPES, CATEGORIES, INDUSTRIES, OBJECTIVES, KPIS,
    BUDGET_TIERS, VERIFICATIONS, DEPTHS,
    type EventLibraryItem, type LibraryFilterCounts, type LibraryStats
} from '../services/eventLibraryService';

// Màu nhấn của thư viện sự kiện — tách khỏi cam của thư viện Kỹ năng AI
const ACCENT = '#7c5cff';
const PAGE_SIZE = 12;

const EMPTY_COUNTS: LibraryFilterCounts = {
    itemTypes: {}, categories: {}, industries: {}, objectives: {},
    kpis: {}, budgetTiers: {}, verifications: {}, depths: {}, ownerships: {}
};

type Scope = 'all' | 'platform' | 'community' | 'mine';

const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter(v => v !== value) : [...list, value];

const STEP_COLORS = [
    { bg: 'bg-violet-500/10 dark:bg-violet-500/20', border: 'border-violet-500/30', num: 'bg-violet-500 text-white', text: 'text-violet-600 dark:text-violet-400' },
    { bg: 'bg-sky-500/10 dark:bg-sky-500/20', border: 'border-sky-500/30', num: 'bg-sky-500 text-white', text: 'text-sky-600 dark:text-sky-400' },
    { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', border: 'border-emerald-500/30', num: 'bg-emerald-500 text-white', text: 'text-emerald-600 dark:text-emerald-400' },
    { bg: 'bg-amber-500/10 dark:bg-amber-500/20', border: 'border-amber-500/30', num: 'bg-amber-500 text-white', text: 'text-amber-600 dark:text-amber-400' },
    { bg: 'bg-rose-500/10 dark:bg-rose-500/20', border: 'border-rose-500/30', num: 'bg-rose-500 text-white', text: 'text-rose-600 dark:text-rose-400' },
];

/** Dải 5 bước "từ case study đến triển khai" nằm dưới hero. */
function JourneyStrip() {
    const { t } = useTranslation();
    const steps = ['analyze', 'pickSkill', 'usePrompt', 'runWorkflow', 'export'] as const;

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 mb-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center gap-5">
                <div className="lg:w-56 shrink-0">
                    <h2 className="text-sm font-bold text-violet-600 dark:text-violet-400 flex items-center gap-2">
                        <span className="w-1.5 h-3.5 rounded-full bg-violet-500" />
                        {t('eventLibrary.journey.title')}
                    </h2>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">{t('eventLibrary.journey.subtitle')}</p>
                </div>
                <div className="flex-1 flex items-center gap-2.5 overflow-x-auto custom-scrollbar pb-1">
                    {steps.map((step, idx) => {
                        const style = STEP_COLORS[idx % STEP_COLORS.length];
                        return (
                            <div key={step} className="flex items-center gap-2.5 shrink-0">
                                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border ${style.bg} ${style.border}`}>
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 shadow-sm ${style.num}`}>
                                        {idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <div className={`text-xs font-bold whitespace-nowrap ${style.text}`}>
                                            {t(`eventLibrary.journey.steps.${step}.title`)}
                                        </div>
                                        <div className="text-[10px] text-[var(--text-tertiary)] whitespace-nowrap">
                                            {t(`eventLibrary.journey.steps.${step}.desc`)}
                                        </div>
                                    </div>
                                </div>
                                {idx < steps.length - 1 && (
                                    <svg className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default function EventLibraryPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [items, setItems] = useState<EventLibraryItem[]>([]);
    const [counts, setCounts] = useState<LibraryFilterCounts>(EMPTY_COUNTS);
    const [stats, setStats] = useState<LibraryStats | null>(null);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [itemType, setItemType] = useState('');
    const [scope, setScope] = useState<Scope>('all');
    const [categories, setCategories] = useState<string[]>([]);
    const [industries, setIndustries] = useState<string[]>([]);
    const [objectives, setObjectives] = useState<string[]>([]);
    const [budgetTiers, setBudgetTiers] = useState<string[]>([]);
    const [kpis, setKpis] = useState<string[]>([]);
    const [verifications, setVerifications] = useState<string[]>([]);
    const [depths, setDepths] = useState<string[]>([]);

    const [sort, setSort] = useState('recent');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => {
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 400);
        return () => clearTimeout(searchTimerRef.current);
    }, [searchQuery]);

    // Mỗi lần đổi bộ lọc đều gọi lại API — danh sách lọc theo quyền xem của
    // từng tài khoản nên không cache được ở client như trang Kỹ năng AI.
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getLibraryItems({
            page, limit: PAGE_SIZE, search: debouncedSearch, scope, sort,
            itemType: itemType || undefined,
            category: categories, industry: industries, objective: objectives,
            kpi: kpis, budgetTier: budgetTiers, verification: verifications, depth: depths
        })
            .then(res => {
                if (cancelled) return;
                setItems(res.data);
                setCounts(res.filterCounts);
                setTotal(res.pagination.total);
            })
            .catch(err => {
                if (!cancelled) console.error('Error loading event library:', err);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [page, debouncedSearch, scope, sort, itemType, categories, industries, objectives, kpis, budgetTiers, verifications, depths]);

    useEffect(() => {
        getLibraryStats().then(setStats).catch(() => setStats(null));
    }, []);

    const resetFilters = () => {
        setCategories([]); setIndustries([]); setObjectives([]);
        setBudgetTiers([]); setKpis([]); setVerifications([]); setDepths([]);
        setScope('all'); setSearchQuery(''); setPage(1);
    };

    const hasActiveFilters = categories.length > 0 || industries.length > 0
        || objectives.length > 0 || budgetTiers.length > 0 || kpis.length > 0
        || verifications.length > 0 || depths.length > 0 || scope !== 'all' || searchQuery !== '';

    const openItem = useCallback((item: EventLibraryItem) => {
        navigate(`/studio/event-library/${item.slug}`);
    }, [navigate]);

    const downloadItem = useCallback((item: EventLibraryItem) => {
        const attachment = item.attachments[0];
        if (!attachment?.url) return;
        markLibraryItemUsed(item.slug);
        window.open(attachment.url, '_blank', 'noopener');
    }, []);

    // Một helper cho cả 7 nhóm lọc nhiều lựa chọn — chúng chỉ khác nhau ở
    // danh sách giá trị, bộ đếm và tiền tố khoá dịch.
    const multiGroup = (
        title: string,
        values: readonly string[],
        selected: string[],
        setSelected: (next: string[]) => void,
        countMap: Record<string, number>,
        i18nPrefix: string,
        maxHeight?: number,
        groupAccent?: string
    ) => (
        <FilterGroup title={title} maxHeight={maxHeight} accent={groupAccent}>
            {values.map(value => (
                <FilterCheckbox
                    key={value}
                    accent={ACCENT}
                    checked={selected.includes(value)}
                    onChange={() => { setSelected(toggle(selected, value)); setPage(1); }}
                >
                    {t(`${i18nPrefix}.${value}`, value)} <FilterCount value={countMap[value] || 0} />
                </FilterCheckbox>
            ))}
        </FilterGroup>
    );

    const filtersContent = (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-primary)]">
                <h2 className="text-lg font-bold text-violet-600 dark:text-violet-400 flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-violet-500" />
                    {t('eventLibrary.filters')}
                </h2>
                {hasActiveFilters && (
                    <button
                        onClick={resetFilters}
                        style={{ color: ACCENT }}
                        className="text-xs hover:underline font-semibold focus-visible:outline-none cursor-pointer"
                    >
                        {t('eventLibrary.resetFilters')}
                    </button>
                )}
            </div>

            {/* Nguồn nội dung — tách nội dung biên tập của web khỏi bài cộng đồng */}
            <FilterGroup title={t('eventLibrary.source')} accent="#7c5cff">
                {(['all', 'platform', 'community'] as const).map(value => (
                    <FilterRadio
                        key={value}
                        name="scope"
                        accent={ACCENT}
                        checked={scope === value}
                        onChange={() => { setScope(value); setPage(1); }}
                    >
                        {t('eventLibrary.scopes.' + value)}
                        {value !== 'all' && (
                            <> <FilterCount value={counts.ownerships[value === 'platform' ? 'platform' : 'user'] || 0} /></>
                        )}
                    </FilterRadio>
                ))}
                {isAuthenticated && (
                    <FilterRadio
                        name="scope"
                        accent={ACCENT}
                        checked={scope === 'mine'}
                        onChange={() => { setScope('mine'); setPage(1); }}
                    >
                        {t('eventLibrary.scopes.mine')}
                    </FilterRadio>
                )}
            </FilterGroup>

            {multiGroup(t('eventLibrary.category'), CATEGORIES, categories, setCategories, counts.categories, 'eventLibrary.categories', undefined, '#8b5cf6')}
            {multiGroup(t('eventLibrary.industry'), INDUSTRIES, industries, setIndustries, counts.industries, 'eventLibrary.industries', 240, '#0284c7')}
            {multiGroup(t('eventLibrary.objective'), OBJECTIVES, objectives, setObjectives, counts.objectives, 'eventLibrary.objectives', undefined, '#10b981')}
            {multiGroup(t('eventLibrary.budget'), BUDGET_TIERS, budgetTiers, setBudgetTiers, counts.budgetTiers, 'eventLibrary.budgetTiers', undefined, '#f59e0b')}
            {multiGroup(t('eventLibrary.kpi'), KPIS, kpis, setKpis, counts.kpis, 'eventLibrary.kpis', undefined, '#ec4899')}
            {multiGroup(t('eventLibrary.verification'), VERIFICATIONS, verifications, setVerifications, counts.verifications, 'eventLibrary.verifications', undefined, '#14b8a6')}
            {multiGroup(t('eventLibrary.depth'), DEPTHS, depths, setDepths, counts.depths, 'eventLibrary.depths', undefined, '#6366f1')}
        </div>
    );

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20">
            <SEOHead
                title={t('eventLibrary.title')}
                description={t('eventLibrary.subtitle')}
                path="/studio/event-library"
            />
            <StudioBackButton />

            <div className="max-w-7xl mx-auto px-6 pt-4 pb-12">
                {/* Hero */}
                <div className="text-center max-w-4xl mx-auto mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-5 rounded-full text-xs md:text-sm font-semibold select-none border"
                        style={{ backgroundColor: `${ACCENT}1a`, borderColor: `${ACCENT}40`, color: ACCENT }}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {t('eventLibrary.badgeText')}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 dark:from-violet-400 dark:via-indigo-300 dark:to-sky-400 bg-clip-text text-transparent">
                        {t('eventLibrary.heroTitle')}
                        <span className="ml-3 align-middle px-2.5 py-0.5 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded uppercase tracking-wider select-none leading-normal">
                            Beta
                        </span>
                    </h1>

                    <p className="text-base md:text-lg text-[var(--text-secondary)] mb-6 max-w-2xl mx-auto leading-relaxed">
                        {t('eventLibrary.subtitle')}
                    </p>

                    <div className="relative max-w-xl mx-auto mb-6">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder={t('eventLibrary.searchPlaceholder')}
                            className="w-full pl-11 pr-4 py-3.5 text-base bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl focus:outline-none transition-all text-[var(--text-primary)]"
                            onFocus={e => { e.currentTarget.style.borderColor = ACCENT; }}
                            onBlur={e => { e.currentTarget.style.borderColor = ''; }}
                        />
                    </div>

                    {stats && (
                        <div className="flex flex-wrap justify-center gap-3 text-sm">
                            <div className="bg-[var(--bg-card)] px-3.5 py-1.5 rounded-lg border border-violet-500/20 bg-violet-500/5">
                                <span className="font-bold text-violet-600 dark:text-violet-400 text-sm">{stats.total}</span>{' '}
                                <span className="text-[var(--text-secondary)]">{t('eventLibrary.statsTotal')}</span>
                            </div>
                            <div className="bg-[var(--bg-card)] px-3.5 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{stats.verified}</span>{' '}
                                <span className="text-[var(--text-secondary)]">{t('eventLibrary.statsVerified')}</span>
                            </div>
                            <div className="bg-[var(--bg-card)] px-3.5 py-1.5 rounded-lg border border-sky-500/20 bg-sky-500/5">
                                <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">{stats.industryCount}</span>{' '}
                                <span className="text-[var(--text-secondary)]">{t('eventLibrary.statsIndustries')}</span>
                            </div>
                            <div className="bg-[var(--bg-card)] px-3.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
                                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{stats.typeCounts.case_study || 0}</span>{' '}
                                <span className="text-[var(--text-secondary)]">{t('eventLibrary.statsCaseStudies')}</span>
                            </div>
                            <div className="bg-[var(--bg-card)] px-3.5 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5">
                                <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">{(stats.typeCounts.template || 0) + (stats.typeCounts.prompt || 0)}</span>{' '}
                                <span className="text-[var(--text-secondary)]">{t('eventLibrary.statsTemplates')}</span>
                            </div>
                        </div>
                    )}
                </div>

                <JourneyStrip />

                {/* Tab loại nội dung */}
                <div className="flex flex-wrap gap-1.5 mb-8 pb-4 border-b border-[var(--border-primary)]">
                    {[''].concat(ITEM_TYPES as unknown as string[]).map(type => {
                        const active = itemType === type;
                        return (
                            <button
                                key={type || 'all'}
                                onClick={() => { setItemType(type); setPage(1); }}
                                style={active ? { backgroundColor: ACCENT, color: '#fff' } : undefined}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer focus:outline-none ${
                                    active ? '' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                {type ? t('eventLibrary.types.' + type) : t('eventLibrary.allTypes')}
                                {type && (
                                    <span className="ml-1.5 text-[10px] opacity-70">{counts.itemTypes[type] || 0}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="hidden lg:block lg:col-span-1">
                        <div className="lg:sticky lg:top-24">{filtersContent}</div>
                    </aside>

                    <main className="lg:col-span-3 min-w-0">
                        <LibraryToolbar
                            sortLabel={t('eventLibrary.sortLabel')}
                            sortOptions={[
                                { value: 'recent', label: t('eventLibrary.sortRecent') },
                                { value: 'popular', label: t('eventLibrary.sortPopular') },
                                { value: 'used', label: t('eventLibrary.sortUsed') },
                                { value: 'az', label: t('eventLibrary.sortAZ') },
                            ]}
                            sort={sort}
                            onSortChange={value => { setSort(value); setPage(1); }}
                            viewLabel={t('eventLibrary.viewLabel')}
                            view={view}
                            onViewChange={setView}
                            accent={ACCENT}
                        />

                        <div className="text-sm text-[var(--text-tertiary)] mb-4 font-mono">
                            {t('eventLibrary.showingStats')
                                .replace('{start}', String(total > 0 ? (page - 1) * PAGE_SIZE + 1 : 0))
                                .replace('{end}', String(Math.min(page * PAGE_SIZE, total)))
                                .replace('{total}', String(total))}
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <div
                                    className="w-10 h-10 border-4 rounded-full animate-spin"
                                    style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }}
                                />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-20 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
                                <svg className="w-16 h-16 text-[var(--text-tertiary)] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t('eventLibrary.noItemsFound')}</h3>
                                <p className="text-base text-[var(--text-secondary)] mb-4 max-w-md mx-auto">
                                    {t('eventLibrary.noItemsHint')}
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        onClick={resetFilters}
                                        style={{ backgroundColor: ACCENT }}
                                        className="px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all cursor-pointer"
                                    >
                                        {t('eventLibrary.resetFilters')}
                                    </button>
                                )}
                            </div>
                        ) : view === 'grid' ? (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {items.map(item => (
                                    <EventLibraryGridCard
                                        key={item._id}
                                        item={item}
                                        accent={ACCENT}
                                        onOpen={openItem}
                                        onDownload={downloadItem}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {items.map(item => (
                                    <EventLibraryListRow
                                        key={item._id}
                                        item={item}
                                        accent={ACCENT}
                                        onOpen={openItem}
                                        onDownload={downloadItem}
                                    />
                                ))}
                            </div>
                        )}

                        <LibraryPagination
                            currentPage={page}
                            totalPages={totalPages}
                            onChange={setPage}
                            prevLabel={t('eventLibrary.prevPage')}
                            nextLabel={t('eventLibrary.nextPage')}
                            accent={ACCENT}
                        />
                    </main>
                </div>
            </div>

            <MobileFilterDrawer open={isMobileFilterOpen} onToggle={setIsMobileFilterOpen} accent={ACCENT}>
                {filtersContent}
            </MobileFilterDrawer>
        </div>
    );
}
