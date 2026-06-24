import { ReactNode } from 'react';
import { motion } from 'framer-motion';


interface HoverSpringProps {
  children: ReactNode;
  scale?: number;
  y?: number;
  x?: number;
  className?: string;
  tag?: string;
}

export default function HoverSpring({
  children,
  scale = 1.03,
  y = -5,
  x = 0,
  className = '',
  tag = 'div',
}: HoverSpringProps) {
  const MotionTag = (motion as any)[tag] || motion.div;

  return (
    <MotionTag
      whileHover={{ scale, y, x }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
