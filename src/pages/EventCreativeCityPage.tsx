import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/ui/SEOHead';
import './EventCreativeCityPage.css';

type CityScene = {
    id: string;
    file: string;
    district: string;
    title: string;
    body: string;
    tags?: string[];
    alt: string;
    align: 'left' | 'right';
};

/** Cấp 1: câu chuyện. Cấp 2: visual theme — chỉ `event-creative-city` có nhiều theme. */
type ConceptId = 'brief-to-showtime' | 'event-creative-city' | 'living-storyboard';
type VisualThemeId = 'neon-night' | 'creative-daylight' | 'festival-garden';

type Look = {
    basePath: string;
    tokens: Record<string, string>;
};

/** Concept một-look dùng chung một Look cho cả ba key để tra cứu luôn hợp lệ. */
const singleLook = (look: Look): Record<VisualThemeId, Look> => ({
    'neon-night': look,
    'creative-daylight': look,
    'festival-garden': look,
});

const briefToShowtimeScenes: CityScene[] = [
    {
        id: 'blank-brief',
        file: '01-blank-brief.png',
        district: 'Điểm bắt đầu',
        title: 'Một trang trắng. Một khả năng lớn.',
        body: 'Mỗi sự kiện bắt đầu bằng một câu hỏi đủ tốt và một khoảng trống chờ được lấp đầy.',
        alt: 'Tờ brief trắng đặt giữa không gian venue sự kiện trước khi được dàn dựng',
        align: 'left',
    },
    {
        id: 'concept-lab',
        file: '02-concept-lab.png',
        district: 'Concept',
        title: 'Ý tưởng tìm thấy hình hài.',
        body: 'Mood, chất liệu và không gian gặp nhau để tạo nên hướng đi đầu tiên.',
        alt: 'Phòng lab concept với moodboard, mẫu chất liệu và mô hình không gian sự kiện',
        align: 'right',
    },
    {
        id: 'storyboard-corridor',
        file: '03-storyboard-corridor.png',
        district: 'Storyboard',
        title: 'Kể trước khoảnh khắc sẽ xảy ra.',
        body: 'Từng frame sắp xếp cảm xúc, nhịp điệu và những điểm chạm của khách mời.',
        alt: 'Hành lang storyboard với các khung hình sự kiện nối tiếp nhau',
        align: 'left',
    },
    {
        id: 'production-blueprint',
        file: '04-production-blueprint.png',
        district: 'Production',
        title: 'Biến ý tưởng thành cấu trúc.',
        body: 'Bản vẽ, sân khấu, LED và hệ kỹ thuật cùng chuyển từ kế hoạch sang hiện thực.',
        alt: 'Bản vẽ sản xuất cùng sân khấu, màn LED và hệ khung kỹ thuật đang được dựng',
        align: 'right',
    },
    {
        id: 'technical-rehearsal',
        file: '05-technical-rehearsal.png',
        district: 'Rehearsal',
        title: 'Chạy thử từng nhịp.',
        body: 'Ánh sáng, hình ảnh và vận hành được cân chỉnh trước khi khán phòng sáng đèn.',
        alt: 'Buổi tổng duyệt kỹ thuật với ánh sáng và visual đang được cân chỉnh',
        align: 'left',
    },
    {
        id: 'doors-open',
        file: '06-doors-open.png',
        district: 'Guest arrival',
        title: 'Khi cánh cửa mở.',
        body: 'Ý tưởng bắt đầu thuộc về khách mời ngay từ bước chân đầu tiên vào không gian.',
        alt: 'Khách mời bước qua cánh cửa mở vào không gian sự kiện đã hoàn thiện',
        align: 'right',
    },
    {
        id: 'showtime',
        file: '07-showtime.png',
        district: 'Live moment',
        title: 'Và rồi: Showtime.',
        body: 'Mọi quyết định hội tụ thành một khoảnh khắc sống động, đồng bộ và đáng nhớ.',
        alt: 'Khoảnh khắc showtime với sân khấu, ánh sáng và khán giả cùng bùng nổ',
        align: 'left',
    },
];

