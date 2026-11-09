import React from 'react';
import type { SVGProps } from 'react';
import { useTheme } from '../../theme/context';

export type BrandName = 'claude' | 'cursor' | 'github' | 'mcp';

export const SVGL_SIZE_LIMIT_BYTES = 21 * 1024;

export function convertBytes(bytes: number, format: 'KB' | 'MB' = 'KB'): string {
    if (format === 'KB') {
        return (bytes / 1024).toFixed(2) + ' KB';
    }
    if (format === 'MB') {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
    return 'Invalid format. Use "KB" or "MB".';
}

export function getViewBox(content: string): string | null {
    const viewBoxRegex = /viewBox="([^"]+)"/;
    return viewBoxRegex.exec(content)?.[1] ?? null;
}

export function getWidth(content: string): string | null {
    const widthRegex = /width="([^"]+)"/;
    return widthRegex.exec(content)?.[1] ?? null;
}

export function getHeight(content: string): string | null {
    const heightRegex = /height="([^"]+)"/;
    return heightRegex.exec(content)?.[1] ?? null;
}

export function ensureSvgViewBox(svgContent: string): string {
    const viewBox = getViewBox(svgContent);
    if (viewBox) {
        return svgContent;
    }
    const width = getWidth(svgContent);
    const height = getHeight(svgContent);
    if (!width || !height) {
        return svgContent;
    }
    return svgContent.replace('<svg', `<svg viewBox="0 0 ${width} ${height}"`);
}

export function checkBrandSvgSize(svgContent: string, limitBytes = SVGL_SIZE_LIMIT_BYTES): boolean {
    const byteLength = new TextEncoder().encode(svgContent).length;
    if (byteLength >= limitBytes) {
        throw new Error(
            `Brand SVG exceeds size limit (${convertBytes(byteLength)} >= ${convertBytes(limitBytes)})`
        );
    }
    return true;
}

export interface BrandSvgAsset {
    title: string;
    viewBox: string;
    lightBody: string;
    darkBody: string;
    rawLightSvg: string;
    rawDarkSvg: string;
}

const CLAUDE_PATH =
    '<path fill="#D97757" d="m50.228 170.321 50.357-28.257.843-2.463-.843-1.361h-2.462l-8.426-.518-28.775-.778-24.952-1.037-24.175-1.296-6.092-1.297L0 125.796l.583-3.759 5.12-3.434 7.324.648 16.202 1.101 24.304 1.685 17.629 1.037 26.118 2.722h4.148l.583-1.685-1.426-1.037-1.101-1.037-25.147-17.045-27.22-18.017-14.258-10.37-7.713-5.25-3.888-4.925-1.685-10.758 7-7.713 9.397.649 2.398.648 9.527 7.323 20.35 15.75L94.817 91.9l3.889 3.24 1.555-1.102.195-.777-1.75-2.917-14.453-26.118-15.425-26.572-6.87-11.018-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0 82.05 1.426l4.472 3.888 6.61 15.101 10.694 23.786 16.591 32.34 4.861 9.592 2.592 8.879.973 2.722h1.685v-1.556l1.36-18.211 2.528-22.36 2.463-28.776.843-8.1 4.018-9.722 7.971-5.25 6.222 2.981 5.12 7.324-.713 4.73-3.046 19.768-5.962 30.98-3.889 20.739h2.268l2.593-2.593 10.499-13.934 17.628-22.036 7.778-8.749 9.073-9.657 5.833-4.601h11.018l8.1 12.055-3.628 12.443-11.342 14.388-9.398 12.184-13.48 18.147-8.426 14.518.778 1.166 2.01-.194 30.46-6.481 16.462-2.982 19.637-3.37 8.88 4.148.971 4.213-3.5 8.62-20.998 5.184-24.628 4.926-36.682 8.685-.454.324.519.648 16.526 1.555 7.065.389h17.304l32.21 2.398 8.426 5.574 5.055 6.805-.843 5.184-12.962 6.611-17.498-4.148-40.83-9.721-14-3.5h-1.944v1.167l11.666 11.406 21.387 19.314 26.767 24.887 1.36 6.157-3.434 4.86-3.63-.518-23.526-17.693-9.073-7.972-20.545-17.304h-1.36v1.814l4.73 6.935 25.017 37.59 1.296 11.536-1.814 3.76-6.481 2.268-7.13-1.297-14.647-20.544-15.1-23.138-12.185-20.739-1.49.843-7.194 77.448-3.37 3.953-7.778 2.981-6.48-4.925-3.436-7.972 3.435-15.749 4.148-20.544 3.37-16.333 3.046-20.285 1.815-6.74-.13-.454-1.49.194-15.295 20.999-23.267 31.433-18.406 19.702-4.407 1.75-7.648-3.954.713-7.064 4.277-6.286 25.47-32.405 15.36-20.092 9.917-11.6-.065-1.686h-.583L44.07 198.125l-12.055 1.555-5.185-4.86.648-7.972 2.463-2.593 20.35-13.999-.064.065Z"/>';

