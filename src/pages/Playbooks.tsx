import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import SiteLayout from "@/components/site/SiteLayout";
import PaymentModal from "@/components/PaymentModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";

type Playbook = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  price: number;
  pages: number;
  emoji: string;
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
      toast.success("Playbook added to your library! 📚");
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="text-gradient-orange">Playbooks</span> that punch above their price
          </h1>
          <p className="mt-3 text-muted-foreground">
            Written by converts, edited by mentors, priced for students.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
          {playbooks?.map((p, i) => {
            const isOwned = ownedIds.has(p.id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-3xl border bg-card p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between">
                  <span className="text-5xl">{p.emoji}</span>
                  <Badge variant="secondary">{p.category}</Badge>
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold">{p.title}</h3>
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
