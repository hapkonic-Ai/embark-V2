import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router";
import type { inferProcedureOutput } from "@trpc/server";
import type { AppRouter } from "../../api/router";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  Check,
  ExternalLink,
  GraduationCap,
  LayoutTemplate,
  Link2,
  Linkedin,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Settings,
  Sprout,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import DashboardShell from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatINR } from "@/lib/format";
import ImageUploadField from "@/components/expert/ImageUploadField";

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export default function MentorDashboard() {
  const { data, isLoading } = trpc.expert.me.useQuery();
  if (isLoading) return null;
  if (!data?.isOnboardingComplete) {
    return <Navigate to="/mentor/onboarding" replace />;
  }
  const isVerified = data.verification?.status === "approved" ||
    data.profile?.isVerified ||
    data.profile?.verificationStatus === "verified";
  return (
    <DashboardShell
      title="Mentor cockpit"
      subtitle="Your mentees, guest lectures and public profile."
      roles={["mentor"]}
      layout="topbar"
      tabs={[
        { id: "mentees", label: "My Mentees", icon: Users },
        { id: "guest", label: "Guest Lectures", icon: CalendarDays },
        { id: "profile", label: "My Profile", icon: Settings },
      ]}
    >
      {(tab) => (
        <>
          {!isVerified && <VerificationBanner />}
          {tab === "mentees" && <MenteesTab />}
          {tab === "guest" && <GuestLecturesTab />}
          {tab === "profile" && <ProfileTab />}
        </>
      )}
    </DashboardShell>
  );
}

function VerificationBanner() {
  return (
    <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="font-medium">Profile verification pending</p>
          <p className="text-sm text-amber-800">
            Your public page is hidden and students cannot book you until a superadmin verifies your profile.
          </p>
        </div>
      </div>
    </div>
  );
}

const MENTEES_PAGE_SIZE = 5;

type MyMenteesOutput = inferProcedureOutput<AppRouter["mentor"]["myMentees"]>;
type MenteeRow = MyMenteesOutput["rows"][number];

function MenteesTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.mentor.myMentees.useQuery({ page, pageSize: MENTEES_PAGE_SIZE });
  const utils = trpc.useUtils();
  const [view, setView] = useState<"list" | "detail">("list");
  const [selected, setSelected] = useState<MenteeRow | null>(null);
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

  const openDetail = (row: MenteeRow) => {
    setSelected(row);
    setView("detail");
  };

  const backToList = () => {
    setView("list");
    setSelected(null);
  };

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!data || data.rows.length === 0) {
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

  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <div className="space-y-5">
      {view === "list" ? (
        <MenteesList
          rows={data.rows}
          totalPages={totalPages}
          page={page}
          setPage={setPage}
          onOpen={openDetail}
        />
      ) : selected ? (
        <MenteeDetail
          row={selected}
          onBack={backToList}
          onSchedule={(s) => { setScheduleFor(s.id); setScheduleNote(s.scheduledNote ?? ""); }}
          onComplete={(s) => { setCompleteFor(s.id); setFeedback(s.feedback ?? ""); }}
        />
      ) : null}

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

function MenteesList({
  rows,
  totalPages,
  page,
  setPage,
  onOpen,
}: {
  rows: MenteeRow[];
  totalPages: number;
  page: number;
  setPage: (p: number) => void;
  onOpen: (row: MenteeRow) => void;
}) {
  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const { mentorship: m, candidateName, candidateEmail, candidatePhone, review } = row;
        const statusMeta =
          m.status === "active"
            ? { label: "Ongoing", cls: "bg-green-100 text-green-700" }
            : m.status === "completed"
              ? { label: "Completed", cls: "bg-stone-200 text-stone-600" }
              : { label: "Cancelled", cls: "bg-red-100 text-red-700" };
        const gdPct = m.gdTotal ? (m.gdUsed / m.gdTotal) * 100 : 0;
        const piPct = m.piTotal ? (m.piUsed / m.piTotal) * 100 : 0;
        return (
          <button
            key={m.id}
            onClick={() => onOpen(row)}
            className="w-full text-left rounded-3xl border bg-card p-6 shadow-sm transition-colors hover:border-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-display text-xl font-bold text-white">
                  {candidateName?.slice(0, 2).toUpperCase() ?? "ME"}
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{candidateName ?? "Mentee"}</h3>
                  <p className="text-xs text-muted-foreground">
                    {candidateEmail}{candidatePhone ? ` · ${candidatePhone}` : ""} · paid {formatINR(m.price)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {review && (
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    <Star className="mr-1 h-3 w-3 fill-amber-500 text-amber-500" /> Review received
                  </Badge>
                )}
                <Badge className={statusMeta.cls}>{statusMeta.label}</Badge>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
          </button>
        );
      })}

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min((page - 1) * MENTEES_PAGE_SIZE + 1, rows.length)}–{Math.min(page * MENTEES_PAGE_SIZE, rows.length)} of {rows.length}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(Math.max(1, page - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    isActive={page === i + 1}
                    onClick={() => setPage(i + 1)}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

function MenteeDetail({
  row,
  onBack,
  onSchedule,
  onComplete,
}: {
  row: MenteeRow;
  onBack: () => void;
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
    <div className="space-y-5">
      <Button variant="outline" className="rounded-full" onClick={onBack}>
        <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to mentees
      </Button>

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
  const { data, isLoading, refetch } = trpc.expert.myProfile.useQuery();
  const utils = trpc.useUtils();
  const uploadImage = trpc.expert.uploadImage.useMutation({ onError: (e) => toast.error(e.message) });
  const save = trpc.expert.upsertProfile.useMutation({
    onSuccess: () => { toast.success("Profile saved"); utils.expert.myProfile.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    displayName: "",
    headline: "",
    bio: "",
    profileImage: "",
    coverImage: "",
    location: "",
    country: "",
    timezone: "Asia/Kolkata",
    currentRole: "",
    company: "",
    expertise: "",
    industries: "",
    languages: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    websiteUrl: "",
    publicSlug: "",
    bschool: "",
    yearsExp: 0,
    whatsapp: "",
    price: 9999,
    mockGds: 3,
    mockPis: 3,
  });

  useEffect(() => {
    if (!data?.profile) return;
    const p = data.profile;
    setForm({
      displayName: p.displayName ?? "",
      headline: p.headline ?? "",
      bio: p.bio ?? "",
      profileImage: p.profileImage ?? "",
      coverImage: p.coverImage ?? "",
      location: p.location ?? "",
      country: p.country ?? "",
      timezone: p.timezone || "Asia/Kolkata",
      currentRole: p.currentRole ?? "",
      company: p.company ?? "",
      expertise: p.expertise ?? "",
      industries: p.industries ?? "",
      languages: p.languages ?? "",
      linkedinUrl: p.linkedinUrl ?? "",
      githubUrl: p.githubUrl ?? "",
      portfolioUrl: p.portfolioUrl ?? "",
      websiteUrl: p.websiteUrl ?? "",
      publicSlug: p.publicSlug ?? "",
      bschool: p.bschool ?? "",
      yearsExp: p.yearsExp,
      whatsapp: p.whatsapp ?? "",
      price: p.price,
      mockGds: p.mockGds,
      mockPis: p.mockPis,
    });
  }, [data]);

  const update = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const publicUrl = form.publicSlug ? `${window.location.origin}/m/${form.publicSlug}` : null;
  const linkedInShareUrl = publicUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}`
    : null;

  const copyUrl = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Profile link copied");
  };

  if (isLoading || !data) return <Skeleton className="h-96 rounded-3xl" />;

  const p = data.profile;
  const isVerified = p?.isVerified || p?.verificationStatus === "verified";
  const completion = data.completion;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      {/* LEFT: basic details form */}
      <div className="rounded-3xl border bg-card p-7 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Pencil className="h-5 w-5 text-orange-500" />
          <h2 className="font-display text-xl font-semibold">Basic details</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name" value={form.displayName} onChange={(v) => update("displayName", v)} />
          <Field label="Professional headline" value={form.headline} onChange={(v) => update("headline", v)} />
          <Field label="Current role" value={form.currentRole} onChange={(v) => update("currentRole", v)} />
          <Field label="Company" value={form.company} onChange={(v) => update("company", v)} />
          <Field label="B-school" value={form.bschool} onChange={(v) => update("bschool", v)} />
          <Field label="Years of experience" value={String(form.yearsExp)} onChange={(v) => update("yearsExp", Number(v) || 0)} type="number" />
          <Field label="Location" value={form.location} onChange={(v) => update("location", v)} />
          <Field label="Country" value={form.country} onChange={(v) => update("country", v)} />
          <Field label="Timezone" value={form.timezone} onChange={(v) => update("timezone", v)} />
          <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => update("whatsapp", v)} />
          <Field label="Package price (₹)" value={String(form.price)} onChange={(v) => update("price", Number(v) || 0)} type="number" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Mock GDs" value={String(form.mockGds)} onChange={(v) => update("mockGds", Number(v) || 0)} type="number" />
            <Field label="Mock PIs" value={String(form.mockPis)} onChange={(v) => update("mockPis", Number(v) || 0)} type="number" />
          </div>
          <div className="sm:col-span-2">
            <Field label="Public profile slug" value={form.publicSlug} onChange={(v) => update("publicSlug", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))} />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>LinkedIn profile URL</Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={form.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} className="pl-9" />
            </div>
          </div>
          <Field label="GitHub" value={form.githubUrl} onChange={(v) => update("githubUrl", v)} />
          <Field label="Portfolio" value={form.portfolioUrl} onChange={(v) => update("portfolioUrl", v)} />
          <Field label="Website" value={form.websiteUrl} onChange={(v) => update("websiteUrl", v)} />
          <Field label="Expertise (comma separated)" value={form.expertise} onChange={(v) => update("expertise", v)} />
          <Field label="Industries (comma separated)" value={form.industries} onChange={(v) => update("industries", v)} />
          <Field label="Languages (comma separated)" value={form.languages} onChange={(v) => update("languages", v)} />
          <div className="sm:col-span-2 space-y-1.5">
            <Label>About you</Label>
            <Textarea rows={4} value={form.bio} onChange={(e) => update("bio", e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex gap-6">
            <ImageUploadField
              label="Profile photo"
              value={form.profileImage}
              onChange={(v) => update("profileImage", v)}
              onUpload={async (dataUrl) => {
                const fileMime = dataUrl.match(/^data:([^;]+)/)?.[1] ?? "image/png";
                const base64 = dataUrl.split(",")[1] ?? "";
                const result = await uploadImage.mutateAsync({ fileName: "profile.png", fileMime, fileBase64: base64 });
                return result.url;
              }}
              disabled={save.isPending || uploadImage.isPending}
            />
            <ImageUploadField
              label="Cover image"
              value={form.coverImage}
              onChange={(v) => update("coverImage", v)}
              onUpload={async (dataUrl) => {
                const fileMime = dataUrl.match(/^data:([^;]+)/)?.[1] ?? "image/png";
                const base64 = dataUrl.split(",")[1] ?? "";
                const result = await uploadImage.mutateAsync({ fileName: "cover.png", fileMime, fileBase64: base64 });
                return result.url;
              }}
              disabled={save.isPending || uploadImage.isPending}
            />
          </div>
        </div>

        <Button
          className="mt-6 rounded-full"
          disabled={save.isPending}
          onClick={() => {
            if (!form.timezone || !isValidTimezone(form.timezone)) {
              toast.error("Please choose a valid timezone such as Asia/Kolkata.");
              return;
            }
            save.mutate(form);
          }}
        >
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save profile
        </Button>
      </div>

      {/* RIGHT: public profile card + experience/education */}
      <div className="space-y-6">
        <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
          <div className="relative h-32">
            {form.coverImage ? (
              <img src={form.coverImage} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-orange-500 via-rose-500 to-violet-600" />
            )}
          </div>
          <div className="relative px-6 pb-6">
            <div className="-mt-14 flex items-end justify-between">
              {form.profileImage ? (
                <img src={form.profileImage} alt={form.displayName} className="h-28 w-28 rounded-3xl border-4 border-card object-cover shadow-xl" />
              ) : (
                <div className="h-28 w-28 rounded-3xl border-4 border-card bg-orange-100 text-orange-600 flex items-center justify-center text-4xl font-bold shadow-xl">
                  {form.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {isVerified ? (
                <Badge className="mb-4 bg-green-100 text-green-700 border-0 rounded-full">
                  <Check className="mr-1 h-3 w-3" /> Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="mb-4">Pending verification</Badge>
              )}
            </div>

            <div className="mt-4">
              <h3 className="font-display text-2xl font-bold">{form.displayName || "Your name"}</h3>
              <p className="text-muted-foreground">{form.headline || form.currentRole || "Headline"}</p>
              {(form.location || form.country) && (
                <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {form.location}{form.location && form.country ? ", " : ""}{form.country}
                </p>
              )}
            </div>

            {completion && (
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Profile completion</span>
                  <span className="font-medium">{completion.percentage}%</span>
                </div>
                <Progress value={completion.percentage} className="h-2" />
              </div>
            )}

            {publicUrl && (
              <div className="mt-5 rounded-2xl border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Link2 className="h-4 w-4" />
                  <span className="truncate">{publicUrl}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="rounded-full" onClick={copyUrl}>Copy link</Button>
                  <Button size="sm" className="rounded-full" asChild>
                    <a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View page</a>
                  </Button>
                  <Button size="sm" variant="secondary" className="rounded-full" asChild>
                    <Link to="/mentor/page"><LayoutTemplate className="mr-1.5 h-3.5 w-3.5" /> Edit public page</Link>
                  </Button>
                  {linkedInShareUrl && (
                    <Button size="sm" className="rounded-full bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white" asChild>
                      <a href={linkedInShareUrl} target="_blank" rel="noreferrer"><Linkedin className="mr-1.5 h-3.5 w-3.5" /> Share</a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <ExperienceManager experiences={data.experiences ?? []} onChange={() => refetch()} />
        <EducationManager educations={data.educations ?? []} onChange={() => refetch()} />
      </div>
    </div>
  );
}

function ExperienceManager({ experiences, onChange }: { experiences: { id: number; role: string | null; company: string; startDate: string | null; endDate: string | null; isCurrent: boolean | null; description: string | null }[]; onChange: () => void }) {
  const create = trpc.expert.createExperience.useMutation({ onSuccess: () => { toast.success("Experience added"); onChange(); }, onError: (e) => toast.error(e.message) });
  const remove = trpc.expert.deleteExperience.useMutation({ onSuccess: () => { toast.success("Experience removed"); onChange(); }, onError: (e) => toast.error(e.message) });
  const [form, setForm] = useState({ company: "", role: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" });
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2"><Briefcase className="h-5 w-5 text-orange-500" /> Experience</h3>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Cancel" : "Add"}</Button>
      </div>

      {experiences.length === 0 && !showAdd && <p className="text-sm text-muted-foreground">No experience added yet.</p>}

      <div className="space-y-3">
        {experiences.map((exp) => (
          <div key={exp.id} className="flex items-start justify-between gap-3 rounded-2xl border bg-muted/40 p-4">
            <div>
              <div className="font-semibold">{exp.role || "Role"} <span className="text-muted-foreground font-normal">at</span> {exp.company}</div>
              <div className="text-xs text-muted-foreground">{exp.startDate} {exp.endDate ? `— ${exp.isCurrent ? "Present" : exp.endDate}` : ""}</div>
              {exp.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>}
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => remove.mutate({ id: exp.id })} disabled={remove.isPending}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="mt-4 rounded-2xl border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company *" value={form.company} onChange={(v) => setForm((f) => ({ ...f, company: v }))} />
            <Field label="Role" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} />
            <Field label="Start date" value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} />
            <Field label="End date" value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} />
          </div>
          <div className="flex items-center gap-2">
            <input id="exp-current-dash" type="checkbox" checked={form.isCurrent} onChange={(e) => setForm((f) => ({ ...f, isCurrent: e.target.checked }))} />
            <Label htmlFor="exp-current-dash">Current role</Label>
          </div>
          <Field label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} textarea />
          <Button
            size="sm"
            className="rounded-full"
            disabled={!form.company || create.isPending}
            onClick={() => create.mutate(form, { onSuccess: () => { setForm({ company: "", role: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" }); setShowAdd(false); } })}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add experience
          </Button>
        </div>
      )}
    </div>
  );
}

function EducationManager({ educations, onChange }: { educations: { id: number; institution: string; degree: string | null; fieldOfStudy: string | null; startDate: string | null; endDate: string | null; grade: string | null; description: string | null }[]; onChange: () => void }) {
  const create = trpc.expert.createEducation.useMutation({ onSuccess: () => { toast.success("Education added"); onChange(); }, onError: (e) => toast.error(e.message) });
  const remove = trpc.expert.deleteEducation.useMutation({ onSuccess: () => { toast.success("Education removed"); onChange(); }, onError: (e) => toast.error(e.message) });
  const [form, setForm] = useState({ institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "", description: "" });
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2"><GraduationCap className="h-5 w-5 text-orange-500" /> Education</h3>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Cancel" : "Add"}</Button>
      </div>

      {educations.length === 0 && !showAdd && <p className="text-sm text-muted-foreground">No education added yet.</p>}

      <div className="space-y-3">
        {educations.map((edu) => (
          <div key={edu.id} className="flex items-start justify-between gap-3 rounded-2xl border bg-muted/40 p-4">
            <div>
              <div className="font-semibold">{edu.degree || "Degree"} <span className="text-muted-foreground font-normal">—</span> {edu.institution}</div>
              <div className="text-xs text-muted-foreground">{edu.startDate} {edu.endDate ? `— ${edu.endDate}` : ""} {edu.fieldOfStudy ? `· ${edu.fieldOfStudy}` : ""}</div>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => remove.mutate({ id: edu.id })} disabled={remove.isPending}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="mt-4 rounded-2xl border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Institution *" value={form.institution} onChange={(v) => setForm((f) => ({ ...f, institution: v }))} />
            <Field label="Degree" value={form.degree} onChange={(v) => setForm((f) => ({ ...f, degree: v }))} />
            <Field label="Field of study" value={form.fieldOfStudy} onChange={(v) => setForm((f) => ({ ...f, fieldOfStudy: v }))} />
            <Field label="Grade" value={form.grade} onChange={(v) => setForm((f) => ({ ...f, grade: v }))} />
            <Field label="Start date" value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} />
            <Field label="End date" value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} />
          </div>
          <Field label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} textarea />
          <Button
            size="sm"
            className="rounded-full"
            disabled={!form.institution || create.isPending}
            onClick={() => create.mutate(form, { onSuccess: () => { setForm({ institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "", description: "" }); setShowAdd(false); } })}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Add education
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  type,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
