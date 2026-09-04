import { useDeferredValue, useMemo, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import type { inferProcedureOutput } from "@trpc/server";
import type { AppRouter } from "../../api/router";
import {
  ArrowRight, Award, BookOpen, Calendar, Check, Compass, CreditCard, Download, LayoutDashboard, Lightbulb,
  Loader2, ShieldCheck, Smartphone, Star, Trophy, UserRound, Users,
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
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { downloadBase64 } from "@/lib/format";
import { fallbackFace } from "@/lib/images";
import { FilterChips, ListPager, SearchBox, usePager } from "@/components/ListControls";
import { ProfileContent } from "@/pages/StudentProfile";


const subStatus: Record<string, { label: string; cls: string }> = {
  submitted: { label: "Submitted", cls: "bg-blue-100 text-blue-700" },
  shortlisted: { label: "Shortlisted", cls: "bg-purple-100 text-purple-700" },
  winner: { label: "Winner", cls: "bg-amber-100 text-amber-700" },
  rejected: { label: "Not selected", cls: "bg-stone-200 text-stone-600" },
};

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: onboarding, isLoading: onboardingLoading } =
    trpc.candidate.studentOnboarding.useQuery();
  if (onboardingLoading) return null;
  if (onboarding?.status !== "completed") {
    return <Navigate to="/student/onboarding" replace />;
  }
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
        { id: "profile", label: "My Profile", icon: UserRound },
      ]}
    >
      {(tab) => (
        <>
          {tab === "overview" && <Overview user={user} />}
          {tab === "mentorships" && <MentorshipsTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "playbooks" && <PlaybooksTab />}
          {tab === "submissions" && <SubmissionsTab />}
          {tab === "profile" && <ProfileContent />}
        </>
      )}
    </DashboardShell>
  );
}

