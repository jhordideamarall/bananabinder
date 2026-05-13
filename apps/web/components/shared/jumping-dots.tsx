'use client';

import { m, type Transition } from 'framer-motion';

export function JumpingDots() {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -8 },
  };

  const dotTransition: Transition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: 'reverse',
    ease: 'easeInOut',
  };

  return (
    <div className="flex items-center justify-center gap-1.5 h-6">
      <m.div
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...dotTransition, delay: 0 }}
        className="h-2 w-2 rounded-full bg-white"
      />
      <m.div
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...dotTransition, delay: 0.15 }}
        className="h-2 w-2 rounded-full bg-white"
      />
      <m.div
        variants={dotVariants}
        initial="initial"
        animate="animate"
        transition={{ ...dotTransition, delay: 0.3 }}
        className="h-2 w-2 rounded-full bg-white"
      />
    </div>
  );
}
