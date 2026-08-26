import { useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Search, BadgeCheck, Linkedin } from "lucide-react";
import { trpc } from "@/providers/trpc";
import SiteLayout from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";

export default function Mentors() {
  const { data: mentors, isLoading } = trpc.catalog.mentors.useQuery();
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
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          {filtered.map((m, i) => (
            <motion.div
              key={m.profile.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-3xl border bg-card p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-display text-2xl font-bold text-white">
                  {m.name?.slice(0, 2).toUpperCase()}
                </div>
                <Badge variant="secondary" className="text-green-700 bg-green-100">
                  <BadgeCheck className="mr-1 h-3.5 w-3.5" /> Verified
                </Badge>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{m.name}</h3>
              <p className="text-sm font-medium text-orange-600">{m.profile.bschool}</p>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">
                {m.profile.headline}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.profile.expertise?.split(",").slice(0, 3).map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">{t.trim()}</Badge>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <div>
                  <div className="font-display text-xl font-bold">{formatINR(m.profile.price)}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.profile.mockGds} mock GDs · {m.profile.mockPis} mock PIs
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.profile.linkedinUrl && (
                    <Button size="icon" variant="outline" className="rounded-full h-8 w-8" asChild>
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