const eventCreativeCityScenes: CityScene[] = [
    {
        id: 'event-gate',
        file: '01-event-gate.png',
        district: 'Cổng thành sự kiện',
        title: 'Nơi mọi sự kiện bắt đầu',
        body: 'Bước vào thành phố sáng tạo, nơi ý tưởng được kết nối với thiết kế, công nghệ và năng lực sản xuất.',
        tags: ['Event Creative City', 'Alpha Studio'],
        alt: 'Cổng vào thành phố sáng tạo sự kiện Alpha Studio',
        align: 'left',
    },
    {
        id: 'brief-tower',
        file: '02-brief-tower.png',
        district: 'Brief Tower',
        title: 'Hiểu đúng điều cần tạo ra',
        body: 'Client, creative và production cùng nhìn vào một mục tiêu để biến brief thành định hướng sự kiện rõ ràng.',
        tags: ['Brief', 'Chiến lược', 'Cộng tác'],
        alt: 'Brief Tower với đội ngũ sự kiện làm việc quanh mô hình sân khấu',
        align: 'right',
    },
    {
        id: 'concept-district',
        file: '03-concept-district.png',
        district: 'Concept District',
        title: 'Cho ý tưởng một hình hài',
        body: 'Moodboard, chất liệu, màu sắc và không gian được thử nghiệm để hình thành một concept giàu cảm xúc.',
        tags: ['Moodboard', 'Key visual', 'Thiết kế 3D'],
        alt: 'Concept District với studio thiết kế và các mô hình sân khấu',
        align: 'left',
    },
    {
        id: 'storyboard-avenue',
        file: '04-storyboard-avenue.png',
        district: 'Storyboard Avenue',
        title: 'Dẫn dắt từng nhịp trải nghiệm',
        body: 'Hành trình khách tham dự, bố cục sân khấu và những key moment được kể bằng một luồng hình ảnh thống nhất.',
        tags: ['Guest journey', 'Key moment', 'Show flow'],
        alt: 'Storyboard Avenue với các khung cảnh sự kiện nối theo một hành trình',
        align: 'right',
    },
    {
        id: 'production-workshop',
        file: '05-production-workshop.png',
        district: 'Production Workshop',
        title: 'Kết nối thiết kế với thực thi',
        body: 'Sân khấu, booth, backdrop, khung dựng và vật liệu được bóc tách thành một kế hoạch sản xuất trực quan.',
        tags: ['Material scan', 'Kỹ thuật', 'Sản xuất'],
        alt: 'Production Workshop với sân khấu, khung truss và hệ thống quét vật liệu',
        align: 'left',
    },
    {
        id: 'led-arena',
        file: '06-led-arena.png',
        district: 'LED Arena',
        title: 'Lập trình khoảnh khắc cao trào',
        body: 'Visual LED, ánh sáng và chuyển động được thử nghiệm đồng bộ để cảm xúc xuất hiện đúng thời điểm.',
        tags: ['LED visual', 'Lighting', 'Rehearsal'],
        alt: 'LED Arena với sân khấu thử nghiệm ánh sáng và visual',
        align: 'right',
    },
    {
        id: 'showtime-plaza',
        file: '07-showtime-plaza.png',
        district: 'Showtime Plaza',
        title: 'Biến ý tưởng thành khoảnh khắc bùng nổ',
        body: 'Mọi năng lực sáng tạo hội tụ trên sân khấu để tạo nên một sự kiện đáng nhớ và có thể chạm đến khán giả.',
        tags: ['Showtime', 'Trải nghiệm', 'Dấu ấn'],
        alt: 'Showtime Plaza với sân khấu LED và sự kiện đang diễn ra',
        align: 'left',
    },
];

