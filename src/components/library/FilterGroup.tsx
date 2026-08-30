import { useState, type ReactNode } from 'react';

/**
 * Khối lọc thu gọn được trong sidebar của các trang thư viện
 * (`SkillsPage`, `EventLibraryPage`).
 *
 * Chỉ chứa phần khung — tiêu đề, mũi tên xoay, đường kẻ dưới. Danh sách lựa
 * chọn do trang gọi tự dựng bằng `FilterCheckbox` / `FilterRadio`, vì mỗi thư
 * viện có ngữ nghĩa lọc riêng.
 */
export function FilterGroup({
    title,
    children,
    maxHeight,
    defaultOpen = true,
    accent,
}: {
    title: string;
    children: ReactNode;
    /** Bọc danh sách trong vùng cuộn khi có quá nhiều lựa chọn (px) */
    maxHeight?: number;
    defaultOpen?: boolean;
    accent?: string;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-[var(--border-primary)] pb-4">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-between w-full text-left mb-3 group focus:outline-none cursor-pointer"
            >
                <div className="flex items-center gap-2 min-w-0">
                    {accent && (
                        <span
                            className="w-1.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: accent }}
                        />
                    )}
                    <span
                        className="font-bold text-sm text-[var(--text-primary)] group-hover:opacity-85 transition-opacity truncate"
                        style={accent ? { color: accent } : undefined}
                    >
                        {title}
                    </span>
                </div>
                <svg
                    className={`w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-transform duration-200 shrink-0 ${open ? '' : 'transform rotate-180'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div
                    className={`space-y-2 text-sm select-none ${maxHeight ? 'overflow-y-auto pr-2 custom-scrollbar' : ''}`}
                    style={maxHeight ? { maxHeight } : undefined}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

interface OptionProps {
    checked: boolean;
    onChange: () => void;
    /** Màu nhấn của trang gọi (hex) — ô tick và nút sắp xếp dùng chung một màu */
    accent: string;
    children: ReactNode;
}

export function FilterCheckbox({ checked, onChange, accent, children }: OptionProps) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                style={{ color: accent, accentColor: accent }}
                className="w-4 h-4 rounded border-[var(--border-primary)] bg-[var(--bg-secondary)] focus:ring-0 cursor-pointer"
            />
            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {children}
            </span>
        </label>
    );
}

export function FilterRadio({ checked, onChange, accent, name, children }: OptionProps & { name: string }) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <input
                type="radio"
                name={name}
                checked={checked}
                onChange={onChange}
                style={{ color: accent, accentColor: accent }}
                className="w-4 h-4 border-[var(--border-primary)] bg-[var(--bg-secondary)] focus:ring-0 cursor-pointer"
            />
            <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                {children}
            </span>
        </label>
    );
}

/** Số lượng mục khớp một lựa chọn lọc — luôn hiển thị mờ, trong ngoặc. */
export function FilterCount({ value }: { value: number }) {
    return <span className="text-xs text-[var(--text-tertiary)]">({value})</span>;
}
