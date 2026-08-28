import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedText } from "./AnimatedText";
import type { ReactNode } from "react";

export function EditorialHero({
  title,
  highlight,
  subtitle,
  cta,
  ctaHref,
  secondaryCta,
  secondaryHref,
  children,
  dark = false,
  align = "left",
}: {
  title: string;
  highlight?: string;
  subtitle: string;
  cta: string;
  ctaHref: string;
  secondaryCta?: string;
  secondaryHref?: string;
  children?: ReactNode;
  dark?: boolean;
  align?: "left" | "center";
}) {
  const reduce = useReducedMotion();
  const base = dark ? "section-dark" : "section-light";

  return (
    <section className={base}>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
        <div className={`grid gap-12 lg:grid-cols-2 items-center ${align === "center" ? "text-center" : ""}`}>
          <motion.div
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={align === "center" ? "mx-auto max-w-3xl" : ""}
          >
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              <AnimatedText delay={0.1} splitBy="word">
                {title}
              </AnimatedText>
              {highlight && (
                <span className="text-gradient-orange">
                  {" "}
                  <AnimatedText delay={0.35} splitBy="word">
                    {highlight}
                  </AnimatedText>
                </span>
              )}
            </h1>
            <motion.p
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className={`mt-5 max-w-xl text-lg leading-relaxed ${dark ? "text-stone-300" : "text-muted-foreground"} ${align === "center" ? "mx-auto" : ""}`}
            >
              {subtitle}
            </motion.p>
            <motion.div
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className={`mt-8 flex flex-wrap items-center gap-3 ${align === "center" ? "justify-center" : ""}`}
            >
              <Button size="lg" className="btn-shine rounded-full px-6 h-12 text-base" asChild>
                <Link to={ctaHref}>
                  {cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {secondaryCta && secondaryHref && (
                <Button
                  size="lg"
                  variant="outline"
                  className={`rounded-full px-6 h-12 text-base ${dark ? "border-white/20 text-white hover:bg-white/10 hover:text-white" : "border-stone-300 text-stone-900 hover:bg-stone-100"}`}
                  asChild
                >
                  <Link to={secondaryHref}>{secondaryCta}</Link>
                </Button>
              )}
            </motion.div>
          </motion.div>

          {children && (
            <motion.div
              initial={reduce ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:flex items-center justify-center"
            >
              {children}
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
