import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Search,
  Users,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";

const PAGE_SIZE = 10;

const tabs = [{ id: "customers", label: "Customers", icon: Users }];

export default function ExpertCustomers() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  const { data, isLoading } = trpc.expertOperations.listCustomers.useQuery({
    page,
    pageSize: PAGE_SIZE,
    query: debouncedQuery || undefined,
  });

  const customers = data?.customers ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <DashboardShell
      title="Customers"
      subtitle="Manage your customer relationships."
      roles={["expert"]}
      tabs={tabs}
    >
      {() => (
        <div className="space-y-6">
          <div className="rounded-3xl border bg-card p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold">All customers</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLoading ? "Loading…" : `${total} customer${total === 1 ? "" : "s"} found`}
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email or phone…"
                  className="pl-9 rounded-full w-full"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {isLoading ? (
              <Skeleton className="h-64 rounded-2xl mt-6" />
            ) : customers.length === 0 ? (
              <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground">No customers found.</p>
                <Button asChild variant="link" className="mt-2 text-orange-600">
                  <Link to="/expert/dashboard">Back to dashboard</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {customers.map((customer) => (
                  <Link
                    key={customer.studentId}
                    to={`/expert/customers/${customer.studentId}`}
                    className="group rounded-2xl border p-5 hover:border-orange-500/50 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-medium truncate">{customer.name}</h3>
                        <div className="mt-1.5 space-y-1 text-sm text-muted-foreground">
                          {customer.email && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 truncate">
                              <Phone className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-lg font-semibold">{customer.bookingCount}</p>
                        <p className="text-xs text-muted-foreground">bookings</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total spent</span>
                      <span className="font-medium">{formatINR(customer.totalSpent)}</span>
                    </div>
                    {customer.lastBookingAt && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Last booking: {new Date(customer.lastBookingAt).toLocaleDateString()}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {!isLoading && customers.length > 0 && (
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
