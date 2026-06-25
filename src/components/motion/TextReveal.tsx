import { motion } from 'framer-motion';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}

export default function TextReveal({
  text,
  className = '',
  delay = 0,
  stagger = 0.08,
}: TextRevealProps) {
  const words = text.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      y: '100%',
      filter: 'blur(8px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring' as const,
        stiffness: 80,
        damping: 14,
      },
    },
  };

  return (
    <motion.span
      key={text}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={`inline-block ${className}`}
    >
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="inline-block overflow-hidden pt-[0.25em] mt-[-0.25em] pb-[0.25em] mb-[-0.25em]"
        >
          <motion.span
            variants={wordVariants}
            className="inline-block origin-bottom mr-[0.25em]"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
