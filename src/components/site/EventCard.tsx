import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Calendar, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { eventCoverImage } from "@/lib/images";
import type { EmbarkEvent } from "@db/schema";

export type EventItem = EmbarkEvent & { submissionCount?: number };

const statusStyle: Record<string, string> = {
  live: "bg-orange-100 text-orange-700",
  closed: "bg-stone-200 text-stone-600",
};

function coverImageForEvent(e: EventItem): string {
  return eventCoverImage(e.type, e.title);
}

const EASE = [0.22, 1, 0.36, 1] as const;

export function EventCard({ e, index }: { e: EventItem; index: number }) {
  const reduce = useReducedMotion();
  const isLive = e.status === "live";
  const coverImage = coverImageForEvent(e);

  return (
    <motion.div
      key={e.id}
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: EASE }}
      whileHover={reduce ? undefined : { y: -6 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-shadow hover:shadow-xl"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={coverImage}
          alt={e.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-stone-950/10" />
        <div className="absolute top-4 right-4">
          <Badge
            className={statusStyle[e.status] ?? "bg-stone-200 text-stone-600"}
            variant="secondary"
          >
            {isLive ? (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                Live
              </span>
            ) : (
              "Closed"
            )}
          </Badge>
        </div>
        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {e.type === "hackathon" ? "Event" : "Case Competition"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-semibold leading-snug flex-1">
          {e.title}
        </h3>
        <div className="mt-4 space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2 font-medium text-orange-600">
            <Trophy className="h-4 w-4" /> {e.prize}
          </p>
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4" /> {e.submissionCount ?? 0} submissions
          </p>
          {e.endAt && (
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Deadline{" "}
              {new Date(e.endAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
        </div>
        <Button
          className="mt-5 w-full rounded-full"
          variant={isLive ? "default" : "outline"}
          size="sm"
          asChild
        >
          <Link to={`/events/${e.id}`}>
            {isLive ? "Participate" : "View results"}{" "}
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

export function EventSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm">
      <Skeleton className="h-48 w-full bg-orange-100" />
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}
