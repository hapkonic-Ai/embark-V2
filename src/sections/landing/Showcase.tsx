import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Check, Lock, Trophy } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";
import { ParallaxBox } from "@/components/site/Parallax";

const PLANS = [
  {
    name: "Lite",
    price: "₹4,999",
    tagline: "Dip your toes",
    features: ["1:1 mentor matching", "2 mock GDs", "2 mock interviews", "WhatsApp support", "1 playbook free"],
    hot: false,
  },
  {
    name: "Pro",
    price: "₹9,999",
    tagline: "The sweet spot",
    features: ["Everything in Lite", "4 mock GDs + 4 mock PIs", "WAT essay reviews", "Profile building call", "3 playbooks free"],
    hot: true,
  },
  {
    name: "Super 100",
    price: "₹14,999",
    tagline: "For the 99+ percentilers",
    features: ["Everything in Pro", "6 GDs + 6 PIs", "B-school form reviews", "Priority mentor access", "All playbooks free"],
    hot: false,
  },
];

export function Programs() {
  return (
    <section className="py-20">
      <ParallaxBox offset={40} className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-orange-600 uppercase tracking-widest">Programs</span>
          <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Pick a plan, meet your mentor
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Final pricing is set by each mentor — these are the typical packages on Embark.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-3xl border p-8 ${
                p.hot
                  ? "bg-stone-950 text-white border-stone-800 shadow-2xl shadow-orange-500/20 scale-[1.03]"
                  : "bg-card shadow-sm"
              }`}
            >
              {p.hot && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <p className={`text-sm ${p.hot ? "text-stone-400" : "text-muted-foreground"}`}>{p.tagline}</p>
              <div className="mt-5 font-display text-4xl font-bold">{p.price}</div>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <span className={p.hot ? "text-stone-300" : ""}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-8 w-full rounded-full ${p.hot ? "btn-shine" : ""}`}
                variant={p.hot ? "default" : "outline"}
                asChild
              >
                <Link to="/mentors">Browse mentors</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </ParallaxBox>
    </section>
  );
}

function MentorAvatar({ id, name }: { id: number; name: string | null }) {
  return (
    <img
      src={`https://i.pravatar.cc/300?u=${id}`}
      alt={name ?? "Mentor"}
      className="h-full w-full object-cover"
      onError={(e) => {
        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name ?? "EM")}&background=f97316&color=fff`;
      }}
    />
  );
}

export function MentorsPreview() {
  const { data: mentors } = trpc.catalog.mentors.useQuery();
  const { isAuthenticated } = useAuth();
  const top = mentors?.slice(0, 4) ?? [];
  return (
    <section className="py-20 bg-orange-50/60 dark:bg-transparent">
      <ParallaxBox offset={35} className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-sm font-semibold text-orange-600 uppercase tracking-widest">Mentors</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">
              Learn from people who made it
            </h2>
          </div>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/mentors">View all mentors <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {top.map((m, i) => (
            <motion.div
              key={m.profile.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-3xl border bg-card shadow-sm hover:shadow-xl transition-all"
            >
              <div className="h-64 overflow-hidden">
                <MentorAvatar id={m.profile.id} name={m.name} />
              </div>
              <div className="p-5">
                <h3 className="font-display font-semibold text-lg">{m.name}</h3>
                <p className="text-sm text-orange-600 font-medium">{m.profile.bschool}</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <h3 className="font-display text-xl font-semibold text-white">{m.name}</h3>
                <p className="text-sm text-orange-300">{m.profile.bschool}</p>
                {m.profile.headline && (
                  <p className="mt-2 text-xs text-stone-300 line-clamp-2">{m.profile.headline}</p>
                )}
                {m.profile.expertise && (
                  <p className="mt-2 text-xs text-stone-400">
                    {m.profile.expertise.split(",").slice(0, 3).map((t) => t.trim()).join(" · ")}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  {isAuthenticated ? (
                    <span className="font-display font-bold text-white">{formatINR(m.profile.price)}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-stone-300">
                      <Lock className="h-3 w-3" /> Login for pricing
                    </span>
                  )}
                  <Badge variant="secondary" className="bg-white/10 text-white border-white/10">
                    {m.profile.mockGds} GD · {m.profile.mockPis} PI
                  </Badge>
                </div>
                <Button size="sm" className="mt-4 w-full rounded-full" asChild>
                  <Link to={`/mentors/${m.profile.id}`}>View profile</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </ParallaxBox>
    </section>
  );
}

export function EventsPreview() {
  const { data: events } = trpc.catalog.events.useQuery();
  const live = events?.filter((e) => e.status === "live").slice(0, 3) ?? [];
  if (live.length === 0) return null;
  return (
    <section className="py-20">
      <ParallaxBox offset={40} className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-sm font-semibold text-orange-600 uppercase tracking-widest">Compete</span>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight">
              Live hackathons & case comps
            </h2>
          </div>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/events">All events <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {live.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-3xl border bg-card p-7 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="text-4xl">{e.emoji}</div>
              <div className="mt-4 flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">● Live</Badge>
                <Badge variant="secondary">
                  {e.type === "hackathon" ? "Hackathon" : "Case Competition"}
                </Badge>
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold leading-snug">{e.title}</h3>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-orange-600 font-medium">
                <Trophy className="h-4 w-4" /> {e.prize}
              </p>
              <Button className="mt-5 rounded-full" size="sm" asChild>
                <Link to={`/events/${e.id}`}>Participate <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </ParallaxBox>
    </section>
  );
}
