import { useState } from "react";
import {
  BookOpen, CalendarPlus, Crown, Download, LayoutDashboard, Loader2,
  Pencil, Star, Trash2, Trophy, Users,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import DashboardShell from "@/components/DashboardShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { downloadBase64, formatINR } from "@/lib/format";

export default function AdminDashboard() {
  return (
    <DashboardShell
      title="Admin HQ 🛠️"
      subtitle="Events, submissions, playbooks and students."
      roles={["admin", "superadmin"]}
      tabs={[
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "events", label: "Events", icon: CalendarPlus },
        { id: "submissions", label: "Submissions", icon: Trophy },
        { id: "playbooks", label: "Playbooks", icon: BookOpen },
        { id: "users", label: "Users", icon: Users },
      ]}
    >
      {(tab) => (
        <>
          {tab === "overview" && <Overview />}
          {tab === "events" && <EventsTab />}
          {tab === "submissions" && <SubmissionsTab />}
          {tab === "playbooks" && <PlaybooksTab />}
          {tab === "users" && <UsersTab />}
        </>
      )}
    </DashboardShell>
  );
}

function Overview() {
  const { data } = trpc.admin.overview.useQuery();
  const cards = [
    { label: "Total users", value: data?.users ?? 0 },
    { label: "Mentor profiles", value: data?.mentors ?? 0 },
    { label: "Events", value: data?.events ?? 0 },
    { label: "Submissions", value: data?.submissions ?? 0 },
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="font-display text-4xl font-bold">{c.value}</div>
          <div className="mt-1 text-sm text-muted-foreground">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- events

type EventForm = {
  id?: number; title: string; description: string; rules: string;
  type: "hackathon" | "case_competition"; prize: string; emoji: string;
  startAt: string; endAt: string; status: "draft" | "live" | "closed";
};
const emptyEvent: EventForm = {
  title: "", description: "", rules: "", type: "hackathon",
  prize: "", emoji: "🏆", startAt: "", endAt: "", status: "draft",
};

function EventsTab() {
  const { data, isLoading } = trpc.admin.listEvents.useQuery();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<EventForm | null>(null);
  const invalidate = () => utils.admin.listEvents.invalidate();

  const create = trpc.admin.createEvent.useMutation({
    onSuccess: () => { toast.success("Event created"); setEditing(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.admin.updateEvent.useMutation({
    onSuccess: () => { toast.success("Event updated"); setEditing(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.admin.deleteEvent.useMutation({
    onSuccess: () => { toast.success("Event deleted"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const save = () => {
    if (!editing) return;
    const payload = {
      title: editing.title, description: editing.description, rules: editing.rules,
      type: editing.type, prize: editing.prize, emoji: editing.emoji,
      status: editing.status,
      startAt: editing.startAt ? new Date(editing.startAt) : undefined,
      endAt: editing.endAt ? new Date(editing.endAt) : undefined,
    };
    if (editing.id) update.mutate({ id: editing.id, ...payload });
    else create.mutate(payload);
  };

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button className="rounded-full" onClick={() => setEditing({ ...emptyEvent })}>
          <CalendarPlus className="mr-1.5 h-4 w-4" /> New event
        </Button>
      </div>
      <div className="space-y-4">
        {data?.map((e) => (
          <div key={e.id} className="rounded-3xl border bg-card p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{e.emoji}</span>
              <div>
                <h3 className="font-display font-semibold">{e.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {e.type === "hackathon" ? "Hackathon" : "Case competition"} · {e.submissionCount} submissions
                  {e.endAt && ` · ends ${new Date(e.endAt).toLocaleDateString("en-IN")}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={
                e.status === "live" ? "bg-green-100 text-green-700"
                : e.status === "draft" ? "bg-stone-200 text-stone-600"
                : "bg-red-100 text-red-700"
              }>{e.status}</Badge>
              <Button size="icon" variant="outline" className="rounded-full" onClick={() => setEditing({
                id: e.id, title: e.title, description: e.description ?? "", rules: e.rules ?? "",
                type: e.type, prize: e.prize ?? "", emoji: e.emoji,
                startAt: e.startAt ? new Date(e.startAt).toISOString().slice(0, 16) : "",
                endAt: e.endAt ? new Date(e.endAt).toISOString().slice(0, 16) : "",
                status: e.status,
              })}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="rounded-full text-red-500" onClick={() => {
                if (confirm("Delete this event and all its submissions?")) del.mutate({ id: e.id });
              }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing?.id ? "Edit event" : "New event"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Rules</Label>
                <Textarea rows={3} value={editing.rules} onChange={(e) => setEditing({ ...editing, rules: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as EventForm["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hackathon">Hackathon</SelectItem>
                    <SelectItem value="case_competition">Case competition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v as EventForm["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prize</Label>
                <Input value={editing.prize} onChange={(e) => setEditing({ ...editing, prize: e.target.value })} placeholder="₹50,000" />
              </div>
              <div className="space-y-1.5">
                <Label>Emoji</Label>
                <Input value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Starts</Label>
                <Input type="datetime-local" value={editing.startAt} onChange={(e) => setEditing({ ...editing, startAt: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="datetime-local" value={editing.endAt} onChange={(e) => setEditing({ ...editing, endAt: e.target.value })} />
              </div>
              <Button className="sm:col-span-2 rounded-full" disabled={create.isPending || update.isPending} onClick={save}>
                {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save event
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ------------------------------------------------------------ submissions

function SubmissionsTab() {
  const { data: events } = trpc.admin.listEvents.useQuery();
  const [eventId, setEventId] = useState<number | null>(null);
  const activeEvent = eventId ?? events?.[0]?.id ?? null;
  const { data: subs, isLoading } = trpc.admin.submissionsForEvent.useQuery(
    { eventId: activeEvent! },
    { enabled: activeEvent !== null },
  );
  const utils = trpc.useUtils();
  const [evalFor, setEvalFor] = useState<{ id: number; score: string; feedback: string; status: string } | null>(null);

  const dl = trpc.admin.downloadSubmission.useMutation({
    onSuccess: (r) => r.fileBase64 && downloadBase64(r.fileBase64, r.fileName ?? "submission", r.fileMime ?? "application/octet-stream"),
    onError: (e) => toast.error(e.message),
  });
  const evaluate = trpc.admin.evaluateSubmission.useMutation({
    onSuccess: () => {
      toast.success("Evaluation saved");
      setEvalFor(null);
      if (activeEvent) utils.admin.submissionsForEvent.invalidate({ eventId: activeEvent });
    },
    onError: (e) => toast.error(e.message),
  });

  const statusCls: Record<string, string> = {
    submitted: "bg-blue-100 text-blue-700",
    shortlisted: "bg-purple-100 text-purple-700",
    winner: "bg-amber-100 text-amber-700",
    rejected: "bg-stone-200 text-stone-600",
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {events?.map((e) => (
          <Button
            key={e.id}
            size="sm"
            variant={activeEvent === e.id ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setEventId(e.id)}
          >
            {e.emoji} {e.title.slice(0, 28)}{e.title.length > 28 ? "…" : ""} ({e.submissionCount})
          </Button>
        ))}
      </div>

      {isLoading && <Skeleton className="h-64 rounded-3xl" />}
      {subs && subs.length === 0 && (
        <div className="rounded-3xl border bg-card p-12 text-center text-muted-foreground">
          No submissions for this event yet.
        </div>
      )}
      <div className="space-y-4">
        {subs?.map(({ submission: s, name, email }) => (
          <div key={s.id} className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display font-semibold flex items-center gap-2">
                  {s.status === "winner" && <Crown className="h-4 w-4 text-amber-500" />}
                  {s.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Team {s.teamName} · {name} ({email}) · {s.fileName} · {(s.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
                {s.note && <p className="mt-2 text-sm text-muted-foreground">“{s.note}”</p>}
              </div>
              <div className="flex items-center gap-2">
                {s.score !== null && <Badge className="bg-orange-500"><Star className="mr-1 h-3 w-3" />{s.score}/100</Badge>}
                <Badge className={statusCls[s.status]}>{s.status}</Badge>
                <Button size="icon" variant="outline" className="rounded-full h-8 w-8" onClick={() => dl.mutate({ id: s.id })}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" className="rounded-full" onClick={() => setEvalFor({
                  id: s.id, score: s.score?.toString() ?? "", feedback: s.feedback ?? "", status: s.status,
                })}>
                  Evaluate
                </Button>
              </div>
            </div>
            {s.feedback && (
              <p className="mt-3 text-sm text-muted-foreground border-l-2 border-orange-400 pl-3">Jury note: “{s.feedback}”</p>
            )}
          </div>
        ))}
      </div>

      <Dialog open={!!evalFor} onOpenChange={(v) => !v && setEvalFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Evaluate submission</DialogTitle></DialogHeader>
          {evalFor && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Score (0–100)</Label>
                <Input type="number" min={0} max={100} value={evalFor.score} onChange={(e) => setEvalFor({ ...evalFor, score: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Feedback</Label>
                <Textarea rows={4} value={evalFor.feedback} onChange={(e) => setEvalFor({ ...evalFor, feedback: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Verdict</Label>
                <Select value={evalFor.status} onValueChange={(v) => setEvalFor({ ...evalFor, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="winner">🏆 Winner</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full rounded-full"
                disabled={evaluate.isPending}
                onClick={() => evaluate.mutate({
                  id: evalFor.id,
                  score: evalFor.score ? Number(evalFor.score) : undefined,
                  feedback: evalFor.feedback || undefined,
                  status: evalFor.status as "submitted" | "shortlisted" | "winner" | "rejected",
                })}
              >
                {evaluate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save evaluation
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ------------------------------------------------------------- playbooks

type PbForm = { id?: number; title: string; description: string; category: string; price: string; pages: string; emoji: string; isPublished: boolean };
const emptyPb: PbForm = { title: "", description: "", category: "GDPI", price: "499", pages: "40", emoji: "📘", isPublished: true };

function PlaybooksTab() {
  const { data, isLoading } = trpc.admin.listPlaybooks.useQuery();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState<PbForm | null>(null);
  const invalidate = () => utils.admin.listPlaybooks.invalidate();

  const create = trpc.admin.createPlaybook.useMutation({
    onSuccess: () => { toast.success("Playbook created"); setEditing(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.admin.updatePlaybook.useMutation({
    onSuccess: () => { toast.success("Playbook updated"); setEditing(null); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.admin.deletePlaybook.useMutation({
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button className="rounded-full" onClick={() => setEditing({ ...emptyPb })}>
          <BookOpen className="mr-1.5 h-4 w-4" /> New playbook
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {data?.map((p) => (
          <div key={p.id} className="rounded-3xl border bg-card p-6 shadow-sm flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <span className="text-3xl">{p.emoji}</span>
              <div>
                <h3 className="font-display font-semibold">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{p.category} · {p.pages} pages · {formatINR(p.price)}</p>
                <Badge className={`mt-2 ${p.isPublished ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-600"}`}>
                  {p.isPublished ? "published" : "hidden"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button size="icon" variant="outline" className="rounded-full h-8 w-8" onClick={() => setEditing({
                id: p.id, title: p.title, description: p.description ?? "", category: p.category,
                price: p.price.toString(), pages: p.pages.toString(), emoji: p.emoji, isPublished: p.isPublished,
              })}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="outline" className="rounded-full h-8 w-8 text-red-500" onClick={() => {
                if (confirm("Delete this playbook?")) del.mutate({ id: p.id });
              }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">{editing?.id ? "Edit" : "New"} playbook</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Description</Label>
                <Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Category</Label>
                  <Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Emoji</Label>
                  <Input value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Price (₹)</Label>
                  <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Pages</Label>
                  <Input type="number" value={editing.pages} onChange={(e) => setEditing({ ...editing, pages: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.isPublished} onChange={(e) => setEditing({ ...editing, isPublished: e.target.checked })} />
                Published (visible in store)
              </label>
              <Button
                className="w-full rounded-full"
                disabled={create.isPending || update.isPending}
                onClick={() => {
                  const payload = {
                    title: editing.title, description: editing.description, category: editing.category,
                    price: Number(editing.price), pages: Number(editing.pages), emoji: editing.emoji,
                    isPublished: editing.isPublished,
                  };
                  if (editing.id) update.mutate({ id: editing.id, ...payload });
                  else create.mutate(payload);
                }}
              >
                Save playbook
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ------------------------------------------------------------------ users

function UsersTab() {
  const { data, isLoading } = trpc.admin.listUsers.useQuery();
  if (isLoading) return <Skeleton className="h-64 rounded-3xl" />;
  return (
    <div className="rounded-3xl border bg-card shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="px-5 py-3.5">Name</th>
            <th className="px-4 py-3.5">Email</th>
            <th className="px-4 py-3.5">Role</th>
            <th className="px-4 py-3.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((u) => (
            <tr key={u.id} className="border-b last:border-0">
              <td className="px-5 py-3 font-medium">{u.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-3"><Badge variant="secondary" className="capitalize">{u.role}</Badge></td>
              <td className="px-4 py-3">{u.isActive ? "✅" : "🚫"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
