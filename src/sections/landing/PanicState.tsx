import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Frown, SearchX, TrendingDown } from "lucide-react";

const FEARS = [
  { icon: Clock, title: "2AM panic scroll", desc: "Watching YouTube videos that contradict each other." },
  { icon: SearchX, title: "No real practice", desc: "No panel to give you the brutal feedback that B-schools will." },
  { icon: TrendingDown, title: "Wrong college picks", desc: "Applying blind when one data point could change everything." },
  { icon: Frown, title: "The blank SOP stare", desc: "Knowing your story but not how to sell it." },
];

function RunningNumber({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      className="font-display font-bold"
    >
      {inView && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {to.toLocaleString("en-IN")}{suffix}
        </motion.span>
      )}
    </motion.span>
  );
}

export function PanicState() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 bg-stone-950 text-stone-100">
      <div className="absolute inset-0 bg-grid-dark opacity-50" />
      <div className="absolute -top-40 left-1/2 h-80 w-[50rem] -translate-x-1/2 rounded-full bg-orange-600/25 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-semibold text-orange-400 uppercase tracking-widest"
            >
              The panic state
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight"
            >
              Every MBA aspirant hits the wall.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-5 text-lg text-stone-400 leading-relaxed"
            >
              You cracked the exam. Now comes the real test: GDs, PIs, SOPs, college shortlists, and the creeping feeling that everyone else has figured it out except you.
            </motion.p>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6">
              {[
                { value: 2, suffix: "AM", label: "when most aspirants panic-search" },
                { value: 40, suffix: "+", label: "GD/PI mocks needed for confidence" },
                { value: 30, suffix: "+", label: "B-schools to compare" },
                { value: 90, suffix: "%", label: "of converts had a mentor" },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5"
                >
                  <div className="font-display text-4xl font-bold text-orange-400">
                    <RunningNumber to={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="mt-1.5 text-sm text-stone-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {FEARS.map((fear, idx) => (
              <motion.div
                key={fear.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                whileHover={{ x: -8, scale: 1.02 }}
                className="group flex items-start gap-4 rounded-2xl border border-stone-800 bg-stone-900/60 p-5 hover:border-orange-500/40 transition-colors"
              >
                <div className="h-11 w-11 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0 group-hover:scale-110 transition-transform">
                  <fear.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{fear.title}</h3>
                  <p className="mt-1 text-sm text-stone-400">{fear.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
