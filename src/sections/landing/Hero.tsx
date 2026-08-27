import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CheckCircle2, Play, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const WORDS = ["CAT", "GDPI", "Case Comps", "Interviews", "Your Dream B-School"];

const REVIEWS = [
  { name: "Ayesha K.", school: "IIM K '27", text: "My PI mentor asked questions that came up in my actual panel.", rating: 5 },
  { name: "Rahul N.", school: "XLRI '27", text: "Won the case comp and put it straight on my resume.", rating: 5 },
  { name: "Priya M.", school: "FMS '27", text: "From blank SOP to final draft in 4 mentor calls.", rating: 5 },
];

const STUDENT_PHOTOS = [
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1531545514256-b1400e3f03b2?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1571260899304-425eee5c7be8?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=120&h=120&fit=crop",
];

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
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.7 }}
              className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]"
            >
              From blank SOP
              <br />
              to final{" "}
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
              transition={{ delay: 0.18, duration: 0.7 }}
              className="mx-auto lg:mx-0 mt-5 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              1:1 mentorship from IIM &amp; XLRI alumni who’ve cleared GD, PI, and placements — so you show up prepared, not panicked, and land the offer that changes your career.
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
              className="mt-6 inline-flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-orange-500" /> Get matched</span>
              <span className="hidden sm:inline text-stone-300">→</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-orange-500" /> Practise mocks</span>
              <span className="hidden sm:inline text-stone-300">→</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-orange-500" /> Crack your call</span>
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
                  <motion.img
                    key={idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + idx * 0.06 }}
                    src={src}
                    alt="student"
                    className="h-10 w-10 rounded-full border-2 border-background object-cover"
                  />
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
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            style={{ rotateX }}
            className="relative hidden lg:flex items-center justify-center h-[540px]"
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="relative z-10 w-80 rounded-3xl border bg-card/90 backdrop-blur-xl p-6 shadow-2xl shadow-orange-500/10"
              style={{ transformStyle: "preserve-3d", transform: "rotateY(-8deg) rotateX(4deg)" }}
            >
              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-display text-xl font-bold text-white">
                  RO
                </div>
                <div>
                  <div className="font-display font-semibold">Rohan Mehta</div>
                  <div className="text-xs text-orange-600">IIM Ahmedabad · ex-McKinsey</div>
                </div>
              </motion.div>
              <motion.div variants={itemVariants} className="mt-5 space-y-3">
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
              </motion.div>
            </motion.div>

            {/* floating review card */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
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
                    <img
                      src={`https://i.pravatar.cc/150?u=${REVIEWS[slider].name}`}
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
            </motion.div>

            {/* floating stats card */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className="absolute bottom-8 -left-8 z-20 w-56 rounded-2xl border bg-card/90 backdrop-blur p-4 shadow-xl"
              style={{ transform: "rotateY(6deg) rotateX(6deg) translateZ(30px)" }}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-600" /> Avg package
              </div>
              <div className="mt-1 font-display text-3xl font-bold">₹35.3 LPA</div>
              <div className="text-xs text-green-600 mt-1">+12% vs last year</div>
            </motion.div>

            {/* student collage polaroid */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              whileHover={{ scale: 1.05, rotate: -1 }}
              className="absolute top-20 -left-14 z-30 rounded-2xl border bg-card p-3 shadow-2xl rotate-[-6deg]"
              style={{ transform: "rotateY(-6deg) rotateX(-4deg) translateZ(60px)" }}
            >
              <div className="grid grid-cols-3 gap-1.5">
                {STUDENT_PHOTOS.map((src, idx) => (
                  <img key={idx} src={src} alt="student" className="h-10 w-10 rounded-lg object-cover" />
                ))}
              </div>
              <p className="mt-2 text-center text-xs font-medium">+4k converts</p>
            </motion.div>

            {/* success story card */}
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              whileHover={{ scale: 1.05 }}
              className="absolute -bottom-2 right-0 z-30 w-64 rounded-2xl border bg-card/95 backdrop-blur p-4 shadow-2xl"
              style={{ transform: "rotateY(4deg) rotateX(4deg) translateZ(50px)" }}
            >
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1531545514256-b1400e3f03b2?w=120&h=120&fit=crop"
                  alt="student"
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div>
                  <div className="font-display font-bold text-green-700">₹42 LPA offer</div>
                  <div className="text-xs text-muted-foreground">IIM B convert · 6 mentor mocks</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
