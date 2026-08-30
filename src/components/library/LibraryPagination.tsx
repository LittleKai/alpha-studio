/**
 * Phân trang dùng chung cho các trang thư viện: rút gọn về tối đa 7 ô số,
 * chèn "..." khi vượt quá.
 */
export function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
        return pages;
    }
    if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
}

export default function LibraryPagination({
    currentPage,
    totalPages,
    onChange,
    prevLabel,
    nextLabel,
    accent,
}: {
    currentPage: number;
    totalPages: number;
    onChange: (page: number) => void;
    prevLabel: string;
    nextLabel: string;
    accent: string;
}) {
    if (totalPages <= 1) return null;

    const edgeButton = (disabled: boolean) =>
        `px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] ${
            disabled
                ? 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] opacity-50 cursor-not-allowed'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/85 cursor-pointer'
        }`;

    return (
        <div className="flex items-center justify-center gap-2 mt-12 select-none">
            <button
                onClick={() => onChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className={edgeButton(currentPage === 1)}
            >
                {prevLabel}
            </button>

            {getPageNumbers(currentPage, totalPages).map((pageNum, idx) => {
                if (pageNum === '...') {
                    return (
                        <span key={`dots-${idx}`} className="text-[var(--text-tertiary)] px-2 text-sm font-semibold">
                            ...
                        </span>
                    );
                }
                const active = currentPage === pageNum;
                return (
                    <button
                        key={`page-${pageNum}`}
                        onClick={() => onChange(Number(pageNum))}
                        style={active ? { backgroundColor: accent, borderColor: accent, color: '#fff' } : undefined}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer ${
                            active
                                ? ''
                                : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/85'
                        }`}
                    >
                        {pageNum}
                    </button>
                );
            })}

            <button
                onClick={() => onChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={edgeButton(currentPage === totalPages)}
            >
                {nextLabel}
            </button>
        </div>
    );
}