const livingStoryboardScenes: CityScene[] = [
    {
        id: 'creative-desk',
        file: '01-creative-desk.png',
        district: 'Blank canvas',
        title: 'Bàn sáng tạo thức giấc.',
        body: 'Một tờ brief trắng mở ra đường dẫn đầu tiên cho câu chuyện sự kiện.',
        alt: 'Bàn sáng tạo ivory với tờ brief trắng và dụng cụ thiết kế bằng giấy',
        align: 'left',
    },
    {
        id: 'moodboard-awakens',
        file: '02-moodboard-awakens.png',
        district: 'Moodboard',
        title: 'Cảm hứng bật khỏi mặt phẳng.',
        body: 'Màu sắc, chất liệu và hình khối bắt đầu đối thoại trong cùng một thế giới.',
        alt: 'Moodboard giấy thủ công với các mảng màu và chất liệu nổi lên khỏi mặt bàn',
        align: 'right',
    },
    {
        id: 'storyboard-rises',
        file: '03-storyboard-rises.png',
        district: 'Story beats',
        title: 'Câu chuyện dựng thành không gian.',
        body: 'Các khung hình đứng dậy, nối tiếp nhau và hé lộ hành trình của người tham dự.',
        alt: 'Các khung storyboard bằng giấy dựng đứng nối thành một hành trình',
        align: 'left',
    },
    {
        id: 'stage-from-paper',
        file: '04-stage-from-paper.png',
        district: 'Spatial design',
        title: 'Sân khấu nảy mầm từ giấy.',
        body: 'Bản vẽ gấp mở thành kiến trúc, ánh sáng và một điểm nhìn trung tâm.',
        alt: 'Sân khấu giấy gấp mở thành kiến trúc với điểm nhìn trung tâm',
        align: 'right',
    },
    {
        id: 'production-layers',
        file: '05-production-layers.png',
        district: 'Build system',
        title: 'Mọi lớp đều được nhìn thấy.',
        body: 'Kết cấu, LED, ánh sáng và vận hành tách lớp để cùng tạo nên một tổng thể khả thi.',
        alt: 'Mô hình giấy tách lớp thể hiện kết cấu, LED và hệ ánh sáng của sự kiện',
        align: 'left',
    },
    {
        id: 'step-into-scene',
        file: '06-step-into-scene.png',
        district: 'Experience',
        title: 'Bước vào chính ý tưởng.',
        body: 'Mô hình mở rộng thành trải nghiệm thật và mời khách đi xuyên qua câu chuyện.',
        alt: 'Mô hình giấy mở rộng thành không gian trải nghiệm cho khách tham dự',
        align: 'right',
    },
    {
        id: 'story-becomes-show',
        file: '07-story-becomes-show.png',
        district: 'Finale',
        title: 'Câu chuyện trở thành sự kiện.',
        body: 'Brief, storyboard và không gian hội tụ trong một khoảnh khắc sống động trước khán giả.',
        alt: 'Sân khấu giấy hoàn thiện thành sự kiện sống động trước khán giả',
        align: 'left',
    },
];

const visualThemeLabels = {
    'neon-night': { label: 'Neon Night', shortLabel: 'Night' },
    'creative-daylight': { label: 'Creative Daylight', shortLabel: 'Daylight' },
    'festival-garden': { label: 'Festival Garden', shortLabel: 'Garden' },
} satisfies Record<VisualThemeId, { label: string; shortLabel: string }>;

