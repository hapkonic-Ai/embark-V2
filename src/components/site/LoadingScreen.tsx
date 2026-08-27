import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const taglines = [
  "Prepping your convert story…",
  "Gathering mock questions…",
  "Warming up the mentors…",
  "Crunching college data…",
  "Sharpening your edge…",
];

export function LoadingScreen() {
  const [show, setShow] = useState(true);
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((i) => (i + 1) % taglines.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#faf8f5]"
        >
          {/* subtle radial gradient */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(249,115,22,0.08),transparent_60%)]" />

          {/* floating background orbs */}
          <motion.div
            animate={{ x: [0, 30, 0], y: [0, -20, 0], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -20, 0], y: [0, 30, 0], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl"
          />

          {/* central 3D spinner + logo */}
          <div className="relative flex items-center justify-center" style={{ perspective: "800px" }}>
            {/* outer pulse ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute h-44 w-44 rounded-full border border-orange-400/30"
            />

            {/* 3D rotating logo cube */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotateY: -180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                animate={{ rotateY: [0, 360], rotateX: [0, 12, 0, -12, 0] }}
                transition={{ rotateY: { duration: 3.2, repeat: Infinity, ease: "linear" }, rotateX: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }}
                className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-2xl shadow-orange-500/30"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* front face shine */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/30 via-transparent to-transparent" />
                {/* side depth panels */}
                <div className="absolute right-0 top-0 h-full w-4 origin-right -translate-x-full -rotate-y-90 rounded-r-2xl bg-gradient-to-r from-orange-600 to-amber-600" style={{ transform: "rotateY(90deg) translateZ(2rem)" }} />
                <div className="absolute bottom-0 left-0 h-4 w-full origin-bottom rounded-b-2xl bg-gradient-to-b from-orange-600 to-amber-700" style={{ transform: "rotateX(-90deg) translateZ(2rem)" }} />
                {/* bolt icon */}
                <div className="relative z-10 flex h-full w-full items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-11 w-11 text-white drop-shadow-md" fill="currentColor">
                    <path d="M13 2 4.5 13.5H11L9.5 22 19.5 9.5H12.5L13 2Z" />
                  </svg>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* brand + tagline */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative z-10 mt-10 text-center"
          >
            <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900">
              embark<span className="text-orange-500">.</span>
            </h1>
            <div className="mt-2 h-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={taglineIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="text-sm font-medium text-stone-500"
                >
                  {taglines[taglineIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* bottom progress bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 h-1 w-full origin-left bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
