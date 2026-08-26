import { useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, Crown, FileUp, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import SiteLayout from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { fileToBase64 } from "@/lib/format";
import { fireConfetti } from "@/components/site/EasterEggs";

export default function EventDetail() {
  const { id } = useParams();
  const eventId = Number(id);
  const { user, isAuthenticated } = useAuth();
  const { data: event, isLoading } = trpc.catalog.event.useQuery({ id: eventId });
  const utils = trpc.useUtils();

  const [teamName, setTeamName] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = trpc.candidate.submitEvent.useMutation({
    onSuccess: (r) => {
      fireConfetti(true);
      toast.success(r.updated ? "Submission updated! 🔄" : "Submission received! 🚀", {
        description: "Track its status and score in your dashboard.",
      });
      utils.catalog.event.invalidate();
      utils.candidate.mySubmissions.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please attach your PPT / PDF / document.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File too large — maximum 8 MB.");
      return;
    }
    const fileBase64 = await fileToBase64(file);
    submit.mutate({
      eventId,
      teamName,
      title,
      note: note || undefined,
      fileName: file.name,
      fileMime: file.type,
      fileBase64,
    });
  };

  if (isLoading) {
    return <SiteLayout><div className="mx-auto max-w-5xl px-4 py-14"><Skeleton className="h-96 rounded-3xl" /></div></SiteLayout>;
  }
  if (!event) {
    return <SiteLayout><div className="mx-auto max-w-5xl px-4 py-24 text-center">Event not found.</div></SiteLayout>;
  }

  const isLive = event.status === "live";
  const deadlinePassed = event.endAt ? new Date(event.endAt) < new Date() : false;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/events"><ArrowLeft className="mr-1.5 h-4 w-4" /> All events</Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-6xl">{event.emoji}</div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge className={isLive ? "bg-green-100 text-green-700" : "bg-stone-200 text-stone-600"}>
                {isLive ? "● Live" : "Closed"}
              </Badge>
              <Badge variant="outline">{event.type === "hackathon" ? "Hackathon" : "Case Competition"}</Badge>
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight leading-tight">{event.title}</h1>
            <p className="mt-3 flex items-center gap-2 text-orange-600 font-medium">
              <Trophy className="h-4 w-4" /> {event.prize}
            </p>
            <p className="mt-6 text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>

            {event.rules && (
              <div className="mt-8 rounded-3xl border bg-card p-7">
                <h2 className="font-display text-xl font-semibold">Rules</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.rules}</p>
              </div>
            )}

            {event.winners.length > 0 && (
              <div className="mt-8 rounded-3xl border border-amber-300 bg-amber-50 p-7 dark:bg-amber-500/10">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" /> Winners
                </h2>
                <ul className="mt-4 space-y-3">
                  {event.winners.map((w) => (
                    <li key={w.id} className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 border">
                      <div>
                        <div className="font-display font-semibold">{w.teamName}</div>
                        <div className="text-xs text-muted-foreground">{w.name} · {w.title}</div>
                      </div>
                      {w.score !== null && <Badge className="bg-amber-500">{w.score}/100</Badge>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-fit rounded-3xl border bg-card p-7 shadow-lg lg:sticky lg:top-24"
          >
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <FileUp className="h-5 w-5 text-orange-500" /> Submit your entry
            </h2>
            {event.endAt && (
              <p className="mt-2 text-sm text-muted-foreground">
                Deadline: {new Date(event.endAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}

            {!isLive || deadlinePassed ? (
              <p className="mt-5 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                Submissions are closed for this event.
              </p>
            ) : !isAuthenticated ? (
              <div className="mt-5">
                <p className="text-sm text-muted-foreground">Sign in as a candidate to participate.</p>
                <Button className="mt-4 w-full rounded-full" asChild>
                  <Link to="/login">Sign in to submit</Link>
                </Button>
              </div>
            ) : user?.role !== "candidate" ? (
              <p className="mt-5 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                Only candidate accounts can submit entries.
              </p>
            ) : (
              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label>Team name</Label>
                  <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} required placeholder="Orange Theory" />
                </div>
                <div className="space-y-1.5">
                  <Label>Entry title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Our big idea" />
                </div>
                <div className="space-y-1.5">
                  <Label>Note for the jury (optional)</Label>
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="TL;DR of your approach…" />
                </div>
                <div className="space-y-1.5">
                  <Label>Deck / document (PDF, PPT, DOC · max 8 MB)</Label>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/50 dark:bg-orange-500/5 p-6 text-center hover:border-orange-500 transition-colors"
                  >
                    <FileUp className="mx-auto h-6 w-6 text-orange-500" />
                    <div className="mt-2 text-sm font-medium">
                      {file ? file.name : "Click to choose file"}
                    </div>
                    {file && <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</div>}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.ppt,.pptx,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <Button type="submit" className="w-full btn-shine rounded-full h-11" disabled={submit.isPending}>
                  {submit.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</> : "Submit entry"}
                </Button>
              </form>
            )}
          </motion.aside>
        </div>
      </div>
    </SiteLayout>
  );
}
