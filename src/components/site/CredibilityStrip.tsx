import { motion, useReducedMotion } from "framer-motion";

const institutions = [
  "IIM Ahmedabad",
  "IIM Bangalore",
  "IIM Calcutta",
  "XLRI Jamshedpur",
  "ISB Hyderabad",
  "ex-McKinsey",
  "ex-Bain",
  "ex-Amazon",
];

export function CredibilityStrip({
  stats,
  extra = [],
}: {
  stats: { value: string; label: string }[];
  extra?: string[];
}) {
  const reduce = useReducedMotion();
  const all = [...institutions, ...extra];

  return (
    <section className="py-16 sm:py-22 section-dark">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <h3 className="font-display text-2xl sm:text-3xl font-bold">Built by people who've actually done it.</h3>
        </motion.div>

        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-14"
        >
          {all.map((name) => (
            <span
              key={name}
              className="rounded-full border border-stone-800 bg-card px-4 py-2 text-sm font-medium text-stone-300"
            >
              {name}
            </span>
          ))}
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
              className="rounded-2xl border border-stone-800 bg-card p-6 text-center"
            >
              <div className="font-display text-4xl font-bold text-orange-400">{s.value}</div>
              <div className="mt-2 text-sm text-stone-400">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
