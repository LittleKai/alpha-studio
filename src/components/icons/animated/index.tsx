import React, { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { Variants } from 'framer-motion';

export interface AnimatedIconHandle {
    startAnimation: () => void;
    stopAnimation: () => void;
}

export interface AnimatedIconProps extends HTMLAttributes<HTMLSpanElement> {
    size?: number;
}

function useHoverControls(
    ref: React.ForwardedRef<AnimatedIconHandle>,
    onMouseEnter?: React.MouseEventHandler<HTMLSpanElement>,
    onMouseLeave?: React.MouseEventHandler<HTMLSpanElement>
) {
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    useImperativeHandle(ref, () => {
        isControlledRef.current = true;
        return {
            startAnimation: () => {
                void controls.start('animate');
            },
            stopAnimation: () => {
                void controls.start('normal');
            },
        };
    });

    const handleMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLSpanElement>) => {
            if (isControlledRef.current) {
                onMouseEnter?.(e);
            } else {
                void controls.start('animate');
            }
        },
        [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLSpanElement>) => {
            if (isControlledRef.current) {
                onMouseLeave?.(e);
            } else {
                void controls.start('normal');
            }
        },
        [controls, onMouseLeave]
    );

    return { controls, handleMouseEnter, handleMouseLeave };
}

const ARROW_LEFT_PATH_VARIANTS: Variants = {
    normal: { d: 'm12 19-7-7 7-7', translateX: 0 },
    animate: {
        d: 'm12 19-7-7 7-7',
        translateX: [0, 3, 0],
        transition: { duration: 0.4 },
    },
};

const ARROW_LEFT_SECOND_PATH_VARIANTS: Variants = {
    normal: { d: 'M19 12H5' },
    animate: {
        d: ['M19 12H5', 'M19 12H8', 'M19 12H5'],
        transition: { duration: 0.4 },
    },
};

export const AnimatedArrowLeftIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    ({ onMouseEnter, onMouseLeave, className = '', size = 20, ...props }, ref) => {
        const { controls, handleMouseEnter, handleMouseLeave } = useHoverControls(
            ref,
            onMouseEnter,
            onMouseLeave
        );

        return (
            <span
                className={`inline-flex items-center justify-center ${className}`.trim()}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...props}
            >
                <svg
                    fill="none"
                    height={size}
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width={size}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <motion.path
                        animate={controls}
                        d="m12 19-7-7 7-7"
                        variants={ARROW_LEFT_PATH_VARIANTS}
                    />
                    <motion.path
                        animate={controls}
                        d="M19 12H5"
                        variants={ARROW_LEFT_SECOND_PATH_VARIANTS}
                    />
                </svg>
            </span>
        );
    }
);
AnimatedArrowLeftIcon.displayName = 'AnimatedArrowLeftIcon';

export const AnimatedEyeIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    ({ onMouseEnter, onMouseLeave, className = '', size = 18, ...props }, ref) => {
        const { controls, handleMouseEnter, handleMouseLeave } = useHoverControls(
            ref,
            onMouseEnter,
            onMouseLeave
        );

        return (
            <span
                className={`inline-flex items-center justify-center ${className}`.trim()}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...props}
            >
                <svg
                    fill="none"
                    height={size}
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width={size}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <motion.path
                        animate={controls}
                        d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                        style={{ originY: '50%' }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        variants={{
                            normal: { scaleY: 1, opacity: 1 },
                            animate: { scaleY: [1, 0.1, 1], opacity: [1, 0.3, 1] },
                        }}
                    />
                    <motion.circle
                        animate={controls}
                        cx="12"
                        cy="12"
                        r="3"
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        variants={{
                            normal: { scale: 1, opacity: 1 },
                            animate: { scale: [1, 0.3, 1], opacity: [1, 0.3, 1] },
                        }}
                    />
                </svg>
            </span>
        );
    }
);
AnimatedEyeIcon.displayName = 'AnimatedEyeIcon';

const EYE_OFF_PATH_VARIANTS: Variants = {
    normal: { pathLength: 1, opacity: 1, pathOffset: 0 },
    animate: {
        pathLength: [0, 2],
        opacity: [0, 1],
        pathOffset: [0, 2],
        transition: { duration: 0.6 },
    },
};

