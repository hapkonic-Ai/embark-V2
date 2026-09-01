import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Users } from "lucide-react";
import { trpc } from "@/providers/trpc";
import SiteLayout from "@/components/site/SiteLayout";
import { DocumentHead } from "@/components/site/DocumentHead";
import { EditorialHero } from "@/components/site/EditorialHero";
import { StorySection } from "@/components/site/StorySection";
import { EventCard, EventSkeleton } from "@/components/site/EventCard";
import { eventCoverImage } from "@/lib/images";

const EASE = [0.22, 1, 0.36, 1] as const;

const EVENT_PHOTOS = [
  eventCoverImage("hackathon", "Students collaborating"),
  eventCoverImage("case_competition", "Audience watching speaker"),
  eventCoverImage("hackathon", "Conference session"),
  eventCoverImage("case_competition", "Students working on laptops"),
  eventCoverImage("hackathon", "Event audience from above"),
  eventCoverImage("case_competition", "Team presenting"),
];

const CATEGORIES = [
  "Career",
  "MBA",
  "Product",
  "Consulting",
  "Technology",
  "Entrepreneurship",
  "Leadership",
];

function EventsCollage() {
  const reduce = useReducedMotion();

  return (
    <div className="relative h-full w-full min-h-[480px]">
      {/* main event poster */}
      <motion.div
        initial={reduce ? { opacity: 1, y: 0, rotate: -5 } : { opacity: 0, y: 30, rotate: -10 }}
        animate={{ opacity: 1, y: 0, rotate: -5 }}
        transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
        whileHover={!reduce ? { y: -8, rotate: -3, scale: 1.02 } : undefined}
        className="absolute left-0 top-2 h-80 w-60 overflow-hidden rounded-3xl border-4 border-white shadow-2xl"
      >
        <img
          src={eventCoverImage("hackathon", "Startup Hack")}
          alt="Startup Hack"
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <div className="font-display text-lg font-bold">Startup Hack</div>
          <div className="text-sm text-white/80">Build your B-plan</div>
        </div>
      </motion.div>

      {/* second event poster */}
      <motion.div
        initial={reduce ? { opacity: 1, y: 0, rotate: 5 } : { opacity: 0, y: 30, rotate: 10 }}
        animate={{ opacity: 1, y: 0, rotate: 5 }}
        transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
        whileHover={!reduce ? { y: -8, rotate: 3, scale: 1.02 } : undefined}
        className="absolute right-0 top-14 h-72 w-56 overflow-hidden rounded-3xl border-4 border-white shadow-2xl"
      >
        <img
          src={eventCoverImage("case_competition", "Case Sprint")}
          alt="Case Sprint"
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5 text-white">
          <div className="font-display text-lg font-bold">Case Sprint</div>
          <div className="text-sm text-white/80">₹50,000 prize</div>
        </div>
      </motion.div>

      {/* stats card */}
      <motion.div
        initial={reduce ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.85 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.55, ease: EASE }}
        whileHover={!reduce ? { y: -6, scale: 1.05 } : undefined}
        className="absolute bottom-8 left-16 flex h-28 w-56 items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 text-stone-900 shadow-xl"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
          <Users className="h-7 w-7" />
        </div>
        <div>
          <div className="font-display text-2xl font-bold">1,200+</div>
          <div className="text-xs text-stone-500">students joined events</div>
        </div>
      </motion.div>

      {/* date chip */}
      <motion.div
        initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.7, ease: EASE }}
        className="absolute bottom-28 right-4 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-900 shadow-lg"
      >
        Next: 12 Sept
      </motion.div>
    </div>
  );
}

export default function Events() {
  const { data: events, isLoading } = trpc.catalog.events.useQuery();
  const liveEvents = events?.filter(e => e.status === "live") ?? [];
  const closedEvents = events?.filter(e => e.status === "closed") ?? [];

  return (
    <SiteLayout>
      <DocumentHead
        title="Events & Case Competitions"
        description="Compete in national MBA events, case competitions and live sessions judged by mentors, founders and B-school alumni on Arena for grads."
        path="events"
      />
      <EditorialHero
        dark={false}
        title="Don't just attend events."
        highlight="Be in the room when something happens."
        subtitle="Build your resume with real wins. Compete in national events judged by mentors, founders, and B-school alumni."
        cta="Browse live events"
        ctaHref="#whats-happening"
        secondaryCta="Host with us"
        secondaryHref="/guest-lecturer"
      >
        <EventsCollage />
      </EditorialHero>

      <section id="whats-happening" className="section-dark py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-bold">
                What's happening
              </h2>
              <p className="mt-2 text-muted-foreground">
                {isLoading
                  ? "Loading events..."
                  : liveEvents.length > 0
                    ? `${liveEvents.length} event${liveEvents.length === 1 ? "" : "s"} open for submissions.`
                    : "No live events right now. Check back soon."}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <EventSkeleton key={i} />
              ))}

            {!isLoading && liveEvents.length === 0 && (
              <p className="col-span-full text-muted-foreground">
                No live events right now. Check back soon.
              </p>
            )}

            {liveEvents.map((e, i) => (
              <EventCard key={e.id} e={e} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-light py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              What you missed
            </h2>
            <p className="mt-2 text-muted-foreground">
              Past events and closed competitions. Results are still live.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <EventSkeleton key={i} />
              ))}

            {!isLoading && closedEvents.length === 0 && (
              <p className="col-span-full text-muted-foreground">
                No past events yet.
              </p>
            )}

            {closedEvents.map((e, i) => (
              <EventCard key={e.id} e={e} index={i} />
            ))}
          </div>
        </div>
      </section>

      <StorySection
        dark={true}
        statement="Moments from the community"
        body={
          <>
            Real students, real campuses, real energy. Every event is a chance
            to meet the people who will shape your next chapter.
          </>
        }
        reverse
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 h-56 overflow-hidden rounded-3xl">
            <img
              src={EVENT_PHOTOS[0]}
              alt="Students collaborating at an event"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="h-44 overflow-hidden rounded-3xl">
            <img
              src={EVENT_PHOTOS[1]}
              alt="Audience watching a speaker"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="h-44 overflow-hidden rounded-3xl">
            <img
              src={EVENT_PHOTOS[2]}
              alt="Conference session in progress"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="h-44 overflow-hidden rounded-3xl">
            <img
              src={EVENT_PHOTOS[3]}
              alt="Students working on laptops"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="h-44 overflow-hidden rounded-3xl">
            <img
              src={EVENT_PHOTOS[4]}
              alt="Event audience from above"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </StorySection>

      <section className="section-light py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 mb-4">
            Find your room
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground mb-10">
            Pick a lane that matches where you are headed. We are building
            events for every kind of ambition.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map(category => (
              <Link
                key={category}
                to={`/events?category=${category.toLowerCase()}`}
                className="inline-flex items-center rounded-full border border-stone-200 bg-card px-5 py-2.5 text-sm font-medium text-stone-900 transition-colors hover:border-orange-500 hover:text-orange-600"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
