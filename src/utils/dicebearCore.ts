export class Fnv1a {
    private static readonly OFFSET_BASIS = 0x811c9dc5;
    private static readonly PRIME = 0x01000193;

    static hash(input: string): number {
        let hash = Fnv1a.OFFSET_BASIS;

        for (let i = 0; i < input.length; i++) {
            hash ^= input.charCodeAt(i);
            hash = Math.imul(hash, Fnv1a.PRIME);
        }

        return hash >>> 0;
    }
}

export class Mulberry32 {
    private state: number;

    constructor(seed: number) {
        this.state = seed | 0;
    }

    next(): number {
        this.state = (this.state + 0x6d2b79f5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

        return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
    }

    nextFloat(): number {
        return this.next();
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.nextFloat() * (max - min + 1)) + min;
    }

    pick<T>(items: readonly T[]): T {
        if (items.length === 0) {
            throw new Error('Cannot pick from an empty array.');
        }
        return items[this.nextInt(0, items.length - 1)];
    }
}

export class Color {
    private hex: string;
    private rgbValue?: [number, number, number];
    private luminanceValue?: number;

    constructor(color = '#000000') {
        const trimmed = color.trim();

        if (/^#?[0-9a-fA-F]{3}$/.test(trimmed)) {
            const raw = trimmed.replace(/^#/, '');
            this.hex = `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
            return;
        }

        if (/^#?[0-9a-fA-F]{6}$/.test(trimmed)) {
            const raw = trimmed.replace(/^#/, '');
            this.hex = `#${raw}`.toLowerCase();
            return;
        }

        throw new Error(`Invalid color format: "${color}"`);
    }

    toHex(): string {
        return this.hex;
    }

    toRgb(): [number, number, number] {
        this.rgbValue ??= [
            parseInt(this.hex.slice(1, 3), 16),
            parseInt(this.hex.slice(3, 5), 16),
            parseInt(this.hex.slice(5, 7), 16),
        ];

        return [...this.rgbValue];
    }

    luminance(): number {
        if (this.luminanceValue === undefined) {
            const [r, g, b] = this.toRgb().map((channel) => {
                const sRGB = channel / 255;

                return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
            });

            this.luminanceValue = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }

        return this.luminanceValue;
    }

    contrast(other: Color): number {
        const lum1 = this.luminance();
        const lum2 = other.luminance();
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);

        return (brightest + 0.05) / (darkest + 0.05);
    }

    sortByContrast(colors: Color[]): Color[] {
        return [...colors]
            .map((color) => ({
                color,
                contrast: this.contrast(color),
            }))
            .sort((a, b) => b.contrast - a.contrast)
            .map((item) => item.color);
    }
}

export class Xml {
    static escape(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u0084\u0086-\u009F\uFDD0-\uFDEF\uFFFE\uFFFF]/g, '');
    }
}

export interface StyleDefinitionMetaLicense {
    name?: string;
    url?: string;
    text?: string;
}

export interface StyleDefinitionMetaCreator {
    name?: string;
    url?: string;
}

export interface StyleDefinitionMetaSource {
    name?: string;
    url?: string;
}

export interface StyleDefinitionMeta {
    license?: StyleDefinitionMetaLicense;
    creator?: StyleDefinitionMetaCreator;
    source?: StyleDefinitionMetaSource;
}

export class MetaLicense {
    #data: StyleDefinitionMetaLicense;

    constructor(data: StyleDefinitionMetaLicense = {}) {
        this.#data = Object.freeze({ ...data });
    }

    name(): string | undefined {
        return this.#data.name;
    }

    url(): string | undefined {
        return this.#data.url;
    }

    text(): string | undefined {
        return this.#data.text;
    }
}

export function assertCc0License(meta?: StyleDefinitionMeta): MetaLicense {
    const license = new MetaLicense(meta?.license);
    if (license.name() !== 'CC0 1.0') {
        throw new Error(
            `Forbidden non-CC0 avatar style license: "${license.name() ?? 'undefined'}". Only CC0 1.0 styles are permitted.`
        );
    }
    return license;
}

export interface StyleColorSet {
    values: readonly string[];
    contrastTo?: string;
    notEqualTo?: readonly string[];
}

