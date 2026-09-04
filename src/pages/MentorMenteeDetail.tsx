import { useState } from "react";
import { Link, useParams } from "react-router";
import type { inferProcedureOutput } from "@trpc/server";
import type { AppRouter } from "../../api/router";
import {
  ArrowLeft, CalendarCheck, Loader2, MessageCircle, Star,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/site/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatINR } from "@/lib/format";

type MenteeRow = inferProcedureOutput<AppRouter["mentor"]["myMenteeDetail"]>;

export default function MentorMenteeDetail() {
  const { id } = useParams();
  const mentorshipId = Number(id);
  const [scheduleFor, setScheduleFor] = useState<number | null>(null);
  const [scheduleNote, setScheduleNote] = useState("");
  const [completeFor, setCompleteFor] = useState<number | null>(null);
  const [score, setScore] = useState("7");
  const [feedback, setFeedback] = useState("");

  const { data: row, isLoading } = trpc.mentor.myMenteeDetail.useQuery(
    { id: mentorshipId },
    { enabled: Number.isFinite(mentorshipId) && mentorshipId > 0 },
  );
  const utils = trpc.useUtils();

  const invalidate = () => {
    utils.mentor.myMenteeDetail.invalidate({ id: mentorshipId });
    utils.mentor.myMentees.invalidate();
  };

  const schedule = trpc.mentor.scheduleSession.useMutation({
    onSuccess: () => { toast.success("Session scheduled"); setScheduleFor(null); setScheduleNote(""); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const complete = trpc.mentor.completeSession.useMutation({
    onSuccess: () => { toast.success("Session completed & feedback saved"); setCompleteFor(null); setScore("7"); setFeedback(""); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-muted/40">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-24 pb-16">
        <Button variant="outline" className="rounded-full" asChild>
          <Link to="/mentor/dashboard?tab=mentees"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to mentees</Link>
        </Button>

        <div className="mt-6">
          {isLoading && <Skeleton className="h-96 rounded-3xl" />}
          {!isLoading && !row && (
            <div className="rounded-3xl border bg-card p-12 text-center">
              <h3 className="font-display text-xl font-semibold">Mentee not found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This mentorship may belong to another mentor or has been removed.
              </p>
            </div>
          )}
          {row && (
            <MenteeDetail
              row={row}
              onSchedule={(s) => { setScheduleFor(s.id); setScheduleNote(s.scheduledNote ?? ""); }}
              onComplete={(s) => { setCompleteFor(s.id); setFeedback(s.feedback ?? ""); }}
            />
          )}
        </div>
      </div>

      <Dialog open={scheduleFor !== null} onOpenChange={(v) => !v && setScheduleFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Schedule session</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>When & where (shared with candidate)</Label>
              <Input value={scheduleNote} onChange={(e) => setScheduleNote(e.target.value)} placeholder="Sun 11 AM · Google Meet (link on WhatsApp)" />
            </div>
            <Button
              className="w-full rounded-full"
              disabled={schedule.isPending || scheduleNote.length < 2}
              onClick={() => scheduleFor && schedule.mutate({ sessionId: scheduleFor, scheduledNote: scheduleNote })}
            >
              {schedule.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={completeFor !== null} onOpenChange={(v) => !v && setCompleteFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Complete session</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Score (1–10)</Label>
              <Input type="number" min={1} max={10} value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Feedback</Label>
              <Textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="What went well, what to fix before the real panel…" />
            </div>
            <Button
              className="w-full rounded-full"
              disabled={complete.isPending || feedback.length < 2}
              onClick={() => completeFor && complete.mutate({ sessionId: completeFor, score: Number(score), feedback })}
            >
              {complete.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save feedback
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenteeDetail({
  row,
  onSchedule,
  onComplete,
}: {
  row: MenteeRow;
  onSchedule: (s: MenteeRow["sessions"][number]) => void;
  onComplete: (s: MenteeRow["sessions"][number]) => void;
}) {
  const { mentorship: m, candidateName, candidateEmail, candidatePhone, sessions, review } = row;
  const statusMeta =
    m.status === "active"
      ? { label: "Ongoing", cls: "bg-green-100 text-green-700" }
      : m.status === "completed"
        ? { label: "Completed", cls: "bg-stone-200 text-stone-600" }
        : { label: "Cancelled", cls: "bg-red-100 text-red-700" };
  const gdPct = m.gdTotal ? (m.gdUsed / m.gdTotal) * 100 : 0;
  const piPct = m.piTotal ? (m.piUsed / m.piTotal) * 100 : 0;

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-display text-2xl font-bold text-white">
            {candidateName?.slice(0, 2).toUpperCase() ?? "ME"}
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">{candidateName ?? "Mentee"}</h2>
            <p className="text-sm text-muted-foreground">
              {candidateEmail}{candidatePhone ? ` · ${candidatePhone}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusMeta.cls}>{statusMeta.label}</Badge>
          {candidatePhone && (
            <Button size="sm" variant="outline" className="rounded-full" asChild>
              <a href={`https://wa.me/${candidatePhone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-1.5 h-3.5 w-3.5 text-green-600" /> WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="rounded-2xl border bg-muted/40 p-4 space-y-2 text-sm">
            <p><span className="text-muted-foreground">Package price:</span> <b>{formatINR(m.price)}</b></p>
            <p><span className="text-muted-foreground">Package:</span> {m.gdTotal} GD + {m.piTotal} PI</p>
            <p><span className="text-muted-foreground">Started:</span> {new Date(m.createdAt).toLocaleDateString("en-IN")}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Progress</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Mock GDs</span>
                  <b>{m.gdUsed}/{m.gdTotal}</b>
                </div>
                <Progress value={gdPct} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Mock Interviews</span>
                  <b>{m.piUsed}/{m.piTotal}</b>
                </div>
                <Progress value={piPct} className="h-2" />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Student review</h4>
            {review ? (
              <div className="rounded-2xl border bg-amber-50 p-4 space-y-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
                    />
                  ))}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
                {review.title && <p className="font-medium text-sm">{review.title}</p>}
                {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No review yet.</p>
            )}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3">Session history</h4>
          <div className="space-y-2.5">
            {sessions.length === 0 && (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="rounded-2xl border bg-muted/40 px-4 py-3 text-sm space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="uppercase">{s.type}</Badge>
                    <span>{s.topic || (s.type === "gd" ? "Group discussion" : "Personal interview")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.score !== null && <Badge className="bg-orange-500">{s.score}/10</Badge>}
                    <Badge className={
                      s.status === "completed" ? "bg-green-100 text-green-700"
                      : s.status === "scheduled" ? "bg-blue-100 text-blue-700"
                      : "bg-stone-200 text-stone-600"
                    }>
                      {s.status}
                    </Badge>
                  </div>
                </div>
                {s.scheduledNote && (
                  <p className="text-xs text-muted-foreground"><span className="font-medium">Note:</span> {s.scheduledNote}</p>
                )}
                {s.feedback && (
                  <p className="text-xs text-muted-foreground border-l-2 border-orange-400 pl-3">
                    <span className="font-medium">Feedback:</span> {s.feedback}
                  </p>
                )}
                <div className="flex gap-2">
                  {s.status === "requested" && (
                    <Button size="sm" className="rounded-full" onClick={() => onSchedule(s)}>Schedule</Button>
                  )}
                  {s.status === "scheduled" && (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => onComplete(s)}>
                      <CalendarCheck className="mr-1.5 h-3.5 w-3.5" /> Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
