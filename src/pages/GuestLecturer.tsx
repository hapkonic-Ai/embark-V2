import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { CalendarDays, Linkedin, Search } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import SiteLayout from "@/components/site/SiteLayout";
import PageHero from "@/components/site/PageHero";
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
import type { MentorProfile } from "../../db/schema";

type MentorRow = { profile: MentorProfile; name: string | null; };

function MentorImage({ m }: { m: MentorRow }) {
  return (
    <img
      src={`https://i.pravatar.cc/300?u=${m.profile.id}`}
      alt={m.name ?? "Mentor"}
      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      onError={(e) => {
        const target = e.currentTarget;
        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name ?? "EM")}&background=f97316&color=fff`;
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

function GuestLecturerVisual() {
  return (
    <div className="relative w-full h-full min-h-[320px]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute left-12 top-8 w-48 h-64 rounded-2xl overflow-hidden shadow-2xl rotate-[-6deg] border-4 border-white/10"
      >
        <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=600&fit=crop" alt="campus" className="h-full w-full object-cover" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="absolute right-12 top-20 w-48 h-64 rounded-2xl overflow-hidden shadow-2xl rotate-[6deg] border-4 border-white/10"
      >
        <img src="https://images.unsplash.com/photo-1544531585-9847b68c8c86?w=400&h=600&fit=crop" alt="speaker" className="h-full w-full object-cover" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-orange-500 text-white px-4 py-2 text-sm font-bold shadow-lg"
      >
        Workshops · Masterclasses · Keynotes
      </motion.div>
    </div>
  );
}

export default function GuestLecturer() {
  const { data: mentors, isLoading } = trpc.catalog.mentors.useQuery();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<MentorRow | null>(null);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const filtered = (mentors ?? []).filter((m) => {
    const hay = `${m.name} ${m.profile.bschool} ${m.profile.company} ${m.profile.expertise}`.toLowerCase();
    return hay.includes(q.toLowerCase());
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
      <PageHero
        eyebrow="Guest Lecturer"
        title="Bring a verified mentor"
        highlight="to your campus"
        subtitle="Invite IIM & XLRI alumni for workshops, GDPI masterclasses, or keynote sessions — no platform fee, just a date to agree on."
        cta="Request a mentor"
        ctaHref="/login?mode=register&role=campus"
        secondaryCta="How it works"
        secondaryHref="#mentors"
        visual={<GuestLecturerVisual />}
      />

      <div id="mentors" className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold">Available mentors</h2>
            <p className="mt-2 text-muted-foreground">Hover to see their story, click to request a session.</p>
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

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-96 rounded-3xl" />
            ))}
          {filtered.map((m, i) => (
            <motion.div
              key={m.profile.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -8 }}
              className="group relative overflow-hidden rounded-3xl border bg-card shadow-sm hover:shadow-2xl transition-all"
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
            No mentors match “{q}”.
          </p>
        )}
      </div>

      <RequestDialog mentor={selected} open={!!selected} onClose={() => setSelected(null)} />
    </SiteLayout>
  );
}
