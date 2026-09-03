import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowRight, Award, BookOpen, Calendar, Check, Compass, CreditCard, Download, LayoutDashboard, Lightbulb,
  Loader2, MessageCircle, ShieldCheck, Smartphone, Star, Trophy, Users,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/providers/cart";
import DashboardShell from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downloadBase64 } from "@/lib/format";
import { fallbackFace } from "@/lib/images";


const subStatus: Record<string, { label: string; cls: string }> = {
  submitted: { label: "Submitted", cls: "bg-blue-100 text-blue-700" },
  shortlisted: { label: "Shortlisted", cls: "bg-purple-100 text-purple-700" },
  winner: { label: "Winner", cls: "bg-amber-100 text-amber-700" },
  rejected: { label: "Not selected", cls: "bg-stone-200 text-stone-600" },
};

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  return (
    <DashboardShell
      title={`Hey, ${user?.name?.split(" ")[0] ?? "there"}`}
      subtitle="Your mentorships, playbooks and competition entries."
      roles={["candidate"]}
      layout="topbar"
      initialTab={searchParams.get("tab") ?? undefined}
      tabs={[
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "mentorships", label: "Mentorships", icon: Users },
        { id: "orders", label: "Orders", icon: CreditCard },
        { id: "playbooks", label: "My Playbooks", icon: BookOpen },
        { id: "submissions", label: "Submissions", icon: Trophy },
      ]}
    >
      {(tab) => (
        <>
          {tab === "overview" && <Overview user={user} />}
          {tab === "mentorships" && <MentorshipsTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "playbooks" && <PlaybooksTab />}
          {tab === "submissions" && <SubmissionsTab />}
        </>
      )}
    </DashboardShell>
  );
}

