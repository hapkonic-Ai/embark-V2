import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Users } from "lucide-react";
import { trpc } from "@/providers/trpc";
import SiteLayout from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const statusStyle: Record<string, string> = {
  live: "bg-green-100 text-green-700",
  closed: "bg-stone-200 text-stone-600",
};

export default function Events() {
  const { data: events, isLoading } = trpc.catalog.events.useQuery();

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Hackathons &amp; <span className="text-gradient-orange">case comps</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Submit your deck or document, get scored by the jury, win glory (and money).
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-3xl" />)}
          {events?.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-3xl border bg-card p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between">
                <span className="text-5xl">{e.emoji}</span>
                <div className="flex gap-1.5">
                  <Badge className={statusStyle[e.status] ?? ""} variant="secondary">
                    {e.status === "live" ? "● Live" : "Closed"}
                  </Badge>
                </div>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold leading-snug flex-1">{e.title}</h3>
              <div className="mt-2">
                <Badge variant="outline">
                  {e.type === "hackathon" ? "Hackathon" : "Case Competition"}
                </Badge>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5 text-orange-600 font-medium">
                  <Trophy className="h-4 w-4" /> {e.prize}
                </p>
                <p className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" /> {e.submissionCount} submissions
                </p>
                {e.endAt && (
                  <p>Deadline: {new Date(e.endAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                )}
              </div>
              <Button className="mt-5 rounded-full" size="sm" variant={e.status === "live" ? "default" : "outline"} asChild>
                <Link to={`/events/${e.id}`}>
                  {e.status === "live" ? "Participate" : "View results"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
