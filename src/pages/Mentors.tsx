import { useState } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Search, BadgeCheck, Linkedin, Lock, ArrowRight } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import SiteLayout from "@/components/site/SiteLayout";
import { EditorialHero } from "@/components/site/EditorialHero";
import { StorySection } from "@/components/site/StorySection";
import { JourneySteps } from "@/components/site/JourneySteps";
import { CredibilityStrip } from "@/components/site/CredibilityStrip";
import { ProfileNetwork } from "@/components/site/ProfileNetwork";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";
import { mentorImage, fallbackFace } from "@/lib/images";

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

function MentorsHeroVisual() {
  return (
    <ProfileNetwork
      featured={{
        name: "Rohan Mehta",
        avatar: mentorImage("Rohan Mehta", "IIM Ahmedabad"),
        school: "IIM Ahmedabad",
        company: "ex-McKinsey",
        expertise: "GD · PI · Placements",
        students: 247,
      }}
      orbit={[
        { name: "Priya S", avatar: mentorImage("Priya S", "IIM Bangalore"), label: "GD specialist", angle: 30, distance: 165, size: 60 },
        { name: "Arjun K", avatar: mentorImage("Arjun K", "IIM Calcutta"), label: "PI specialist", angle: 90, distance: 150, size: 52 },
        { name: "Neha R", avatar: mentorImage("Neha R", "XLRI"), label: "Placement mentor", angle: 150, distance: 170, size: 58 },
        { name: "Vikram B", avatar: mentorImage("Vikram B", "IIM Ahmedabad"), label: "IIM interview", angle: 210, distance: 155, size: 54 },
        { name: "Sana M", avatar: mentorImage("Sana M", "FMS Delhi"), label: "Career switch", angle: 300, distance: 160, size: 56 },
      ]}
      tags={["Verified alumni", "1:1 sessions", "Mock GDs", "Mock PIs", "Profile reviews"]}
      stats={[
        { value: "4,000+", label: "mentors" },
        { value: "1,200+", label: "reviews" },
        { value: "4.9", label: "rating" },
      ]}
    />
  );
}

export default function Mentors() {
  const { data: mentors, isLoading } = trpc.catalog.mentors.useQuery();
  const { isAuthenticated } = useAuth();
  const [q, setQ] = useState("");
  const reduce = useReducedMotion();

  const filtered = (mentors ?? []).filter((m) => {
    const hay = `${m.name} ${m.profile.bschool} ${m.profile.company} ${m.profile.expertise}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <SiteLayout>
      <EditorialHero
        title="The people who made it."
        highlight="Now in your corner."
        subtitle="Verified IIM & XLRI alumni who've cracked the exact GD, PI and placement process you're about to face. Learn directly from someone who's already been in that chair."
        cta="Find your mentor"
        ctaHref="/login?mode=register"
        secondaryCta="Become a mentor"
        secondaryHref="/login?mode=register&role=mentor"
      >
        <MentorsHeroVisual />
      </EditorialHero>

      <StorySection
        dark
        statement="Because knowing the answer isn't the same as knowing what to say when the panel is staring at you."
        body={
          <>
            <p>
              Most students prepare in isolation. They practice generic answers, hope their profile holds up, and walk into the room rehearsed but not ready.
            </p>
            <p className="mt-4">
              A mentor changes that. They tell you what panels actually evaluate, where your answers sound templated, and how to structure your story so it sticks. It's not content. It's calibration.
            </p>
          </>
        }
      >
        <div className="rounded-3xl bg-card p-6 sm:p-8 border border-stone-800">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground mb-3">Before mentor</p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>Unsure what interviewers actually expect</li>
                <li>Practicing generic answers from forums</li>
                <li>Nervous about GDs and extempore</li>
                <li>Doesn't know how their profile will be questioned</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-stone-900 text-stone-100 p-6 border border-stone-800">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400 mb-3">After mentor</p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>Understands what panels evaluate</li>
                <li>Has practiced realistic, profile-specific questions</li>
                <li>Knows how to structure answers under pressure</li>
                <li>Gets personalized, brutally useful feedback</li>
              </ul>
            </div>
          </div>
        </div>
      </StorySection>

      <JourneySteps
        title="How mentorship works"
        steps={[
          { number: "01", title: "Find your person", description: "Tell us where you're headed — IIM, XLRI, ISB, or a career switch." },
          { number: "02", title: "Get matched", description: "Meet an alumnus who understands the exact journey you're on." },
          { number: "03", title: "Practice for real", description: "Mock GDs, PIs, extempore, and profile-led questions." },
          { number: "04", title: "Get feedback", description: "Know exactly what to fix before the actual interview." },
          { number: "05", title: "Walk in prepared", description: "Not rehearsed. Prepared." },
        ]}
      />

      <CredibilityStrip
        stats={[
          { value: "4,000+", label: "verified mentors" },
          { value: "1,200+", label: "student reviews" },
          { value: "4.9/5", label: "average rating" },
        ]}
        extra={["Product leaders", "Founders", "Consultants", "Placement experts"]}
      />

      <section className="py-16 sm:py-24 section-light">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold">Find your mentor</h2>
              <p className="mt-2 text-muted-foreground">Filter by school, company, or expertise. Book a session in minutes.</p>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by school, company, skill…"
                className="pl-10 h-11 rounded-full"
              />
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-3xl" />
              ))}
            {filtered.map((m, i) => (
              <motion.div
                key={m.profile.id}
                initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-3xl border bg-card shadow-sm hover:shadow-xl transition-all flex flex-col"
              >
                <div className="h-64 overflow-hidden">
                  <MentorAvatar name={m.name} bschool={m.profile.bschool} />
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="text-green-700 bg-green-100">
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
                        <Button size="icon" variant="outline" className="rounded-full h-8 w-8 border-stone-600 text-white hover:bg-stone-800" asChild>
                          <a href={m.profile.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                            <Linkedin className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                      <Button size="sm" className="rounded-full" asChild>
                        <Link to={m.profile.publicSlug ? `/m/${m.profile.publicSlug}` : `/mentors/${m.profile.id}`}>
                          {m.profile.publicSlug ? "Public page" : "View profile"}
                        </Link>
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
      </section>

      <section className="py-20 section-dark">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold">Ready to stop guessing?</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Get matched with a mentor who has cleared the exact process you're preparing for.
          </p>
          <Button size="lg" className="mt-8 rounded-full px-8 h-12 text-base btn-shine" asChild>
            <Link to="/login?mode=register">
              Start your mentorship <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
