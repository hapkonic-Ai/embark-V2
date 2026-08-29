import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { trpc } from "@/providers/trpc";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const tabs = [{ id: "reviews", label: "Reviews", icon: Star }];

export default function ExpertReviews() {
  const [serviceId, setServiceId] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: summary, isLoading: summaryLoading } = trpc.expertOperations.reviewSummary.useQuery();
  const { data: services, isLoading: servicesLoading } = trpc.expertServices.listMyServices.useQuery();
  const { data, isLoading } = trpc.expertOperations.listReviews.useQuery({
    page,
    pageSize: PAGE_SIZE,
    serviceId: serviceId === "all" ? undefined : Number(serviceId),
  });

  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <DashboardShell
      title="Reviews"
      subtitle="Student feedback for your services."
      roles={["expert"]}
      tabs={tabs}
    >
      {() => (
        <div className="space-y-6">
          <div className="rounded-3xl border bg-card p-7 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold">Average rating</h2>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-48 mt-1" />
                ) : (
                  <div className="mt-1 flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-5 w-5",
                            i < Math.round(summary?.averageRating ?? 0)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {(summary?.averageRating ?? 0).toFixed(1)}
                      </span>{" "}
                      · {summary?.reviewCount ?? 0} review
                      {(summary?.reviewCount ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                )}
              </div>

              <div className="w-full sm:w-64">
                <Select
                  value={serviceId}
                  onValueChange={(value) => {
                    setServiceId(value);
                    setPage(1);
                  }}
                  disabled={servicesLoading}
                >
                  <SelectTrigger className="rounded-full w-full">
                    <SelectValue placeholder="Filter by service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All services</SelectItem>
                    {(services ?? []).map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-7 shadow-sm">
            <h3 className="font-display text-lg font-semibold">Recent reviews</h3>

            {isLoading ? (
              <Skeleton className="h-64 rounded-2xl mt-6" />
            ) : reviews.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">No reviews yet.</p>
            ) : (
              <>
                <div className="mt-6 space-y-4">
                  {reviews.map((row) => (
                    <div key={row.review.id} className="rounded-2xl border p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < row.review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(row.review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-2 font-medium">{row.review.title ?? "Review"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {row.review.content ?? "No content"}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted px-2.5 py-1">{row.studentName}</span>
                        <span className="rounded-full bg-muted px-2.5 py-1">{row.serviceTitle}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
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
              </>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
