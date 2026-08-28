import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Check, Lock } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";
import { mentorImage, fallbackFace } from "@/lib/images";
import { ParallaxBox } from "@/components/site/Parallax";
import { EventCard, EventSkeleton } from "@/components/site/EventCard";

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
    <section className="section-dark py-20">
      <ParallaxBox offset={40} className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
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

function MentorAvatar({ name, bschool }: { name: string | null; bschool: string | null }) {
  return (
    <img
      src={mentorImage(name ?? "Mentor", bschool ?? "IIM")}
      alt={name ?? "Mentor"}
      className="h-full w-full object-cover"
      onError={(e) => {
        e.currentTarget.src = fallbackFace(name ?? "Mentor");
      }}
    />
  );
}

export function MentorsPreview() {
  const { data: mentors } = trpc.catalog.mentors.useQuery();
  const { isAuthenticated } = useAuth();
  const top = mentors?.slice(0, 4) ?? [];
  return (
    <section className="section-light py-20">
      <ParallaxBox offset={35} className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
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
                <MentorAvatar name={m.name} bschool={m.profile.bschool} />
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
  const { data: events, isLoading } = trpc.catalog.events.useQuery();
  const live = events?.filter((e) => e.status === "live").slice(0, 3) ?? [];
  if (!isLoading && live.length === 0) return null;
  return (
    <section className="section-dark py-20">
      <ParallaxBox offset={40} className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
              Live events & case comps
            </h2>
          </div>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/events">All events <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {isLoading &&
            Array.from({ length: 3 }).map((_, i) => (
              <EventSkeleton key={i} />
            ))}
          {live.map((e, i) => (
            <EventCard key={e.id} e={e} index={i} />
          ))}
        </div>
      </ParallaxBox>
    </section>
  );
}
