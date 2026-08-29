import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const tabs = [{ id: "customer", label: "Customer", icon: Users }];

export default function ExpertCustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const studentId = Number(id);
  const validId = !Number.isNaN(studentId) && studentId > 0;

  const { data, isLoading } = trpc.expertOperations.getCustomer.useQuery(
    { studentId },
    { enabled: validId }
  );

  const student = data?.student;
  const services = data?.services ?? [];
  const bookings = data?.bookings ?? [];
  const payments = data?.payments ?? [];
  const reviews = data?.reviews ?? [];

  const stats = (() => {
    const totalBookings = bookings.length;
    const totalSpent = bookings.reduce((sum, row) => {
      const amount = row.order?.amount ?? 0;
      return row.order?.status === "paid" ? sum + amount : sum;
    }, 0);
    const lastSession = bookings
      .filter((row) => row.booking.status === "completed" || row.booking.status === "confirmed")
      .map((row) => new Date(row.booking.startAt))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return { totalBookings, totalSpent, lastSession };
  })();

  const serviceUsage = (() => {
    const counts = new Map<number, { title: string; count: number }>();
    for (const service of services) {
      counts.set(service.id, { title: service.title, count: 0 });
    }
    for (const row of bookings) {
      const existing = counts.get(row.booking.serviceId);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(row.booking.serviceId, { title: row.service?.title ?? "Service", count: 1 });
      }
    }
    return Array.from(counts.values());
  })();

  return (
    <DashboardShell
      title="Customer 360"
      subtitle={student?.name ?? `Customer #${id}`}
      roles={["expert"]}
      tabs={tabs}
    >
      {() => (
        <div className="space-y-6">
          {isLoading || !validId ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : !data ? (
            <EmptyState message="Customer not found." />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-2 rounded-3xl border bg-card p-7 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-xl font-semibold">{student?.name}</h2>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {student?.email && (
                          <p className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" /> {student.email}
                          </p>
                        )}
                        {student?.phone && (
                          <p className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" /> {student.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {student?.createdAt && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Customer since {new Date(student.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <StatCard label="Total bookings" value={String(stats.totalBookings)} />
                <StatCard label="Total spent" value={formatINR(stats.totalSpent)} />
                <StatCard
                  label="Last session"
                  value={stats.lastSession ? stats.lastSession.toLocaleDateString() : "—"}
                />
              </div>

              <div className="rounded-3xl border bg-card p-7 shadow-sm">
                <h3 className="font-display text-lg font-semibold">Services used</h3>
                {serviceUsage.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No services used yet.</p>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {serviceUsage.map((service) => (
                      <Badge key={service.title} variant="secondary" className="rounded-full">
                        {service.title} · {service.count}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border bg-card p-7 shadow-sm">
                <h3 className="font-display text-lg font-semibold">Bookings</h3>
                {bookings.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No bookings yet.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {bookings.map((row) => (
                      <Link
                        key={row.booking.id}
                        to={`/expert/bookings/${row.booking.id}`}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border p-4 hover:bg-muted/40 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{row.service?.title ?? "Service"}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(row.booking.startAt).toLocaleString()}
                          </p>
                        </div>
                        <BookingStatusBadge status={row.booking.status} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border bg-card p-7 shadow-sm">
                <h3 className="font-display text-lg font-semibold">Sessions</h3>
                {bookings.filter((row) => row.session).length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No sessions yet.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {bookings
                      .filter((row) => row.session)
                      .map((row) => (
                        <div
                          key={row.session!.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border p-4"
                        >
                          <div>
                            <p className="font-medium">{row.service?.title ?? "Session"}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(row.session!.startAt).toLocaleString()}
                            </p>
                          </div>
                          <span className="text-sm capitalize text-muted-foreground">
                            {row.session!.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border bg-card p-7 shadow-sm">
                <h3 className="font-display text-lg font-semibold">Payments</h3>
                {payments.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No payments yet.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {payments.map((row) => (
                      <div
                        key={row.payment.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border p-4"
                      >
                        <div>
                          <p className="font-medium">{formatINR(row.payment.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {row.payment.provider} · {row.bookingReference ?? "—"}
                          </p>
                        </div>
                        <PaymentStatusBadge status={row.payment.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <NotesSection studentId={studentId} />

              <div className="rounded-3xl border bg-card p-7 shadow-sm">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Star className="h-5 w-5" /> Reviews
                </h3>
                {reviews.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="mt-4 space-y-4">
                    {reviews.map((row) => (
                      <div key={row.review.id} className="rounded-2xl border p-4">
                        <div className="flex items-center justify-between gap-2">
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
                        <p className="text-sm text-muted-foreground mt-1">
                          {row.review.content ?? "No content"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">{row.serviceTitle}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border bg-card p-12 text-center">
      <p className="text-muted-foreground">{message}</p>
      <Button asChild variant="link" className="mt-2 text-orange-600">
        <Link to="/expert/customers">Back to customers</Link>
      </Button>
    </div>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const variant =
    status === "confirmed"
      ? "default"
      : status === "completed"
        ? "secondary"
        : status === "cancelled" || status === "no_show"
          ? "destructive"
          : "outline";

  return (
    <Badge
      variant={variant}
      className={cn("capitalize", status === "confirmed" && "bg-orange-500 hover:bg-orange-500")}
    >
      {status.replace("_", " ")}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const variant =
    status === "success" ? "secondary" : status === "failed" ? "destructive" : "outline";
  return (
    <Badge variant={variant} className="capitalize">
      {status}
    </Badge>
  );
}

function NotesSection({ studentId }: { studentId: number }) {
  const [content, setContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const { data, isLoading, refetch } = trpc.expertOperations.listNotes.useQuery({
    studentId,
    page: 1,
    pageSize: 50,
  });

  const createMutation = trpc.expertOperations.createNote.useMutation({
    onSuccess: () => {
      toast.success("Note added");
      setContent("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.expertOperations.updateNote.useMutation({
    onSuccess: () => {
      toast.success("Note updated");
      setEditingNoteId(null);
      setEditContent("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.expertOperations.deleteNote.useMutation({
    onSuccess: () => {
      toast.success("Note deleted");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const notes = data?.notes ?? [];

  function createNote() {
    if (!content.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    createMutation.mutate({ studentId, content: content.trim() });
  }

  function saveEdit(noteId: number) {
    if (!editContent.trim()) {
      toast.error("Note cannot be empty");
      return;
    }
    updateMutation.mutate({ id: noteId, content: editContent.trim() });
  }

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <h3 className="font-display text-lg font-semibold">Notes</h3>
      <div className="mt-4 space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note about this customer…"
          rows={3}
          className="rounded-xl"
        />
        <Button
          className="rounded-full"
          disabled={createMutation.isPending || !content.trim()}
          onClick={createNote}
        >
          {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add note
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-32 rounded-2xl mt-6" />
      ) : notes.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {notes.map((row) => (
            <div key={row.note.id} className="rounded-2xl border p-4">
              {editingNoteId === row.note.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="rounded-xl"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={updateMutation.isPending}
                      onClick={() => saveEdit(row.note.id)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setEditingNoteId(null);
                        setEditContent("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm whitespace-pre-wrap">{row.note.content}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {new Date(row.note.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingNoteId(row.note.id);
                          setEditContent(row.note.content);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteMutation.mutate({ id: row.note.id })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
