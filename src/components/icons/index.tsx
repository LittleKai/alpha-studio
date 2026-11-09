import React from 'react';
import type { SVGProps } from 'react';

export interface IconifyIcon {
    body: string;
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    rotate?: number;
    hFlip?: boolean;
    vFlip?: boolean;
}

export interface IconifyIconCustomisations {
    width?: string | number | null;
    height?: string | number | null;
    rotate?: number;
    hFlip?: boolean;
    vFlip?: boolean;
}

export type SVGViewBox = [number, number, number, number];

export interface IconifyIconBuildResult {
    attributes: {
        width?: string;
        height?: string;
        viewBox: string;
    };
    viewBox: SVGViewBox;
    body: string;
}

export const defaultIconDimensions = Object.freeze({
    left: 0,
    top: 0,
    width: 24,
    height: 24,
});

export const defaultIconTransformations = Object.freeze({
    rotate: 0,
    vFlip: false,
    hFlip: false,
});

export const defaultIconProps = Object.freeze({
    ...defaultIconDimensions,
    ...defaultIconTransformations,
});

export const defaultIconCustomisations: Required<IconifyIconCustomisations> = Object.freeze({
    width: null,
    height: null,
    rotate: 0,
    vFlip: false,
    hFlip: false,
});

const unitsSplit = /(-?[0-9.]*[0-9]+[0-9.]*)/g;
const unitsTest = /^-?[0-9.]*[0-9]+[0-9.]*$/g;

export function calculateSize(size: string, ratio: number, precision?: number): string;
export function calculateSize(size: number, ratio: number, precision?: number): number;
export function calculateSize(size: string | number, ratio: number, precision?: number): string | number;
export function calculateSize(
    size: string | number,
    ratio: number,
    precision?: number
): string | number {
    if (ratio === 1) {
        return size;
    }

    const prec = precision || 100;
    if (typeof size === 'number') {
        return Math.ceil(size * ratio * prec) / prec;
    }

    if (typeof size !== 'string') {
        return size;
    }

    const oldParts = size.split(unitsSplit);
    if (oldParts === null || !oldParts.length) {
        return size;
    }

    const newParts: (string | number)[] = [];
    let code = oldParts.shift() as string;
    let isNumber = unitsTest.test(code);

    while (true) {
        if (isNumber) {
            const num = parseFloat(code);
            if (isNaN(num)) {
                newParts.push(code);
            } else {
                newParts.push(Math.ceil(num * ratio * prec) / prec);
            }
        } else {
            newParts.push(code);
        }

        const nextCode = oldParts.shift();
        if (nextCode === undefined) {
            return newParts.join('');
        }
        code = nextCode;
        isNumber = !isNumber;
    }
}

export function splitSVGDefs(content: string, tag = 'defs'): { defs: string; content: string } {
    let defs = '';
    const index = content.indexOf('<' + tag);
    while (index >= 0) {
        const start = content.indexOf('>', index);
        const end = content.indexOf('</' + tag);
        if (start === -1 || end === -1) {
            break;
        }
        const endEnd = content.indexOf('>', end);
        if (endEnd === -1) {
            break;
        }
        defs += content.slice(start + 1, end).trim();
        content = content.slice(0, index).trim() + content.slice(endEnd + 1);
    }

    return {
        defs,
        content,
    };
}

export function mergeDefsAndContent(defs: string, content: string): string {
    return defs ? '<defs>' + defs + '</defs>' + content : content;
}

export function wrapSVGContent(body: string, start: string, end: string): string {
    const split = splitSVGDefs(body);
    return mergeDefsAndContent(split.defs, start + split.content + end);
}

export function mergeIconTransformations<T extends IconifyIcon>(
    obj1: T,
    obj2: IconifyIconCustomisations
): T {
    const result = { ...obj1 };
    if (!obj1.hFlip !== !obj2.hFlip) {
        result.hFlip = true;
    } else {
        delete result.hFlip;
    }
    if (!obj1.vFlip !== !obj2.vFlip) {
        result.vFlip = true;
    } else {
        delete result.vFlip;
    }
    const rotate = ((obj1.rotate || 0) + (obj2.rotate || 0)) % 4;
    if (rotate) {
        result.rotate = rotate;
    } else {
        delete result.rotate;
    }
    return result;
}

export const isUnsetKeyword = (value: unknown): boolean =>
    value === 'unset' || value === 'undefined' || value === 'none';

