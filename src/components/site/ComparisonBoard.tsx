import { motion, useReducedMotion } from "framer-motion";
import { Building2, MapPin, TrendingUp, Wallet } from "lucide-react";
import { collegeCampusImage } from "@/lib/images";

export function ComparisonBoard({
  colleges,
}: {
  colleges: {
    shortName: string;
    city: string;
    type: string;
    avgPackage: string;
    highestPackage: string;
    fees: string;
    roi: string;
    rank: string;
    color: string;
  }[];
}) {
  const reduce = useReducedMotion();

  return (
    <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl shadow-stone-900/8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">Compare colleges</h3>
          <p className="text-xs text-muted-foreground">Side by side, where it matters</p>
        </div>
        <motion.span
          initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-xs font-medium text-orange-600"
        >
          {colleges.length} selected
        </motion.span>
      </div>

      <div className="grid gap-4">
        {colleges.map((c, i) => (
          <motion.div
            key={c.shortName}
            initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + i * 0.15, ease: [0.22, 1.4, 0.36, 1] }}
            whileHover={!reduce ? { y: -4, transition: { duration: 0.2 } } : undefined}
            className="group relative overflow-hidden rounded-2xl border border-stone-100 bg-stone-50 p-4 transition-colors hover:border-orange-200 hover:bg-orange-50/30"
          >
            <div className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: c.color }} />
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-stone-100 bg-white">
                  <img
                    src={collegeCampusImage(c.shortName)}
                    alt={c.shortName}
                    className="h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center text-white font-display text-sm font-bold"
                    style={{ backgroundColor: `${c.color}CC` }}
                  >
                    <Building2 className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-display text-base font-bold">{c.shortName}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {c.city} · {c.type}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <motion.div
                  initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + i * 0.15, duration: 0.5 }}
                  className="font-display text-xl font-bold text-green-700"
                >
                  {c.avgPackage}
                </motion.div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Avg package</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {[
                { icon: TrendingUp, label: "Highest", value: c.highestPackage },
                { icon: Wallet, label: "Fees", value: c.fees },
                { icon: null, label: "ROI", value: c.roi },
                { icon: null, label: "NIRF", value: c.rank },
              ].map((item, j) => (
                <motion.div
                  key={item.label}
                  initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.15 + j * 0.08, duration: 0.4 }}
                  className="rounded-xl bg-white p-2 shadow-sm"
                >
                  {item.icon && (
                    <div className="mb-1 flex items-center justify-center text-orange-500">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div className="font-display text-sm font-bold">{item.value}</div>
                  <div className="text-[9px] uppercase text-muted-foreground">{item.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
