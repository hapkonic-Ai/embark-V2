import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function StorySection({
  statement,
  body,
  children,
  reverse = false,
  dark = false,
  className = "",
}: {
  statement: string;
  body: ReactNode;
  children?: ReactNode;
  reverse?: boolean;
  dark?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const base = dark ? "section-dark" : "section-light";

  return (
    <section className={`py-20 sm:py-28 ${base} ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className={`grid gap-12 lg:gap-20 items-center ${reverse ? "lg:grid-cols-[1fr_1.1fr]" : "lg:grid-cols-[1.1fr_1fr]"}`}>
          <motion.div
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={reverse ? "lg:order-2" : ""}
          >
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.08] tracking-tight">
              {statement}
            </h2>
            <div className="mt-6 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-xl">
              {body}
            </div>
          </motion.div>

          {children && (
            <motion.div
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={reverse ? "lg:order-1" : ""}
            >
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