export function iconToSVG(
    icon: IconifyIcon,
    customisations?: IconifyIconCustomisations
): IconifyIconBuildResult {
    const fullIcon = {
        ...defaultIconProps,
        ...icon,
    };
    const fullCustomisations = {
        ...defaultIconCustomisations,
        ...customisations,
    };

    const box = {
        left: fullIcon.left,
        top: fullIcon.top,
        width: fullIcon.width,
        height: fullIcon.height,
    };

    let body = fullIcon.body;

    [fullIcon, fullCustomisations].forEach((props) => {
        const transformations: string[] = [];
        const hFlip = Boolean(props.hFlip);
        const vFlip = Boolean(props.vFlip);
        let rotation = props.rotate || 0;

        if (hFlip) {
            if (vFlip) {
                rotation += 2;
            } else {
                transformations.push(
                    'translate(' +
                        (box.width + box.left).toString() +
                        ' ' +
                        (0 - box.top).toString() +
                        ')'
                );
                transformations.push('scale(-1 1)');
                box.top = box.left = 0;
            }
        } else if (vFlip) {
            transformations.push(
                'translate(' +
                    (0 - box.left).toString() +
                    ' ' +
                    (box.height + box.top).toString() +
                    ')'
            );
            transformations.push('scale(1 -1)');
            box.top = box.left = 0;
        }

        let tempValue: number;
        if (rotation < 0) {
            rotation -= Math.floor(rotation / 4) * 4;
        }
        rotation = rotation % 4;
        switch (rotation) {
            case 1:
                tempValue = box.height / 2 + box.top;
                transformations.unshift(
                    'rotate(90 ' + tempValue.toString() + ' ' + tempValue.toString() + ')'
                );
                break;

            case 2:
                transformations.unshift(
                    'rotate(180 ' +
                        (box.width / 2 + box.left).toString() +
                        ' ' +
                        (box.height / 2 + box.top).toString() +
                        ')'
                );
                break;

            case 3:
                tempValue = box.width / 2 + box.left;
                transformations.unshift(
                    'rotate(-90 ' + tempValue.toString() + ' ' + tempValue.toString() + ')'
                );
                break;
        }

        if (rotation % 2 === 1) {
            if (box.left !== box.top) {
                tempValue = box.left;
                box.left = box.top;
                box.top = tempValue;
            }
            if (box.width !== box.height) {
                tempValue = box.width;
                box.width = box.height;
                box.height = tempValue;
            }
        }

        if (transformations.length) {
            body = wrapSVGContent(
                body,
                '<g transform="' + transformations.join(' ') + '">',
                '</g>'
            );
        }
    });

    const customisationsWidth = fullCustomisations.width;
    const customisationsHeight = fullCustomisations.height;
    const boxWidth = box.width;
    const boxHeight = box.height;

    let width: string | number;
    let height: string | number;
    if (customisationsWidth === null) {
        height =
            customisationsHeight === null
                ? '1em'
                : customisationsHeight === 'auto'
                  ? boxHeight
                  : customisationsHeight;
        width = calculateSize(height, boxWidth / boxHeight);
    } else {
        width = customisationsWidth === 'auto' ? boxWidth : customisationsWidth;
        height =
            customisationsHeight === null
                ? calculateSize(width, boxHeight / boxWidth)
                : customisationsHeight === 'auto'
                  ? boxHeight
                  : customisationsHeight;
    }

    const attributes = {} as IconifyIconBuildResult['attributes'];
    const setAttr = (prop: 'width' | 'height', value: string | number) => {
        if (!isUnsetKeyword(value)) {
            attributes[prop] = value.toString();
        }
    };
    setAttr('width', width);
    setAttr('height', height);

    const viewBox: SVGViewBox = [box.left, box.top, boxWidth, boxHeight];
    attributes.viewBox = viewBox.join(' ');

    return {
        attributes,
        viewBox,
        body,
    };
}

