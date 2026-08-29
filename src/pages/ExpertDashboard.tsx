import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Package,
  Plus,
  Settings,
  Star,
  Users,
  Wallet,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, Navigate } from "react-router";

export default function ExpertDashboard() {
  const { data, isLoading } = trpc.expert.me.useQuery();
  if (isLoading) return null;
  const onboardingCompleted = data?.onboarding?.status === "completed";
  const verificationSubmitted = data?.verification?.status === "pending" || data?.verification?.status === "approved";
  if (!onboardingCompleted && !verificationSubmitted) {
    return <Navigate to="/expert/onboarding" replace />;
  }

  return (
    <DashboardShell
      title="Expert dashboard"
      subtitle="Your profile, services, bookings and earnings."
      roles={["expert"]}
      tabs={[
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "page", label: "My Page", icon: Globe },
        { id: "profile", label: "Profile", icon: Settings },
        { id: "services", label: "Services", icon: Package },
        { id: "calendar", label: "Calendar", icon: CalendarDays },
        { id: "bookings", label: "Bookings", icon: BookOpen },
        { id: "customers", label: "Customers", icon: Users },
        { id: "reviews", label: "Reviews", icon: Star },
        { id: "earnings", label: "Earnings", icon: Wallet },
      ]}
    >
      {(tab) => (
        <>
          {tab === "overview" && <OverviewTab />}
          {tab === "page" && <MyPageTab />}
          {tab === "profile" && <ProfileTab />}
          {tab === "services" && <ServicesTab />}
          {tab === "calendar" && <CalendarTab />}
          {tab === "bookings" && <BookingsTab />}
          {tab === "customers" && <CustomersTab />}
          {tab === "reviews" && <ReviewsTab />}
          {tab === "earnings" && <PlaceholderTab title="Earnings" subtitle="Wallet and payouts are coming in Phase 2." />}
        </>
      )}
    </DashboardShell>
  );
}

