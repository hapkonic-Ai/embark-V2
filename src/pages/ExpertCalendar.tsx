import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Clock, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayRule = {
  dayOfWeek: (typeof DAYS)[number];
  startTime: string;
  endTime: string;
};

export default function ExpertCalendar() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-6 w-6 text-primary" />
            <h1 className="font-display text-2xl font-semibold">Calendar &amp; availability</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Set your weekly hours, manage exceptions, and see upcoming bookings.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Tabs defaultValue="schedule" className="space-y-6">
          <TabsList className="rounded-full">
            <TabsTrigger value="schedule" className="rounded-full">Weekly schedule</TabsTrigger>
            <TabsTrigger value="exceptions" className="rounded-full">Exceptions</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-full">Bookings</TabsTrigger>
          </TabsList>
          <TabsContent value="schedule">
            <ScheduleTab />
          </TabsContent>
          <TabsContent value="exceptions">
            <ExceptionsTab />
          </TabsContent>
          <TabsContent value="bookings">
            <BookingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function ScheduleTab() {
  const { data: rules, isLoading } = trpc.expertCalendar.getRules.useQuery();
  const utils = trpc.useUtils();
  const save = trpc.expertCalendar.setRules.useMutation({
    onSuccess: () => {
      utils.expertCalendar.getRules.invalidate();
      toast.success("Availability saved");
    },
    onError: (err) => toast.error(err.message || "Failed to save"),
  });

  const [draft, setDraft] = useState<DayRule[]>([]);

  useEffect(() => {
    if (rules) {
      setDraft(
        rules.map((r) => ({
          dayOfWeek: r.dayOfWeek as (typeof DAYS)[number],
          startTime: r.startTime,
          endTime: r.endTime,
        })),
      );
    }
  }, [rules]);

  const grouped = useMemo(() => {
    const map: Record<string, DayRule[]> = {};
    for (const d of DAYS) map[d] = [];
    for (const r of draft) map[r.dayOfWeek].push(r);
    return map;
  }, [draft]);

  const addSlot = (day: (typeof DAYS)[number]) => {
    setDraft((prev) => [
      ...prev,
      { dayOfWeek: day, startTime: "09:00", endTime: "17:00" },
    ]);
  };

  const updateSlot = (
    idx: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setDraft((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const removeSlot = (idx: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const cleaned = draft.filter((r) => r.startTime && r.endTime);
    for (const r of cleaned) {
      if (r.endTime <= r.startTime) {
        toast.error(`End time must be after start time on ${label(r.dayOfWeek)}`);
        return;
      }
    }
    save.mutate(cleaned);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading schedule…</p>;

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="font-display text-lg">Weekly availability</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {DAYS.map((day) => (
          <div key={day} className="border-b last:border-0 pb-6 last:pb-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium capitalize">{label(day)}</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => addSlot(day)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add slot
              </Button>
            </div>
            {grouped[day].length === 0 ? (
              <p className="text-sm text-muted-foreground">No availability</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {grouped[day].map((slot, i) => {
                  const globalIdx = draft.findIndex(
                    (r) => r === slot,
                  );
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-2xl border bg-muted/40 px-3 py-2"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          updateSlot(globalIdx, "startTime", e.target.value)
                        }
                        className="w-28 rounded-xl"
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          updateSlot(globalIdx, "endTime", e.target.value)
                        }
                        className="w-28 rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                        onClick={() => removeSlot(globalIdx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={save.isPending}
            className="rounded-full"
          >
            {save.isPending ? "Saving…" : "Save weekly schedule"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ExceptionsTab() {
  const { data: exceptions, isLoading } =
    trpc.expertCalendar.listExceptions.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.expertCalendar.createException.useMutation({
    onSuccess: () => {
      utils.expertCalendar.listExceptions.invalidate();
      toast.success("Exception added");
    },
    onError: (err) => toast.error(err.message || "Failed to add"),
  });
  const remove = trpc.expertCalendar.deleteException.useMutation({
    onSuccess: () => {
      utils.expertCalendar.listExceptions.invalidate();
      toast.success("Exception removed");
    },
    onError: (err) => toast.error(err.message || "Failed to remove"),
  });

  const [date, setDate] = useState("");
  const [type, setType] = useState<"block" | "override">("block");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [allDay, setAllDay] = useState(true);

  const handleAdd = () => {
    if (!date) return toast.error("Pick a date");
    create.mutate({
      exceptionDate: date,
      type,
      startTime: allDay ? null : startTime,
      endTime: allDay ? null : endTime,
      reason: reason || null,
    });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="rounded-3xl lg:col-span-1">
        <CardHeader>
          <CardTitle className="font-display text-lg">Add exception</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label>Type</Label>
            <div className="flex gap-2 mt-1.5">
              <Button
                type="button"
                variant={type === "block" ? "default" : "outline"}
                className="flex-1 rounded-full"
                onClick={() => setType("block")}
              >
                Block
              </Button>
              <Button
                type="button"
                variant={type === "override" ? "default" : "outline"}
                className="flex-1 rounded-full"
                onClick={() => setType("override")}
              >
                Override
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="allDay"
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="allDay">All day</Label>
          </div>
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}
          <div>
            <Label>Reason (optional)</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Travel day"
              className="rounded-xl"
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={create.isPending}
            className="w-full rounded-full"
          >
            <Plus className="mr-1 h-4 w-4" /> Add exception
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-display text-lg">Upcoming exceptions</CardTitle>
        </CardHeader>
        <CardContent>
          {!exceptions?.length ? (
            <p className="text-sm text-muted-foreground">No exceptions yet.</p>
          ) : (
            <div className="space-y-3">
              {exceptions.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={ex.type === "block" ? "destructive" : "default"}
                      >
                        {ex.type}
                      </Badge>
                      <span className="font-medium">
                        {format(parseISO(ex.exceptionDate), "PPP")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ex.startTime && ex.endTime
                        ? `${ex.startTime} – ${ex.endTime}`
                        : "All day"}
                    </p>
                    {ex.reason && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {ex.reason}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                    onClick={() => remove.mutate({ id: ex.id })}
                    disabled={remove.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BookingsTab() {
  const { data: bookings, isLoading } = trpc.booking.listForExpert.useQuery();
  const utils = trpc.useUtils();
  const confirm = trpc.booking.confirm.useMutation({
    onSuccess: () => {
      utils.booking.listForExpert.invalidate();
      toast.success("Booking confirmed");
    },
    onError: (err) => toast.error(err.message || "Failed to confirm"),
  });
  const cancel = trpc.booking.cancel.useMutation({
    onSuccess: () => {
      utils.booking.listForExpert.invalidate();
      toast.success("Booking declined");
    },
    onError: (err) => toast.error(err.message || "Failed to decline"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading bookings…</p>;

  return (
    <div className="space-y-4">
      {!bookings?.length ? (
        <Card className="rounded-3xl p-8 text-center">
          <p className="text-sm text-muted-foreground">No bookings yet.</p>
        </Card>
      ) : (
        bookings.map((row) => (
          <Card key={row.booking.id} className="rounded-3xl">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{row.serviceTitle}</h3>
                    <Badge variant="secondary">{row.booking.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    with {row.studentName} ·{" "}
                    {format(parseISO(row.booking.startAt as unknown as string), "PPp")}
                  </p>
                </div>
                {row.booking.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={() =>
                        confirm.mutate({ bookingId: row.booking.id })
                      }
                      disabled={confirm.isPending || cancel.isPending}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() =>
                        cancel.mutate({ bookingId: row.booking.id })
                      }
                      disabled={confirm.isPending || cancel.isPending}
                    >
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

function label(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}
