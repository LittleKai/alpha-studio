import React from 'react';
import { useTranslation } from '../../i18n/context';
import { useTheme } from '../../theme/context';
import { cdnImage } from '../../services/cloudinaryAssets';

/**
 * Bento bốn ô cho section Alpha Connect, dùng chính khung hình Event Creative City
 * đã được nén sang WebP. Bộ ảnh đổi theo theme để khớp với video nền của hero.
 */

const TILES = [
    { key: 'concept', slug: 'concept', span: 'sm:col-span-3' },
    { key: 'storyboard', slug: 'storyboard', span: 'sm:col-span-2' },
    { key: 'production', slug: 'production', span: 'sm:col-span-2' },
    { key: 'showtime', slug: 'showtime', span: 'sm:col-span-3' },
] as const;

const ConnectBento: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    return (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 auto-rows-[180px] md:auto-rows-[200px]">
            {TILES.map((tile, index) => {
                const label = t(`landing.features.bento.${tile.key}`);
                return (
                    <figure
                        key={tile.key}
                        className={`${tile.span} relative overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] group`}
                    >
                        <img
                            src={cdnImage(`landing/connect/${theme}-${tile.slug}`)}
                            alt={label}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                        />
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--bg-primary) 88%, transparent) 0%, transparent 55%)' }}
                        />
                        <figcaption className="absolute left-4 bottom-3.5 flex items-center gap-2">
                            <span className="text-[10px] font-black tabular-nums text-[var(--accent-primary)]">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="text-xs font-black uppercase tracking-[0.14em] text-[var(--text-primary)]">
                                {label}
                            </span>
                        </figcaption>
                    </figure>
                );
            })}
        </div>
    );
};

export default ConnectBento;
