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
    const t = setTimeout(() => setShow(false), 1200);
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



          {/* central 3D spinner + logo */}
          <div className="relative flex items-center justify-center" style={{ perspective: "800px" }}>
            {/* outer pulse ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute h-44 w-44 rounded-full border border-orange-400/30"
            />

            {/* 3D rotating logo */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
              style={{ perspective: "600px", transformStyle: "preserve-3d" }}
            >
              <motion.div
                animate={{ rotateY: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-2xl shadow-orange-500/25"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* front face */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500" />
                {/* sheen */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/25 via-transparent to-transparent" />
                {/* bolt */}
                <div className="relative z-10 flex h-full w-full items-center justify-center">
                  <svg viewBox="0 0 24 24" className="h-11 w-11 text-white" fill="currentColor">
                    <path d="M13 2 4.5 13.5H11L9.5 22 19.5 9.5H12.5L13 2Z" />
                  </svg>
                </div>
                {/* back face for depth during rotation */}
                <div
                  className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-600 to-amber-600"
                  style={{ transform: "rotateY(180deg) translateZ(1px)", backfaceVisibility: "hidden" }}
                />
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
            transition={{ duration: 1.1, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 h-1 w-full origin-left bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