const CURSOR_GEO =
    'M457.43,125.94L244.42,2.96c-6.84-3.95-15.28-3.95-22.12,0L9.3,125.94c-5.75,3.32-9.3,9.46-9.3,16.11v247.99c0,6.65,3.55,12.79,9.3,16.11l213.01,122.98c6.84,3.95,15.28,3.95,22.12,0l213.01-122.98c5.75-3.32,9.3-9.46,9.3-16.11v-247.99c0-6.65-3.55-12.79-9.3-16.11h-.01ZM444.05,151.99l-205.63,356.16c-1.39,2.4-5.06,1.42-5.06-1.36v-233.21c0-4.66-2.49-8.97-6.53-11.31L24.87,145.67c-2.4-1.39-1.42-5.06,1.36-5.06h411.26c5.84,0,9.49,6.33,6.57,11.39h-.01Z';

const GITHUB_LIGHT_BODY =
    '<path fill="#1b1f23" fill-rule="evenodd" clip-rule="evenodd" d="M512 0C229.12 0 0 229.12 0 512c0 226.56 146.56 417.92 350.08 485.76 25.6 4.48 35.2-10.88 35.2-24.32 0-12.16-.64-52.48-.64-95.36-128.64 23.68-161.92-31.36-172.16-60.16-5.76-14.72-30.72-60.16-52.48-72.32-17.92-9.6-43.52-33.28-.64-33.92 40.32-.64 69.12 37.12 78.72 52.48 46.08 77.44 119.68 55.68 149.12 42.24 4.48-33.28 17.92-55.68 32.64-68.48-113.92-12.8-232.96-56.96-232.96-252.8 0-55.68 19.84-101.76 52.48-137.6-5.12-12.8-23.04-65.28 5.12-135.68 0 0 42.88-13.44 140.8 52.48 40.96-11.52 84.48-17.28 128-17.28s87.04 5.76 128 17.28c97.92-66.56 140.8-52.48 140.8-52.48 28.16 70.4 10.24 122.88 5.12 135.68 32.64 35.84 52.48 81.28 52.48 137.6 0 196.48-119.68 240-233.6 252.8 18.56 16 34.56 46.72 34.56 94.72 0 68.48-.64 123.52-.64 140.8 0 13.44 9.6 29.44 35.2 24.32C877.44 929.92 1024 737.92 1024 512 1024 229.12 794.88 0 512 0"/>';

const GITHUB_DARK_BODY =
    '<path fill="#ffffff" fill-rule="evenodd" clip-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z" transform="scale(64)"/>';

