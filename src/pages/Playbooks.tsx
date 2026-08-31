import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import SiteLayout from "@/components/site/SiteLayout";
import { DocumentHead } from "@/components/site/DocumentHead";
import { EditorialHero } from "@/components/site/EditorialHero";
import { BookStack } from "@/components/site/BookStack";
import { StorySection } from "@/components/site/StorySection";
import { JourneySteps } from "@/components/site/JourneySteps";
import PaymentModal from "@/components/PaymentModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";
import { generateBookCover } from "@/lib/bookCover";

function fallbackCover(_id: number, title: string) {
  return generateBookCover(title);
}

const HERO_BOOKS = [
  { title: "Crack the GD", subtitle: "Group discussion scripts that win", color: "#ea580c" },
  { title: "Build your MBA profile", subtitle: "Shape your story for top b-schools", color: "#1c1917" },
  { title: "Master the PI", subtitle: "Interview answers with intent", color: "#c2410c" },
  { title: "Consulting case framework", subtitle: "Solve cases like a consultant", color: "#44403c" },
  { title: "Placement preparation", subtitle: "A plan that survives pressure", color: "#f97316" },
  { title: "Career switch", subtitle: "Move with clarity, not guesswork", color: "#57534e" },
  { title: "SOP that converts", subtitle: "From blank page to final admit", color: "#7c2d12" },
  { title: "WAT essay mastery", subtitle: "Write under pressure", color: "#92400e" },
];

const PLAYBOOK_STEPS = [
  { number: "01", title: "QUESTION", description: "Start with the exact problem the playbook is built to solve." },
  { number: "02", title: "FRAMEWORK", description: "Get a reusable structure distilled from real interviews." },
  { number: "03", title: "EXAMPLE", description: "See how the framework played out in actual situations." },
  { number: "04", title: "PRACTICE", description: "Apply it yourself with guided prompts and exercises." },
  { number: "05", title: "FEEDBACK", description: "Refine your response until it sounds like your own." },
];

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
  const reduce = useReducedMotion();
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
      <DocumentHead
        title="Playbooks"
        description="Practical MBA playbooks for GD, PI, profile building, case frameworks and placement preparation — written by students who converted their calls."
        path="playbooks"
      />
      <EditorialHero
        title="The playbook for"
        highlight="getting where you want to go."
        subtitle="Real frameworks, case shortcuts and GD/PI scripts written by students who cracked IIMs, XLRI and ISB. No fluff — just what moves the needle."
        cta="Browse playbooks"
        ctaHref="#playbooks-grid"
        secondaryCta="Become a contributor"
        secondaryHref="/mentors"
        dark={false}
      >
        <BookStack books={HERO_BOOKS} />
      </EditorialHero>

      <StorySection
        dark={true}
        statement="Built from real interviews, real mistakes and real outcomes."
        body={
          <>
            Every playbook is experience distilled into something usable. They are not textbooks — they are the notes you would have taken if you had sat in the room with candidates who converted their calls.
            <br className="hidden sm:block" />
            <span className="mt-4 block">
              Use them to prepare faster, avoid common traps, and walk into rooms with answers that sound like yours.
            </span>
          </>
        }
      />

      <JourneySteps title="How a playbook works" steps={PLAYBOOK_STEPS} className="section-light" />

      <section id="playbooks-grid" className="section-dark py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-stone-100">All playbooks</h2>
              <p className="mt-1 text-sm text-muted-foreground">Buy once, keep forever. Updates included.</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-3xl bg-stone-800" />
              ))}
            {playbooks?.map((p, i) => {
              const isOwned = ownedIds.has(p.id);
              const cover = p.coverImage || fallbackCover(p.id, p.title);
              return (
                <motion.div
                  key={p.id}
                  initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={reduce ? undefined : { y: -12, scale: 1.03, transition: { duration: 0.3 } }}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-stone-800 bg-card shadow-sm transition-shadow duration-300 hover:shadow-2xl hover:shadow-orange-500/10 cursor-pointer"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={cover}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute inset-0 flex flex-col justify-end p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <h4 className="font-display text-xl font-bold text-white">{p.title}</h4>
                      <p className="mt-1 line-clamp-2 text-sm text-white/80">{p.description}</p>
                    </div>

                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-xl font-semibold text-stone-100 transition-colors group-hover:text-orange-400">{p.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">{p.description}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="h-3.5 w-3.5" /> {p.pages} pages
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-stone-800 pt-4">
                      <span className="font-display text-xl font-bold text-stone-100">{formatINR(p.price)}</span>
                      {isOwned ? (
                        <Button size="sm" variant="secondary" disabled className="rounded-full bg-card text-muted-foreground">
                          <Check className="mr-1.5 h-3.5 w-3.5" /> Owned
                        </Button>
                      ) : (
                        <Button size="sm" className="rounded-full bg-stone-100 text-stone-900 hover:bg-white" onClick={() => buy(p)}>
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
      </section>

      <section className="section-light py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Choose how you want to learn</h2>
            <p className="mt-4 text-muted-foreground">Buy single playbooks or unlock the full library.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: "Single", price: "₹499", desc: "One playbook of your choice", features: ["1 playbook", "Lifetime access", "Free updates"] },
              { name: "Bundle", price: "₹1,999", desc: "Any 5 playbooks", features: ["5 playbooks", "Lifetime access", "Free updates", "Save 20%"], hot: true },
              { name: "Library", price: "₹4,999", desc: "Every playbook we publish", features: ["All current & future playbooks", "Lifetime access", "Priority support", "Best value"] },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={reduce ? undefined : { y: -8, transition: { duration: 0.25 } }}
                className={`relative rounded-3xl border p-7 ${plan.hot ? "bg-stone-950 text-white border-stone-800 shadow-2xl shadow-orange-500/10" : "bg-card shadow-sm"}`}
              >
                <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
                <p className={`mt-1 text-sm ${plan.hot ? "text-stone-400" : "text-muted-foreground"}`}>{plan.desc}</p>
                <div className="mt-4 font-display text-4xl font-bold">{plan.price}</div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`h-4 w-4 ${plan.hot ? "text-orange-400" : "text-orange-500"}`} />
                      <span className={plan.hot ? "text-stone-300" : ""}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`mt-6 w-full rounded-full ${plan.hot ? "btn-shine" : ""}`} variant={plan.hot ? "default" : "outline"}>
                  Choose {plan.name}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {selected && (
        <PaymentModal
          open={!!selected}
          onOpenChange={(v) => !v && setSelected(null)}
          amount={selected.price}
          title={selected.title}
          onConfirm={async () => {
            await purchase.mutateAsync({ playbookId: selected.id });
          }}
        />
      )}
    </SiteLayout>
  );
}
