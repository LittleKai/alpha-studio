import { ReactNode } from 'react';
import { motion } from 'framer-motion';


interface RevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  scale?: number;
  staggerChildren?: number;
  className?: string;
  tag?: string;
  once?: boolean;
}

export const revealItemVariants = {
  hidden: (custom: { y: number; x: number; scale: number }) => ({
    opacity: 0,
    y: custom?.y !== undefined ? custom.y : 30,
    x: custom?.x !== undefined ? custom.x : 0,
    scale: custom?.scale !== undefined ? custom.scale : 1,
  }),
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 16,
    },
  },
};

export default function Reveal({
  children,
  delay = 0,
  duration = 0.5,
  y = 30,
  x = 0,
  scale = 1,
  staggerChildren,
  className = '',
  tag = 'div',
  once = true,
}: RevealProps) {
  // Get corresponding motion tag
  const MotionTag = (motion as any)[tag] || motion.div;

  if (staggerChildren !== undefined) {
    return (
      <MotionTag
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: '-50px' }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren,
              delayChildren: delay,
            },
          },
        }}
        className={className}
      >
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      initial={{ opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once, margin: '-50px' }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 16,
        delay,
        duration,
      }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}

// Child item for staggered containers
export interface RevealItemProps {
  children: ReactNode;
  className?: string;
  tag?: string;
  y?: number;
  x?: number;
  scale?: number;
}

export function RevealItem({
  children,
  className = '',
  tag = 'div',
  y = 30,
  x = 0,
  scale = 1,
}: RevealItemProps) {
  const MotionTag = (motion as any)[tag] || motion.div;

  return (
    <MotionTag
      variants={revealItemVariants}
      custom={{ y, x, scale }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