const MCP_PATHS =
    '<path d="M15.688 2.343a2.588 2.588 0 00-3.61 0l-9.626 9.44a.863.863 0 01-1.203 0 .823.823 0 010-1.18l9.626-9.44a4.313 4.313 0 016.016 0 4.116 4.116 0 011.204 3.54 4.3 4.3 0 013.609 1.18l.05.05a4.115 4.115 0 010 5.9l-8.706 8.537a.274.274 0 000 .393l1.788 1.754a.823.823 0 010 1.18.863.863 0 01-1.203 0l-1.788-1.753a1.92 1.92 0 010-2.754l8.706-8.538a2.47 2.47 0 000-3.54l-.05-.049a2.588 2.588 0 00-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 01-1.204 0 .823.823 0 010-1.18l7.273-7.133a2.47 2.47 0 00-.003-3.537z"/><path d="M14.485 4.703a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a4.115 4.115 0 000 5.9 4.314 4.314 0 006.016 0l7.12-6.982a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a2.588 2.588 0 01-3.61 0 2.47 2.47 0 010-3.54l7.12-6.982z"/>';

export const BRAND_SVG_ASSETS: Record<BrandName, BrandSvgAsset> = {
    claude: {
        title: 'Claude AI',
        viewBox: '0 0 256 257',
        lightBody: CLAUDE_PATH,
        darkBody: CLAUDE_PATH,
        rawLightSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="257" viewBox="0 0 256 257">${CLAUDE_PATH}</svg>`,
        rawDarkSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="257" viewBox="0 0 256 257">${CLAUDE_PATH}</svg>`,
    },
    cursor: {
        title: 'Cursor',
        viewBox: '0 0 466.73 532.09',
        lightBody: `<path fill="#26251e" d="${CURSOR_GEO}"/>`,
        darkBody: `<path fill="#edecec" d="${CURSOR_GEO}"/>`,
        rawLightSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 466.73 532.09"><path fill="#26251e" d="${CURSOR_GEO}"/></svg>`,
        rawDarkSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 466.73 532.09"><path fill="#edecec" d="${CURSOR_GEO}"/></svg>`,
    },
    github: {
        title: 'GitHub',
        viewBox: '0 0 1024 1024',
        lightBody: GITHUB_LIGHT_BODY,
        darkBody: GITHUB_DARK_BODY,
        rawLightSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" fill="none">${GITHUB_LIGHT_BODY}</svg>`,
        rawDarkSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none">${GITHUB_DARK_BODY}</svg>`,
    },
    mcp: {
        title: 'Model Context Protocol',
        viewBox: '0 0 24 24',
        lightBody: `<g fill="#000000" fill-rule="evenodd">${MCP_PATHS}</g>`,
        darkBody: `<g fill="#ffffff" fill-rule="evenodd">${MCP_PATHS}</g>`,
        rawLightSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="#000000" fill-rule="evenodd">${MCP_PATHS}</svg>`,
        rawDarkSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" fill="#ffffff" fill-rule="evenodd">${MCP_PATHS}</svg>`,
    },
};

for (const asset of Object.values(BRAND_SVG_ASSETS)) {
    checkBrandSvgSize(asset.rawLightSvg);
    checkBrandSvgSize(asset.rawDarkSvg);
}

export interface BrandLogoProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
    brand: BrandName;
    size?: number | string;
    themeMode?: 'light' | 'dark';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
    brand,
    size = 24,
    themeMode,
    className = '',
    ...props
}) => {
    let contextTheme: 'light' | 'dark' = 'dark';
    try {
        const themeCtx = useTheme();
        contextTheme = themeCtx.theme;
    } catch {
        contextTheme = 'dark';
    }

    const activeTheme = themeMode ?? contextTheme;
    const asset = BRAND_SVG_ASSETS[brand];
    const normalizedSvg = ensureSvgViewBox(
        activeTheme === 'light' ? asset.rawLightSvg : asset.rawDarkSvg
    );
    const viewBox = getViewBox(normalizedSvg) || asset.viewBox;
    const body = activeTheme === 'light' ? asset.lightBody : asset.darkBody;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox={viewBox}
            fill="none"
            role="img"
            aria-label={asset.title}
            data-brand={brand}
            data-theme-variant={activeTheme}
            className={`inline-block shrink-0 ${className}`.trim()}
            dangerouslySetInnerHTML={{ __html: body }}
            {...props}
        />
    );
};

export default BrandLogo;
