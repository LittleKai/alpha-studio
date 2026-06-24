import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Fast spring for outline ring
  const ringX = useSpring(mouseX, { stiffness: 450, damping: 28 });
  const ringY = useSpring(mouseY, { stiffness: 450, damping: 28 });

  useEffect(() => {
    // Flag to track mouse movement status
    let firstMove = true;

    const handleMouseMove = (e: MouseEvent) => {
      if (firstMove) {
        // Position instantly on first move to prevent jumping from (0,0)
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
        firstMove = false;
      } else {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    const updateHoverState = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isClickable =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('.cursor-pointer') ||
        target.closest('[role="button"]') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea');

      setIsHovered(!!isClickable);
    };

    window.addEventListener('mouseover', updateHoverState);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', updateHoverState);
    };
  }, [mouseX, mouseY, isVisible]);

  if (typeof window === 'undefined') return null;

  // Disable completely on touch devices (mobile & tablets)
  const isTouchDevice =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches;

  if (isTouchDevice) return null;

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        x: ringX,
        y: ringY,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: isHovered ? 64 : 48,
        height: isHovered ? 64 : 48,
        borderColor: isHovered ? 'rgba(255, 255, 255, 0.25)' : 'var(--accent-primary)',
        opacity: isVisible ? 1 : 0,
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="fixed pointer-events-none rounded-full border-[1.5px] z-[99998] will-change-[transform,opacity,width,height]"
    />
  );
}
