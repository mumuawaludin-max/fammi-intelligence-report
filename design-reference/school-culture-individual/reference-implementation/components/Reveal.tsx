import type { PropsWithChildren } from "react";
import { motion, useReducedMotion } from "motion/react";

interface RevealProps extends PropsWithChildren {
  className?: string;
  delay?: number;
  amount?: number;
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  amount = 0.2
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{
        duration: 0.62,
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      {children}
    </motion.div>
  );
}
