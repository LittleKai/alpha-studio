import type { ReactNode } from 'react';

/**
 * Nút lọc nổi + ngăn kéo bộ lọc cho màn hình nhỏ (dưới `lg`). Sidebar lọc trên
 * desktop và nội dung ngăn kéo này dùng chung một cây JSX do trang truyền vào.
 */
export default function MobileFilterDrawer({
    open,
    onToggle,
    accent,
    children,
}: {
    open: boolean;
    onToggle: (open: boolean) => void;
    accent: string;
    children: ReactNode;
}) {
    return (
        <>
            <button
                onClick={() => onToggle(!open)}
                style={{ backgroundColor: accent }}
                className="fixed bottom-24 right-6 z-40 lg:hidden w-14 h-14 text-white rounded-full shadow-xl flex items-center justify-center cursor-pointer transition-all hover:scale-105 focus:outline-none"
                aria-label="Filter"
            >
                {open ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                )}
            </button>

            {open && (
                <>
                    <div
                        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
                        onClick={() => onToggle(false)}
                    />
                    <div className="fixed bottom-40 right-6 z-40 w-80 sm:w-96 max-h-[60vh] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl shadow-2xl p-6 overflow-y-auto lg:hidden flex flex-col custom-scrollbar animate-in slide-in-from-bottom-5 fade-in duration-200">
                        {children}
                    </div>
                </>
            )}
        </>
    );
}