const concepts = {
    'brief-to-showtime': {
        label: 'Từ Brief đến Showtime',
        shortLabel: 'Brief',
        hasVisualThemes: false,
        scenes: briefToShowtimeScenes,
        themes: singleLook({
            basePath: '/event-creative-city/concepts/brief-to-showtime',
            tokens: {
                '--ecc-bg': '#07111f',
                '--ecc-surface': 'rgba(8, 21, 38, 0.82)',
                '--ecc-ink': '#f8fafc',
                '--ecc-muted': '#c3d5e6',
                '--ecc-accent': '#61e8ff',
                '--ecc-secondary': '#8b7dff',
                '--ecc-highlight': '#ffb454',
                '--ecc-border': 'rgba(255, 255, 255, 0.13)',
                '--ecc-on-accent': '#07111f',
                '--ecc-shadow': 'rgba(0, 0, 0, 0.34)',
            },
        }),
    },
    'event-creative-city': {
        label: 'Event Creative City',
        shortLabel: 'City',
        hasVisualThemes: true,
        scenes: eventCreativeCityScenes,
        themes: {
            'neon-night': {
                basePath: '/event-creative-city',
                tokens: {
                    '--ecc-bg': '#07111f',
                    '--ecc-surface': 'rgba(8, 21, 38, 0.82)',
                    '--ecc-ink': '#f8fafc',
                    '--ecc-muted': '#c3d5e6',
                    '--ecc-accent': '#61e8ff',
                    '--ecc-secondary': '#8b7dff',
                    '--ecc-highlight': '#ffb454',
                    '--ecc-border': 'rgba(255, 255, 255, 0.13)',
                    '--ecc-on-accent': '#07111f',
                    '--ecc-shadow': 'rgba(0, 0, 0, 0.34)',
                },
            },
            'creative-daylight': {
                basePath: '/event-creative-city/themes/creative-daylight',
                tokens: {
                    '--ecc-bg': '#eef7fb',
                    '--ecc-surface': 'rgba(255, 255, 255, 0.78)',
                    '--ecc-ink': '#0f172a',
                    '--ecc-muted': '#475569',
                    '--ecc-accent': '#0284c7',
                    '--ecc-secondary': '#7c3aed',
                    '--ecc-highlight': '#f59e0b',
                    '--ecc-border': 'rgba(15, 75, 112, 0.16)',
                    '--ecc-on-accent': '#f8fafc',
                    '--ecc-shadow': 'rgba(15, 75, 112, 0.16)',
                },
            },
            'festival-garden': {
                basePath: '/event-creative-city/themes/festival-garden',
                tokens: {
                    '--ecc-bg': '#fff8ec',
                    '--ecc-surface': 'rgba(255, 252, 244, 0.84)',
                    '--ecc-ink': '#3f2d1f',
                    '--ecc-muted': '#6b5b4b',
                    '--ecc-accent': '#f97316',
                    '--ecc-secondary': '#4d7c0f',
                    '--ecc-highlight': '#eab308',
                    '--ecc-border': 'rgba(112, 78, 44, 0.18)',
                    '--ecc-on-accent': '#fff8ec',
                    '--ecc-shadow': 'rgba(112, 78, 44, 0.18)',
                },
            },
        },
    },
    'living-storyboard': {
        label: 'Storyboard sống',
        shortLabel: 'Storyboard',
        hasVisualThemes: false,
        scenes: livingStoryboardScenes,
        themes: singleLook({
            basePath: '/event-creative-city/concepts/living-storyboard',
            tokens: {
                '--ecc-bg': '#f7f1e8',
                '--ecc-surface': 'rgba(255, 252, 246, 0.84)',
                '--ecc-ink': '#2c3440',
                '--ecc-muted': '#5c6675',
                '--ecc-accent': '#58c7d9',
                '--ecc-secondary': '#f47c6c',
                '--ecc-highlight': '#e8a33d',
                '--ecc-border': 'rgba(44, 52, 64, 0.16)',
                '--ecc-on-accent': '#123039',
                '--ecc-shadow': 'rgba(44, 52, 64, 0.16)',
            },
        }),
    },
} satisfies Record<ConceptId, {
    label: string;
    shortLabel: string;
    hasVisualThemes: boolean;
    scenes: CityScene[];
    themes: Record<VisualThemeId, Look>;
}>;

const conceptIds = Object.keys(concepts) as ConceptId[];
const themeIds = Object.keys(visualThemeLabels) as VisualThemeId[];

const CONCEPT_STORAGE_KEY = 'ecc-concept-v1';
const THEME_STORAGE_KEY = 'ecc-visual-theme-v1';
const DEFAULT_CONCEPT: ConceptId = 'event-creative-city';
const DEFAULT_THEME: VisualThemeId = 'neon-night';
const FADE_MS = 380;

/** Mọi concept đều có đúng 7 scene nên scene index được giữ nguyên khi đổi concept. */
const SCENE_COUNT = concepts[DEFAULT_CONCEPT].scenes.length;

const getSceneImage = (concept: ConceptId, theme: VisualThemeId, index: number) =>
    `${concepts[concept].themes[theme].basePath}/${concepts[concept].scenes[index].file}`;

const preloadImages = (urls: string[]) => Promise.all(
    urls.map((url) => new Promise<void>((resolve) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => resolve();
        image.src = url;
    })),
);

