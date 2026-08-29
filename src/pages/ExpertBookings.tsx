import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const tabs = [{ id: "bookings", label: "Bookings", icon: CalendarDays }];

const statusOptions = [
  { value: "all", label: "All status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No-show" },
];

export default function ExpertBookings() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  const { data, isLoading } = trpc.expertOperations.listBookings.useQuery({
    page,
    pageSize: PAGE_SIZE,
    query: debouncedQuery || undefined,
    status: status === "all" ? undefined : (status as "pending" | "confirmed" | "completed" | "cancelled" | "no_show"),
  });

  const bookings = data?.bookings ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <DashboardShell
      title="Bookings"
      subtitle="Manage your sessions and reservations."
      roles={["expert"]}
      tabs={tabs}
    >
      {() => (
        <div className="space-y-6">
          <div className="rounded-3xl border bg-card p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold">All bookings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLoading ? "Loading…" : `${total} booking${total === 1 ? "" : "s"} found`}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search customer, service, reference…"
                    className="pl-9 rounded-full w-full sm:w-72"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 rounded-full border bg-background px-3 text-sm w-full sm:w-auto"
                >
                  {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <Skeleton className="h-64 rounded-2xl mt-6" />
            ) : bookings.length === 0 ? (
              <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground">No bookings found.</p>
                <Button
                  variant="link"
                  onClick={() => navigate("/expert/dashboard")}
                  className="mt-2 text-orange-600"
                >
                  Back to dashboard
                </Button>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto -mx-7 px-7">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-3 font-medium">Student</th>
                      <th className="py-3 font-medium">Service</th>
                      <th className="py-3 font-medium">Date & time</th>
                      <th className="py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bookings.map((row) => (
                      <tr
                        key={row.booking.id}
                        onClick={() => navigate(`/expert/bookings/${row.booking.id}`)}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-3.5 font-medium">{row.studentName}</td>
                        <td className="py-3.5 text-muted-foreground">{row.serviceTitle}</td>
                        <td className="py-3.5 text-muted-foreground">
                          {new Date(row.booking.startAt).toLocaleString()}
                        </td>
                        <td className="py-3.5">
                          <StatusBadge status={row.booking.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isLoading && bookings.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "confirmed"
      ? "default"
      : status === "completed"
        ? "secondary"
        : status === "cancelled" || status === "no_show"
          ? "destructive"
          : "outline";

  return (
    <Badge variant={variant} className={cn("capitalize", status === "confirmed" && "bg-orange-500 hover:bg-orange-500")}>
      {status.replace("_", "-")}
    </Badge>
  );
}
