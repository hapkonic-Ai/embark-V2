import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Globe,
  MapPin,
  Monitor,
  Users,
} from "lucide-react";
import {
  addDays,
  endOfDay,
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  one_on_one: "1:1 Session",
  review: "Review",
  consultation: "Consultation",
  mentorship: "Mentorship Package",
};

const DELIVERY_LABELS: Record<string, { label: string; icon: typeof Monitor }> = {
  online: { label: "Online", icon: Monitor },
  offline: { label: "Offline", icon: MapPin },
  async: { label: "Async", icon: Clock },
  hybrid: { label: "Hybrid", icon: Globe },
};

const COMMUNICATION_LABELS: Record<string, string> = {
  none: "In-app communication",
  whatsapp_direct: "WhatsApp Direct",
  whatsapp_group: "Private WhatsApp Group",
  whatsapp_direct_and_group: "WhatsApp Direct + Group",
};

function formatDuration(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function PublicServiceDetail() {
  const navigate = useNavigate();
  const { slug, serviceSlug } = useParams<{ slug: string; serviceSlug: string }>();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: service, isLoading } = trpc.catalog.expertServiceBySlug.useQuery(
    { expertSlug: slug ?? "", serviceSlug: serviceSlug ?? "" },
    { enabled: !!slug && !!serviceSlug },
  );

  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [selectedSlot, setSelectedSlot] = useState<{
    startAt: string;
    endAt: string;
  } | null>(null);
  const [intake, setIntake] = useState("");

  const { from, to } = useMemo(() => {
    const base = selectedDate ? parseISO(selectedDate) : new Date();
    return {
      from: startOfDay(base).toISOString(),
      to: endOfDay(addDays(base, 13)).toISOString(),
    };
  }, [selectedDate]);

  const {
    data: slots,
    isLoading: slotsLoading,
    refetch,
  } = trpc.catalog.expertServiceSlots.useQuery(
    {
      expertSlug: slug ?? "",
      serviceSlug: serviceSlug ?? "",
      from,
      to,
    },
    { enabled: !!slug && !!serviceSlug && !!service },
  );

  const book = trpc.booking.create.useMutation({
    onSuccess: (data) => {
      if (data.status === "confirmed") {
        toast.success("Booking confirmed");
      } else {
        toast.success("Booking request sent");
      }
      setSelectedSlot(null);
      setIntake("");
      refetch();
      setTimeout(() => navigate(`/m/${slug}`), 1200);
    },
    onError: (err) => toast.error(err.message || "Booking failed"),
  });

  const groupedSlots = useMemo(() => {
    const map = new Map<string, typeof slots>();
    for (const slot of slots ?? []) {
      const day = format(parseISO(slot.startAt), "yyyy-MM-dd");
      const list = map.get(day) ?? [];
      list.push(slot);
      map.set(day, list);
    }
    return map;
  }, [slots]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 pt-28 pb-16">
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-muted/40">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 text-center">
          <h1 className="font-display text-3xl font-bold">Service not found</h1>
          <p className="mt-2 text-muted-foreground">
            This service does not exist or is not published.
          </p>
          <Button className="mt-6 rounded-full" asChild>
            <Link to={`/m/${slug}`}>Back to profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  const typeLabel = SERVICE_TYPE_LABELS[service.serviceType] ?? service.serviceType;
  const delivery =
    DELIVERY_LABELS[service.deliveryMode ?? "online"] ?? {
      label: service.deliveryMode ?? "",
      icon: Monitor,
    };
  const DeliveryIcon = delivery.icon;

  const handleBook = () => {
    if (!selectedSlot || !user) return;
    const responses: Record<string, string> = {};
    if (intake.trim()) responses["message"] = intake.trim();
    book.mutate({
      serviceId: service.id,
      startAt: selectedSlot.startAt,
      endAt: selectedSlot.endAt,
      intakeResponses: responses,
    });
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-28 pb-16">
        <Button variant="ghost" className="rounded-full mb-6" asChild>
          <Link to={`/m/${slug}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to profile
          </Link>
        </Button>

        <div className="rounded-3xl border bg-card p-8 shadow-sm overflow-hidden">
          {service.image && (
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-48 sm:h-64 object-cover rounded-2xl mb-6 border"
            />
          )}

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary">{typeLabel}</Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <DeliveryIcon className="h-3.5 w-3.5" /> {delivery.label}
            </Badge>
            {service.communicationMode && service.communicationMode !== "none" && (
              <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200 bg-green-50">
                {COMMUNICATION_LABELS[service.communicationMode] ?? service.communicationMode}
              </Badge>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            {service.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-4">
            <span className="font-display text-3xl font-bold">
              {formatINR(service.price)}
            </span>
            {service.durationMinutes && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" /> {formatDuration(service.durationMinutes)}
              </span>
            )}
          </div>

          {service.description && (
            <p className="mt-6 text-base leading-relaxed whitespace-pre-line">
              {service.description}
            </p>
          )}

          {service.outcomes && (
            <div className="mt-6 p-5 rounded-2xl bg-muted/40">
              <h2 className="font-display text-lg font-semibold mb-2">
                What you&apos;ll get
              </h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {service.outcomes.split("\n").map((line, i) => (
                  <li key={i}>{line.trim()}</li>
                ))}
              </ul>
            </div>
          )}

          {service.requirements && (
            <div className="mt-6 p-5 rounded-2xl bg-muted/40">
              <h2 className="font-display text-lg font-semibold mb-2">
                Please share
              </h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {service.requirements}
              </p>
            </div>
          )}

          <Card className="mt-8 rounded-3xl">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" /> Book a slot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!user ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    Sign in to book this session.
                  </p>
                  <Button className="mt-4 rounded-full" asChild>
                    <Link to="/login">Sign in</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <Label>Pick a start date</Label>
                    <Input
                      type="date"
                      value={selectedDate}
                      min={format(new Date(), "yyyy-MM-dd")}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="mt-1.5 rounded-xl w-full sm:w-64"
                    />
                  </div>

                  {slotsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 animate-spin" /> Loading slots…
                    </div>
                  ) : groupedSlots.size === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No available slots in the next two weeks for this date
                      range. Try a different date or check back later.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      {Array.from(groupedSlots.entries()).map(([day, daySlots]) => {
                        const slots = daySlots ?? [];
                        return (
                        <div key={day}>
                          <h3 className="text-sm font-medium mb-2">
                            {format(parseISO(slots[0]!.startAt), "EEEE, MMM d")}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {slots.map((slot) => {
                              const active =
                                selectedSlot?.startAt === slot.startAt;
                              return (
                                <Button
                                  key={slot.startAt}
                                  type="button"
                                  variant={active ? "default" : "outline"}
                                  size="sm"
                                  className="rounded-full"
                                  onClick={() => setSelectedSlot(slot)}
                                >
                                  {format(parseISO(slot.startAt), "h:mm a")}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}

                  {selectedSlot && (
                    <div className="space-y-4 rounded-2xl bg-muted/40 p-4">
                      <div>
                        <Label>Anything to share?</Label>
                        <Textarea
                          value={intake}
                          onChange={(e) => setIntake(e.target.value)}
                          placeholder="Brief context for the expert…"
                          className="mt-1.5 rounded-xl"
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(selectedSlot.startAt), "PPp")}
                        </p>
                        <Button
                          onClick={handleBook}
                          disabled={book.isPending}
                          className="rounded-full"
                        >
                          {book.isPending ? "Booking…" : "Request booking"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="outline" className="rounded-full" asChild>
              <Link to={`/m/${slug}`}>
                <Users className="mr-1.5 h-4 w-4" /> View expert profile
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
