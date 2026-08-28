import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageHero({
  title,
  highlight,
  subtitle,
  cta,
  ctaHref,
  secondaryCta,
  secondaryHref,
  visual,
}: {
  title: string;
  highlight?: string;
  subtitle: string;
  cta: string;
  ctaHref: string;
  secondaryCta?: string;
  secondaryHref?: string;
  visual?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-stone-950 text-white">
      <div className="absolute inset-0 bg-grid-dark opacity-40" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-orange-600/25 blur-3xl" />
      <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              {title}{" "}
              {highlight && <span className="text-gradient-orange">{highlight}</span>}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-stone-300 leading-relaxed">{subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" className="btn-shine rounded-full px-6 h-12 text-base" asChild>
                <Link to={ctaHref}>
                  {cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {secondaryCta && secondaryHref && (
                <Button size="lg" variant="outline" className="rounded-full px-6 h-12 text-base border-white/20 text-white hover:bg-white/10 hover:text-white" asChild>
                  <Link to={secondaryHref}>{secondaryCta}</Link>
                </Button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative hidden lg:flex items-center justify-center min-h-[320px]"
          >
            {visual}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
