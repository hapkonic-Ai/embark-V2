import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fireConfetti } from "@/components/site/EasterEggs";

const WORDS = ["CAT", "GDPI", "Case Comps", "Interviews", "Your Dream Campus"];

export default function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40">
      {/* background */}
      <div className="absolute inset-0 bg-grid mask-fade-b" />
      <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-orange-300/40 blur-3xl animate-blob" />
      <div className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-amber-300/40 blur-3xl animate-blob [animation-delay:3s]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => fireConfetti()}
          className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-300"
        >
          <Sparkles className="h-4 w-4" />
          Admissions season 2026 is on — click for luck ✨
        </motion.button>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mt-6 font-display text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05]"
        >
          Embark on the journey
          <br />
          from{" "}
          <span className="relative inline-block text-left align-baseline">
            <AnimatePresence mode="wait">
              <motion.span
                key={i}
                initial={{ y: 28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -28, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="text-gradient-orange inline-block"
              >
                {WORDS[i]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.6 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground"
        >
          1:1 mentorship from IIM &amp; XLRI alumni, national hackathons and case
          competitions, battle-tested playbooks, and a comparison of every MBA
          college in India — all in one place.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.6 }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button size="lg" className="btn-shine rounded-full px-8 h-12 text-base" asChild>
            <Link to="/login?mode=register">
              Start free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base" asChild>
            <Link to="/mentors">
              <Play className="mr-2 h-4 w-4" /> Meet the mentors
            </Link>
          </Button>
        </motion.div>

        {/* floating cards */}
        <div className="pointer-events-none absolute left-6 top-32 hidden lg:block animate-float-slow">
          <div className="rounded-2xl border bg-card/80 backdrop-blur p-4 shadow-xl w-52 text-left rotate-[-4deg]">
            <div className="text-xs text-muted-foreground">Mock GD booked</div>
            <div className="font-display font-semibold mt-1">with Rohan · IIMA</div>
            <div className="mt-2 h-1.5 rounded-full bg-orange-100 overflow-hidden">
              <div className="h-full w-3/5 bg-orange-500 rounded-full" />
            </div>
            <div className="text-xs mt-1.5 text-muted-foreground">3 of 5 sessions done</div>
          </div>
        </div>
        <div className="pointer-events-none absolute right-6 top-52 hidden lg:block animate-float-slow [animation-delay:1.5s]">
          <div className="rounded-2xl border bg-card/80 backdrop-blur p-4 shadow-xl w-48 text-left rotate-[3deg]">
            <div className="text-2xl">🏆</div>
            <div className="font-display font-semibold mt-1">HackCAT 2026</div>
            <div className="text-xs text-muted-foreground">Prize pool ₹1,00,000</div>
          </div>
        </div>
      </div>
    </section>
  );
}