const readStored = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    try {
        const stored = window.localStorage.getItem(key);
        if (stored && (allowed as readonly string[]).includes(stored)) return stored as T;
    } catch {
        // localStorage bị chặn (private mode) — dùng mặc định
    }
    return fallback;
};

const persist = (key: string, value: string) => {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // localStorage bị chặn — chỉ mất khả năng ghi nhớ lựa chọn
    }
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const EventCreativeCityPage: React.FC = () => {
    const worldRef = useRef<HTMLElement>(null);
    const frameRequestRef = useRef<number | null>(null);
    const scenePositionRef = useRef(0);
    const [scenePosition, setScenePosition] = useState(0);

    const [activeConcept, setActiveConcept] = useState<ConceptId>(
        () => readStored(CONCEPT_STORAGE_KEY, conceptIds, DEFAULT_CONCEPT),
    );
    const [activeTheme, setActiveTheme] = useState<VisualThemeId>(
        () => readStored(THEME_STORAGE_KEY, themeIds, DEFAULT_THEME),
    );
    const [outgoing, setOutgoing] = useState<{ concept: ConceptId; theme: VisualThemeId } | null>(null);
    const [pending, setPending] = useState<{ concept: ConceptId; theme: VisualThemeId } | null>(null);
    const switchRequestRef = useRef(0);
    const fadeTimerRef = useRef<number | null>(null);

    const updateProgress = useCallback(() => {
        frameRequestRef.current = null;
        const root = worldRef.current;
        if (!root) return;

        const rect = root.getBoundingClientRect();
        const scrollableHeight = Math.max(1, rect.height - window.innerHeight);
        const progress = clamp(-rect.top / scrollableHeight);
        scenePositionRef.current = progress * (SCENE_COUNT - 1);
        setScenePosition(scenePositionRef.current);
    }, []);

    useEffect(() => {
        const queueUpdate = () => {
            if (frameRequestRef.current === null) {
                frameRequestRef.current = window.requestAnimationFrame(updateProgress);
            }
        };

        updateProgress();
        window.addEventListener('scroll', queueUpdate, { passive: true });
        window.addEventListener('resize', queueUpdate);

        return () => {
            window.removeEventListener('scroll', queueUpdate);
            window.removeEventListener('resize', queueUpdate);
            if (frameRequestRef.current !== null) {
                window.cancelAnimationFrame(frameRequestRef.current);
            }
        };
    }, [updateProgress]);

    useEffect(() => () => {
        // Chặn setState sau khi unmount nếu preload còn đang chạy
        switchRequestRef.current += 1;
        if (fadeTimerRef.current !== null) {
            window.clearTimeout(fadeTimerRef.current);
        }
    }, []);

    const applySelection = useCallback(async (concept: ConceptId, theme: VisualThemeId) => {
        if (concept === activeConcept && theme === activeTheme) {
            // Bấm lại lựa chọn đang dùng = huỷ lần đổi đang preload
            if (pending !== null) {
                switchRequestRef.current += 1;
                setPending(null);
            }
            return;
        }

        const requestId = switchRequestRef.current + 1;
        switchRequestRef.current = requestId;
        setPending({ concept, theme });

        // Ưu tiên scene đang xem cùng hai scene lân cận để hoàn tất chuyển cảnh sớm
        const current = Math.round(scenePositionRef.current);
        const nearIndexes = [current - 1, current, current + 1].filter((i) => i >= 0 && i < SCENE_COUNT);
        const restIndexes = Array.from({ length: SCENE_COUNT }, (_, i) => i)
            .filter((i) => !nearIndexes.includes(i));

        await preloadImages(nearIndexes.map((i) => getSceneImage(concept, theme, i)));
        if (switchRequestRef.current !== requestId) return;

        void preloadImages(restIndexes.map((i) => getSceneImage(concept, theme, i)));

        setOutgoing({ concept: activeConcept, theme: activeTheme });
        setActiveConcept(concept);
        setActiveTheme(theme);
        setPending(null);
        persist(CONCEPT_STORAGE_KEY, concept);
        persist(THEME_STORAGE_KEY, theme);

        if (fadeTimerRef.current !== null) {
            window.clearTimeout(fadeTimerRef.current);
        }
        fadeTimerRef.current = window.setTimeout(() => {
            fadeTimerRef.current = null;
            setOutgoing(null);
        }, FADE_MS);
    }, [activeConcept, activeTheme, pending]);

    const concept = concepts[activeConcept];
    const scenes = concept.scenes;
    const activeIndex = Math.round(scenePosition);
    const overallProgress = scenePosition / (SCENE_COUNT - 1);

    const sceneStyles = useMemo(() => scenes.map((_, index) => {
        const delta = index - scenePosition;
        const opacity = clamp(1 - Math.abs(delta));
        const scale = 1.02 + clamp(-delta, -1, 1) * 0.085;
        const translateY = clamp(delta, -1, 1) * 2.5;

        return {
            opacity,
            transform: `translate3d(0, ${translateY}%, 0) scale(${scale})`,
            zIndex: Math.max(1, 20 - Math.round(Math.abs(delta) * 10)),
        };
    }), [scenes, scenePosition]);

    const jumpToScene = (index: number) => {
        const root = worldRef.current;
        if (!root) return;

        const rootTop = window.scrollY + root.getBoundingClientRect().top;
        const scrollableHeight = Math.max(1, root.offsetHeight - window.innerHeight);
        const target = rootTop + (index / (SCENE_COUNT - 1)) * scrollableHeight;
        window.scrollTo({ top: target, behavior: 'smooth' });
    };

    return (
        <main
            className="ecc-page"
            data-concept={activeConcept}
            data-visual-theme={activeTheme}
            style={concept.themes[activeTheme].tokens as React.CSSProperties}
        >
            <SEOHead
                title="Event Creative City — Alpha Studio"
                description="Khám phá hành trình sáng tạo sự kiện từ brief, concept, storyboard đến sản xuất và showtime trong Event Creative City."
                path="/event-creative-city"
            />

            <header className="ecc-header">
                <Link className="ecc-brand" to="/" aria-label="Về trang chủ Alpha Studio">
                    <img src="/alpha-symbol-only.png" alt="" />
                    <span>
                        <strong>ALPHA STUDIO</strong>
                        <small>EVENT CREATIVE CITY</small>
                    </span>
                </Link>

                <div
                    className="ecc-switch ecc-switch--concept"
                    role="group"
                    aria-label="Chọn câu chuyện"
                    aria-busy={pending !== null}
                >
                    {conceptIds.map((id) => (
                        <button
                            key={id}
                            type="button"
                            className={id === activeConcept ? 'is-active' : ''}
                            data-pending={pending && pending.concept !== activeConcept && id === pending.concept ? 'true' : undefined}
                            aria-pressed={id === activeConcept}
                            aria-label={`Câu chuyện ${concepts[id].label}`}
                            onClick={() => { void applySelection(id, activeTheme); }}
                        >
                            <span className="ecc-switch-label">{concepts[id].label}</span>
                            <span className="ecc-switch-label-short" aria-hidden="true">{concepts[id].shortLabel}</span>
                        </button>
                    ))}
                </div>

                {concept.hasVisualThemes && (
                    <div
                        className="ecc-switch ecc-switch--theme"
                        role="group"
                        aria-label="Giao diện thành phố"
                        aria-busy={pending !== null}
                    >
                        {themeIds.map((id) => (
                            <button
                                key={id}
                                type="button"
                                className={id === activeTheme ? 'is-active' : ''}
                                data-pending={pending && pending.theme !== activeTheme && id === pending.theme ? 'true' : undefined}
                                aria-pressed={id === activeTheme}
                                aria-label={`Giao diện ${visualThemeLabels[id].label}`}
                                onClick={() => { void applySelection(activeConcept, id); }}
                            >
                                <span
                                    className="ecc-theme-swatch"
                                    aria-hidden="true"
                                    style={{
                                        background: `linear-gradient(135deg, ${concept.themes[id].tokens['--ecc-accent']}, ${concept.themes[id].tokens['--ecc-secondary']})`,
                                    }}
                                />
                                <span className="ecc-switch-label">{visualThemeLabels[id].label}</span>
                                <span className="ecc-switch-label-short" aria-hidden="true">{visualThemeLabels[id].shortLabel}</span>
                            </button>
                        ))}
                    </div>
                )}

                <nav aria-label="Điều hướng thử nghiệm">
                    <Link to="/">Trang chủ</Link>
                    <Link className="ecc-header-cta" to="/studio">Khám phá Studio</Link>
                </nav>
            </header>

            <section
                ref={worldRef}
                className="ecc-world"
                aria-label="Hành trình qua Event Creative City"
                style={{ '--ecc-scene-count': SCENE_COUNT } as React.CSSProperties}
            >
                <div className="ecc-sticky">
                    <div className="ecc-ambient" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </div>

                    <div className="ecc-scenes">
                        {scenes.map((scene, index) => {
                            const isActive = index === activeIndex;
                            return (
                                <article
                                    id={scene.id}
                                    key={scene.id}
                                    className={`ecc-scene ecc-scene--${scene.align}`}
                                    style={{ zIndex: sceneStyles[index].zIndex }}
                                    aria-hidden={!isActive}
                                >
                                    <div
                                        className="ecc-scene-image-wrap"
                                        style={{
                                            opacity: sceneStyles[index].opacity,
                                            transform: sceneStyles[index].transform,
                                        }}
                                    >
                                        <img
                                            className="ecc-scene-image"
                                            src={getSceneImage(activeConcept, activeTheme, index)}
                                            alt={isActive ? scene.alt : ''}
                                            loading={index < 2 ? 'eager' : 'lazy'}
                                            fetchPriority={index === 0 ? 'high' : 'auto'}
                                        />
                                        {outgoing && (
                                            <img
                                                key={`${outgoing.concept}/${outgoing.theme}`}
                                                className="ecc-scene-image ecc-scene-image--outgoing"
                                                src={getSceneImage(outgoing.concept, outgoing.theme, index)}
                                                alt=""
                                                aria-hidden="true"
                                            />
                                        )}
                                    </div>

                                    <div className="ecc-copy-shell">
                                        <div className="ecc-copy" key={activeConcept}>
                                            <div className="ecc-eyebrow">
                                                <span>{String(index).padStart(2, '0')}</span>
                                                {scene.district}
                                            </div>
                                            <h1>{scene.title}</h1>
                                            <p>{scene.body}</p>
                                            {scene.tags && scene.tags.length > 0 && (
                                                <div className="ecc-tags" aria-label="Chủ đề">
                                                    {scene.tags.map((tag) => <span key={tag}>{tag}</span>)}
                                                </div>
                                            )}
                                            {index === SCENE_COUNT - 1 && (
                                                <div className="ecc-actions">
                                                    <Link className="ecc-primary-action" to="/studio">
                                                        Bắt đầu sáng tạo
                                                        <span aria-hidden="true">↗</span>
                                                    </Link>
                                                    <Link className="ecc-secondary-action" to="/courses">
                                                        Khám phá lộ trình học
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <aside className="ecc-route-rail" aria-label="Các địa điểm trong hành trình">
                        <div className="ecc-route-line" aria-hidden="true">
                            <span style={{ height: `${overallProgress * 100}%` }} />
                        </div>
                        {scenes.map((scene, index) => (
                            <button
                                key={scene.id}
                                type="button"
                                className={index === activeIndex ? 'is-active' : ''}
                                onClick={() => jumpToScene(index)}
                                aria-label={`Đi đến ${scene.district}`}
                                aria-current={index === activeIndex ? 'step' : undefined}
                            >
                                <span className="ecc-route-dot" />
                                <span className="ecc-route-label">{scene.district}</span>
                            </button>
                        ))}
                    </aside>

                    {activeIndex === 0 && (
                        <div className="ecc-scroll-cue" aria-hidden="true">
                            <span>Cuộn để khám phá</span>
                            <i />
                        </div>
                    )}

                    <div className="ecc-progress" aria-hidden="true">
                        <span style={{ transform: `scaleX(${overallProgress})` }} />
                    </div>
                </div>
            </section>
        </main>
    );
};

export default EventCreativeCityPage;
