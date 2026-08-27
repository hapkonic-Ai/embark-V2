import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Search, BadgeCheck, Linkedin, Lock } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import SiteLayout from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";

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

export default function Mentors() {
  const { data: mentors, isLoading } = trpc.catalog.mentors.useQuery();
  const { isAuthenticated } = useAuth();
  const [q, setQ] = useState("");

  const filtered = (mentors ?? []).filter((m) => {
    const hay = `${m.name} ${m.profile.bschool} ${m.profile.company} ${m.profile.expertise}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Find your <span className="text-gradient-orange">mentor</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Verified alumni from India's top B-schools. Pay on Embark, connect on
            WhatsApp, convert your call.
          </p>
        </div>

        <div className="mt-8 relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by school, company, skill…"
            className="pl-10 h-11 rounded-full"
          />
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          {filtered.map((m, i) => (
            <motion.div
              key={m.profile.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-3xl border bg-card shadow-sm hover:shadow-xl transition-all flex flex-col"
            >
              <div className="h-64 overflow-hidden">
                <MentorAvatar id={m.profile.id} name={m.name} />
              </div>
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="text-green-700 bg-green-100 backdrop-blur-sm">
                  <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified
                </Badge>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <h3 className="font-display text-xl font-semibold text-white">{m.name}</h3>
                <p className="text-sm text-orange-300">{m.profile.bschool}</p>
                <p className="mt-2 text-sm text-stone-300 line-clamp-2 flex-1">{m.profile.headline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.profile.expertise?.split(",").slice(0, 3).map((t) => (
                    <Badge key={t} variant="outline" className="text-xs text-stone-200 border-stone-600">
                      {t.trim()}
                    </Badge>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  {isAuthenticated ? (
                    <div>
                      <div className="font-display text-xl font-bold text-white">{formatINR(m.profile.price)}</div>
                      <div className="text-xs text-stone-300">
                        {m.profile.mockGds} mock GDs · {m.profile.mockPis} mock PIs
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="inline-flex items-center gap-1 text-sm text-stone-200">
                        <Lock className="h-3.5 w-3.5" /> Login for pricing
                      </div>
                      <div className="text-xs text-stone-400">{m.profile.mockGds} GD · {m.profile.mockPis} PI</div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {m.profile.linkedinUrl && (
                      <Button size="icon" variant="outline" className="rounded-full h-8 w-8 border-white/20 text-white hover:bg-white/10" asChild>
                        <a href={m.profile.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                          <Linkedin className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm" className="rounded-full" asChild>
                      <Link to={`/mentors/${m.profile.id}`}>View profile</Link>
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-5 group-hover:opacity-0 transition-opacity">
                <h3 className="font-display text-xl font-semibold">{m.name}</h3>
                <p className="text-sm font-medium text-orange-600">{m.profile.bschool}</p>
              </div>
            </motion.div>
          ))}
        </div>
        {!isLoading && filtered.length === 0 && (
          <p className="mt-16 text-center text-muted-foreground">
            No mentors match “{q}”. Try “IIM” or “GD”.
          </p>
        )}
      </div>
    </SiteLayout>
  );
}
