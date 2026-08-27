import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { CalendarDays, Linkedin, Search, Users } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import SiteLayout from "@/components/site/SiteLayout";
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MentorRow = any;

function MentorImage({ m }: { m: MentorRow }) {
  return (
    <img
      src={`https://i.pravatar.cc/300?u=${m.profile.id}`}
      alt={m.name ?? "Mentor"}
      className="h-full w-full object-cover"
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700 mb-4">
            <Users className="h-4 w-4" /> Guest Lecturer Program
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Bring a <span className="text-gradient-orange">verified mentor</span> to your campus
          </h1>
          <p className="mt-3 text-muted-foreground">
            Invite IIM & XLRI alumni for workshops, GDPI masterclasses, or keynote sessions.
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

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          {filtered.map((m, i) => (
            <motion.div
              key={m.profile.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-3xl border bg-card shadow-sm hover:shadow-xl transition-all"
            >
              <div className="h-64 overflow-hidden">
                <MentorImage m={m} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                <h3 className="font-display text-xl font-semibold text-white">{m.name}</h3>
                <p className="text-sm text-orange-300">{m.profile.bschool}</p>
                {m.profile.headline && (
                  <p className="mt-2 text-xs text-stone-300 line-clamp-2">{m.profile.headline}</p>
                )}
                {m.profile.expertise && (
                  <p className="mt-2 text-xs text-stone-400">{m.profile.expertise.split(",").slice(0, 3).join(" · ")}</p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  {m.profile.linkedinUrl && (
                    <Button size="icon" variant="outline" className="rounded-full h-8 w-8 border-white/20 text-white hover:bg-white/10" asChild>
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
