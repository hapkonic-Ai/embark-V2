import { useParams, Link, Navigate } from "react-router";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Download,
  ShoppingCart,
  Sparkles,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/providers/cart";
import SiteLayout from "@/components/site/SiteLayout";
import { DocumentHead } from "@/components/site/DocumentHead";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";
import { generateBookCover } from "@/lib/bookCover";

function downloadBase64(fileName: string, mime: string, base64: string) {
  const link = document.createElement("a");
  link.href = `data:${mime};base64,${base64}`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const FEATURES = [
  "Real interview questions and frameworks",
  "Step-by-step answer scripts",
  "Practice prompts with solutions",
  "Lifetime access + free updates",
];

export default function PlaybookDetail() {
  const { id } = useParams<{ id: string }>();
  const playbookId = Number(id);
  const { user, isAuthenticated } = useAuth();
  const reduce = useReducedMotion();
  const { addItem, items } = useCart();

  const { data: playbook, isLoading: pbLoading } = trpc.catalog.playbook.useQuery(
    { id: playbookId },
    { enabled: !Number.isNaN(playbookId) },
  );

  const { data: owned, isLoading: ownedLoading } = trpc.candidate.myPlaybooks.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "candidate" },
  );

  const isOwned = owned?.some((o) => o.playbook.id === playbookId);
  const inCart = items.some((i) => i.type === "playbook" && i.playbookId === playbookId);

  const download = trpc.candidate.downloadPlaybook.useMutation({
    onSuccess: (res) => {
      if (!res.fileBase64) {
        toast.error("Playbook file is empty.");
        return;
      }
      downloadBase64(res.fileName, res.fileMime, res.fileBase64);
      toast.success("Download started!");
    },
    onError: (e) => toast.error(e.message),
  });

  const addToCart = () => {
    if (!isAuthenticated) {
      toast("Sign in first", { description: "Create a free candidate account to buy playbooks." });
      return;
    }
    if (user?.role !== "candidate") {
      toast.error("Only candidate accounts can purchase playbooks.");
      return;
    }
    if (!playbook) return;
    const offer = playbook.offerPercent ?? 0;
    const finalPrice = offer > 0 ? Math.round((playbook.price * (100 - offer)) / 100) : playbook.price;
    addItem({
      type: "playbook",
      playbookId: playbook.id,
      title: playbook.title,
      price: finalPrice,
    });
    toast.success("Added to cart", { description: "Checkout from your dashboard Orders section." });
  };

  if (!Number.isNaN(playbookId) && pbLoading) {
    return (
      <SiteLayout>
        <div className="section-light min-h-screen py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Skeleton className="h-8 w-32 rounded-full" />
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <Skeleton className="aspect-[3/4] w-full max-w-md rounded-3xl" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4 rounded-xl" />
                <Skeleton className="h-6 w-1/2 rounded-xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-12 w-40 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!playbook) {
    return <Navigate to="/playbooks" replace />;
  }

  const cover = playbook.coverImage || generateBookCover(playbook.title, playbook.description ?? undefined);

  return (
    <SiteLayout>
      <DocumentHead
        title={playbook.title}
        description={playbook.description || `${playbook.title} — practical playbook for MBA aspirants.`}
        path={`playbooks/${playbook.id}`}
      />
      <div className="section-light min-h-screen py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Button variant="ghost" className="mb-6 -ml-3 text-muted-foreground hover:text-stone-900" asChild>
            <Link to="/playbooks" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to playbooks
            </Link>
          </Button>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
            {/* cover */}
            <motion.div
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-md lg:max-w-none"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-[2rem] border-4 border-white shadow-2xl">
                <img
                  src={cover}
                  alt={playbook.title}
                  className="h-full w-full object-cover"
                />
                {(playbook.offerPercent ?? 0) > 0 && (
                  <span className="absolute left-4 top-4 rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-bold text-white shadow">
                    {playbook.offerPercent}% OFF
                  </span>
                )}
              </div>
              <div className="absolute -bottom-6 -right-6 hidden sm:block">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl">
                  <BookOpen className="h-8 w-8" />
                </div>
              </div>
            </motion.div>

            {/* details */}
            <motion.div
              initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col"
            >
              <Badge variant="secondary" className="w-fit rounded-full px-3 py-1 text-xs font-medium">
                {playbook.category}
              </Badge>
              <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight text-stone-900">
                {playbook.title}
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                {playbook.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  {playbook.pages} pages
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  Written by verified converts
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-orange-500" />
                  Instant download
                </div>
              </div>

              <div className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    {(playbook.offerPercent ?? 0) > 0 && (
                      <>
                        <span className="font-display text-xl text-muted-foreground line-through">{formatINR(playbook.price)}</span>
                        <span className="ml-2 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">{playbook.offerPercent}% off applied</span>
                      </>
                    )}
                    <div className="font-display text-4xl font-bold text-stone-900">
                      {formatINR(playbook.offerPercent ? Math.round((playbook.price * (100 - (playbook.offerPercent ?? 0))) / 100) : playbook.price)}
                    </div>
                    <p className="text-sm text-muted-foreground">One-time purchase. Lifetime access.</p>
                  </div>
                  {isOwned ? (
                    <Button
                      size="lg"
                      className="rounded-full bg-stone-900 text-white hover:bg-stone-800"
                      onClick={() => download.mutate({ playbookId })}
                      disabled={download.isPending}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {download.isPending ? "Preparing..." : "Download now"}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="rounded-full btn-shine"
                      onClick={addToCart}
                      disabled={inCart || ownedLoading}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {inCart ? "In cart" : ownedLoading ? "Please wait..." : "Add to cart"}
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="font-display text-lg font-semibold text-stone-900">What&apos;s inside</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {FEATURES.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                        <Check className="h-3 w-3" />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
