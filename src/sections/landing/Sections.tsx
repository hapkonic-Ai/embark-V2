import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Trophy, BookOpen, Users, GitCompareArrows, MessageCircle, CalendarCheck, FileUp } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { ParallaxBox } from "@/components/site/Parallax";
import { Illustrations } from "@/components/site/Illustrations";

const SCHOOLS = ["IIM Ahmedabad", "IIM Bangalore", "IIM Calcutta", "XLRI", "FMS Delhi", "SPJIMR", "ISB Hyderabad", "IIM Lucknow", "IIFT Delhi", "NMIMS", "SIBM Pune", "MDI Gurgaon", "IIT Bombay", "IIM Kozhikode", "TISS Mumbai", "IIM Indore"];

export function Marquee() {
  return (
    <div className="section-dark border-y border-stone-800 py-4">
      <div className="flex w-max animate-marquee gap-10">
        {[...SCHOOLS, ...SCHOOLS].map((s, i) => (
          <span key={i} className="flex items-center gap-10 text-sm font-display font-medium text-stone-400 whitespace-nowrap">
            {s} <span className="h-1.5 w-1.5 rounded-full bg-orange-500 inline-block align-middle mx-2" />
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
    { illustration: Illustrations.mentor, value: data?.mentors ?? 8, suffix: "", label: "Verified mentors" },
    { illustration: Illustrations.college, value: data?.colleges ?? 48, suffix: "", label: "B-schools to compare" },
    { illustration: Illustrations.competition, value: data?.events ?? 3, suffix: "", label: "Live competitions" },
    { illustration: Illustrations.aspirants, value: (data?.candidates ?? 0) + 500, suffix: "+", label: "Aspirants on board" },
  ];
  return (
    <section className="section-light py-16">
      <ParallaxBox offset={30} className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((it, idx) => (
            <motion.div
              key={it.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="rounded-2xl border bg-card p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
            >
              <it.illustration className="mx-auto h-10 w-10 text-orange-600" />
              <div className="mt-3 font-display text-4xl font-bold text-stone-900">
                <Counter to={it.value} suffix={it.suffix} />
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{it.label}</div>
            </motion.div>
          ))}
        </div>
      </ParallaxBox>
    </section>
  );
}

const FEATURES = [
  {
    icon: Users,
    title: "1:1 Mentorship",
    desc: "Pick a mentor from IIMs, XLRI, ISB & more. Guidance, mock GDs and mock interviews included, scheduled directly over WhatsApp.",
    accent: "from-orange-600 to-orange-400",
  },
  {
    icon: Trophy,
    title: "Events & Case Comps",
    desc: "Compete nationally. Upload your deck or PDF, get scored by our jury, and see your name in the winners' circle.",
    accent: "from-orange-600 to-orange-400",
  },
  {
    icon: BookOpen,
    title: "Playbooks",
    desc: "No-fluff, exam-day-ready PDFs: GD frameworks, 200 real PI questions, WAT toolkits and case competition bibles.",
    accent: "from-orange-700 to-orange-500",
  },
  {
    icon: GitCompareArrows,
    title: "College Compass",
    desc: "Every major MBA college in India. Fees, average packages, cutoffs and NIRF ranks, comparable side by side.",
    accent: "from-orange-500 to-orange-400",
  },
];

export function Features() {
  return (
    <section className="section-dark py-20">
      <ParallaxBox offset={40} className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
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
      </ParallaxBox>
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
    <section className="section-light py-20">
      <ParallaxBox offset={35} className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
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
              className="relative rounded-3xl border border-stone-200 bg-card p-7 shadow-sm"
            >
              <span className="font-display text-5xl font-bold text-stone-200">{s.step}</span>
              <s.icon className="mt-4 h-6 w-6 text-orange-500" />
              <h3 className="mt-3 font-display text-lg font-semibold text-stone-900">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </ParallaxBox>
    </section>
  );
}
