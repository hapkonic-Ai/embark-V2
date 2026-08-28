import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Users, ArrowUpRight } from "lucide-react";
import { speakerImage, fallbackFace } from "@/lib/images";

export function SpotlightHero({
  speaker,
}: {
  speaker: {
    name: string;
    role: string;
    company: string;
    topic: string;
    avatar?: string;
    date: string;
    audience: string;
  };
}) {
  const reduce = useReducedMotion();
  const avatar = speaker.avatar || speakerImage(speaker.name, speaker.topic);

  const floatCards = [
    {
      name: "Rohan Mehra",
      topic: "Fintech disruption",
      label: "Fintech · 45 min",
      delay: 0.6,
      duration: 5,
      position: "left-0 top-10",
    },
    {
      name: "Priya Nair",
      topic: "Building consumer brands",
      label: "FMCG · 60 min",
      delay: 0.8,
      duration: 6,
      position: "right-0 bottom-20",
    },
    {
      name: "Vikram Joshi",
      topic: "Product strategy",
      label: "Product · 30 min",
      delay: 1.0,
      duration: 5.5,
      position: "left-4 bottom-8",
    },
  ];

  return (
    <div className="relative flex min-h-[520px] items-center justify-center lg:min-h-[620px]">
      {/* animated stage lights */}
      <motion.div
        initial={reduce ? { opacity: 0.2 } : { opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1.5 }}
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-orange-300/50 via-orange-200/20 to-transparent"
        style={{ clipPath: "ellipse(55% 90% at 50% 0%)" }}
      />
      <motion.div
        initial={reduce ? { opacity: 0.1 } : { opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1.8, delay: 0.2 }}
        className="pointer-events-none absolute inset-0 rounded-[3rem] bg-orange-500/10 blur-3xl"
      />

      {/* background rings */}
      <motion.div
        initial={reduce ? { opacity: 0.1, scale: 0.8 } : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full border border-orange-500/30"
      />
      <motion.div
        initial={reduce ? { opacity: 0.1, scale: 0.8 } : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.5 }}
        className="pointer-events-none absolute h-[320px] w-[320px] rounded-full border border-orange-500/40"
      />

      {/* floating speaker cards */}
      {floatCards.map((card) => (
        <motion.div
          key={card.name}
          initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          animate={{ y: [0, -10, 0] }}
          transition={{
            delay: card.delay,
            duration: card.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute z-10 hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-xl lg:block ${card.position}`}
        >
          <div className="flex items-center gap-3">
            <img
              src={speakerImage(card.name, card.topic)}
              alt={card.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div>
              <div className="font-display text-sm font-bold text-stone-900">{card.name}</div>
              <div className="text-xs text-orange-600">{card.label}</div>
            </div>
            <ArrowUpRight className="ml-2 h-4 w-4 text-stone-400" />
          </div>
        </motion.div>
      ))}

      {/* main stage card */}
      <motion.div
        initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 40, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1.4, 0.36, 1] }}
        whileHover={
          !reduce
            ? {
                y: -8,
                rotateY: 2,
                rotateX: -2,
                transition: { duration: 0.3 },
              }
            : undefined
        }
        style={{ transformStyle: "preserve-3d" }}
        className="relative z-20 w-full max-w-md rounded-3xl bg-stone-900 p-7 text-white shadow-2xl shadow-stone-900/30"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <motion.h3
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-4 font-display text-2xl font-bold"
            >
              {speaker.name}
            </motion.h3>
            <motion.p
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-1 text-sm text-orange-300"
            >
              {speaker.role}
            </motion.p>
            <motion.p
              initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="text-sm text-stone-400"
            >
              {speaker.company}
            </motion.p>
          </div>
          <motion.img
            initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1.4, 0.36, 1] }}
            src={avatar}
            alt={speaker.name}
            className="h-24 w-24 rounded-2xl border border-white/10 bg-stone-800 object-cover"
            onError={(e) => {
              e.currentTarget.src = fallbackFace(speaker.name);
            }}
          />
        </div>
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <p className="text-xs uppercase tracking-wide text-stone-500">Topic</p>
          <p className="mt-1 font-display text-lg font-semibold">{speaker.topic}</p>
        </motion.div>
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-5 flex items-center justify-between text-sm text-stone-300"
        >
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-orange-400" />
            {speaker.date}
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-orange-400" />
            {speaker.audience}
          </div>
        </motion.div>
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
          className="mt-5 flex items-center gap-2 rounded-xl bg-orange-500/10 px-4 py-3 text-xs text-orange-300"
        >
          <Users className="h-4 w-4 shrink-0" />
          <span>Speakers available for your campus</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