export interface DeterministicStyleSpec {
    meta: StyleDefinitionMeta;
    colors: Record<string, StyleColorSet>;
}

export const CC0_AVATAR_STYLES = {
    glass: {
        meta: {
            license: {
                name: 'CC0 1.0',
                url: 'https://creativecommons.org/publicdomain/zero/1.0/',
                text: '„Glass” (https://www.dicebear.com) by „DiceBear”, licensed under „CC0 1.0” (https://creativecommons.org/publicdomain/zero/1.0/)',
            },
            creator: { name: 'DiceBear', url: 'https://www.dicebear.com' },
            source: { name: 'Glass', url: 'https://www.dicebear.com' },
        },
        colors: {
            background: {
                values: [
                    '#eb4747',
                    '#eb6247',
                    '#7eeb47',
                    '#62eb47',
                    '#47eb47',
                    '#47eb62',
                    '#47eb7e',
                    '#47eb99',
                    '#47ebb4',
                    '#47ebd0',
                    '#47ebeb',
                    '#47d0eb',
                    '#eb7e47',
                    '#47b4eb',
                    '#4799eb',
                    '#477eeb',
                    '#4762eb',
                    '#4747eb',
                    '#6247eb',
                    '#7e47eb',
                    '#9947eb',
                    '#b447eb',
                    '#d047eb',
                    '#eb9947',
                    '#eb47eb',
                    '#eb47d0',
                    '#eb4799',
                    '#eb477e',
                    '#eb4762',
                    '#ebb447',
                    '#ebd047',
                    '#ebeb47',
                    '#d0eb47',
                    '#b4eb47',
                    '#99eb47',
                ],
            },
        },
    },
    'shape-grid': {
        meta: {
            license: {
                name: 'CC0 1.0',
                url: 'https://creativecommons.org/publicdomain/zero/1.0/',
                text: '„Shape Grid” (https://www.dicebear.com) by „DiceBear”, licensed under „CC0 1.0” (https://creativecommons.org/publicdomain/zero/1.0/)',
            },
            creator: { name: 'DiceBear', url: 'https://www.dicebear.com' },
            source: { name: 'Shape Grid', url: 'https://www.dicebear.com' },
        },
        colors: {
            background: {
                values: [
                    '#ffa3b5',
                    '#ffb382',
                    '#ffe08a',
                    '#e2f299',
                    '#a8f0b0',
                    '#86eadf',
                    '#7fd4f5',
                    '#9cbeff',
                    '#cfbeff',
                ],
            },
            shape: {
                notEqualTo: [],
                contrastTo: 'background',
                values: ['#000000', '#ffffff'],
            },
        },
    },
    initials: {
        meta: {
            license: {
                name: 'CC0 1.0',
                url: 'https://creativecommons.org/publicdomain/zero/1.0/',
                text: '„Initials” (https://www.dicebear.com) by „DiceBear”, licensed under „CC0 1.0” (https://creativecommons.org/publicdomain/zero/1.0/)',
            },
            creator: { name: 'DiceBear', url: 'https://www.dicebear.com' },
            source: { name: 'Initials', url: 'https://www.dicebear.com' },
        },
        colors: {
            background: {
                values: [
                    '#c44f4f',
                    '#ac6039',
                    '#8e6e2f',
                    '#777728',
                    '#627e2a',
                    '#48822b',
                    '#2d862d',
                    '#2b8248',
                    '#2b8265',
                    '#2a7e7e',
                    '#347a9d',
                    '#4b73c3',
                    '#6a6acd',
                    '#825ec9',
                    '#9f53c6',
                    '#bb3ebb',
                    '#c14497',
                    '#c34b73',
                ],
            },
            text: {
                values: ['#ffffff', '#000000'],
                contrastTo: 'background',
            },
        },
    },
} as const satisfies Record<string, DeterministicStyleSpec>;

export type Cc0AvatarStyleName = keyof typeof CC0_AVATAR_STYLES;

for (const styleSpec of Object.values(CC0_AVATAR_STYLES)) {
    assertCc0License(styleSpec.meta);
}

export interface DeterministicAvatarOptions {
    seed: string;
    styleName?: Cc0AvatarStyleName;
    size?: number;
}

