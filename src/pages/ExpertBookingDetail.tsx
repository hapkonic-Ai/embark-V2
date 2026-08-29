import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import DashboardShell from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const tabs = [{ id: "detail", label: "Booking detail", icon: CalendarDays }];

export default function ExpertBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const bookingId = Number(id);
  const validId = !Number.isNaN(bookingId) && bookingId > 0;

  const { data, isLoading, refetch } = trpc.expertOperations.getBooking.useQuery(
    { id: bookingId },
    { enabled: validId }
  );

  const canReschedule = data?.booking?.status === "confirmed" || data?.booking?.status === "pending";
  const canCancel =
    data?.booking?.status !== "cancelled" &&
    data?.booking?.status !== "completed" &&
    data?.booking?.status !== "no_show";
  const canComplete = data?.booking?.status === "confirmed";

  const durationMinutes = data?.service?.durationMinutes ?? 0;
  const durationText = durationMinutes > 0 ? `${durationMinutes} min` : "—";

  return (
    <DashboardShell
      title="Booking detail"
      subtitle={data?.booking ? `Booking ${data.booking.bookingReference}` : `Booking #${id}`}
      roles={["expert"]}
      tabs={tabs}
    >
      {() => {
        if (isLoading || !validId) return <Skeleton className="h-96 rounded-2xl" />;
        if (!data?.booking) return <EmptyState message="Booking not found." />;
        const { booking, session, order, service, student } = data;
        const whatsappAccess = data.whatsappAccess;
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border bg-card p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold">{student?.name ?? "Student"}</h2>
                    <BookingStatusBadge status={booking.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{service?.title}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canReschedule && (
                      <RescheduleDialog
                        bookingId={booking.id}
                        currentStart={booking.startAt}
                        durationMinutes={durationMinutes}
                        onSuccess={refetch}
                      />
                    )}
                    {canCancel && (
                      <CancelDialog
                        bookingId={booking.id}
                        studentName={student?.name}
                        onSuccess={refetch}
                      />
                    )}
                    {canComplete && (
                      <CompleteDialog
                        bookingId={booking.id}
                        studentName={student?.name}
                        onSuccess={refetch}
                      />
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  <MetadataItem label="Date & time">
                    {new Date(booking.startAt).toLocaleString()} ({booking.timezone})
                  </MetadataItem>
                  <MetadataItem label="Duration">{durationText}</MetadataItem>
                  <MetadataItem label="Reference">{booking.bookingReference}</MetadataItem>
                  <MetadataItem label="Price">
                    {formatINR(Number(order?.amount ?? service?.price ?? 0))}
                  </MetadataItem>
                  <MetadataItem label="Session status">
                    {session ? <span className="capitalize">{session.status}</span> : "—"}
                  </MetadataItem>
                  <MetadataItem label="Order status">
                    {order ? <span className="capitalize">{order.status}</span> : "—"}
                  </MetadataItem>
                </div>

                {booking.meetingUrl && (
                  <div className="mt-4">
                    <a
                      href={booking.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" /> Join meeting
                    </a>
                  </div>
                )}
              </div>

              {!!booking.intakeResponses && Object.keys(booking.intakeResponses).length > 0 && (
                <div className="rounded-3xl border bg-card p-7 shadow-sm">
                  <h3 className="font-display text-lg font-semibold">Intake responses</h3>
                  <div className="mt-4 space-y-3">
                    {Object.entries(booking.intakeResponses as Record<string, unknown>).map(
                      ([key, value]) => (
                        <div key={key} className="text-sm">
                          <p className="font-medium capitalize">{key.replace(/_/g, " ")}</p>
                          <p className="text-muted-foreground mt-0.5">
                            {Array.isArray(value) ? value.join(", ") : String(value ?? "—")}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              <WhatsAppCard access={whatsappAccess} />

              {booking && student && (
                <NotesSection bookingId={booking.id} studentId={student.id} />
              )}
          </div>
        );
      }}
    </DashboardShell>
  );
}

function MetadataItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 font-medium">{children}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border bg-card p-12 text-center">
      <p className="text-muted-foreground">{message}</p>
      <Button asChild variant="link" className="mt-2 text-orange-600">
        <Link to="/expert/bookings">Back to bookings</Link>
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

function WhatsAppCard({
  access,
}: {
  access: { mode: string; isEligible: boolean; directNumber?: string | null; groupInviteUrl?: string | null } | undefined;
}) {
  if (!access || access.mode === "none") {
    return (
      <div className="rounded-3xl border bg-card p-7 shadow-sm">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" /> WhatsApp access
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          WhatsApp communication is not enabled for this service.
        </p>
      </div>
    );
  }

  const policyReason =
    access.mode === "group" || access.mode === "direct_and_group"
      ? "Group invite unlocks after payment/completion."
      : "WhatsApp access unlocks after payment/completion.";

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <h3 className="font-display text-lg font-semibold flex items-center gap-2">
        <MessageCircle className="h-5 w-5" /> WhatsApp access
      </h3>

      {!access.isEligible ? (
        <p className="text-sm text-muted-foreground mt-2">{policyReason}</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(access.mode === "direct" || access.mode === "direct_and_group") && access.directNumber && (
            <div className="rounded-2xl border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Direct number</p>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href={`https://wa.me/${access.directNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-orange-600 hover:underline"
                >
                  {access.directNumber}
                </a>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-full"
                asChild
              >
                <a
                  href={`https://wa.me/${access.directNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Open WhatsApp
                </a>
              </Button>
            </div>
          )}
          {(access.mode === "group" || access.mode === "direct_and_group") && access.groupInviteUrl && (
            <div className="rounded-2xl border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Group invite</p>
              <p className="mt-1 text-sm font-medium truncate">{access.groupInviteUrl}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-full"
                asChild
              >
                <a href={access.groupInviteUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Join group
                </a>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RescheduleDialog({
  bookingId,
  currentStart,
  durationMinutes,
  onSuccess,
}: {
  bookingId: number;
  currentStart: Date | string;
  durationMinutes: number;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [startValue, setStartValue] = useState(toDateTimeLocal(currentStart));
  const [endValue, setEndValue] = useState("");

  const mutation = trpc.expertOperations.rescheduleBooking.useMutation({
    onSuccess: () => {
      toast.success("Booking rescheduled");
      setOpen(false);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  function applyDurationToEnd() {
    const start = new Date(startValue);
    if (Number.isNaN(start.getTime()) || durationMinutes <= 0) return;
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    setEndValue(toDateTimeLocal(end));
  }

  function submit() {
    const start = new Date(startValue);
    const end = new Date(endValue);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      toast.error("Please enter valid start and end times.");
      return;
    }
    mutation.mutate({
      bookingId,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Clock className="mr-1.5 h-4 w-4" /> Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Reschedule booking</DialogTitle>
          <DialogDescription>
            Pick a new start and end time. The slot must match the service duration and be available.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="reschedule-start">Start</Label>
            <Input
              id="reschedule-start"
              type="datetime-local"
              value={startValue}
              onChange={(e) => setStartValue(e.target.value)}
              onBlur={applyDurationToEnd}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="reschedule-end">End</Label>
              {durationMinutes > 0 && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-orange-600"
                  onClick={applyDurationToEnd}
                >
                  Set +{durationMinutes} min
                </Button>
              )}
            </div>
            <Input
              id="reschedule-end"
              type="datetime-local"
              value={endValue}
              onChange={(e) => setEndValue(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button className="rounded-full" disabled={mutation.isPending} onClick={submit}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({
  bookingId,
  studentName,
  onSuccess,
}: {
  bookingId: number;
  studentName?: string | null;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const mutation = trpc.expertOperations.cancelBooking.useMutation({
    onSuccess: () => {
      toast.success("Booking cancelled");
      setOpen(false);
      setReason("");
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full text-destructive hover:text-destructive">
          <X className="mr-1.5 h-4 w-4" /> Cancel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Cancel booking</DialogTitle>
          <DialogDescription>
            This will cancel the booking{studentName ? ` for ${studentName}` : ""}. The student will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="cancel-reason">Reason (optional)</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Schedule conflict"
            rows={3}
            className="rounded-xl"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
            Keep booking
          </Button>
          <Button
            variant="destructive"
            className="rounded-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ bookingId, reason: reason || undefined })}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompleteDialog({
  bookingId,
  studentName,
  onSuccess,
}: {
  bookingId: number;
  studentName?: string | null;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);

  const mutation = trpc.expertOperations.completeBooking.useMutation({
    onSuccess: () => {
      toast.success("Booking marked as completed");
      setOpen(false);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full">
          <Check className="mr-1.5 h-4 w-4" /> Complete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Complete booking</DialogTitle>
          <DialogDescription>
            Mark this booking as completed{studentName ? ` for ${studentName}` : ""}?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
            Not yet
          </Button>
          <Button
            className="rounded-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ bookingId })}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, complete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NotesSection({ bookingId, studentId }: { bookingId: number; studentId: number }) {
  const [content, setContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const { data, isLoading, refetch } = trpc.expertOperations.listNotes.useQuery({
    bookingId,
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
    createMutation.mutate({ studentId, bookingId, content: content.trim() });
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
          placeholder="Add a note about this booking…"
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

function toDateTimeLocal(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
