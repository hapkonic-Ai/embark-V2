import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, Sparkles, Star, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fireConfetti } from "@/components/site/EasterEggs";

const WORDS = ["CAT", "GDPI", "Case Comps", "Interviews", "Your Dream Campus"];

const REVIEWS = [
  { name: "Ayesha K.", school: "IIM K '27", text: "My PI mentor asked questions that came up in my actual panel.", rating: 5 },
  { name: "Rahul N.", school: "XLRI '27", text: "Won the case comp and put it straight on my resume.", rating: 5 },
  { name: "Priya M.", school: "FMS '27", text: "From blank SOP to final draft in 4 mentor calls.", rating: 5 },
];

const AVATARS = [
  "https://i.pravatar.cc/150?u=a",
  "https://i.pravatar.cc/150?u=b",
  "https://i.pravatar.cc/150?u=c",
  "https://i.pravatar.cc/150?u=d",
  "https://i.pravatar.cc/150?u=e",
];

export default function Hero() {
  const [i, setI] = useState(0);
  const [slider, setSlider] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [0, 8]);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlider((v) => (v + 1) % REVIEWS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section ref={containerRef} className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24" style={{ perspective: "1200px" }}>
      {/* animated background blobs */}
      <motion.div style={{ y: y1 }} className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-orange-300/30 blur-[120px] animate-blob" />
      <motion.div style={{ y: y2 }} className="absolute top-20 -right-40 h-[32rem] w-[32rem] rounded-full bg-amber-300/30 blur-[120px] animate-blob [animation-delay:3s]" />
      <div className="absolute top-1/2 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-radial from-orange-200/20 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* left copy */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => fireConfetti()}
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors dark:bg-orange-500/10 dark:border-orange-500/30 dark:text-orange-300"
            >
              <Sparkles className="h-4 w-4" />
              Admissions 2026 is live — click for luck
            </motion.button>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="mt-6 font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
            >
              Stop the 2am
              <br />
              panic scroll.
              <br />
              Crack{" "}
              <span className="relative inline-block text-left align-baseline">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={i}
                    initial={{ y: 36, opacity: 0, rotateX: -45 }}
                    animate={{ y: 0, opacity: 1, rotateX: 0 }}
                    exit={{ y: -36, opacity: 0, rotateX: 45 }}
                    transition={{ duration: 0.4 }}
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
              transition={{ delay: 0.22, duration: 0.7 }}
              className="mx-auto lg:mx-0 mt-5 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              1:1 mentorship from IIM &amp; XLRI alumni, national hackathons, battle-tested playbooks, and a comparison of every MBA college in India — all in one place.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.7 }}
              className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3"
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

            {/* social proof */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46, duration: 0.7 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <div className="flex -space-x-3">
                {AVATARS.map((src, idx) => (
                  <motion.img
                    key={idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + idx * 0.08 }}
                    src={src}
                    alt="student"
                    className="h-10 w-10 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 text-orange-600">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  <span className="ml-1 text-sm font-semibold">4.9/5</span>
                </div>
                <p className="text-xs text-muted-foreground">from 1,200+ student reviews</p>
              </div>
            </motion.div>
          </motion.div>

          {/* right 3D scene */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{ rotateX }}
            className="relative hidden lg:flex items-center justify-center h-[520px]"
          >
            {/* main floating card */}
            <motion.div
              animate={{ y: [0, -16, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-80 rounded-3xl border bg-card/90 backdrop-blur-xl p-6 shadow-2xl shadow-orange-500/10"
              style={{ transformStyle: "preserve-3d", transform: "rotateY(-8deg) rotateX(4deg)" }}
            >
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-display text-xl font-bold text-white">
                  RO
                </div>
                <div>
                  <div className="font-display font-semibold">Rohan Mehta</div>
                  <div className="text-xs text-orange-600">IIM Ahmedabad · ex-McKinsey</div>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-muted/50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mock GDs</span>
                    <span className="font-semibold">3 of 5 done</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-orange-100 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "60%" }} transition={{ duration: 1.2, delay: 0.8 }} className="h-full bg-orange-500 rounded-full" />
                  </div>
                </div>
                <div className="rounded-2xl bg-green-50 text-green-800 p-3 text-sm">
                  <span className="font-semibold">Latest feedback:</span> Strong opening. Tighten your conclusion.
                </div>
              </div>
            </motion.div>

            {/* floating review card */}
            <motion.div
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -top-4 -right-4 z-20 w-64 rounded-2xl border bg-card/90 backdrop-blur p-4 shadow-xl"
              style={{ transform: "rotateY(8deg) rotateX(-4deg) translateZ(40px)" }}
            >
              <div className="flex gap-0.5 text-orange-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={slider}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">“{REVIEWS[slider].text}”</p>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
                      {REVIEWS[slider].name.charAt(0)}
                    </div>
                    <div className="text-xs">
                      <div className="font-medium">{REVIEWS[slider].name}</div>
                      <div className="text-muted-foreground">{REVIEWS[slider].school}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* floating stats card */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-8 -left-8 z-20 w-56 rounded-2xl border bg-card/90 backdrop-blur p-4 shadow-xl"
              style={{ transform: "rotateY(6deg) rotateX(6deg) translateZ(30px)" }}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-600" /> Avg package
              </div>
              <div className="mt-1 font-display text-3xl font-bold">₹35.3 LPA</div>
              <div className="text-xs text-green-600 mt-1">+12% vs last year</div>
            </motion.div>

            {/* floating people card */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute top-24 -left-12 z-10 rounded-2xl border bg-card/90 backdrop-blur p-3 shadow-xl"
              style={{ transform: "rotateY(-6deg) rotateX(-4deg) translateZ(20px)" }}
            >
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                <span className="font-display font-bold">8 verified</span>
              </div>
              <div className="text-xs text-muted-foreground">mentors online now</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
