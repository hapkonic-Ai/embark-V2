import { useMemo, useState } from "react";
import { Link } from "react-router";
import { format } from "date-fns";
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Compass,
  CreditCard,
  Filter,
  Search,
  Star,
  X,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "one_on_one", label: "1:1 Session" },
  { value: "review", label: "Review" },
  { value: "consultation", label: "Consultation" },
  { value: "mentorship", label: "Mentorship" },
];

const SERVICE_TYPE_LABELS: Record<string, string> = {
  one_on_one: "1:1 Session",
  review: "Review",
  consultation: "Consultation",
  mentorship: "Mentorship",
};

function statusBadge(status: string) {
  switch (status) {
    case "confirmed":
    case "completed":
      return <Badge className="bg-green-100 text-green-700 border-0">{status}</Badge>;
    case "pending":
      return <Badge variant="secondary">pending</Badge>;
    case "cancelled":
      return <Badge variant="destructive">cancelled</Badge>;
    case "no_show":
      return <Badge variant="outline">no show</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function MyBookings() {
  const { data, isLoading } = trpc.booking.listForStudent.useQuery();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [serviceType, setServiceType] = useState("all");

  const filtered = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((row) => {
      const hay = `${row.serviceTitle} ${row.expertName}`.toLowerCase();
      const matchesQ = hay.includes(q.toLowerCase());
      const matchesStatus = status === "all" || row.booking.status === status;
      const matchesType = serviceType === "all" || row.serviceType === serviceType;
      return matchesQ && matchesStatus && matchesType;
    });
  }, [data, q, status, serviceType]);

  const activeFilters = (status !== "all" ? 1 : 0) + (serviceType !== "all" ? 1 : 0) + (q ? 1 : 0);

  function clearFilters() {
    setQ("");
    setStatus("all");
    setServiceType("all");
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-28 pb-16">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-28 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">My bookings</h1>
            <p className="mt-1 text-muted-foreground">
              Track, filter, and manage every session you have booked.
            </p>
          </div>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/dashboard">
              <CreditCard className="mr-1.5 h-4 w-4" /> Orders & payments
            </Link>
          </Button>
        </div>

        <div className="rounded-3xl border bg-card p-5 shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by mentor or service…"
                className="pl-9 rounded-full"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" /> Filter by
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="rounded-full w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger className="rounded-full w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeFilters > 0 && (
                <Button variant="ghost" size="sm" className="rounded-full" onClick={clearFilters}>
                  <X className="mr-1.5 h-4 w-4" /> Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {!data || data.length === 0 ? (
          <div className="rounded-3xl border bg-card p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
              <Compass className="h-8 w-8" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">No bookings yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Discover a verified mentor and book your first session.
            </p>
            <Button className="mt-6 rounded-full" asChild>
              <Link to="/mentors">Browse mentors <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border bg-card p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Filter className="h-8 w-8" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold">No matches</h3>
            <p className="mt-2 text-sm text-muted-foreground">Try clearing your filters.</p>
            <Button className="mt-6 rounded-full" variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(({ booking, expertName, serviceTitle, serviceType }) => {
              const start = new Date(booking.startAt);
              const end = new Date(booking.endAt);
              return (
                <Link
                  key={booking.id}
                  to={`/dashboard/orders/${booking.id}`}
                  className="block rounded-3xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-semibold">{serviceTitle}</h3>
                        {statusBadge(booking.status)}
                        {booking.status === "completed" && (
                          <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                            <Star className="mr-1 h-3 w-3" /> Review
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">with {expertName}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" /> {format(start, "PPP")}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" /> {format(start, "p")} — {format(end, "p")}
                        </span>
                        <span className="flex items-center gap-1.5 capitalize">
                          <Check className="h-4 w-4" /> {SERVICE_TYPE_LABELS[serviceType] ?? serviceType.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-full flex-shrink-0">
                      View details <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
