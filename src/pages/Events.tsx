import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Rocket, Trophy, Users } from "lucide-react";
import { trpc } from "@/providers/trpc";
import SiteLayout from "@/components/site/SiteLayout";
import PageHero from "@/components/site/PageHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const GRADIENTS = [
  "from-purple-600 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-rose-500",
  "from-blue-500 to-cyan-500",
  "from-pink-500 to-fuchsia-600",
];

const statusStyle: Record<string, string> = {
  live: "bg-green-100 text-green-700",
  closed: "bg-stone-200 text-stone-600",
};

function EventsVisual() {
  return (
    <div className="relative w-full h-full min-h-[320px]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute left-16 top-12 w-56 h-72 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-2xl rotate-[-6deg] flex flex-col justify-end p-5 text-white"
      >
        <Trophy className="h-10 w-10" />
        <div className="mt-2 font-display font-bold">Case Sprint</div>
        <div className="text-sm opacity-80">₹50,000 prize</div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="absolute right-16 top-24 w-56 h-72 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 shadow-2xl rotate-[6deg] flex flex-col justify-end p-5 text-white"
      >
        <Rocket className="h-10 w-10" />
        <div className="mt-2 font-display font-bold">Startup Hack</div>
        <div className="text-sm opacity-80">Build your B-plan</div>
      </motion.div>
    </div>
  );
}

export default function Events() {
  const { data: events, isLoading } = trpc.catalog.events.useQuery();
  const liveCount = events?.filter((e) => e.status === "live").length ?? 0;

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Events"
        title="Events &"
        highlight="case competitions"
        subtitle="Build your resume with real wins. Compete in national events judged by mentors, founders, and B-school alumni."
        cta="Browse live events"
        ctaHref="#events"
        secondaryCta="Host with us"
        secondaryHref="/guest-lecturer"
        visual={<EventsVisual />}
      />

      <div id="events" className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold">Live events</h2>
            <p className="mt-2 text-muted-foreground">
              {liveCount > 0 ? `${liveCount} event${liveCount === 1 ? "" : "s"} open for submissions.` : "No live events right now. Check back soon."}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-3xl" />)}
          {events?.map((e, i) => {
            const gradient = GRADIENTS[i % GRADIENTS.length];
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -8 }}
                className="group relative overflow-hidden rounded-3xl border bg-card shadow-sm hover:shadow-2xl transition-all flex flex-col"
              >
                <div className={`relative h-40 bg-gradient-to-br ${gradient} p-6`}>
                  <div className="absolute top-4 right-4">
                    <Badge className={statusStyle[e.status] ?? ""} variant="secondary">
                      {e.status === "live" ? "● Live" : "Closed"}
                    </Badge>
                  </div>
                  <div className="text-white/90">
                    {e.type === "hackathon" ? <Rocket className="h-10 w-10" /> : <Trophy className="h-10 w-10" />}
                  </div>
                  <div className="absolute bottom-4 left-6 right-6">
                    <div className="text-white/90 text-sm font-medium">{e.type === "hackathon" ? "Event" : "Case Competition"}</div>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-display text-xl font-semibold leading-snug flex-1">{e.title}</h3>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2 text-orange-600 font-medium">
                      <Trophy className="h-4 w-4" /> {e.prize}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="h-4 w-4" /> {e.submissionCount} submissions
                    </p>
                    {e.endAt && (
                      <p className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Deadline {new Date(e.endAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <Button className="mt-5 w-full rounded-full" variant={e.status === "live" ? "default" : "outline"} size="sm" asChild>
                    <Link to={`/events/${e.id}`}>
                      {e.status === "live" ? "Participate" : "View results"} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SiteLayout>
  );
}