function OverviewTab() {
  const { data, isLoading } = trpc.expert.me.useQuery();

  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />;

  const completion = data?.completion;
  const verification = data?.verification;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Welcome back, {data?.user.name || "Expert"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Here is your onboarding and verification status.
            </p>
          </div>
          <Badge
            className={
              verification?.status === "approved"
                ? "bg-green-100 text-green-700"
                : verification?.status === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : verification?.status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-stone-100 text-stone-600"
            }
          >
            {verification?.status ?? "not_started"}
          </Badge>
        </div>

        {completion && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Profile completion</span>
              <span className="text-muted-foreground">{completion.percentage}%</span>
            </div>
            <Progress value={completion.percentage} className="h-2" />
            <div className="mt-4 flex flex-wrap gap-2">
              {completion.missingRequiredSections.map((s: string) => (
                <span key={s} className="text-xs rounded-full bg-orange-50 text-orange-700 px-2.5 py-1">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <Link to="/expert/profile/edit">Edit profile</Link>
          </Button>
          {completion && completion.percentage < 100 && (
            <Button variant="outline" asChild className="rounded-full">
              <Link to="/expert/onboarding">Continue onboarding</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Profile views" value="—" subtitle="Coming in Phase 2" />
        <BookingsStatCard />
        <ReviewsStatCard />
      </div>
    </div>
  );
}

function BookingsStatCard() {
  const { data, isLoading } = trpc.expertOperations.listBookings.useQuery({ page: 1, pageSize: 1 });

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">Bookings</p>
      <p className="mt-2 font-display text-2xl font-bold">
        {isLoading ? "—" : data?.total ?? 0}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Total bookings</p>
      <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
        <Link to="/expert/bookings">
          View bookings <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function ReviewsStatCard() {
  const { data, isLoading } = trpc.expertOperations.reviewSummary.useQuery();

  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">Reviews</p>
      <p className="mt-2 font-display text-2xl font-bold">
        {isLoading ? "—" : data?.reviewCount ?? 0}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {isLoading ? "—" : `${(data?.averageRating ?? 0).toFixed(1)} average rating`}
      </p>
      <Button asChild variant="outline" size="sm" className="mt-4 rounded-full">
        <Link to="/expert/reviews">
          View reviews <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function ProfileTab() {
  const { data, isLoading } = trpc.expert.myProfile.useQuery();
  const { data: me, isLoading: meLoading } = trpc.expert.me.useQuery();
  const { data: pageData, isLoading: pageLoading } = trpc.expertPage.myPage.useQuery();

  if (isLoading || meLoading || pageLoading) return <Skeleton className="h-96 rounded-3xl" />;
  const profile = data?.profile;
  const verification = me?.verification;
  const isVerified =
    verification?.status === "approved" ||
    profile?.verificationStatus === "verified";
  const page = pageData?.page;
  const publicUrl = page?.slug ? `${window.location.origin}/m/${page.slug}` : null;

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-display text-lg font-semibold">Public profile</h3>
          {isVerified ? (
            <Badge className="bg-green-100 text-green-700 border-0">
              <Check className="mr-1 h-3 w-3" /> Verified
            </Badge>
          ) : verification?.status === "pending" ? (
            <Badge className="bg-amber-100 text-amber-700 border-0">Pending review</Badge>
          ) : verification?.status === "rejected" ? (
            <Badge className="bg-red-100 text-red-700 border-0">Rejected</Badge>
          ) : (
            <Badge variant="secondary">Not verified</Badge>
          )}
        </div>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/expert/profile/edit">Edit</Link>
        </Button>
      </div>
      <div className="mt-4 space-y-2 text-sm">
        <ProfileRow label="Display name" value={profile?.displayName} />
        <ProfileRow label="Headline" value={profile?.headline} />
        <ProfileRow label="Location" value={profile?.location} />
        <ProfileRow label="Expertise" value={profile?.expertise} />
      </div>
      {publicUrl ? (
        <div className="mt-6 p-4 rounded-2xl bg-muted/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Public page</p>
            <p className="text-sm text-muted-foreground break-all">{publicUrl}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full" asChild>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View
              </a>
            </Button>
            <Button size="sm" className="rounded-full" asChild>
              <Link to="/expert/page">Manage page</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 p-4 rounded-2xl bg-muted/40">
          <p className="text-sm font-medium">Public page</p>
          <p className="text-sm text-muted-foreground">
            Your public page slug will be created when you open the page builder.
          </p>
        </div>
      )}
    </div>
  );
}

function MyPageTab() {
  return (
    <div className="rounded-3xl border bg-card p-12 text-center">
      <h3 className="font-display text-xl font-semibold">My public expert page</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
        Customize your sections, theme, and branding, then publish your public page.
      </p>
      <div className="mt-6">
        <Button asChild className="rounded-full">
          <Link to="/expert/page">Open page builder</Link>
        </Button>
      </div>
    </div>
  );
}

function ServicesTab() {
  const { data, isLoading } = trpc.expertServices.listMyServices.useQuery();

  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />;

  const services = data ?? [];
  const published = services.filter((s) => s.status === "published");
  const drafts = services.filter((s) => s.status === "draft");

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Your services</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {services.length === 0
                ? "Create a service so students can discover and book you."
                : `${published.length} published · ${drafts.length} draft${drafts.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <Button asChild className="rounded-full">
            <Link to="/expert/services">
              <Plus className="mr-1.5 h-4 w-4" /> Manage services
            </Link>
          </Button>
        </div>

        {services.length === 0 ? (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">No services yet.</p>
            <Button className="mt-4 rounded-full" asChild>
              <Link to="/expert/services/new">Create your first service</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 3).map((s) => (
              <div key={s.id} className="rounded-2xl border p-4">
                <p className="font-medium truncate">{s.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {s.status === "published" ? "Published" : s.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarTab() {
  const { data, isLoading } = trpc.expertCalendar.listBookings.useQuery();
  const upcoming = data?.filter((b) => new Date(b.booking.startAt) > new Date()) ?? [];

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Calendar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? "Loading…"
              : upcoming.length === 0
                ? "No upcoming bookings."
                : `${upcoming.length} upcoming booking${upcoming.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/expert/calendar">Manage availability</Link>
        </Button>
      </div>
    </div>
  );
}

function BookingsTab() {
  const { data, isLoading } = trpc.expertCalendar.listBookings.useQuery();
  const upcoming = data
    ?.filter((b) => new Date(b.booking.startAt) > new Date())
    .sort((a, b) => new Date(a.booking.startAt).getTime() - new Date(b.booking.startAt).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Upcoming bookings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "Loading…" : `${upcoming?.length ?? 0} upcoming`}
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/expert/bookings">View all bookings</Link>
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 rounded-2xl mt-6" />
      ) : !upcoming || upcoming.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">No upcoming bookings.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {upcoming.map((row) => (
            <Link
              key={row.booking.id}
              to={`/expert/bookings/${row.booking.id}`}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border p-4 hover:bg-muted/40 transition-colors"
            >
              <div>
                <p className="font-medium">{row.studentName ?? "Student"}</p>
                <p className="text-sm text-muted-foreground">{row.serviceTitle ?? "Service"}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(row.booking.startAt).toLocaleString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomersTab() {
  const { data, isLoading } = trpc.expertOperations.listCustomers.useQuery({
    page: 1,
    pageSize: 5,
  });
  const customers = data?.customers ?? [];

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Recent customers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "Loading…" : `${data?.total ?? 0} total customers`}
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/expert/customers">View all customers</Link>
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 rounded-2xl mt-6" />
      ) : customers.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted-foreground">No customers yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {customers.map((customer) => (
            <Link
              key={customer.studentId}
              to={`/expert/customers/${customer.studentId}`}
              className="flex items-center justify-between gap-3 rounded-2xl border p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{customer.name}</p>
                <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display text-lg font-semibold">{customer.bookingCount}</p>
                <p className="text-xs text-muted-foreground">bookings</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsTab() {
  const { data, isLoading } = trpc.expertOperations.reviewSummary.useQuery();

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Reviews</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? "Loading…"
              : `${data?.reviewCount ?? 0} review${(data?.reviewCount ?? 0) === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/expert/reviews">View all reviews</Link>
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 rounded-2xl mt-6" />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border p-4">
            <p className="text-sm text-muted-foreground">Average rating</p>
            <p className="mt-2 font-display text-2xl font-bold">
              {(data?.averageRating ?? 0).toFixed(1)}
            </p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="text-sm text-muted-foreground">Total reviews</p>
            <p className="mt-2 font-display text-2xl font-bold">{data?.reviewCount ?? 0}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderTab({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border bg-card p-12 text-center">
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{subtitle}</p>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-1 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
