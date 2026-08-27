import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import SiteLayout from "@/components/site/SiteLayout";
import PageHero from "@/components/site/PageHero";
import PaymentModal from "@/components/PaymentModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";

const UNSPLASH_COVERS = [
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop",
];

function fallbackCover(id: number) {
  return UNSPLASH_COVERS[id % UNSPLASH_COVERS.length];
}

type Playbook = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  price: number;
  pages: number;
  emoji: string;
  coverImage: string | null;
};

export default function Playbooks() {
  const { user, isAuthenticated } = useAuth();
  const { data: playbooks, isLoading } = trpc.catalog.playbooks.useQuery();
  const { data: owned } = trpc.candidate.myPlaybooks.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "candidate",
  });
  const [selected, setSelected] = useState<Playbook | null>(null);
  const utils = trpc.useUtils();

  const ownedIds = new Set(owned?.map((o) => o.playbook.id) ?? []);

  const purchase = trpc.candidate.purchasePlaybook.useMutation({
    onSuccess: () => {
      toast.success("Playbook added to your library!");
      utils.candidate.myPlaybooks.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const buy = (p: Playbook) => {
    if (!isAuthenticated) {
      toast("Sign in first", { description: "Create a free candidate account to buy playbooks." });
      return;
    }
    if (user?.role !== "candidate") {
      toast.error("Only candidate accounts can purchase playbooks.");
      return;
    }
    setSelected(p);
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="Curated by MBA converts"
        title="Playbooks that punch above their"
        highlight="price"
        subtitle="Real frameworks, case shortcuts and GD/PI scripts written by students who cracked IIMs, XLRI and ISB. No fluff — just what moves the needle."
        cta="Browse below"
        ctaHref="#playbooks-grid"
        secondaryCta="Become a contributor"
        secondaryHref="/mentors"
        visual={
          <div className="relative w-full max-w-md">
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm shadow-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="h-20 w-16 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500" />
                <div>
                  <div className="font-display text-2xl font-bold">GD-PI Bible</div>
                  <div className="text-sm text-stone-300">87 pages · 4.9/5</div>
                </div>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-orange-400"
                  initial={{ width: "0%" }}
                  animate={{ width: "78%" }}
                  transition={{ duration: 1.5, delay: 0.4 }}
                />
              </div>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0], rotate: [0, -2, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="absolute -bottom-8 -right-8 rounded-2xl border border-white/10 bg-stone-900/80 p-4 shadow-xl"
            >
              <div className="text-xs text-stone-400">Student saved</div>
              <div className="font-display text-xl font-bold text-green-400">₹24,000</div>
              <div className="text-xs text-stone-500">vs offline classes</div>
            </motion.div>
          </div>
        }
      />

      <div id="playbooks-grid" className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">All playbooks</h2>
            <p className="mt-1 text-sm text-muted-foreground">Buy once, keep forever. Updates included.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-3xl" />)}
          {playbooks?.map((p, i) => {
            const isOwned = ownedIds.has(p.id);
            const cover = p.coverImage || fallbackCover(p.id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-3xl border bg-card shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all flex flex-col overflow-hidden"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={cover}
                    alt={p.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute left-4 bottom-4 flex items-center gap-2">
                    <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-stone-900 backdrop-blur-sm">
                      {p.emoji}
                    </span>
                    <Badge variant="secondary" className="bg-white/90 text-stone-900 backdrop-blur-sm">
                      {p.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">{p.description}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" /> {p.pages} pages
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t pt-4">
                    <span className="font-display text-xl font-bold">{formatINR(p.price)}</span>
                    {isOwned ? (
                      <Button size="sm" variant="secondary" disabled className="rounded-full">
                        <Check className="mr-1.5 h-3.5 w-3.5" /> Owned
                      </Button>
                    ) : (
                      <Button size="sm" className="rounded-full" onClick={() => buy(p)}>
                        Get it
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {selected && (
        <PaymentModal
          open={!!selected}
          onOpenChange={(v) => !v && setSelected(null)}
          amount={selected.price}
          title={selected.title}
          onConfirm={async () => { await purchase.mutateAsync({ playbookId: selected.id }); }}
        />
      )}
    </SiteLayout>
  );
}
