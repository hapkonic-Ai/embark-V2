import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewPersonImage, fallbackFace } from "@/lib/images";

const WORDS = ["GDPI", "Cases", "Interviews", "IIM calls", "Placements"];

const REVIEWS = [
  { name: "Ayesha K.", school: "IIM K '27", text: "My PI mentor asked questions that came up in my actual panel.", rating: 5, gender: "women" as const },
  { name: "Rahul N.", school: "XLRI '27", text: "Won the case comp and put it straight on my resume.", rating: 5, gender: "men" as const },
  { name: "Priya M.", school: "FMS '27", text: "From blank SOP to final draft in 4 mentor calls.", rating: 5, gender: "women" as const },
];

const STUDENT_PHOTOS = [
  reviewPersonImage("Ayesha"),
  reviewPersonImage("Rahul"),
  reviewPersonImage("Priya"),
  reviewPersonImage("Dev"),
  reviewPersonImage("Neha"),
  reviewPersonImage("Arjun"),
];

function SafeImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [error, setError] = useState(false);
  const fallback = fallbackFace(alt);
  return (
    <img
      src={error ? fallback : src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" as const } },
};

function FloatingCard({
  children,
  className,
  initial,
  delay,
  floatDuration = 4,
  floatDistance = 5,
  hover,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  initial: { opacity?: number; x?: number; y?: number; rotate?: number; rotateY?: number; scale?: number };
  delay: number;
  floatDuration?: number;
  floatDistance?: number;
  hover?: Parameters<typeof motion.div>[0]["whileHover"];
  style?: React.CSSProperties;
}) {
  const reduced = useReducedMotion();
  const [floating, setFloating] = useState(false);

  const entrance = {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    rotateY: 0,
    scale: 1,
  };

  if (reduced) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay * 0.3, duration: 0.4 }}
        className={className}
        style={style}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...initial }}
      animate={entrance}
      transition={{ delay, type: "spring", stiffness: 110, damping: 15, mass: 0.75 }}
      onAnimationComplete={() => setFloating(true)}
      whileHover={hover}
      className={className}
      style={style}
    >
      <motion.div
        animate={floating ? { y: [0, -floatDistance, 0] } : { y: 0 }}
        transition={{ duration: floatDuration, repeat: Infinity, ease: "easeInOut" }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export default function Hero() {
  const [i, setI] = useState(0);
  const [slider, setSlider] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSlider((v) => (v + 1) % REVIEWS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section ref={containerRef} className="section-light pt-28 pb-16 sm:pt-36 sm:pb-24" style={{ perspective: "1200px" }}>
      {/* subtle warm tint background only — no radial orbs */}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* left copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.7 }}
              className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.12]"
            >
              From blank SOP to final
              <br />
              <span className="relative inline-flex h-[1.15em] items-center whitespace-nowrap align-baseline overflow-visible">
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
              transition={{ delay: 0.18, duration: 0.7 }}
              className="mx-auto lg:mx-0 mt-5 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              1:1 mentorship from IIM &amp; XLRI alumni who’ve cleared GD, PI, and placements. Show up prepared, not panicked, and land the offer that changes your career.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
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

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.7 }}
              className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-stone-600"
            >
              <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded bg-orange-500 text-[10px] font-bold text-white">1</span> Get matched</span>
              <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded bg-orange-500 text-[10px] font-bold text-white">2</span> Practise mocks</span>
              <span className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded bg-orange-500 text-[10px] font-bold text-white">3</span> Crack your call</span>
            </motion.div>

            {/* social proof */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.54, duration: 0.7 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5"
            >
              <div className="flex -space-x-3">
                {STUDENT_PHOTOS.slice(0, 5).map((src, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.06, type: "spring", stiffness: 200 }}
                  >
                    <SafeImg
                      src={src}
                      alt={`Student ${idx + 1}`}
                      className="h-10 w-10 rounded-full border-2 border-background object-cover"
                    />
                  </motion.div>
                ))}
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-orange-500 text-xs font-bold text-white">
                  +4k
                </div>
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
            className="relative hidden lg:flex items-center justify-center h-[600px]"
          >
            {/* hand-drawn arrow pointing to student */}
            <motion.svg
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 }}
              className="absolute top-16 left-8 z-0 h-44 w-44 text-orange-500"
              viewBox="0 0 176 176"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M28 24 C 60 24, 80 72, 110 96"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 1.1 }}
              />
              <motion.path
                d="M94 84 L110 96 L124 80 Z"
                fill="currentColor"
                stroke="none"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 2 }}
                style={{ transformOrigin: "110px 96px" }}
              />
            </motion.svg>

            {/* sparkle / dot decorations */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.3, type: "spring" }}
              className="absolute top-10 right-20 h-3 w-3 rounded-full bg-orange-500"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.45, type: "spring" }}
              className="absolute bottom-24 right-12 h-2 w-2 rounded-full bg-amber-400"
            />
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 1.6, type: "spring" }}
              className="absolute top-1/3 left-10 text-orange-300"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.4 9.6H22L16 14.4L18.4 22L12 17.2L5.6 22L8 14.4L2 9.6H9.6L12 2Z" />
              </svg>
            </motion.div>
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: 20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ delay: 1.75, type: "spring" }}
              className="absolute bottom-1/3 right-8 text-amber-400"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.4 9.6H22L16 14.4L18.4 22L12 17.2L5.6 22L8 14.4L2 9.6H9.6L12 2Z" />
              </svg>
            </motion.div>

            {/* central student image */}
            <motion.div
              initial={{ opacity: 0, y: 160, scale: 0.82 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.95, ease: [0.22, 1.4, 0.36, 1] }}
              className="relative z-10 h-[500px] w-[340px]"
            >
              <img
                src="/student-hero.png"
                alt="Student with books and headphones"
                className="h-full w-full object-contain object-bottom drop-shadow-2xl"
              />
            </motion.div>

            {/* floating review card */}
            <FloatingCard
              delay={0.35}
              initial={{ x: 80, y: 160, rotate: 12, scale: 0.82 }}
              floatDuration={3.8}
              floatDistance={5}
              hover={{ y: -8, rotateZ: -2, transition: { duration: 0.3 } }}
              className="absolute top-0 right-0 z-20 w-64 rounded-2xl border bg-white p-4 shadow-xl shadow-stone-900/10"
              style={{ transform: "rotateY(8deg) rotateX(-4deg) translateZ(40px)" }}
            >
              <div className="flex gap-0.5 text-orange-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={slider}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.35 }}
                >
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">“{REVIEWS[slider].text}”</p>
                  <div className="mt-3 flex items-center gap-2">
                    <SafeImg
                      src={reviewPersonImage(REVIEWS[slider].name)}
                      alt={REVIEWS[slider].name}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <div className="text-xs">
                      <div className="font-medium">{REVIEWS[slider].name}</div>
                      <div className="text-muted-foreground">{REVIEWS[slider].school}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </FloatingCard>

            {/* main mentor card */}
            <FloatingCard
              delay={0.5}
              initial={{ x: 120, y: 200, rotateY: -12, scale: 0.88 }}
              floatDuration={4.5}
              floatDistance={4}
              hover={{ y: -6, rotateY: -6, transition: { duration: 0.3 } }}
              className="absolute top-1/2 -right-4 -translate-y-1/2 z-20 w-72 rounded-3xl border bg-white p-5 shadow-2xl shadow-stone-900/10"
              style={{ transformStyle: "preserve-3d", transform: "rotateY(-8deg) rotateX(4deg)" }}
            >
              <motion.div variants={containerVariants} initial="hidden" animate="show">
                <motion.div variants={itemVariants} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-display text-lg font-bold text-white">
                    RO
                  </div>
                  <div>
                    <div className="font-display font-semibold">Rohan Mehta</div>
                    <div className="text-xs text-orange-600">IIM Ahmedabad · ex-McKinsey</div>
                  </div>
                </motion.div>
                <motion.div variants={itemVariants} className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-muted/50 p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mock GDs</span>
                      <span className="font-semibold">3 of 5 done</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-orange-100 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: "60%" }} transition={{ duration: 1.2, delay: 0.9 }} className="h-full bg-orange-500 rounded-full" />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-green-50 text-green-800 p-2.5 text-xs">
                    <span className="font-semibold">Latest feedback:</span> Strong opening. Tighten your conclusion.
                  </div>
                </motion.div>
              </motion.div>
            </FloatingCard>

            {/* floating stats card */}
            <FloatingCard
              delay={0.65}
              initial={{ x: -80, y: 180, rotate: -10, scale: 0.82 }}
              floatDuration={4.2}
              floatDistance={4}
              hover={{ y: -8, rotateZ: 2, transition: { duration: 0.3 } }}
              className="absolute bottom-16 -left-4 z-20 w-56 rounded-2xl border bg-white p-4 shadow-xl shadow-stone-900/10"
              style={{ transform: "rotateY(6deg) rotateX(6deg) translateZ(30px)" }}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-600" /> Avg package
              </div>
              <div className="mt-1 font-display text-3xl font-bold">₹35.3 LPA</div>
              <div className="text-xs text-green-600 mt-1">+12% vs last year</div>
            </FloatingCard>

            {/* student collage polaroid */}
            <FloatingCard
              delay={0.8}
              initial={{ x: -100, y: 160, rotate: -14, scale: 0.82 }}
              floatDuration={4.0}
              floatDistance={5}
              hover={{ scale: 1.05, rotate: -2, transition: { duration: 0.3 } }}
              className="absolute top-24 -left-12 z-30 rounded-2xl border bg-white p-3 shadow-2xl shadow-stone-900/10"
              style={{ transform: "rotateY(-6deg) rotateX(-4deg) translateZ(60px)" }}
            >
              <div className="grid grid-cols-3 gap-1.5">
                {STUDENT_PHOTOS.map((src, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.8 + idx * 0.08, type: "spring", stiffness: 250 }}
                  >
                    <SafeImg
                      src={src}
                      alt={`Student ${idx + 1}`}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  </motion.div>
                ))}
              </div>
              <p className="mt-2 text-center text-xs font-medium">+4k converts</p>
            </FloatingCard>

            {/* success story card */}
            <FloatingCard
              delay={0.95}
              initial={{ x: 100, y: 200, rotate: 10, scale: 0.82 }}
              floatDuration={3.6}
              floatDistance={5}
              hover={{ y: -8, rotateZ: 2, transition: { duration: 0.3 } }}
              className="absolute bottom-4 right-4 z-30 w-60 rounded-2xl border bg-white p-4 shadow-2xl shadow-stone-900/10"
              style={{ transform: "rotateY(4deg) rotateX(4deg) translateZ(50px)" }}
            >
              <div className="flex items-center gap-3">
                <SafeImg
                  src={reviewPersonImage("Ishita")}
                  alt="IIM B convert"
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div>
                  <div className="font-display font-bold text-green-700">₹42 LPA offer</div>
                  <div className="text-xs text-muted-foreground">IIM B convert · 6 mentor mocks</div>
                </div>
              </div>
            </FloatingCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
