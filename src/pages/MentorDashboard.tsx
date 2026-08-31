import { useEffect, useState } from "react";
import { CalendarCheck, CalendarDays, Globe, Link2, Linkedin, Loader2, Settings, Sprout, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import DashboardShell from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatINR } from "@/lib/format";

export default function MentorDashboard() {
  return (
    <DashboardShell
      title="Mentor cockpit"
      subtitle="Your mentees, mock sessions and public profile."
      roles={["mentor"]}
      tabs={[
        { id: "mentees", label: "My Mentees", icon: Users },
        { id: "guest", label: "Guest Lectures", icon: CalendarDays },
        { id: "profile", label: "My Profile", icon: Settings },
      ]}
    >
      {(tab) => (
        <>
          {tab === "mentees" && <MenteesTab />}
          {tab === "guest" && <GuestLecturesTab />}
          {tab === "profile" && <ProfileTab />}
        </>
      )}
    </DashboardShell>
  );
}

function MenteesTab() {
  const { data, isLoading } = trpc.mentor.myMentees.useQuery();
  const utils = trpc.useUtils();
  const [scheduleFor, setScheduleFor] = useState<number | null>(null);
  const [scheduleNote, setScheduleNote] = useState("");
  const [completeFor, setCompleteFor] = useState<number | null>(null);
  const [score, setScore] = useState("7");
  const [feedback, setFeedback] = useState("");

  const invalidate = () => utils.mentor.myMentees.invalidate();

  const schedule = trpc.mentor.scheduleSession.useMutation({
    onSuccess: () => { toast.success("Session scheduled"); setScheduleFor(null); setScheduleNote(""); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const complete = trpc.mentor.completeSession.useMutation({
    onSuccess: () => { toast.success("Session completed & feedback saved"); setCompleteFor(null); setScore("7"); setFeedback(""); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 mx-auto">
          <Sprout className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">No mentees yet</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
          Make sure your profile is complete — a superadmin verifies it before you appear on the mentors page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {data.map(({ mentorship: m, candidateName, candidateEmail, sessions }) => (
        <div key={m.id} className="rounded-3xl border bg-card p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold">{candidateName}</h3>
              <p className="text-xs text-muted-foreground">{candidateEmail} · paid {formatINR(m.price)}</p>
            </div>
            <Badge className={m.status === "active" ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-600"}>{m.status}</Badge>
          </div>
          <div className="mt-3 text-sm text-muted-foreground">
            GDs: <b className="text-foreground">{m.gdUsed}/{m.gdTotal}</b> · PIs: <b className="text-foreground">{m.piUsed}/{m.piTotal}</b>
          </div>

          <div className="mt-5 space-y-2.5">
            {sessions.length === 0 && (
              <p className="text-sm text-muted-foreground">No session requests yet.</p>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="uppercase">{s.type}</Badge>
                  <span>{s.topic || "—"}</span>
                  {s.scheduledNote && <span className="text-xs text-muted-foreground">· {s.scheduledNote}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {s.score !== null && <Badge className="bg-orange-500">{s.score}/10</Badge>}
                  {s.status === "requested" && (
                    <Button size="sm" className="rounded-full" onClick={() => { setScheduleFor(s.id); setScheduleNote(s.scheduledNote ?? ""); }}>
                      Schedule
                    </Button>
                  )}
                  {s.status === "scheduled" && (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => { setCompleteFor(s.id); setFeedback(s.feedback ?? ""); }}>
                      <CalendarCheck className="mr-1.5 h-3.5 w-3.5" /> Complete
                    </Button>
                  )}
                  {s.status === "completed" && <Badge className="bg-green-100 text-green-700">completed</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

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

function GuestLecturesTab() {
  const { data, isLoading } = trpc.mentor.myGuestRequests.useQuery();
  const utils = trpc.useUtils();
  const [respondFor, setRespondFor] = useState<{
    id: number;
    status: "accepted" | "rejected";
    confirmedDate: string;
    mentorNote: string;
  } | null>(null);

  const respond = trpc.mentor.respondToGuestRequest.useMutation({
    onSuccess: () => {
      toast.success("Response saved");
      setRespondFor(null);
      utils.mentor.myGuestRequests.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-12 text-center">
        <h3 className="font-display text-xl font-semibold">No guest lecture invites yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Campuses will send requests here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map(({ request, campusName, campusEmail }) => {
        const statusMeta = {
          pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
          accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
          rejected: { label: "Declined", cls: "bg-red-100 text-red-700" },
        }[request.status];
        const date = request.confirmedDate ?? request.proposedDate;
        return (
          <div key={request.id} className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-display font-semibold text-lg">{campusName}</h3>
                <p className="text-xs text-muted-foreground">{campusEmail}</p>
              </div>
              <Badge className={statusMeta.cls}>{statusMeta.label}</Badge>
            </div>
            {date && (
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Date:</span>{" "}
                {new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
            {request.campusNote && (
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Campus note:</span> {request.campusNote}
              </p>
            )}
            {request.mentorNote && (
              <p className="mt-2 text-sm text-muted-foreground border-l-2 border-orange-400 pl-3">{request.mentorNote}</p>
            )}
            {request.status === "pending" && (
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    setRespondFor({
                      id: request.id,
                      status: "accepted",
                      confirmedDate: request.proposedDate ? new Date(request.proposedDate).toISOString().slice(0, 16) : "",
                      mentorNote: "",
                    })
                  }
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    setRespondFor({
                      id: request.id,
                      status: "rejected",
                      confirmedDate: "",
                      mentorNote: "",
                    })
                  }
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <Dialog open={!!respondFor} onOpenChange={(v) => !v && setRespondFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">
              {respondFor?.status === "accepted" ? "Confirm guest lecture" : "Decline invite"}
            </DialogTitle>
          </DialogHeader>
          {respondFor && (
            <div className="space-y-4">
              {respondFor.status === "accepted" && (
                <div className="space-y-1.5">
                  <Label>Confirmed date & time</Label>
                  <Input
                    type="datetime-local"
                    value={respondFor.confirmedDate}
                    onChange={(e) => setRespondFor({ ...respondFor, confirmedDate: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Note to campus</Label>
                <Input
                  value={respondFor.mentorNote}
                  onChange={(e) => setRespondFor({ ...respondFor, mentorNote: e.target.value })}
                  placeholder="Format, topic, logistics…"
                />
              </div>
              <Button
                className="w-full rounded-full"
                disabled={respond.isPending}
                onClick={() =>
                  respond.mutate({
                    requestId: respondFor.id,
                    status: respondFor.status,
                    confirmedDate: respondFor.confirmedDate || undefined,
                    mentorNote: respondFor.mentorNote || undefined,
                  })
                }
              >
                {respond.isPending ? "Saving…" : respondFor.status === "accepted" ? "Confirm" : "Decline"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileTab() {
  const { data, isLoading } = trpc.mentor.myProfile.useQuery();
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    headline: "", bschool: "", company: "", expertise: "",
    yearsExp: 0, bio: "", whatsapp: "", linkedinUrl: "", publicSlug: "",
    price: 9999, mockGds: 3, mockPis: 3,
  });

  useEffect(() => {
    if (data) {
      setForm({
        headline: data.headline ?? "",
        bschool: data.bschool ?? "",
        company: data.company ?? "",
        expertise: data.expertise ?? "",
        yearsExp: data.yearsExp,
        bio: data.bio ?? "",
        whatsapp: data.whatsapp ?? "",
        linkedinUrl: data.linkedinUrl ?? "",
        publicSlug: data.publicSlug ?? "",
        price: data.price,
        mockGds: data.mockGds,
        mockPis: data.mockPis,
      });
    }
  }, [data]);

  const save = trpc.mentor.upsertProfile.useMutation({
    onSuccess: () => { toast.success("Profile saved"); utils.mentor.myProfile.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const publicUrl = data?.publicSlug ? `${window.location.origin}/m/${data.publicSlug}` : null;
  const linkedInShareUrl = publicUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`
    : null;

  const copyUrl = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Profile link copied to clipboard");
  };

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;

  const field = (k: keyof typeof form, label: string, props: Record<string, unknown> = {}) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={String(form[k])}
        onChange={(e) =>
          setForm((f) => ({ ...f, [k]: typeof f[k] === "number" ? Number(e.target.value) : e.target.value }))
        }
        {...props}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-7 shadow-sm max-w-2xl">
        {data && !data.isVerified && (
          <p className="mb-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4">
            Your profile is pending verification by a superadmin. Complete it below to speed things up.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{field("headline", "Headline", { placeholder: "IIM A alum · ex-McKinsey" })}</div>
          {field("bschool", "B-school")}
          {field("company", "Company")}
          <div className="sm:col-span-2">{field("expertise", "Expertise (comma separated)", { placeholder: "GD, PI, Consulting" })}</div>
          {field("yearsExp", "Years of experience", { type: "number", min: 0 })}
          {field("whatsapp", "WhatsApp number (shown to paying candidates)", { placeholder: "+91 98xxx xxxxx" })}
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="linkedin">LinkedIn profile URL</Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="linkedin"
                value={form.linkedinUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/your-handle"
                className="pl-9"
              />
            </div>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="slug">Public profile slug</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="slug"
                value={form.publicSlug}
                onChange={(e) => setForm((f) => ({ ...f, publicSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                placeholder="your-name"
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">Your public booking page will be {window.location.origin}/m/{form.publicSlug || "your-slug"}</p>
          </div>
          {field("price", "Package price (₹)", { type: "number", min: 499 })}
          <div className="grid grid-cols-2 gap-4">
            {field("mockGds", "Mock GDs included", { type: "number", min: 0 })}
            {field("mockPis", "Mock PIs included", { type: "number", min: 0 })}
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Bio</Label>
            <Textarea rows={4} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </div>
        </div>
        <Button className="mt-6 rounded-full" disabled={save.isPending} onClick={() => save.mutate(form)}>
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save profile
        </Button>
      </div>

      {publicUrl && (
        <div className="rounded-3xl border bg-card p-7 shadow-sm max-w-2xl">
          <h3 className="font-display font-semibold text-lg">Share your Arena for grads profile</h3>
          <p className="text-sm text-muted-foreground mt-1">Students can book mock sessions directly from your public page.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px] flex items-center gap-2 rounded-xl border px-3 py-2 bg-muted/40">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm truncate">{publicUrl}</span>
            </div>
            <Button variant="outline" className="rounded-full" onClick={copyUrl}>
              Copy link
            </Button>
            {linkedInShareUrl && (
              <Button className="rounded-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white" asChild>
                <a href={linkedInShareUrl} target="_blank" rel="noreferrer">
                  <Linkedin className="mr-1.5 h-4 w-4" /> Share on LinkedIn
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
