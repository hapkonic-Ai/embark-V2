import { useState } from "react";
import { Link, useParams } from "react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Monitor,
  Phone,
  Star,
  Users,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatINR } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  paid: "Paid",
  pending: "Pending",
  cancelled: "Cancelled",
  no_show: "No show",
};

const statusBadge = (status: string) => {
  const label = STATUS_LABELS[status] ?? status;
  switch (status) {
    case "confirmed":
    case "completed":
      return <Badge className="bg-green-100 text-green-700 border-0">{label}</Badge>;
    case "paid":
      return <Badge className="bg-green-100 text-green-700 border-0">{label}</Badge>;
    case "pending":
      return <Badge variant="secondary">{label}</Badge>;
    case "cancelled":
      return <Badge variant="destructive">{label}</Badge>;
    case "no_show":
      return <Badge variant="outline">{label}</Badge>;
    default:
      return <Badge variant="secondary">{label}</Badge>;
  }
};

export default function StudentBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const bookingId = Number(id);
  const { data, isLoading } = trpc.booking.getById.useQuery(
    { id: bookingId },
    { enabled: !isNaN(bookingId) },
  );
  const utils = trpc.useUtils();
  const pay = trpc.payments.simulatePay.useMutation({
    onSuccess: () => {
      toast.success("Payment successful");
      utils.booking.getById.invalidate({ id: bookingId });
      utils.payments.myOrders.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: canReview } = trpc.reviews.canReview.useQuery(
    { bookingId },
    { enabled: !isNaN(bookingId) && data?.booking.status === "completed" }
  );

  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");

  const review = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Review submitted");
      setReviewOpen(false);
      setRating(0);
      setReviewTitle("");
      setReviewContent("");
      utils.booking.getById.invalidate({ id: bookingId });
      utils.reviews.canReview.invalidate({ bookingId });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 pt-28 pb-16">
          <Skeleton className="h-[70vh] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-muted/40">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 text-center">
          <h1 className="font-display text-3xl font-bold">Booking not found</h1>
          <p className="mt-2 text-muted-foreground">This booking does not exist or you cannot view it.</p>
          <Button className="mt-6 rounded-full" asChild>
            <Link to="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { booking, session, order, payment, expertName, serviceTitle } = data;
  const start = new Date(booking.startAt);
  const end = new Date(booking.endAt);
  const snapshot = (booking.serviceSnapshot ?? {}) as {
    title?: string;
    price?: number;
    currency?: string;
    durationMinutes?: number;
    deliveryMode?: string;
    communicationMode?: string | null;
    whatsappDirectNumber?: string | null;
    whatsappGroupInviteUrl?: string | null;
    whatsappGroupAccessPolicy?: string | null;
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-28 pb-16">
        <Button variant="ghost" className="rounded-full mb-6" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard
          </Link>
        </Button>

        <div className="rounded-3xl border bg-card p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold">
                {serviceTitle || snapshot.title || "Booking"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">with {expertName || "your mentor"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {statusBadge(booking.status)}
                {order && statusBadge(order.status)}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="font-display text-2xl font-bold">
                {formatINR(order?.amount ?? snapshot.price ?? 0)}
              </div>
              <p className="text-sm text-muted-foreground">{order ? "Order total" : "Service price"}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/40 p-5 space-y-3">
            <h2 className="font-display text-lg font-semibold">Session details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(start, "PPP")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{format(start, "p")} — {format(end, "p")}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span>{snapshot.durationMinutes ?? "—"} min</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{snapshot.deliveryMode ?? "online"}</span>
              </div>
            </div>
          </div>

          {session?.meetingUrl && (
            <div className="rounded-2xl bg-green-50 border border-green-100 p-5">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Video className="h-5 w-5 text-green-600" /> Meeting link
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Join using the link shared by your mentor.
              </p>
              <Button className="mt-4 rounded-full" asChild>
                <a href={session.meetingUrl} target="_blank" rel="noreferrer">
                  Join session
                </a>
              </Button>
            </div>
          )}

          {order && (
            <div className="rounded-2xl bg-muted/40 p-5 space-y-3">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-muted-foreground" /> Order & payment
              </h2>
              <div className="text-sm space-y-2">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Order status</span>
                  <span className="font-medium capitalize">{order.status}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium">{formatINR(order.amount)} {order.currency}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Booked on</span>
                  <span className="font-medium">{format(new Date(order.createdAt), "PPp")}</span>
                </p>
                {payment ? (
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="font-medium flex items-center gap-1">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                      {payment.provider} · {payment.providerPaymentId}
                    </span>
                  </p>
                ) : (
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <span className="font-medium flex items-center gap-1">
                      <X className="h-3.5 w-3.5 text-red-500" /> Not paid
                    </span>
                  </p>
                )}
              </div>

              {order.status === "pending" && (
                <Button
                  className="mt-2 rounded-full w-full sm:w-auto"
                  disabled={pay.isPending}
                  onClick={() => pay.mutate({ orderId: order.id })}
                >
                  {pay.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <CreditCard className="mr-1.5 h-4 w-4" /> Pay now
                </Button>
              )}
            </div>
          )}

          {data.booking.status === "completed" && canReview && (
            <div className="rounded-2xl bg-orange-50 border border-orange-100 p-5">
              <h2 className="font-display text-lg font-semibold mb-2 flex items-center gap-2">
                <Star className="h-5 w-5 text-orange-600" /> How did it go?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Leave a rating and review to complete this booking.
              </p>
              <Button className="rounded-full" onClick={() => setReviewOpen(true)}>
                <Star className="mr-1.5 h-4 w-4" /> Write a review
              </Button>
            </div>
          )}

          {data.booking.status === "completed" && canReview === false && (
            <div className="rounded-2xl bg-muted/40 p-5">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" /> Review submitted
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Thanks for your feedback.
              </p>
            </div>
          )}

          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle>Write a review</DialogTitle>
                <DialogDescription>
                  Share your experience to help other students.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const active = i < (hoverRating || rating);
                    return (
                      <button
                        key={i}
                        type="button"
                        className="p-1"
                        onMouseEnter={() => setHoverRating(i + 1)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(i + 1)}
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            active ? "fill-amber-400 text-amber-400" : "text-stone-300"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-title">Title</Label>
                  <Input
                    id="review-title"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Insightful mock interview"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-content">Review</Label>
                  <Textarea
                    id="review-content"
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="What went well? What could be better?"
                    rows={4}
                    className="rounded-xl"
                  />
                </div>
                <Button
                  className="w-full rounded-full"
                  disabled={rating === 0 || review.isPending}
                  onClick={() =>
                    review.mutate({
                      bookingId,
                      rating,
                      title: reviewTitle || undefined,
                      content: reviewContent || undefined,
                    })
                  }
                >
                  {review.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit review
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {snapshot.communicationMode && snapshot.communicationMode !== "none" && (
            <div className="rounded-2xl bg-green-50 border border-green-100 p-5 space-y-4">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-green-600" /> WhatsApp connection
              </h2>
              <p className="text-sm text-muted-foreground">
                Mode: <span className="font-medium capitalize">{snapshot.communicationMode.replace(/_/g, " ")}</span>
                {snapshot.whatsappGroupAccessPolicy && (
                  <>
                    {" "}
                    · Access: <span className="font-medium capitalize">{snapshot.whatsappGroupAccessPolicy.replace(/_/g, " ")}</span>
                  </>
                )}
              </p>

              {(() => {
                const mode = snapshot.communicationMode ?? "none";
                const policy = snapshot.whatsappGroupAccessPolicy ?? "after_payment";
                const bookingOk = booking.status === "confirmed" || booking.status === "completed";
                const paid = order?.status === "paid";
                const completed = booking.status === "completed";
                const canShowDirect =
                  mode.includes("direct") &&
                  (policy === "after_booking"
                    ? bookingOk
                    : policy === "after_payment"
                      ? paid
                      : policy === "after_completion"
                        ? completed
                        : false);
                const canShowGroup =
                  mode.includes("group") &&
                  (policy === "after_booking"
                    ? bookingOk
                    : policy === "after_payment"
                      ? paid
                      : policy === "after_completion"
                        ? completed
                        : false);
                const lockedReason =
                  policy === "after_booking"
                    ? "once the booking is confirmed"
                    : policy === "after_payment"
                      ? "after payment is complete"
                      : policy === "after_completion"
                        ? "after the session is completed"
                        : "by the mentor directly";

                return (
                  <div className="space-y-3">
                    {canShowDirect && snapshot.whatsappDirectNumber && (
                      <Button variant="outline" className="rounded-full" asChild>
                        <a
                          href={`https://wa.me/${snapshot.whatsappDirectNumber.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Phone className="mr-1.5 h-4 w-4 text-green-600" /> {snapshot.whatsappDirectNumber}
                        </a>
                      </Button>
                    )}
                    {canShowGroup && snapshot.whatsappGroupInviteUrl && (
                      <Button variant="outline" className="rounded-full" asChild>
                        <a href={snapshot.whatsappGroupInviteUrl} target="_blank" rel="noreferrer">
                          <Users className="mr-1.5 h-4 w-4 text-green-600" /> Open WhatsApp group
                        </a>
                      </Button>
                    )}
                    {!canShowDirect && !canShowGroup && (
                      <div className="flex items-start gap-3 rounded-xl bg-white/60 p-4 text-sm">
                        <Link2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <p>
                          WhatsApp contact details will be shared <span className="font-medium">{lockedReason}</span>.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <div className="rounded-2xl bg-muted/40 p-5">
            <h2 className="font-display text-lg font-semibold mb-2">Booking reference</h2>
            <p className="font-mono text-sm">{booking.bookingReference}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
