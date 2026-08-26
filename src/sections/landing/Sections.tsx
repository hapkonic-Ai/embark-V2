import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Trophy, BookOpen, Users, GitCompareArrows, MessageCircle, CalendarCheck, FileUp } from "lucide-react";
import { trpc } from "@/providers/trpc";

const SCHOOLS = ["IIM Ahmedabad", "IIM Bangalore", "IIM Calcutta", "XLRI", "FMS Delhi", "SPJIMR", "ISB Hyderabad", "IIM Lucknow", "IIFT Delhi", "NMIMS", "SIBM Pune", "MDI Gurgaon", "IIT Bombay", "IIM Kozhikode", "TISS Mumbai", "IIM Indore"];

export function Marquee() {
  return (
    <div className="border-y bg-stone-950 py-4 overflow-hidden">
      <div className="flex w-max animate-marquee gap-10">
        {[...SCHOOLS, ...SCHOOLS].map((s, i) => (
          <span key={i} className="flex items-center gap-10 text-sm font-display font-medium text-stone-400 whitespace-nowrap">
            {s} <span className="text-orange-500">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return (
    <span ref={ref} className="tabular-nums">
      {val.toLocaleString("en-IN")}{suffix}
    </span>
  );
}

export function Stats() {
  const { data } = trpc.catalog.stats.useQuery();
  const items = [
    { icon: Users, value: data?.mentors ?? 8, suffix: "", label: "Verified mentors" },
    { icon: GraduationCap, value: data?.colleges ?? 48, suffix: "", label: "B-schools to compare" },
    { icon: Trophy, value: data?.events ?? 3, suffix: "", label: "Live competitions" },
    { icon: BookOpen, value: (data?.candidates ?? 0) + 500, suffix: "+", label: "Aspirants on board" },
  ];
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((it, idx) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08 }}
            className="rounded-2xl border bg-card p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <it.icon className="mx-auto h-6 w-6 text-orange-500" />
            <div className="mt-3 font-display text-4xl font-bold">
              <Counter to={it.value} suffix={it.suffix} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{it.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Users,
    title: "1:1 Mentorship",
    desc: "Pick a mentor from IIMs, XLRI, ISB & more. Guidance, mock GDs and mock interviews included — scheduled directly over WhatsApp.",
    accent: "from-orange-500 to-amber-500",
  },
  {
    icon: Trophy,
    title: "Hackathons & Case Comps",
    desc: "Compete nationally. Upload your deck or PDF, get scored by our jury, and see your name in the winners' circle.",
    accent: "from-amber-500 to-yellow-400",
  },
  {
    icon: BookOpen,
    title: "Playbooks",
    desc: "No-fluff, exam-day-ready PDFs: GD frameworks, 200 real PI questions, WAT toolkits and case competition bibles.",
    accent: "from-orange-600 to-red-400",
  },
  {
    icon: GitCompareArrows,
    title: "College Compass",
    desc: "Every major MBA college in India — fees, average packages, cutoffs and NIRF ranks, comparable side by side.",
    accent: "from-orange-400 to-amber-300",
  },
];

export function Features() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-orange-600 uppercase tracking-widest">The whole toolkit</span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Everything after the CAT score
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Coaching teaches you the exam. Embark teaches you the game after it.
          </p>
        </motion.div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8 }}
              className="group rounded-3xl border bg-card p-7 shadow-sm hover:shadow-xl transition-shadow"
            >
              <div className={`inline-flex rounded-2xl bg-gradient-to-br ${f.accent} p-3 text-white shadow-lg`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { icon: Users, step: "01", title: "Pick your mentor", desc: "Browse verified alumni, compare their packages and mock session counts." },
  { icon: MessageCircle, step: "02", title: "Connect on WhatsApp", desc: "Get your mentor's number instantly after checkout. No middleman calls." },
  { icon: CalendarCheck, step: "03", title: "Mock, review, repeat", desc: "Request mock GDs & PIs, get scored feedback, track your progress." },
  { icon: FileUp, step: "04", title: "Compete & win", desc: "Submit to hackathons, get evaluated, and bag the prize." },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-stone-950 text-stone-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-dark opacity-60" />
      <div className="absolute -top-40 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-orange-600/25 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-orange-400 uppercase tracking-widest">How it works</span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Four steps. Zero fluff.
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="relative rounded-3xl border border-stone-800 bg-stone-900/70 p-7 backdrop-blur"
            >
              <span className="font-display text-5xl font-bold text-stone-800">{s.step}</span>
              <s.icon className="mt-4 h-6 w-6 text-orange-400" />
              <h3 className="mt-3 font-display text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-stone-400 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