export function iconToHTML(body: string, attributes: Record<string, string>): string {
    let renderAttribsHTML =
        body.indexOf('xlink:') === -1 ? '' : ' xmlns:xlink="http://www.w3.org/1999/xlink"';
    for (const attr in attributes) {
        renderAttribsHTML += ' ' + attr + '="' + attributes[attr] + '"';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg"' + renderAttribsHTML + '>' + body + '</svg>';
}

export const STUDIO_ICON_DATA = {
    'chevron-down': {
        width: 24,
        height: 24,
        body: '<path d="m6 9 6 6 6-6"/>',
    },
    'coins': {
        width: 24,
        height: 24,
        body: '<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><path d="m2 16 6 6"/><circle cx="16" cy="9" r="2.9"/><circle cx="6" cy="5" r="3"/>',
    },
    'book-open': {
        width: 24,
        height: 24,
        body: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/><path d="M8 11h8"/><path d="M8 7h6"/>',
    },
    'user': {
        width: 24,
        height: 24,
        body: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    },
    'graduation-cap': {
        width: 24,
        height: 24,
        body: '<path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/><path d="M22 10v6"/>',
    },
    'settings': {
        width: 24,
        height: 24,
        body: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    },
    'log-out': {
        width: 24,
        height: 24,
        body: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    },
    'menu': {
        width: 24,
        height: 24,
        body: '<line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/>',
    },
    'x': {
        width: 24,
        height: 24,
        body: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    },
    'home': {
        width: 24,
        height: 24,
        body: '<path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>',
    },
    'info': {
        width: 24,
        height: 24,
        body: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    },
    'newspaper': {
        width: 24,
        height: 24,
        body: '<path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>',
    },
    'briefcase': {
        width: 24,
        height: 24,
        body: '<path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    },
    'zap': {
        width: 24,
        height: 24,
        body: '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
    },
    'users': {
        width: 24,
        height: 24,
        body: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    },
    'log-in': {
        width: 24,
        height: 24,
        body: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="3" x2="15" y1="12" y2="12"/>',
    },
    'camera': {
        width: 24,
        height: 24,
        body: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    },
    'save': {
        width: 24,
        height: 24,
        body: '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>',
    },
    'map-pin': {
        width: 24,
        height: 24,
        body: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    },
    'calendar': {
        width: 24,
        height: 24,
        body: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><circle cx="8" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="18" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="18" r="1" fill="currentColor" stroke="none"/>',
    },
    'mail': {
        width: 24,
        height: 24,
        body: '<path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/>',
    },
    'phone': {
        width: 24,
        height: 24,
        body: '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>',
    },
    'link': {
        width: 24,
        height: 24,
        body: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    },
    'file-text': {
        width: 24,
        height: 24,
        body: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    },
    'image': {
        width: 24,
        height: 24,
        body: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    },
    'lock': {
        width: 24,
        height: 24,
        body: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    },
} as const satisfies Record<string, IconifyIcon>;

export type StudioIconName = keyof typeof STUDIO_ICON_DATA;

export interface StudioIconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
    name?: StudioIconName;
    size?: number | string;
    rotate?: number;
    hFlip?: boolean;
    vFlip?: boolean;
}

export const StudioIcon: React.FC<StudioIconProps & { name: StudioIconName }> = ({
    name,
    size,
    width,
    height,
    rotate,
    hFlip,
    vFlip,
    strokeWidth = 2,
    className,
    ...props
}) => {
    const iconData = STUDIO_ICON_DATA[name];
    const resolvedSize = size ?? width ?? height ?? 20;
    const built = iconToSVG(iconData, {
        width: width ?? resolvedSize,
        height: height ?? resolvedSize,
        rotate,
        hFlip,
        vFlip,
    });

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={built.attributes.width}
            height={built.attributes.height}
            viewBox={built.attributes.viewBox}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            dangerouslySetInnerHTML={{ __html: built.body }}
            {...props}
        />
    );
};

function createStudioIcon(name: StudioIconName, defaultSize = 20) {
    const Component: React.FC<Omit<StudioIconProps, 'name'>> = ({ size = defaultSize, ...props }) => (
        <StudioIcon name={name} size={size} {...props} />
    );
    Component.displayName = `StudioIcon(${name})`;
    return Component;
}

export const ChevronDownIcon = createStudioIcon('chevron-down', 16);
export const CoinsIcon = createStudioIcon('coins', 16);
export const BookOpenIcon = createStudioIcon('book-open', 16);
export const UserIcon = createStudioIcon('user', 16);
export const GraduationCapIcon = createStudioIcon('graduation-cap', 16);
export const SettingsIcon = createStudioIcon('settings', 16);
export const LogOutIcon = createStudioIcon('log-out', 16);
export const MenuIcon = createStudioIcon('menu', 24);
export const XIcon = createStudioIcon('x', 16);
export const HomeIcon = createStudioIcon('home', 20);
export const InfoIcon = createStudioIcon('info', 20);
export const NewspaperIcon = createStudioIcon('newspaper', 20);
export const BriefcaseIcon = createStudioIcon('briefcase', 16);
export const ZapIcon = createStudioIcon('zap', 20);
export const UsersIcon = createStudioIcon('users', 20);
export const LogInIcon = createStudioIcon('log-in', 20);
export const CameraIcon = createStudioIcon('camera', 18);
export const SaveIcon = createStudioIcon('save', 18);
export const MapPinIcon = createStudioIcon('map-pin', 16);
export const CalendarIcon = createStudioIcon('calendar', 16);
export const MailIcon = createStudioIcon('mail', 16);
export const PhoneIcon = createStudioIcon('phone', 16);
export const LinkIcon = createStudioIcon('link', 16);
export const FileTextIcon = createStudioIcon('file-text', 20);
export const ImageIcon = createStudioIcon('image', 20);
export const LockIcon = createStudioIcon('lock', 20);
