import { useState } from "react";
import { Link } from "react-router";
import {
  Award, BookOpen, Calendar, Compass, CreditCard, Download, LayoutDashboard, Lightbulb,
  Loader2, MessageCircle, Trophy, Users,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import DashboardShell from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { downloadBase64 } from "@/lib/format";
import { fallbackFace } from "@/lib/images";
import { format } from "date-fns";

const subStatus: Record<string, { label: string; cls: string }> = {
  submitted: { label: "Submitted", cls: "bg-blue-100 text-blue-700" },
  shortlisted: { label: "Shortlisted", cls: "bg-purple-100 text-purple-700" },
  winner: { label: "Winner", cls: "bg-amber-100 text-amber-700" },
  rejected: { label: "Not selected", cls: "bg-stone-200 text-stone-600" },
};

export default function CandidateDashboard() {
  const { user } = useAuth();
  return (
    <DashboardShell
      title={`Hey, ${user?.name?.split(" ")[0] ?? "there"}`}
      subtitle="Your mentorships, playbooks and competition entries."
      roles={["candidate"]}
      tabs={[
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "mentorships", label: "Mentorships", icon: Users },
        { id: "bookings", label: "Bookings", icon: Calendar },
        { id: "orders", label: "Orders", icon: CreditCard },
        { id: "playbooks", label: "My Playbooks", icon: BookOpen },
        { id: "submissions", label: "Submissions", icon: Trophy },
      ]}
    >
      {(tab) => (
        <>
          {tab === "overview" && <Overview />}
          {tab === "mentorships" && <MentorshipsTab />}
          {tab === "bookings" && <BookingsTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "playbooks" && <PlaybooksTab />}
          {tab === "submissions" && <SubmissionsTab />}
        </>
      )}
    </DashboardShell>
  );
}

