import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import { CalendarDays, Linkedin, Search } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import SiteLayout from "@/components/site/SiteLayout";
import { DocumentHead } from "@/components/site/DocumentHead";
import { EditorialHero } from "@/components/site/EditorialHero";
import { SpotlightHero } from "@/components/site/SpotlightHero";
import { StorySection } from "@/components/site/StorySection";
import { JourneySteps } from "@/components/site/JourneySteps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { mentorImage, eventCoverImage, speakerImage } from "@/lib/images";
import type { MentorProfile } from "../../db/schema";

type MentorRow = { profile: MentorProfile; name: string | null; };

function MentorImage({ m }: { m: MentorRow }) {
  const fallback = mentorImage(m.name ?? "Mentor", m.profile.bschool ?? "IIM");
  const src = m.profile.profileImage || fallback;
  return (
    <img
      src={src}
      alt={m.name ?? "Mentor"}
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      onError={(e) => {
        const target = e.currentTarget;
        target.src = fallback;
      }}
    />
  );
}

function RequestDialog({
  mentor,
  open,
  onClose,
}: {
  mentor: MentorRow | null;
  open: boolean;
  onClose: () => void;
}) {
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const utils = trpc.useUtils();
  const request = trpc.campus.createRequest.useMutation({
    onSuccess: () => {
      toast.success("Guest lecture request sent");
      setDate("");
      setNote("");
      utils.campus.myRequests.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!mentor) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Request {mentor.name} as guest lecturer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Preferred date & time</Label>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Note for the mentor</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Topic, audience size, format…" />
          </div>
          <Button
            className="w-full rounded-full"
            disabled={!date || request.isPending}
            onClick={() => request.mutate({ mentorProfileId: mentor.profile.id, proposedDate: new Date(date).toISOString(), campusNote: note || undefined })}
          >
            {request.isPending ? "Sending…" : "Send request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-stone-100">
        {label}
      </Label>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 h-11 rounded-full"
        />
      </div>
    </div>
  );
}

export default function GuestLecturer() {
  const { data: mentors, isLoading } = trpc.catalog.mentors.useQuery();
  const [industry, setIndustry] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("");
  const [selected, setSelected] = useState<MentorRow | null>(null);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const matches = (value: string, ...fields: (string | null | undefined)[]) => {
    if (!value.trim()) return true;
    const v = value.toLowerCase();
    return fields.some((f) => (f ?? "").toLowerCase().includes(v));
  };

  const filtered = (mentors ?? []).filter((m) => {
    return (
      matches(industry, m.profile.expertise, m.profile.headline) &&
      matches(role, m.profile.headline, m.name, m.profile.expertise) &&
      matches(company, m.profile.company) &&
      matches(topic, m.profile.expertise, m.profile.headline, m.profile.bio)
    );
  });

  const handleRequest = (m: MentorRow) => {
    if (!isAuthenticated) {
      navigate("/login?mode=register&role=campus");
      return;
    }
    if (user?.role !== "campus") {
      toast("This feature is for campus accounts", { description: "Sign up as a campus user to invite mentors." });
      return;
    }
    setSelected(m);
  };

  return (
    <SiteLayout>
      <DocumentHead
        title="Guest Lecturer"
        description="Invite verified IIM, XLRI and ISB alumni to deliver guest lectures, workshops and campus sessions through Arena for grads."
        path="guest-lecturer"
      />
      <EditorialHero
        dark={false}
        title="Meet the people shaping the industries"
        highlight="you're about to enter."
        subtitle="Every session is a live conversation with founders, CEOs, product leaders, investors, and researchers — not another recorded webinar. You choose the speaker, set the date, and bring the real world into your classroom."
        cta="Request a mentor"
        ctaHref="/login?mode=register&role=campus"
        secondaryCta="Browse speakers"
        secondaryHref="#speakers"
      >
        <SpotlightHero
          speaker={{
            name: "Ananya Mehta",
            role: "Founder & CEO",
            company: "Quartzlane",
            topic: "Building a venture-backed B2B startup from campus",
            avatar: speakerImage("Ananya Mehta", "Building a venture-backed B2B startup from campus"),
            date: "Thu, 12 Sept",
            audience: "120 students",
          }}
        />
      </EditorialHero>

      <StorySection
        dark={true}
        statement="What happens when the classroom meets the real world?"
        body={
          <>
            <p>
              Students spend weeks learning frameworks, models, and case studies. Then a founder, CEO, product leader, investor, consultant, or researcher walks in and shows them how those same ideas actually work inside a company.
            </p>
            <p className="mt-4">
              The conversation changes. Concepts become decisions. Theory becomes context. And students leave with a perspective no textbook can offer.
            </p>
          </>
        }
      >
        <div className="relative overflow-hidden rounded-3xl bg-stone-100">
          <img
            src={eventCoverImage("case_competition", "Guest lecture classroom")}
            alt="Students in a live guest lecture"
            className="h-full w-full object-cover"
          />
        </div>
      </StorySection>

      <section className="section-light">
        <JourneySteps
          title="From textbook to perspective"
          steps={[
            {
              number: "01",
              title: "TEXTBOOK",
              description: "Students begin with the frameworks, models, and core concepts that shape a discipline.",
            },
            {
              number: "02",
              title: "CONTEXT",
              description: "A founder, operator, or leader shows how that same idea plays out inside a real organization.",
            },
            {
              number: "03",
              title: "CONVERSATION",
              description: "The session becomes interactive: questions, debate, and live problem-solving with the speaker.",
            },
            {
              number: "04",
              title: "PERSPECTIVE",
              description: "Students leave with a point of view shaped by experience — not just another slide deck.",
            },
          ]}
        />
      </section>

      <section id="speakers" className="section-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-display text-3xl font-bold">Browse speakers</h2>
              <p className="mt-2 text-muted-foreground">
                Filter by industry, role, company, or topic and request a session for your campus.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FilterInput
                id="industry-filter"
                label="Industry"
                value={industry}
                onChange={setIndustry}
                placeholder="e.g. Fintech, FMCG"
              />
              <FilterInput
                id="role-filter"
                label="Role"
                value={role}
                onChange={setRole}
                placeholder="e.g. CEO, PM"
              />
              <FilterInput
                id="company-filter"
                label="Company"
                value={company}
                onChange={setCompany}
                placeholder="e.g. Quartzlane"
              />
              <FilterInput
                id="topic-filter"
                label="Topic"
                value={topic}
                onChange={setTopic}
                placeholder="e.g. Product strategy"
              />
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-3xl bg-card border border-stone-800" />
              ))}
            {filtered.map((m, i) => (
              <motion.div
                key={m.profile.id}
                initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={reduce ? {} : { y: -8 }}
                className="group relative overflow-hidden rounded-3xl border border-stone-800 bg-card shadow-sm hover:shadow-2xl transition-all"
              >
                <div className="relative h-72 overflow-hidden">
                  <MentorImage m={m} />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-display text-xl font-semibold text-white">{m.name}</h3>
                    <p className="text-sm text-orange-300">{m.profile.bschool}</p>
                  </div>
                </div>

                <div className="p-5">
                  {m.profile.headline && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{m.profile.headline}</p>
                  )}
                  {m.profile.expertise && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {m.profile.expertise.split(",").slice(0, 3).join(" · ")}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    {m.profile.linkedinUrl && (
                      <Button size="icon" variant="outline" className="rounded-full h-8 w-8" asChild>
                        <a href={m.profile.linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                          <Linkedin className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button size="sm" className="rounded-full" onClick={() => handleRequest(m)}>
                      <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Request
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {!isLoading && filtered.length === 0 && (
            <p className="mt-16 text-center text-muted-foreground">
              No speakers match your filters.
            </p>
          )}
        </div>
      </section>

      <RequestDialog mentor={selected} open={!!selected} onClose={() => setSelected(null)} />
    </SiteLayout>
  );
}