function Overview({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const { data: ms } = trpc.candidate.myMentorships.useQuery();
  const { data: pbs } = trpc.candidate.myPlaybooks.useQuery();
  const { data: subs } = trpc.candidate.mySubmissions.useQuery();
  const { data: recommendedMentors } = trpc.catalog.mentors.useQuery();
  const { data: events } = trpc.catalog.events.useQuery();
  const active = ms?.rows.filter((m) => m.mentorship.status === "active") ?? [];
  const readiness = Math.min(100, active.length * 25 + (pbs?.length ?? 0) * 15 + (subs?.length ?? 0) * 20);

  const statCards = [
    { label: "Active mentors", value: active.length, to: "/mentors", cta: "Find a mentor", icon: Users },
    { label: "Playbooks owned", value: pbs?.length ?? 0, to: "/playbooks", cta: "Browse playbooks", icon: BookOpen },
    { label: "Competition entries", value: subs?.length ?? 0, to: "/events", cta: "Join an event", icon: Trophy },
  ];

  const profileComplete = !!(user?.phone && user?.linkedinUrl);
  const nextSteps = [
    { label: "Complete your profile", desc: "Add LinkedIn & phone so mentors can vet you.", done: profileComplete, to: "/dashboard" },
    { label: "Book a mentor", desc: "Pick a verified mentor and start your GD/PI prep.", done: active.length > 0, to: "/mentors" },
    { label: "Join an event", desc: "Build your B-school resume with real case wins.", done: (subs?.length ?? 0) > 0, to: "/events" },
    { label: "Read a playbook", desc: "GD frameworks, PI questions, WAT templates.", done: (pbs?.length ?? 0) > 0, to: "/playbooks" },
  ];

  const upcomingEvents = events?.filter((e) => e.status !== "closed").slice(0, 3) ?? [];
  const mentors = recommendedMentors?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      {/* stats */}
      <div className="grid gap-5 sm:grid-cols-3">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-3xl font-bold">{c.value}</div>
                <div className="text-sm text-muted-foreground">{c.label}</div>
              </div>
            </div>
            <Button variant="link" className="px-0 mt-3 text-orange-600" asChild>
              <Link to={c.to} className="inline-flex items-center gap-1">{c.cta} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* readiness + next steps */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-semibold text-lg">Your readiness score</h3>
                <p className="text-sm text-muted-foreground">Based on mentors, playbooks and event entries.</p>
              </div>
              <div className="h-14 w-14 rounded-full border-4 border-orange-500 flex items-center justify-center font-display font-bold text-orange-600">
                {readiness}
              </div>
            </div>
            <Progress value={readiness} className="mt-5 h-2" />
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg">Next steps</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {nextSteps.map((s) => (
                <Link
                  key={s.label}
                  to={s.to}
                  className={`rounded-2xl border p-4 transition-colors hover:bg-muted/40 ${s.done ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-sm">{s.label}</div>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                    </div>
                    {s.done ? (
                      <div className="h-5 w-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center"><Check className="h-3 w-3" /></div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-orange-500 text-orange-600 flex items-center justify-center"><ArrowRight className="h-3 w-3" /></div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* sidebar filler */}
        <div className="space-y-6">
          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-orange-600" /> Prep tip
            </h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Top B-school panels look for structured thinking, not perfection. Practice summarising any topic in 60 seconds using the PREP framework: Point, Reason, Example, Point.
            </p>
          </div>

          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" /> Upcoming events
            </h3>
            <div className="mt-4 space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((e) => (
                  <Link key={e.id} to={`/events/${e.id}`} className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/40">
                    <div>
                      <div className="text-sm font-medium line-clamp-1">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.status === "live" ? "Live now" : "Opening soon"}</div>
                    </div>
                    <div className="text-xs font-semibold text-orange-600">{e.prize}</div>
                  </Link>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No live events right now. Check back soon.</div>
              )}
            </div>
            <Button variant="link" className="px-0 mt-3 text-orange-600" asChild>
              <Link to="/events" className="inline-flex items-center gap-1">View all events <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </div>

      {/* recommended mentors */}
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-semibold text-lg">Recommended mentors</h3>
            <p className="text-sm text-muted-foreground">Verified mentors who match your MBA prep journey.</p>
          </div>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/mentors">Browse all</Link>
          </Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <Link key={m.profile.id} to={m.profile.publicSlug ? `/m/${m.profile.publicSlug}` : `/mentors/${m.profile.id}`} className="rounded-2xl border p-4 hover:bg-muted/40 transition-colors">
              <div className="flex items-center gap-3">
                {m.profile.profileImage ? (
                  <img
                    src={m.profile.profileImage}
                    alt={m.name ?? "Mentor"}
                    className="h-12 w-12 rounded-xl object-cover"
                    onError={(e) => { e.currentTarget.src = fallbackFace(m.name ?? "Mentor"); }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-display font-bold text-white text-sm">
                    {m.name?.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm">{m.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{m.profile.bschool} · {m.profile.company}</div>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{m.profile.headline}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const MENTORSHIPS_PAGE_SIZE = 5;

function MentorshipsTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.candidate.myMentorships.useQuery({ page, pageSize: MENTORSHIPS_PAGE_SIZE });
  const utils = trpc.useUtils();
  const [reqOpen, setReqOpen] = useState<{ id: number; type: "gd" | "pi" } | null>(null);
  const [reviewFor, setReviewFor] = useState<{ mentorshipId: number; mentorName: string | null } | null>(null);
  const [topic, setTopic] = useState("");

  const request = trpc.candidate.requestMock.useMutation({
    onSuccess: () => {
      toast.success("Mock session requested!", {
        description: "Your mentor will schedule it over WhatsApp.",
      });
      setReqOpen(null);
      setTopic("");
      utils.candidate.myMentorships.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!data || data.rows.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
          <Compass className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">No mentorships yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Your mentor is waiting to meet you.</p>
        <Button className="mt-5 rounded-full" asChild><Link to="/mentors">Browse mentors</Link></Button>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / data.pageSize);

  return (
    <div className="space-y-5">
      {data.rows.map(({ mentorship: m, profile, mentorName, sessions, order, review }) => {
        const gdPct = m.gdTotal ? (m.gdUsed / m.gdTotal) * 100 : 0;
        const piPct = m.piTotal ? (m.piUsed / m.piTotal) * 100 : 0;
        const isPaid = !order || order.status === "paid";
        const isCompleted = m.status === "completed";
        const needsReview = isCompleted && !review;
        return (
          <MentorshipCard
            key={m.id}
            mentorship={m}
            profile={profile}
            mentorName={mentorName}
            sessions={sessions}
            isPaid={isPaid}
            isCompleted={isCompleted}
            needsReview={needsReview}
            hasReview={!!review}
            gdPct={gdPct}
            piPct={piPct}
            onRequest={(type) => setReqOpen({ id: m.id, type })}
            onReview={() => setReviewFor({ mentorshipId: m.id, mentorName })}
          />
        );
      })}

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min((page - 1) * MENTORSHIPS_PAGE_SIZE + 1, data.total)}–{Math.min(page * MENTORSHIPS_PAGE_SIZE, data.total)} of {data.total}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

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
              onClick={() => reqOpen && request.mutate({ mentorshipId: reqOpen.id, type: reqOpen.type, topic: topic || undefined })}
            >
              {request.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {reviewFor && (
        <MentorshipReviewDialog
          mentorshipId={reviewFor.mentorshipId}
          mentorName={reviewFor.mentorName}
          open
          onClose={() => setReviewFor(null)}
        />
      )}
    </div>
  );
}

function MentorshipCard({
  mentorship,
  profile,
  mentorName,
  sessions,
  isPaid,
  isCompleted,
  needsReview,
  hasReview,
  gdPct,
  piPct,
  onRequest,
  onReview,
}: {
  mentorship: { id: number; status: string; gdUsed: number; gdTotal: number; piUsed: number; piTotal: number };
  profile: { profileImage: string | null; bschool: string | null; company: string | null; whatsapp: string | null };
  mentorName: string | null;
  sessions: { id: number; type: "gd" | "pi"; topic: string | null; status: string; score: number | null; feedback: string | null; scheduledNote: string | null }[];
  isPaid: boolean;
  isCompleted: boolean;
  needsReview: boolean;
  hasReview: boolean;
  gdPct: number;
  piPct: number;
  onRequest: (type: "gd" | "pi") => void;
  onReview: () => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const active = mentorship.status === "active" && isPaid;

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={mentorName ?? "Mentor"}
              className="h-14 w-14 rounded-2xl object-cover"
              onError={(e) => { e.currentTarget.src = fallbackFace(mentorName ?? "Mentor"); }}
            />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-display text-xl font-bold text-white">
              {mentorName?.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-display text-lg font-semibold">{mentorName}</h3>
            <p className="text-sm text-orange-600">{profile.bschool} · {profile.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={active ? "bg-green-100 text-green-700" : needsReview ? "bg-amber-100 text-amber-700" : "bg-stone-200 text-stone-600"}>
            {needsReview ? "review pending" : active ? "active" : isCompleted ? "completed" : "pending payment"}
          </Badge>
          {profile.whatsapp && (
            <Button size="sm" variant="outline" className="rounded-full" asChild>
              <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-1.5 h-3.5 w-3.5 text-green-600" /> {profile.whatsapp}
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Mock GDs</span>
            <b>{mentorship.gdUsed}/{mentorship.gdTotal}</b>
          </div>
          <Progress value={gdPct} className="h-2" />
          <Button
            size="sm" variant="outline" className="mt-3 rounded-full"
            disabled={!active || mentorship.gdUsed >= mentorship.gdTotal}
            onClick={() => onRequest("gd")}
          >
            Request mock GD
          </Button>
          {!isPaid && (
            <p className="text-xs text-muted-foreground mt-1">Complete payment in Orders to request sessions.</p>
          )}
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Mock Interviews</span>
            <b>{mentorship.piUsed}/{mentorship.piTotal}</b>
          </div>
          <Progress value={piPct} className="h-2" />
          <Button
            size="sm" variant="outline" className="mt-3 rounded-full"
            disabled={!active || mentorship.piUsed >= mentorship.piTotal}
            onClick={() => onRequest("pi")}
          >
            Request mock PI
          </Button>
        </div>
      </div>

      {needsReview && (
        <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900 font-medium">All sessions completed!</p>
          <p className="text-xs text-amber-800 mt-0.5">Leave a review to close this mentorship.</p>
          <Button size="sm" className="mt-2 rounded-full" onClick={onReview}>
            <Star className="mr-1.5 h-3.5 w-3.5" /> Give review
          </Button>
        </div>
      )}
      {hasReview && (
        <div className="mt-5 rounded-2xl border bg-green-50 p-4">
          <p className="text-sm text-green-800 font-medium">Review submitted</p>
          <p className="text-xs text-green-700 mt-0.5">This mentorship is closed.</p>
        </div>
      )}

      <div className="mt-5 border-t pt-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">Sessions</h4>
          <Button variant="ghost" size="sm" onClick={() => setShowHistory((s) => !s)}>
            {showHistory ? "Hide history" : "Show history"}
          </Button>
        </div>
        {showHistory && (
          <div className="space-y-2.5">
            {sessions.length === 0 && (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            )}
            {sessions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-muted/60 px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="uppercase">{s.type}</Badge>
                  <span>{s.topic || (s.type === "gd" ? "Group discussion" : "Personal interview")}</span>
                </div>
                <div className="flex items-center gap-2">
                  {s.scheduledNote && <span className="text-xs text-muted-foreground">{s.scheduledNote}</span>}
                  {s.score !== null && <Badge className="bg-orange-500">{s.score}/10</Badge>}
                  <Badge className={
                    s.status === "completed" ? "bg-green-100 text-green-700"
                    : s.status === "scheduled" ? "bg-blue-100 text-blue-700"
                    : "bg-stone-200 text-stone-600"
                  }>
                    {s.status}
                  </Badge>
                </div>
                {s.feedback && (
                  <p className="w-full text-xs text-muted-foreground border-l-2 border-orange-400 pl-3 mt-1">
                    “{s.feedback}”
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
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

type CheckoutPhase = "cart" | "payment" | "paying" | "done";

function OrdersTab() {
  const { data: orders, isLoading } = trpc.payments.myOrders.useQuery();
  const { items: cartItems, removeItem: removeFromCart } = useCart();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [phase, setPhase] = useState<CheckoutPhase>("cart");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [checkoutItems, setCheckoutItems] = useState<typeof cartItems>([]);
  const [doneCount, setDoneCount] = useState(0);
  const utils = trpc.useUtils();

  const pay = trpc.payments.simulatePay.useMutation({
    onSuccess: () => {
      utils.payments.myOrders.invalidate();
      utils.candidate.myMentorships.invalidate();
      utils.candidate.myPlaybooks.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const purchaseMentorship = trpc.candidate.purchaseMentorship.useMutation({
    onSuccess: () => {
      utils.candidate.myMentorships.invalidate();
      utils.payments.myOrders.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const purchasePlaybook = trpc.candidate.purchasePlaybook.useMutation({
    onSuccess: () => {
      utils.candidate.myPlaybooks.invalidate();
      utils.payments.myOrders.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const isBusy = purchaseMentorship.isPending || purchasePlaybook.isPending || pay.isPending;

  const startCheckout = (items: typeof cartItems) => {
    if (items.length === 0) {
      toast.error("Select at least one item to checkout");
      return;
    }
    setCheckoutItems(items);
    setPhase("payment");
  };

  const runCheckout = async () => {
    setPhase("paying");
    let paid = 0;
    const paidIds: string[] = [];

    try {
      for (const item of checkoutItems) {
        let orderId: number | undefined;
        if (item.type === "mentorship") {
          const r = await purchaseMentorship.mutateAsync({ mentorProfileId: item.mentorProfileId });
          orderId = r.orderId;
        } else {
          const r = await purchasePlaybook.mutateAsync({ playbookId: item.playbookId });
          orderId = r.orderId;
        }
        if (orderId) {
          await pay.mutateAsync({ orderId });
        }
        paid += 1;
        paidIds.push(item.id);
      }
      setDoneCount(paid);
      setPhase("done");
      paidIds.forEach((id) => removeFromCart(id));
      setSelected((prev) => {
        const next = new Set(prev);
        paidIds.forEach((id) => next.delete(id));
        return next;
      });
    } catch {
      setPhase("payment");
    }
  };

  const resetCheckout = () => {
    setPhase("cart");
    setCheckoutItems([]);
    setDoneCount(0);
  };

  const checkoutOne = (item: typeof cartItems[number]) => {
    startCheckout([item]);
  };

  const checkoutSelected = () => {
    const toCheckout = cartItems.filter((i) => selected.has(i.id));
    startCheckout(toCheckout);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(cartItems.map((i) => i.id)));
  };

  const selectedTotal = cartItems
    .filter((i) => selected.has(i.id))
    .reduce((sum, i) => sum + i.price, 0);

  const checkoutTotal = checkoutItems.reduce((sum, i) => sum + i.price, 0);

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">Cart ({cartItems.length})</h3>
          {cartItems.length > 0 && phase === "cart" && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>Select all</Button>
              {cartItems.length > 1 && (
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={selected.size === 0 || isBusy}
                  onClick={checkoutSelected}
                >
                  <CreditCard className="mr-1.5 h-4 w-4" />
                  Checkout selected ({selected.size}) {selectedTotal > 0 && `· ₹${selectedTotal.toLocaleString("en-IN")}`}
                </Button>
              )}
            </div>
          )}
        </div>

        {cartItems.length === 0 && phase !== "done" ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <div className="mt-3 flex justify-center gap-3">
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link to="/mentors">Browse mentors</Link>
              </Button>
              <Button size="sm" variant="outline" className="rounded-full" asChild>
                <Link to="/playbooks">Browse playbooks</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {phase === "cart" && cartItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-orange-500"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">
                    {item.type === "mentorship" ? `Mentorship with ${item.mentorName}` : item.title}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.type === "mentorship"
                      ? `${item.gdTotal} GD + ${item.piTotal} PI`
                      : "Playbook"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">₹{item.price.toLocaleString("en-IN")}</span>
                  <Button
                    size="sm"
                    className="rounded-full"
                    disabled={isBusy}
                    onClick={() => checkoutOne(item)}
                  >
                    <CreditCard className="mr-1.5 h-4 w-4" /> Checkout
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)}>Remove</Button>
                </div>
              </div>
            ))}

            {phase === "payment" && (
              <div className="rounded-2xl border bg-muted/40 p-5 space-y-4">
                <div>
                  <h4 className="font-display font-semibold text-lg">Checkout</h4>
                  <p className="text-sm text-muted-foreground">
                    {checkoutItems.length} item{checkoutItems.length > 1 ? "s" : ""} · Total{" "}
                    <span className="font-semibold text-orange-600">₹{checkoutTotal.toLocaleString("en-IN")}</span>
                  </p>
                </div>

                <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "upi" | "card")}>
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="upi"><Smartphone className="mr-1.5 h-4 w-4" />UPI</TabsTrigger>
                    <TabsTrigger value="card"><CreditCard className="mr-1.5 h-4 w-4" />Card</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upi" className="space-y-3 pt-3">
                    <label className="text-sm font-medium">UPI ID</label>
                    <input
                      type="text"
                      placeholder="you@okhdfc"
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </TabsContent>
                  <TabsContent value="card" className="space-y-3 pt-3">
                    <label className="text-sm font-medium">Card number</label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-full" onClick={resetCheckout}>Cancel</Button>
                  <Button className="rounded-full" disabled={isBusy} onClick={runCheckout}>
                    {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pay ₹{checkoutTotal.toLocaleString("en-IN")}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Demo checkout — no real money is charged.
                </p>
              </div>
            )}

            {phase === "paying" && (
              <div className="rounded-2xl border bg-muted/40 p-8 text-center space-y-3">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-500" />
                <p className="font-medium">Processing payment…</p>
                <p className="text-sm text-muted-foreground">Talking to the (imaginary) bank for {checkoutItems.length} item{checkoutItems.length > 1 ? "s" : ""}.</p>
              </div>
            )}

            {phase === "done" && (
              <div className="rounded-2xl border bg-green-50 p-8 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-6 w-6" />
                </div>
                <p className="font-medium text-green-900">Payment successful!</p>
                <p className="text-sm text-green-800">{doneCount} item{doneCount > 1 ? "s" : ""} added to your orders.</p>
                <Button className="rounded-full" onClick={resetCheckout}>Back to cart</Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-3xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">Order history</h3>
          <Button variant="outline" size="sm" className="rounded-full" onClick={() => setShowHistory((s) => !s)}>
            {showHistory ? "Hide history" : "Show history"}
          </Button>
        </div>

        {showHistory && (
          <div className="space-y-4">
            {!orders || orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              orders.map(({ order, type, title, expertName, payment }) => {
                const isPending = order.status === "pending";
                return (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 rounded-2xl border bg-muted/40 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium">{title}</h4>
                        <Badge variant={order.status === "paid" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </div>
                      {expertName && (
                        <p className="text-sm text-muted-foreground mt-1">with {expertName}</p>
                      )}
                      <p className="text-sm text-muted-foreground capitalize">
                        {type === "booking" ? "Session booking" : type === "mentorship" ? "Mentorship package" : "Playbook"}
                      </p>
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Amount:</span>{" "}
                        <span className="font-medium">₹{order.amount.toLocaleString("en-IN")} {order.currency}</span>
                        {payment && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            Paid via {payment.provider} · {payment.providerPaymentId}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <Button
                          size="sm"
                          className="rounded-full"
                          disabled={pay.isPending}
                          onClick={() => pay.mutate({ orderId: order.id })}
                        >
                          {pay.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <CreditCard className="mr-1.5 h-4 w-4" /> Pay now
                        </Button>
                      )}
                      {order.status === "paid" && (
                        <Badge className="bg-green-100 text-green-700 border-0">
                          <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Paid
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaybooksTab() {
  const { data, isLoading } = trpc.candidate.myPlaybooks.useQuery();
  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
          <BookOpen className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">Your library is empty</h3>
        <p className="mt-2 text-sm text-muted-foreground">Playbooks are distilled guides from mentors who cracked the same calls.</p>
        <Button className="mt-5 rounded-full" asChild><Link to="/playbooks">Browse playbooks</Link></Button>
      </div>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {data.map(({ purchase, playbook }) => (
        <Link
          key={purchase.id}
          to={`/playbooks/${playbook.id}`}
          className="rounded-3xl border bg-card p-6 shadow-sm flex gap-4 transition-colors hover:border-orange-200 hover:bg-orange-50/30"
        >
          <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display font-semibold">{playbook.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {playbook.pages} pages · bought {new Date(purchase.createdAt).toLocaleDateString("en-IN")}
            </p>
            <Badge variant="secondary" className="mt-2">{playbook.category}</Badge>
          </div>
        </Link>
      ))}
    </div>
  );
}

function SubmissionsTab() {
  const { data, isLoading } = trpc.candidate.mySubmissions.useQuery();
  const dl = trpc.candidate.downloadSubmission.useMutation({
    onSuccess: (r) => r.fileBase64 && downloadBase64(r.fileBase64, r.fileName ?? "submission", r.fileMime ?? "application/octet-stream"),
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
          <Award className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">No entries yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Compete in hackathons and case competitions to build your resume.</p>
        <Button className="mt-5 rounded-full" asChild><Link to="/events">Join a competition</Link></Button>
      </div>
    );
  }
  const st = (s: string) => subStatus[s] ?? subStatus.submitted;
  return (
    <div className="space-y-4">
      {data.map(({ submission: s, event }) => (
        <div key={s.id} className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">{event.title}</div>
              <h3 className="font-display font-semibold mt-1">{s.title}</h3>
              <p className="text-xs text-muted-foreground">Team {s.teamName} · {s.fileName}</p>
            </div>
            <div className="flex items-center gap-2">
              {s.score !== null && <Badge className="bg-orange-500">{s.score}/100</Badge>}
              <Badge className={st(s.status).cls}>{st(s.status).label}</Badge>
              {s.fileName && (
                <Button size="icon" variant="outline" className="rounded-full h-8 w-8" onClick={() => dl.mutate({ id: s.id })}>
                  {dl.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                </Button>
              )}
            </div>
          </div>
          {s.feedback && (
            <p className="mt-3 text-sm text-muted-foreground border-l-2 border-orange-400 pl-3">Jury: “{s.feedback}”</p>
          )}
        </div>
      ))}
    </div>
  );
}