export const AnimatedEyeOffIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    ({ onMouseEnter, onMouseLeave, className = '', size = 18, ...props }, ref) => {
        const { controls, handleMouseEnter, handleMouseLeave } = useHoverControls(
            ref,
            onMouseEnter,
            onMouseLeave
        );

        return (
            <span
                className={`inline-flex items-center justify-center ${className}`.trim()}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...props}
            >
                <svg
                    fill="none"
                    height={size}
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width={size}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                    <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                    <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                    <motion.path
                        animate={controls}
                        d="m2 2 20 20"
                        variants={EYE_OFF_PATH_VARIANTS}
                    />
                </svg>
            </span>
        );
    }
);
AnimatedEyeOffIcon.displayName = 'AnimatedEyeOffIcon';

export const AnimatedPlusIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    ({ onMouseEnter, onMouseLeave, className = '', size = 16, ...props }, ref) => {
        const { controls, handleMouseEnter, handleMouseLeave } = useHoverControls(
            ref,
            onMouseEnter,
            onMouseLeave
        );

        return (
            <span
                className={`inline-flex items-center justify-center ${className}`.trim()}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...props}
            >
                <motion.svg
                    animate={controls}
                    fill="none"
                    height={size}
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                    variants={{
                        normal: { rotate: 0 },
                        animate: { rotate: 180 },
                    }}
                    viewBox="0 0 24 24"
                    width={size}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                </motion.svg>
            </span>
        );
    }
);
AnimatedPlusIcon.displayName = 'AnimatedPlusIcon';

const DELETE_LID_VARIANTS: Variants = {
    normal: { y: 0 },
    animate: { y: -1.1 },
};

const DELETE_SPRING = {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
};

export const AnimatedDeleteIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    ({ onMouseEnter, onMouseLeave, className = '', size = 16, ...props }, ref) => {
        const { controls, handleMouseEnter, handleMouseLeave } = useHoverControls(
            ref,
            onMouseEnter,
            onMouseLeave
        );

        return (
            <span
                className={`inline-flex items-center justify-center ${className}`.trim()}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...props}
            >
                <svg
                    fill="none"
                    height={size}
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width={size}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <motion.g
                        animate={controls}
                        transition={DELETE_SPRING}
                        variants={DELETE_LID_VARIANTS}
                    >
                        <path d="M3 6h18" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </motion.g>
                    <motion.path
                        animate={controls}
                        d="M19 8v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V8"
                        transition={DELETE_SPRING}
                        variants={{
                            normal: { d: 'M19 8v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V8' },
                            animate: { d: 'M19 9v12c0 1-1 2-2 2H7c-1 0-2-1-2-2V9' },
                        }}
                    />
                    <motion.line
                        animate={controls}
                        transition={DELETE_SPRING}
                        variants={{
                            normal: { y1: 11, y2: 17 },
                            animate: { y1: 11.5, y2: 17.5 },
                        }}
                        x1="10"
                        x2="10"
                        y1="11"
                        y2="17"
                    />
                    <motion.line
                        animate={controls}
                        transition={DELETE_SPRING}
                        variants={{
                            normal: { y1: 11, y2: 17 },
                            animate: { y1: 11.5, y2: 17.5 },
                        }}
                        x1="14"
                        x2="14"
                        y1="11"
                        y2="17"
                    />
                </svg>
            </span>
        );
    }
);
AnimatedDeleteIcon.displayName = 'AnimatedDeleteIcon';

const UPLOAD_ARROW_VARIANTS: Variants = {
    normal: { y: 0 },
    animate: {
        y: -2,
        transition: {
            type: 'spring',
            stiffness: 200,
            damping: 10,
            mass: 1,
        },
    },
};

export const AnimatedUploadIcon = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    ({ onMouseEnter, onMouseLeave, className = '', size = 32, ...props }, ref) => {
        const { controls, handleMouseEnter, handleMouseLeave } = useHoverControls(
            ref,
            onMouseEnter,
            onMouseLeave
        );

        return (
            <span
                className={`inline-flex items-center justify-center ${className}`.trim()}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                {...props}
            >
                <svg
                    fill="none"
                    height={size}
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width={size}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <motion.g animate={controls} variants={UPLOAD_ARROW_VARIANTS}>
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" x2="12" y1="3" y2="15" />
                    </motion.g>
                </svg>
            </span>
        );
    }
);
AnimatedUploadIcon.displayName = 'AnimatedUploadIcon';