export interface DeterministicAvatarResult {
    svg: string;
    backgroundHex: string;
    foregroundHex: string;
    license: MetaLicense;
    toDataUri: () => string;
}

function extractInitials(seed: string): string {
    const cleaned = seed.trim().replace(/@.*$/, '');
    if (!cleaned) {
        return 'U';
    }
    const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return cleaned.slice(0, 2).toUpperCase();
}

export function createDeterministicAvatar({
    seed,
    styleName = 'glass',
    size = 64,
}: DeterministicAvatarOptions): DeterministicAvatarResult {
    const styleSpec = CC0_AVATAR_STYLES[styleName];
    if (!styleSpec) {
        throw new Error(`Unknown CC0 avatar style: "${String(styleName)}"`);
    }

    const license = assertCc0License(styleSpec.meta);
    const seedKey = `${styleName}:${seed || 'user'}`;
    const prng = new Mulberry32(Fnv1a.hash(seedKey));

    const bgPalette = styleSpec.colors.background.values;
    const bgHex = prng.pick(bgPalette);
    const bgColor = new Color(bgHex);

    const contrastCandidates =
        styleName === 'shape-grid'
            ? styleSpec.colors.shape.values
            : styleName === 'initials'
              ? styleSpec.colors.text.values
              : ['#ffffff', '#000000'];

    const sortedContrast = bgColor.sortByContrast(
        contrastCandidates.map((hex) => new Color(hex))
    );
    const fgHex = sortedContrast[0].toHex();

    const clipId = `db-${Fnv1a.hash(`clip:${seedKey}`).toString(16)}`;
    let innerBody = '';

    if (styleName === 'glass') {
        const accent1 = prng.pick(bgPalette);
        const accent2 = prng.pick(bgPalette);
        const cx1 = prng.nextInt(15, 85);
        const cy1 = prng.nextInt(15, 85);
        const cx2 = prng.nextInt(15, 85);
        const cy2 = prng.nextInt(15, 85);
        const initials = Xml.escape(extractInitials(seed));

        innerBody = [
            `<circle cx="${cx1}" cy="${cy1}" r="44" fill="${Xml.escape(accent1)}" fill-opacity="0.65" />`,
            `<circle cx="${cx2}" cy="${cy2}" r="36" fill="${Xml.escape(accent2)}" fill-opacity="0.55" />`,
            `<text x="50" y="53" text-anchor="middle" dominant-baseline="central" fill="${Xml.escape(fgHex)}" font-family="Inter, system-ui, sans-serif" font-size="38" font-weight="700">${initials}</text>`,
        ].join('');
    } else if (styleName === 'shape-grid') {
        const cells: string[] = [];
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 2; col++) {
                const active = prng.nextInt(0, 1) === 1;
                if (active) {
                    const xLeft = 18 + col * 16;
                    const xRight = 18 + (3 - col) * 16;
                    const y = 18 + row * 16;
                    cells.push(
                        `<rect x="${xLeft}" y="${y}" width="14" height="14" rx="3" fill="${Xml.escape(fgHex)}" fill-opacity="0.82" />`
                    );
                    cells.push(
                        `<rect x="${xRight}" y="${y}" width="14" height="14" rx="3" fill="${Xml.escape(fgHex)}" fill-opacity="0.82" />`
                    );
                }
            }
        }
        innerBody = cells.join('');
    } else {
        const initials = Xml.escape(extractInitials(seed));
        innerBody = `<text x="50" y="53" text-anchor="middle" dominant-baseline="central" fill="${Xml.escape(fgHex)}" font-family="Inter, system-ui, sans-serif" font-size="42" font-weight="700">${initials}</text>`;
    }

    const svg = [
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${Xml.escape(seed || 'Avatar')}">`,
        `<defs><clipPath id="${clipId}"><rect width="100" height="100" rx="50" /></clipPath></defs>`,
        `<g clip-path="url(#${clipId})">`,
        `<rect width="100" height="100" fill="${Xml.escape(bgHex)}" />`,
        innerBody,
        `</g>`,
        `</svg>`,
    ].join('');

    return {
        svg,
        backgroundHex: bgHex,
        foregroundHex: fgHex,
        license,
        toDataUri: () => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
    };
}
