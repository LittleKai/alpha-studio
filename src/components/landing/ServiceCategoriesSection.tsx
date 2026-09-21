import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import Reveal, { RevealItem } from '../motion/Reveal';
import HoverSpring from '../motion/HoverSpring';
import SectionHeading from './SectionHeading';
import { getServiceCategories, type ServiceCategory } from '../../services/serviceCategoryService';
import { cdnFromUrl } from '../../services/cloudinaryAssets';
import { localizedText } from '../../utils/localized';

/** Viền/nền theo `accent` của phân mục — cùng hệ màu với SECTION_PALETTES. */
const ACCENT_STYLES: Record<string, string> = {
    violet: 'hover:border-violet-500/60 group-hover:text-violet-600 dark:group-hover:text-violet-300',
    sky: 'hover:border-sky-500/60 group-hover:text-sky-600 dark:group-hover:text-sky-300',
    emerald: 'hover:border-emerald-500/60 group-hover:text-emerald-600 dark:group-hover:text-emerald-300',
    amber: 'hover:border-amber-500/60 group-hover:text-amber-600 dark:group-hover:text-amber-300',
    rose: 'hover:border-rose-500/60 group-hover:text-rose-600 dark:group-hover:text-rose-300'
};

/**
 * Dải phân mục sản phẩm/dịch vụ trên landing, đặt ngay sau Khoá học nổi bật.
 * Ẩn hẳn khi chưa có phân mục nào để trang chủ không hiện khung rỗng.
 */
export default function ServiceCategoriesSection() {
    const { t, language } = useTranslation();
    const [categories, setCategories] = useState<ServiceCategory[]>([]);

    useEffect(() => {
        getServiceCategories()
            .then(setCategories)
            .catch(err => console.error('Failed to load service categories:', err));
    }, []);

    if (categories.length === 0) return null;

    return (
        <section className="py-20 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] relative overflow-hidden">
            <div className="container mx-auto px-6">
                <SectionHeading
                    eyebrow={t('landing.sections.solutionsEyebrow')}
                    title={t('landing.solutions.title')}
                    subtitle={t('landing.solutions.subtitle')}
                    action={(
                        <HoverSpring scale={1.04} y={-2} className="inline-block">
                            <Link
                                to="/services"
                                className="inline-flex items-center gap-2 py-3 px-7 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-card-alpha)] backdrop-blur-sm hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300 text-sm font-bold text-[var(--accent-primary)]"
                            >
                                {t('landing.solutions.viewAll')}
                                <span aria-hidden="true">→</span>
                            </Link>
                        </HoverSpring>
                    )}
                />

                <Reveal staggerChildren={0.1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map(cat => (
                        <RevealItem key={cat._id} y={24}>
                            <Link
                                to={`/services?cat=${cat.slug}`}
                                className={`group flex flex-col h-full rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden transition-all duration-300 hover:-translate-y-1 ${ACCENT_STYLES[cat.accent] || ACCENT_STYLES.violet}`}
                            >
                                {cat.coverImage ? (
                                    <div className="aspect-[16/9] overflow-hidden">
                                        <img
                                            src={cdnFromUrl(cat.coverImage, 'w_640')}
                                            alt={localizedText(cat.title, language)}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                ) : (
                                    <div className="aspect-[16/9] flex items-center justify-center bg-[var(--bg-tertiary)] text-5xl" aria-hidden="true">
                                        {cat.icon || '◆'}
                                    </div>
                                )}
                                <div className="p-5 flex flex-col gap-2 flex-1">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] transition-colors">
                                        {localizedText(cat.title, language)}
                                    </h3>
                                    {localizedText(cat.description, language) && (
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                                            {localizedText(cat.description, language)}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        </RevealItem>
                    ))}
                </Reveal>
            </div>
        </section>
    );
}