function Overview({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const { data: ms } = trpc.candidate.myMentorships.useQuery({ page: 1, pageSize: 50 });
  const { data: pbs } = trpc.candidate.myPlaybooks.useQuery();
  const { data: subs } = trpc.candidate.mySubmissions.useQuery();
  const { data: recommendedMentors } = trpc.catalog.mentors.useQuery();
  const { data: events } = trpc.catalog.events.useQuery();
  const { data: onboarding } = trpc.candidate.studentOnboarding.useQuery();
  const active = ms?.rows.filter((m) => m.mentorship.status === "active") ?? [];
  const readiness = Math.min(100, active.length * 25 + (pbs?.length ?? 0) * 15 + (subs?.length ?? 0) * 20);

  const statCards = [
    { label: "Active mentors", value: active.length, to: "/mentors", cta: "Find a mentor", icon: Users },
    { label: "Playbooks owned", value: pbs?.length ?? 0, to: "/playbooks", cta: "Browse playbooks", icon: BookOpen },
    { label: "Competition entries", value: subs?.length ?? 0, to: "/events", cta: "Join an event", icon: Trophy },
  ];

  const profileComplete = !!(user?.phone && user?.linkedinUrl);
  const onboardingDone = onboarding?.status === "completed";
  const nextSteps = [
    { label: "Complete your profile", desc: "Add LinkedIn & phone so mentors can vet you.", done: profileComplete, to: onboardingDone ? "/dashboard?tab=profile" : "/student/onboarding" },
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

type MyMentorshipsOutput = inferProcedureOutput<AppRouter["candidate"]["myMentorships"]>;
type MentorshipRow = MyMentorshipsOutput["rows"][number];

function MentorshipsTab() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed" | "cancelled">("all");
  const [mentorQuery, setMentorQuery] = useState("");
  const deferredQuery = useDeferredValue(mentorQuery);
  const { data, isLoading } = trpc.candidate.myMentorships.useQuery({
    page,
    pageSize: MENTORSHIPS_PAGE_SIZE,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(deferredQuery.trim() ? { search: deferredQuery.trim() } : {}),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!data) return null;

  const hasFilters = statusFilter !== "all" || deferredQuery.trim() !== "";

  if (data.total === 0 && !hasFilters) {
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
  const sc = data.statusCounts;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}
          options={[
            { id: "all", label: "All", count: sc.active + sc.completed + sc.cancelled },
            { id: "active", label: "Ongoing", count: sc.active },
            { id: "completed", label: "Completed", count: sc.completed },
            { id: "cancelled", label: "Cancelled", count: sc.cancelled },
          ]}
        />
        <SearchBox value={mentorQuery} onChange={(v) => { setMentorQuery(v); setPage(1); }} placeholder="Search mentors…" />
      </div>
      <MentorshipList
        rows={data.rows}
        total={data.total}
        totalPages={totalPages}
        page={page}
        setPage={setPage}
      />
    </div>
  );
}

function MentorshipList({
  rows,
  total,
  totalPages,
  page,
  setPage,
}: {
  rows: MentorshipRow[];
  total: number;
  totalPages: number;
  page: number;
  setPage: (p: number) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No mentorships match your filters.</p>
    );
  }
  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const { mentorship: m, profile, mentorName, order, review } = row;
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
          <Link
            key={m.id}
            to={`/dashboard/mentorships/${m.id}`}
            className="block w-full text-left rounded-3xl border bg-card p-6 shadow-sm transition-colors hover:border-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
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
                  <h3 className="font-display text-lg font-semibold">{mentorName ?? "Mentor"}</h3>
                  <p className="text-sm text-orange-600">{profile.bschool} · {profile.company}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {review && (
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    <Star className="mr-1 h-3 w-3 fill-amber-500 text-amber-500" /> Review given
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
          </Link>
        );
      })}

      <ListPager
        page={page}
        totalPages={totalPages}
        onPage={setPage}
        total={total}
        pageSize={MENTORSHIPS_PAGE_SIZE}
      />
    </div>
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
  const [histFilter, setHistFilter] = useState("all");
  const [histQuery, setHistQuery] = useState("");
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

  const histList = useMemo(() => orders ?? [], [orders]);
  const histPending = histList.filter((o) => o.order.status === "pending").length;
  const histPaid = histList.filter((o) => o.order.status === "paid").length;
  const filteredOrders = useMemo(() => {
    const q = histQuery.trim().toLowerCase();
    return histList.filter((o) => {
      if (histFilter !== "all" && o.order.status !== histFilter) return false;
      if (q && !`${o.title} ${o.expertName ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [histList, histFilter, histQuery]);
  const histPager = usePager(filteredOrders);

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
            {histList.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <FilterChips
                    value={histFilter}
                    onChange={setHistFilter}
                    options={[
                      { id: "all", label: "All", count: histList.length },
                      { id: "pending", label: "Pending", count: histPending },
                      { id: "paid", label: "Paid", count: histPaid },
                    ]}
                  />
                  <SearchBox value={histQuery} onChange={setHistQuery} placeholder="Search orders…" />
                </div>

                {filteredOrders.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No orders match your filters.</p>
                ) : (
                  <div className="space-y-3">
                    {histPager.pageItems.map(({ order, type, title, expertName, payment }) => {
                      const isPending = order.status === "pending";
                      return (
                        <div key={order.id} className="flex flex-col gap-4 rounded-2xl border bg-muted/40 p-4 sm:flex-row sm:items-start sm:justify-between">
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
                              {" · "}{new Date(order.createdAt).toLocaleDateString("en-IN")}
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
                    })}
                  </div>
                )}

                <ListPager page={histPager.page} totalPages={histPager.totalPages} onPage={histPager.setPage} total={filteredOrders.length} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlaybooksTab() {
  const { data, isLoading } = trpc.candidate.myPlaybooks.useQuery();
  const [query, setQuery] = useState("");
  const download = trpc.candidate.downloadPlaybook.useMutation({
    onSuccess: (r) => {
      if (r.fileBase64) downloadBase64(r.fileBase64, r.fileName ?? "playbook.pdf", r.fileMime ?? "application/pdf");
    },
    onError: (e) => toast.error(e.message),
  });
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(({ playbook }) =>
      `${playbook.title} ${playbook.category}`.toLowerCase().includes(q),
    );
  }, [data, query]);
  const pager = usePager(filtered);
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} book{filtered.length === 1 ? "" : "s"} in your library
        </p>
        <SearchBox value={query} onChange={setQuery} placeholder="Search your playbooks…" />
      </div>

      {pager.pageItems.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No playbooks match your search.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {pager.pageItems.map(({ purchase, playbook }) => (
            <Link
              key={purchase.id}
              to={`/playbooks/${playbook.id}`}
              className="rounded-3xl border bg-card p-6 shadow-sm flex gap-4 transition-colors hover:border-orange-200 hover:bg-orange-50/30"
            >
              <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold">{playbook.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {playbook.pages} pages · bought {new Date(purchase.createdAt).toLocaleDateString("en-IN")}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">{playbook.category}</Badge>
                  {playbook.fileUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full h-7"
                      disabled={download.isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        download.mutate({ playbookId: playbook.id });
                      }}
                    >
                      {download.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                      Download PDF
                    </Button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <ListPager page={pager.page} totalPages={pager.totalPages} onPage={pager.setPage} total={filtered.length} />
    </div>
  );
}

function SubmissionsTab() {
  const { data, isLoading } = trpc.candidate.mySubmissions.useQuery();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const dl = trpc.candidate.downloadSubmission.useMutation({
    onSuccess: (r) => r.fileBase64 && downloadBase64(r.fileBase64, r.fileName ?? "submission", r.fileMime ?? "application/octet-stream"),
    onError: (e) => toast.error(e.message),
  });

  const countFor = (status: string) => (data ?? []).filter(({ submission: s }) => s.status === status).length;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(({ submission: s, event }) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (q && !`${event.title} ${s.title} ${s.teamName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, filter, query]);
  const pager = usePager(filtered);

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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { id: "all", label: "All", count: data.length },
            { id: "submitted", label: "Submitted", count: countFor("submitted") },
            { id: "shortlisted", label: "Shortlisted", count: countFor("shortlisted") },
            { id: "winner", label: "Won", count: countFor("winner") },
            { id: "rejected", label: "Not selected", count: countFor("rejected") },
          ]}
        />
        <SearchBox value={query} onChange={setQuery} placeholder="Search entries…" />
      </div>

      {pager.pageItems.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No entries match your filters.</p>
      ) : (
        <div className="space-y-4">
          {pager.pageItems.map(({ submission: s, event }) => (
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
      )}

      <ListPager page={pager.page} totalPages={pager.totalPages} onPage={pager.setPage} total={filtered.length} />
    </div>
  );
}
