import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { fallbackFace } from "@/lib/images";
import { Building2, GraduationCap, Users } from "lucide-react";

function Avatar({ src, name, size = 64 }: { src: string; name: string; size?: number }) {
  return (
    <img
      src={src}
      alt={name}
      className="rounded-full object-cover border-2 border-white shadow-md bg-stone-100"
      style={{ width: size, height: size }}
      onError={(e) => {
        e.currentTarget.src = fallbackFace(name);
      }}
    />
  );
}

export function ProfileNetwork({
  featured,
  orbit,
  tags,
  stats,
}: {
  featured: {
    name: string;
    avatar: string;
    school: string;
    company: string;
    expertise: string;
    students: number;
  };
  orbit: { name: string; avatar: string; label: string; angle: number; distance: number; size: number }[];
  tags: string[];
  stats?: { label: string; value: string }[];
}) {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex items-center justify-center min-h-[420px] lg:min-h-[520px]">
      {/* subtle connection ring */}
      <motion.div
        initial={reduce ? { opacity: 0.1 } : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="absolute h-[340px] w-[340px] lg:h-[440px] lg:w-[440px] rounded-full border border-stone-900/10"
      />

      {/* orbit avatars */}
      {orbit.map((m, i) => {
        const rad = (m.angle * Math.PI) / 180;
        const x = Math.cos(rad) * m.distance;
        const y = Math.sin(rad) * m.distance;
        return (
          <motion.div
            key={m.name}
            initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 + i * 0.08 }}
            className="absolute flex flex-col items-center gap-2"
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <Avatar src={m.avatar} name={m.name} size={m.size} />
            <span className="whitespace-nowrap rounded-full bg-stone-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm">
              {m.label}
            </span>
          </motion.div>
        );
      })}

      {/* featured card */}
      <motion.div
        initial={reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1.4, 0.36, 1] }}
        className="relative z-10 w-72 rounded-3xl bg-white p-5 shadow-2xl shadow-stone-900/10 border border-stone-100"
      >
        <div className="flex items-start gap-4">
          <Avatar src={featured.avatar} name={featured.name} size={72} />
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-bold truncate">{featured.name}</h3>
            <div className="mt-1 flex items-center gap-1 text-xs font-medium text-orange-600">
              <GraduationCap className="h-3.5 w-3.5" />
              <span className="truncate">{featured.school}</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span className="truncate">{featured.company}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="rounded-full text-xs font-medium">
            {featured.expertise}
          </Badge>
          <Badge variant="outline" className="rounded-full text-xs font-medium">
            Available
          </Badge>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-stone-50 px-4 py-3">
          <Users className="h-4 w-4 text-orange-500" />
          <div>
            <div className="font-display text-base font-bold">{featured.students}+</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">students helped</div>
          </div>
        </div>
      </motion.div>

      {/* floating tags */}
      {tags.map((tag, i) => (
        <motion.span
          key={tag}
          initial={reduce ? { opacity: 1 } : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.9 + i * 0.06 }}
          className="absolute rounded-full border border-stone-200 bg-white/90 px-3 py-1 text-xs font-semibold text-stone-700 shadow-sm"
          style={{
            top: `${18 + ((i * 67) % 5) * 12}%`,
            left: i % 2 === 0 ? "8%" : "84%",
          }}
        >
          {tag}
        </motion.span>
      ))}

      {/* stats */}
      {stats && (
        <motion.div
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="absolute bottom-0 flex gap-6 rounded-2xl bg-stone-900 px-6 py-3 text-white shadow-xl"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-stone-400 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
