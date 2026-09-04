import { useState } from "react";
import { Link, useParams } from "react-router";
import type { inferProcedureOutput } from "@trpc/server";
import type { AppRouter } from "../../api/router";
import {
  ArrowLeft, Loader2, MessageCircle, Star,
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
import { fallbackFace } from "@/lib/images";

type MentorshipRow = inferProcedureOutput<AppRouter["candidate"]["myMentorshipDetail"]>;

export default function StudentMentorshipDetail() {
  const { id } = useParams();
  const mentorshipId = Number(id);
  const [reqOpen, setReqOpen] = useState<{ type: "gd" | "pi" } | null>(null);
  const [topic, setTopic] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: row, isLoading } = trpc.candidate.myMentorshipDetail.useQuery(
    { id: mentorshipId },
    { enabled: Number.isFinite(mentorshipId) && mentorshipId > 0 },
  );
  const utils = trpc.useUtils();

  const request = trpc.candidate.requestMock.useMutation({
    onSuccess: () => {
      toast.success("Mock session requested!", {
        description: "Your mentor will schedule it over WhatsApp.",
      });
      setReqOpen(null);
      setTopic("");
      utils.candidate.myMentorshipDetail.invalidate({ id: mentorshipId });
      utils.candidate.myMentorships.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-muted/40">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-24 pb-16">
        <Button variant="outline" className="rounded-full" asChild>
          <Link to="/dashboard?tab=mentorships"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to mentorships</Link>
        </Button>

        <div className="mt-6">
          {isLoading && <Skeleton className="h-96 rounded-3xl" />}
          {!isLoading && !row && (
            <div className="rounded-3xl border bg-card p-12 text-center">
              <h3 className="font-display text-xl font-semibold">Mentorship not found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                It may belong to another account or has been removed.
              </p>
            </div>
          )}
          {row && (
            <MentorshipDetail
              row={row}
              onRequest={(type) => setReqOpen({ type })}
              onReview={() => setReviewOpen(true)}
            />
          )}
        </div>
      </div>

      <Dialog open={!!reqOpen} onOpenChange={(v) => !v && setReqOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              Request a mock {reqOpen?.type === "gd" ? "GD" : "interview"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Topic / focus area (optional)</Label>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. AI in Indian agriculture" />
            </div>
            <Button
              className="w-full rounded-full"
              disabled={request.isPending}
              onClick={() =>
                reqOpen &&
                request.mutate({ mentorshipId, type: reqOpen.type, topic: topic || undefined })
              }
            >
              {request.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {row && (
        <MentorshipReviewDialog
          mentorshipId={mentorshipId}
          mentorName={row.mentorName}
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
        />
      )}
    </div>
  );
}

function MentorshipDetail({
  row,
  onRequest,
  onReview,
}: {
  row: MentorshipRow;
  onRequest: (type: "gd" | "pi") => void;
  onReview: () => void;
}) {
  const { mentorship: m, profile, mentorName, sessions, order, review } = row;
  const isPaid = !order || order.status === "paid";
  const isCompleted = m.status === "completed";
  const needsReview = isCompleted && !review;
  const active = m.status === "active" && isPaid;

  const statusMeta = active
    ? { label: "Ongoing", cls: "bg-green-100 text-green-700" }
    : needsReview
      ? { label: "Review pending", cls: "bg-amber-100 text-amber-700" }
      : isCompleted
        ? { label: "Completed", cls: "bg-stone-200 text-stone-600" }
        : { label: "Pending payment", cls: "bg-amber-100 text-amber-700 border border-amber-300" };

  const gdPct = m.gdTotal ? (m.gdUsed / m.gdTotal) * 100 : 0;
  const piPct = m.piTotal ? (m.piUsed / m.piTotal) * 100 : 0;

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={mentorName ?? "Mentor"}
              className="h-16 w-16 rounded-2xl object-cover"
              onError={(e) => { e.currentTarget.src = fallbackFace(mentorName ?? "Mentor"); }}
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-display text-2xl font-bold text-white">
              {mentorName?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="font-display text-2xl font-bold">{mentorName ?? "Mentor"}</h2>
            <p className="text-sm text-orange-600">{profile.bschool} · {profile.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusMeta.cls}>{statusMeta.label}</Badge>
          {profile.whatsapp && isPaid && (
            <Button size="sm" variant="outline" className="rounded-full" asChild>
              <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
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
            {!isPaid && <p className="text-amber-700 font-medium">Complete payment in Orders to request sessions.</p>}
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
            <h4 className="text-sm font-semibold mb-3">Request a session</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm" variant="outline" className="rounded-full"
                disabled={!active || m.gdUsed >= m.gdTotal}
                onClick={() => onRequest("gd")}
              >
                Request mock GD
              </Button>
              <Button
                size="sm" variant="outline" className="rounded-full"
                disabled={!active || m.piUsed >= m.piTotal}
                onClick={() => onRequest("pi")}
              >
                Request mock PI
              </Button>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Your review</h4>
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
            ) : needsReview ? (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-2">
                <p className="text-sm text-amber-900 font-medium">All sessions completed!</p>
                <p className="text-xs text-amber-800">Leave a review to close this mentorship.</p>
                <Button size="sm" className="rounded-full" onClick={onReview}>
                  <Star className="mr-1.5 h-3.5 w-3.5" /> Give review
                </Button>
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MentorshipReviewDialog({
  mentorshipId,
  mentorName,
  open,
  onClose,
}: {
  mentorshipId: number;
  mentorName: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const create = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Review submitted");
      utils.candidate.myMentorships.invalidate();
      utils.candidate.myMentorshipDetail.invalidate({ id: mentorshipId });
      setRating(0);
      setHoverRating(0);
      setTitle("");
      setContent("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Review {mentorName ?? "Mentor"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const active = i < (hoverRating || rating);
              return (
                <button
                  key={i}
                  type="button"
                  className="p-1"
                  onMouseEnter={() => setHoverRating(i + 1)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(i + 1)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      active ? "fill-amber-400 text-amber-400" : "text-stone-300"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Insightful mock interview" className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Review</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What went well? What could be better?" rows={4} className="rounded-xl" />
          </div>
          <Button
            className="w-full rounded-full"
            disabled={rating === 0 || create.isPending}
            onClick={() => create.mutate({ mentorshipId, rating, title: title || undefined, content: content || undefined })}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
