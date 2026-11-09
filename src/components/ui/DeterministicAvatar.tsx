import React, { useMemo } from 'react';
import type { Cc0AvatarStyleName } from '../../utils/dicebearCore';
import { createDeterministicAvatar } from '../../utils/dicebearCore';

export interface DeterministicAvatarProps {
    seed: string;
    size?: number;
    styleName?: Cc0AvatarStyleName;
    className?: string;
    alt?: string;
}

export const DeterministicAvatar: React.FC<DeterministicAvatarProps> = ({
    seed,
    size = 32,
    styleName = 'glass',
    className = '',
    alt,
}) => {
    const avatar = useMemo(
        () => createDeterministicAvatar({ seed, styleName, size }),
        [seed, styleName, size]
    );

    return (
        <span
            className={`inline-flex items-center justify-center overflow-hidden shrink-0 select-none ${className}`.trim()}
            style={{ width: size, height: size }}
            title={alt || seed}
            dangerouslySetInnerHTML={{ __html: avatar.svg }}
        />
    );
};

export default DeterministicAvatar;