function Overview() {
  const { data: ms } = trpc.candidate.myMentorships.useQuery();
  const { data: pbs } = trpc.candidate.myPlaybooks.useQuery();
  const { data: subs } = trpc.candidate.mySubmissions.useQuery();
  const { data: recommendedMentors } = trpc.catalog.mentors.useQuery();
  const { data: events } = trpc.catalog.events.useQuery();
  const active = ms?.filter((m) => m.mentorship.status === "active") ?? [];
  const readiness = Math.min(100, active.length * 25 + (pbs?.length ?? 0) * 15 + (subs?.length ?? 0) * 20);

  const statCards = [
    { label: "Active mentors", value: active.length, to: "/mentors", cta: "Find a mentor", icon: Users },
    { label: "Playbooks owned", value: pbs?.length ?? 0, to: "/playbooks", cta: "Browse playbooks", icon: BookOpen },
    { label: "Competition entries", value: subs?.length ?? 0, to: "/events", cta: "Join an event", icon: Trophy },
  ];

  const nextSteps = [
    { label: "Complete your profile", desc: "Add LinkedIn & phone so mentors can vet you.", done: false, to: "/dashboard" },
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
              <Link to={c.to}>{c.cta} →</Link>
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
                      <div className="h-5 w-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs">✓</div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-orange-500 text-orange-600 flex items-center justify-center text-xs">→</div>
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
              <Link to="/events">View all events →</Link>
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

function MentorshipsTab() {
  const { data, isLoading } = trpc.candidate.myMentorships.useQuery();
  const utils = trpc.useUtils();
  const [reqOpen, setReqOpen] = useState<{ id: number; type: "gd" | "pi" } | null>(null);
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
  if (!data || data.length === 0) {
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

  return (
    <div className="space-y-5">
      {data.map(({ mentorship: m, profile, mentorName, sessions }) => {
        const gdPct = m.gdTotal ? (m.gdUsed / m.gdTotal) * 100 : 0;
        const piPct = m.piTotal ? (m.piUsed / m.piTotal) * 100 : 0;
        return (
          <div key={m.id} className="rounded-3xl border bg-card p-7 shadow-sm">
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
                <Badge className={m.status === "active" ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-600"}>
                  {m.status}
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
                  <b>{m.gdUsed}/{m.gdTotal}</b>
                </div>
                <Progress value={gdPct} className="h-2" />
                <Button
                  size="sm" variant="outline" className="mt-3 rounded-full"
                  disabled={m.status !== "active" || m.gdUsed >= m.gdTotal}
                  onClick={() => setReqOpen({ id: m.id, type: "gd" })}
                >
                  Request mock GD
                </Button>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Mock Interviews</span>
                  <b>{m.piUsed}/{m.piTotal}</b>
                </div>
                <Progress value={piPct} className="h-2" />
                <Button
                  size="sm" variant="outline" className="mt-3 rounded-full"
                  disabled={m.status !== "active" || m.piUsed >= m.piTotal}
                  onClick={() => setReqOpen({ id: m.id, type: "pi" })}
                >
                  Request mock PI
                </Button>
              </div>
            </div>

            {sessions.length > 0 && (
              <div className="mt-6 border-t pt-5">
                <h4 className="text-sm font-semibold mb-3">Sessions</h4>
                <div className="space-y-2.5">
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
              </div>
            )}
          </div>
        );
      })}

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
    </div>
  );
}

function BookingsTab() {
  const { data, isLoading } = trpc.booking.listForStudent.useQuery();

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
          <Calendar className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">No bookings yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Book a session with a verified mentor to see it here.</p>
        <Button className="mt-5 rounded-full" asChild><Link to="/mentors">Browse mentors</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {data.map(({ booking, expertName, serviceTitle }) => {
        const date = format(new Date(booking.startAt), "PPp");
        return (
          <div key={booking.id} className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <Link
                to={`/dashboard/orders/${booking.id}`}
                className="min-w-0 flex-1 hover:opacity-80 transition-opacity"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{serviceTitle}</h3>
                  <Badge
                    variant={
                      booking.status === "confirmed" || booking.status === "completed"
                        ? "default"
                        : booking.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {booking.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">with {expertName}</p>
                <p className="text-sm mt-2 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" /> {date}
                </p>
              </Link>
              <div className="flex items-center gap-2">
                {booking.status === "completed" && (
                  <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                    Ready for review
                  </Badge>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrdersTab() {
  const { data: orders, isLoading } = trpc.payments.myOrders.useQuery();
  const utils = trpc.useUtils();
  const pay = trpc.payments.simulatePay.useMutation({
    onSuccess: () => {
      toast.success("Payment successful");
      utils.payments.myOrders.invalidate();
      utils.booking.listForStudent.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!orders || orders.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
          <CreditCard className="h-8 w-8" />
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold">No orders yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Book a session with a verified mentor to see it here.</p>
        <Button className="mt-5 rounded-full" asChild><Link to="/mentors">Browse mentors</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {orders.map(({ order, booking, expertName, serviceTitle, payment }) => {
        const date = format(new Date(booking.startAt), "PPp");
        const isPending = order.status === "pending";
        return (
          <div key={order.id} className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <Link
                to={`/dashboard/orders/${booking.id}`}
                className="min-w-0 flex-1 hover:opacity-80 transition-opacity"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{serviceTitle}</h3>
                  <Badge variant={order.status === "paid" ? "default" : "secondary"}>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">with {expertName}</p>
                <p className="text-sm mt-2 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" /> {date}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">₹{order.amount.toLocaleString("en-IN")} {order.currency}</span>
                  {payment && (
                    <span className="text-xs text-muted-foreground">
                      Paid via {payment.provider} · {payment.providerPaymentId}
                    </span>
                  )}
                </div>
              </Link>
              <div className="flex items-center gap-2">
                {isPending && (
                  <Button
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
          </div>
        );
      })}
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
        <div key={purchase.id} className="rounded-3xl border bg-card p-6 shadow-sm flex gap-4">
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
        </div>
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
