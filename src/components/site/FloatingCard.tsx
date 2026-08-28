import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

export type FlyDirection = "top-right" | "right" | "bottom" | "bottom-right" | "left" | "top";

const directionOffset: Record<FlyDirection, { x: number | string; y: number | string; rotate: number }> = {
  "top-right": { x: "30%", y: "-40%", rotate: 12 },
  right: { x: "45%", y: "10%", rotate: -8 },
  bottom: { x: "-10%", y: "55%", rotate: -6 },
  "bottom-right": { x: "40%", y: "50%", rotate: 10 },
  left: { x: "-45%", y: "10%", rotate: 8 },
  top: { x: "0%", y: "-45%", rotate: -5 },
};

export function FloatingCard({
  children,
  direction = "right",
  delay = 0,
  duration = 0.9,
  float = true,
  floatAmount = 6,
  floatDuration = 4,
  className = "",
}: {
  children: ReactNode;
  direction?: FlyDirection;
  delay?: number;
  duration?: number;
  float?: boolean;
  floatAmount?: number;
  floatDuration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const offset = directionOffset[direction];
  const [entered, setEntered] = useState(reduce);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setEntered(true), (delay + duration) * 1000);
    return () => clearTimeout(t);
  }, [reduce, delay, duration]);

  return (
    <motion.div
      initial={false}
      animate={entered && float && !reduce ? { y: [0, -floatAmount, 0] } : { y: 0 }}
      transition={
        entered && float && !reduce
          ? { duration: floatDuration, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0 }
      }
    >
      <motion.div
        initial={{
          opacity: reduce ? 1 : 0,
          x: reduce ? 0 : offset.x,
          y: reduce ? 0 : offset.y,
          rotate: reduce ? 0 : offset.rotate,
          scale: reduce ? 1 : 0.86,
        }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
        }}
        transition={{
          duration: reduce ? 0.25 : duration,
          delay: reduce ? 0 : delay,
          ease: [0.22, 1.4, 0.36, 1],
        }}
        className={className}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
