import { Link } from "react-router";
import { CalendarDays, CheckCircle2, Clock, LayoutDashboard, XCircle } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import DashboardShell from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CampusDashboard() {
  const { user } = useAuth();
  return (
    <DashboardShell
      title={`Hey, ${user?.name?.split(" ")[0] ?? "there"}`}
      subtitle="Manage guest lecture invites for your campus."
      roles={["campus"]}
      tabs={[
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "requests", label: "Guest Lectures", icon: CalendarDays },
      ]}
    >
      {(tab) => (tab === "overview" ? <Overview /> : <RequestsTab />)}
    </DashboardShell>
  );
}

function Overview() {
  const { data, isLoading } = trpc.campus.myRequests.useQuery();
  const counts = {
    pending: data?.filter((r) => r.request.status === "pending").length ?? 0,
    accepted: data?.filter((r) => r.request.status === "accepted").length ?? 0,
    rejected: data?.filter((r) => r.request.status === "rejected").length ?? 0,
  };

  const cards = [
    { label: "Pending invites", value: counts.pending, icon: Clock, color: "text-amber-600" },
    { label: "Confirmed", value: counts.accepted, icon: CheckCircle2, color: "text-green-600" },
    { label: "Declined", value: counts.rejected, icon: XCircle, color: "text-red-600" },
  ];

  if (isLoading) return <Skeleton className="h-40 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-3xl font-bold">{c.value}</div>
                <div className="text-sm text-muted-foreground">{c.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border bg-card p-7 shadow-sm">
        <h3 className="font-display font-semibold text-lg">How it works</h3>
        <ol className="mt-4 space-y-3 text-sm text-muted-foreground list-decimal list-inside">
          <li>Browse verified mentors on the <Link to="/guest-lecturer" className="text-orange-600 hover:underline">Guest Lecturer</Link> page.</li>
          <li>Send an invite with your preferred date and topic.</li>
          <li>The mentor accepts or rejects and confirms the final date.</li>
        </ol>
      </div>
    </div>
  );
}

function RequestsTab() {
  const { data, isLoading } = trpc.campus.myRequests.useQuery();

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!data || data.length === 0) {
    return (
      <div className="rounded-3xl border bg-card p-12 text-center">
        <h3 className="font-display text-xl font-semibold">No invites yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">Start by inviting a mentor to your campus.</p>
        <Button className="mt-5 rounded-full" asChild>
          <Link to="/guest-lecturer">Browse mentors</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map(({ request, mentorName, profile }) => {
        const statusMeta = {
          pending: { label: "Pending", cls: "bg-amber-100 text-amber-700" },
          accepted: { label: "Accepted", cls: "bg-green-100 text-green-700" },
          rejected: { label: "Declined", cls: "bg-red-100 text-red-700" },
        }[request.status];
        const date = request.confirmedDate ?? request.proposedDate;
        return (
          <div key={request.id} className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={`https://i.pravatar.cc/120?u=${profile.id}`}
                  alt={mentorName ?? ""}
                  className="h-14 w-14 rounded-2xl object-cover"
                  onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mentorName ?? "EM")}&background=f97316&color=fff`; }}
                />
                <div>
                  <h3 className="font-display font-semibold text-lg">{mentorName}</h3>
                  <p className="text-sm text-orange-600">{profile.bschool}</p>
                </div>
              </div>
              <Badge className={statusMeta.cls}>{statusMeta.label}</Badge>
            </div>
            {date && (
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Date:</span> {new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
            {request.campusNote && (
              <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Your note:</span> {request.campusNote}</p>
            )}
            {request.mentorNote && (
              <p className="mt-2 text-sm text-muted-foreground border-l-2 border-orange-400 pl-3">{request.mentorNote}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
