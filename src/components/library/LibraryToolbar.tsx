export interface SortOption {
    value: string;
    label: string;
}

/**
 * Thanh sắp xếp + chuyển chế độ xem (lưới / danh sách) nằm trên đầu lưới kết
 * quả của các trang thư viện.
 */
export default function LibraryToolbar({
    sortLabel,
    sortOptions,
    sort,
    onSortChange,
    viewLabel,
    view,
    onViewChange,
    accent,
}: {
    sortLabel: string;
    sortOptions: SortOption[];
    sort: string;
    onSortChange: (value: string) => void;
    viewLabel: string;
    view: 'grid' | 'list';
    onViewChange: (view: 'grid' | 'list') => void;
    accent: string;
}) {
    const activeStyle = { backgroundColor: accent, color: '#fff' };

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[var(--border-primary)]/50">
            <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--text-secondary)]">{sortLabel}</span>
                <div className="flex flex-wrap gap-1.5">
                    {sortOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => onSortChange(option.value)}
                            style={sort === option.value ? activeStyle : undefined}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none cursor-pointer ${
                                sort === option.value
                                    ? ''
                                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/80 hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-3 justify-end">
                <span className="text-sm font-semibold text-[var(--text-secondary)]">{viewLabel}</span>
                <div className="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-primary)]">
                    <button
                        onClick={() => onViewChange('grid')}
                        style={view === 'grid' ? activeStyle : undefined}
                        className={`p-1.5 rounded transition-all focus:outline-none cursor-pointer ${view === 'grid' ? '' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                        aria-label="Grid View"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onViewChange('list')}
                        style={view === 'list' ? activeStyle : undefined}
                        className={`p-1.5 rounded transition-all focus:outline-none cursor-pointer ${view === 'list' ? '' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}
                        aria-label="List View"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
