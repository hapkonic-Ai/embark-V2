import { motion, useReducedMotion } from "framer-motion";

export function JourneySteps({
  title,
  steps,
  className = "",
}: {
  title?: string;
  steps: { number: string; title: string; description: string }[];
  className?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <section className={`py-20 sm:py-28 section-light ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {title && (
          <motion.h3
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-2xl sm:text-3xl font-bold text-center mb-14"
          >
            {title}
          </motion.h3>
        )}
        <div className="relative">
          <div className="hidden lg:block absolute top-8 left-0 right-0 h-px bg-stone-200" />
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative"
              >
                <div className="flex lg:justify-center mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-900 text-white font-display text-xl font-bold shadow-lg shadow-stone-900/10">
                    {step.number}
                  </div>
                </div>
                <h4 className="font-display text-lg font-bold mb-2">{step.title}</h4>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
