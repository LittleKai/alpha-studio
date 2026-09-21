import React from 'react';
import Reveal from '../motion/Reveal';

interface SectionHeadingProps {
    eyebrow: string;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

/** Eyebrow + tiêu đề + action, dùng chung cho các section của landing. */
const SectionHeading: React.FC<SectionHeadingProps> = ({ eyebrow, title, subtitle, action }) => (
    <Reveal y={20} className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-3 max-w-[62ch]">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">
                <span className="w-6 h-px bg-[var(--accent-primary)]" aria-hidden="true" />
                {eyebrow}
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)]">{title}</h2>
            {subtitle && <p className="text-[var(--text-secondary)] leading-relaxed">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
    </Reveal>
);

export default SectionHeading;
