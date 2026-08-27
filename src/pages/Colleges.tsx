import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownWideNarrow, Building2, GitCompareArrows, GraduationCap, MapPin, Plus, Search, Wallet, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import SiteLayout from "@/components/site/SiteLayout";
import PageHero from "@/components/site/PageHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatFees, formatLPA } from "@/lib/format";

type College = {
  id: number; name: string; shortName: string | null; city: string | null;
  state: string | null; type: string; nirfRank: number | null; fees: number;
  avgPackage: number | null; highestPackage: number | null; exams: string | null;
  cutoff: string | null; established: number | null; website: string | null; logoUrl: string | null;
};

type SortKey = "nirf" | "feesAsc" | "feesDesc" | "avgDesc" | "established";

export default function Colleges() {
  const { data: colleges, isLoading } = trpc.catalog.colleges.useQuery();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState<SortKey>("nirf");
  const [maxFees, setMaxFees] = useState<number>(5000000);
  const [minPackage, setMinPackage] = useState<number>(0);
  const [compare, setCompare] = useState<College[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selected, setSelected] = useState<College | null>(null);

  const rows = useMemo(() => {
    let list = (colleges ?? []) as College[];
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter((c) =>
        `${c.name} ${c.shortName} ${c.city} ${c.state} ${c.exams}`.toLowerCase().includes(needle),
      );
    }
    if (type !== "all") list = list.filter((c) => c.type === type);
    list = list.filter((c) => c.fees <= maxFees && (c.avgPackage ?? 0) >= minPackage);
    const sorted = [...list];
    switch (sort) {
      case "feesAsc": sorted.sort((a, b) => a.fees - b.fees); break;
      case "feesDesc": sorted.sort((a, b) => b.fees - a.fees); break;
      case "avgDesc": sorted.sort((a, b) => (b.avgPackage ?? 0) - (a.avgPackage ?? 0)); break;
      case "established": sorted.sort((a, b) => (b.established ?? 0) - (a.established ?? 0)); break;
      default: sorted.sort((a, b) => (a.nirfRank ?? 999) - (b.nirfRank ?? 999));
    }
    return sorted;
  }, [colleges, q, type, sort, maxFees, minPackage]);

  const toggleCompare = (c: College) => {
    setCompare((prev) => {
      if (prev.some((p) => p.id === c.id)) return prev.filter((p) => p.id !== c.id);
      if (prev.length >= 3) return prev;
      return [...prev, c];
    });
  };

  return (
    <SiteLayout>
      <PageHero
        eyebrow="College Compass"
        title="Compare every top MBA college in"
        highlight="India"
        subtitle="Fees, NIRF rank, average and highest packages, cutoffs, location — everything you need to shortlist your dream B-school in one place."
        cta="Start comparing"
        ctaHref="#colleges-filters"
        secondaryCta="View mentors"
        secondaryHref="/mentors"
        visual={
          <div className="grid gap-4 w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-400"><Building2 className="h-6 w-6" /></div>
                <div>
                  <div className="font-display text-3xl font-bold">{(colleges ?? []).length}</div>
                  <div className="text-sm text-stone-400">Colleges listed</div>
                </div>
              </div>
            </motion.div>
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400"><GraduationCap className="h-5 w-5" /></div>
                <div className="mt-3 font-display text-2xl font-bold">{(colleges ?? []).filter((c) => c.type === "IIM").length}</div>
                <div className="text-xs text-stone-400">IIMs</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400"><Wallet className="h-5 w-5" /></div>
                <div className="mt-3 font-display text-2xl font-bold">{formatLPA(Math.max(...(colleges ?? []).map((c) => c.avgPackage ?? 0)))}</div>
                <div className="text-xs text-stone-400">Highest avg package</div>
              </motion.div>
            </div>
          </div>
        }
      />

      <div id="colleges-filters" className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        <div className="rounded-3xl border bg-card p-6 shadow-sm mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="relative flex-1 min-w-56">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, city, exam…" className="pl-10 h-11 rounded-full" />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-40 h-11 rounded-full"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="IIM">IIMs</SelectItem>
                <SelectItem value="IIT">IITs</SelectItem>
                <SelectItem value="Govt">Govt</SelectItem>
                <SelectItem value="Private">Private</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-48 h-11 rounded-full">
                <ArrowDownWideNarrow className="mr-1.5 h-4 w-4" /><SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nirf">NIRF rank</SelectItem>
                <SelectItem value="feesAsc">Fees: low → high</SelectItem>
                <SelectItem value="feesDesc">Fees: high → low</SelectItem>
                <SelectItem value="avgDesc">Avg package</SelectItem>
                <SelectItem value="established">Established</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Max fees</span>
                <span className="font-medium">{formatFees(maxFees)}</span>
              </div>
              <Slider value={[maxFees]} onValueChange={(v) => setMaxFees(v[0])} min={100000} max={5000000} step={100000} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Min avg package</span>
                <span className="font-medium">{formatLPA(minPackage)}</span>
              </div>
              <Slider value={[minPackage]} onValueChange={(v) => setMinPackage(v[0])} min={0} max={40} step={1} />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="rounded-full w-full" onClick={() => { setQ(""); setType("all"); setSort("nirf"); setMaxFees(5000000); setMinPackage(0); }}>
                Reset filters
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-5">College</th>
                  <th className="px-5 py-5">NIRF</th>
                  <th className="px-5 py-5">Fees</th>
                  <th className="px-5 py-5">Avg pkg</th>
                  <th className="px-5 py-5">Highest</th>
                  <th className="px-5 py-5">Exams</th>
                  <th className="px-5 py-5">Cutoff</th>
                  <th className="px-5 py-5">Est.</th>
                  <th className="px-5 py-5"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={9} className="p-8"><Skeleton className="h-48 w-full" /></td></tr>
                )}
                {rows.map((c) => {
                  const inCompare = compare.some((p) => p.id === c.id);
                  return (
                    <tr
                      key={c.id}
                      className="border-b last:border-0 hover:bg-orange-50/50 dark:hover:bg-orange-500/5 transition-colors cursor-pointer"
                      onClick={() => setSelected(c)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-white border flex items-center justify-center overflow-hidden shrink-0">
                            {c.logoUrl ? (
                              <img src={c.logoUrl} alt={c.shortName ?? c.name} className="h-full w-full object-contain p-1.5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            ) : (
                              <span className="font-display font-bold text-orange-600 text-xs">{(c.shortName ?? c.name).slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-base">{c.shortName ?? c.name}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" /> {c.city}, {c.state}
                            </div>
                            <Badge variant="outline" className="mt-2 text-[10px]">{c.type}</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 font-display font-bold text-xl text-orange-600">{c.nirfRank ?? "—"}</td>
                      <td className="px-5 py-5 font-medium">{formatFees(c.fees)}</td>
                      <td className="px-5 py-5 font-medium text-green-700">{formatLPA(c.avgPackage)}</td>
                      <td className="px-5 py-5 font-medium">{formatLPA(c.highestPackage)}</td>
                      <td className="px-5 py-5 text-xs max-w-[140px]">{c.exams}</td>
                      <td className="px-5 py-5 text-xs max-w-[140px]">{c.cutoff}</td>
                      <td className="px-5 py-5 text-xs">{c.established}</td>
                      <td className="px-5 py-5">
                        <Button
                          size="sm"
                          variant={inCompare ? "default" : "outline"}
                          className="rounded-full"
                          onClick={(e) => { e.stopPropagation(); toggleCompare(c); }}
                          disabled={!inCompare && compare.length >= 3}
                        >
                          {inCompare ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!isLoading && rows.length === 0 && (
            <div className="p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">No colleges match your filters</h3>
              <p className="mt-1 text-sm text-muted-foreground">Try widening the fee range or clearing the search.</p>
            </div>
          )}
        </div>
      </div>

      {/* compare tray */}
      <AnimatePresence>
        {compare.length > 0 && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            className="fixed bottom-5 inset-x-0 z-40 flex justify-center px-4"
          >
            <div className="flex items-center gap-3 rounded-full border bg-stone-950 text-white pl-5 pr-2 py-2 shadow-2xl">
              <GitCompareArrows className="h-4 w-4 text-orange-400" />
              <div className="flex -space-x-2">
                {compare.map((c) => (
                  <span key={c.id} title={c.name} className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 border-2 border-stone-950 flex items-center justify-center text-[10px] font-bold">
                    {(c.shortName ?? c.name).slice(0, 2).toUpperCase()}
                  </span>
                ))}
              </div>
              <span className="text-sm text-stone-400">{compare.length}/3 selected</span>
              <Button
                size="sm"
                className="rounded-full"
                disabled={compare.length < 2}
                onClick={() => setCompareOpen(true)}
              >
                Compare
              </Button>
              <Button size="icon" variant="ghost" className="rounded-full text-stone-400" onClick={() => setCompare([])}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* college detail dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{selected?.shortName ?? selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-2xl bg-white border flex items-center justify-center overflow-hidden shrink-0">
                    {selected.logoUrl ? (
                      <img src={selected.logoUrl} alt={selected.shortName ?? selected.name} className="h-full w-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <span className="font-display font-bold text-orange-600 text-2xl">{(selected.shortName ?? selected.name).slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {selected.city}, {selected.state}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">{selected.type}</Badge>
                      <Badge variant="outline">Est. {selected.established}</Badge>
                    </div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {selected.name} is a {selected.type} B-school in {selected.city}, {selected.state}. Established in {selected.established}, it accepts {selected.exams} and has a NIRF rank of {selected.nirfRank ?? "N/A"}.
                </p>
                {selected.website && (
                  <Button variant="outline" className="rounded-full" size="sm" asChild>
                    <a href={selected.website} target="_blank" rel="noreferrer">Visit official website</a>
                  </Button>
                )}
              </div>
              <div className="rounded-2xl border bg-muted/40 p-5 space-y-3">
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">NIRF rank</span><span className="font-display font-bold text-orange-600">{selected.nirfRank ?? "—"}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total fees</span><span className="font-semibold">{formatFees(selected.fees)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Avg package</span><span className="font-semibold text-green-700">{formatLPA(selected.avgPackage)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Highest package</span><span className="font-semibold">{formatLPA(selected.highestPackage)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Exams</span><span className="font-medium text-xs text-right max-w-[180px]">{selected.exams}</span></div>
                <div className="flex justify-between"><span className="text-sm text-muted-foreground">Cutoff</span><span className="font-medium text-xs text-right max-w-[180px]">{selected.cutoff}</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* compare dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-[95vw] w-full lg:max-w-[1400px] p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 sm:px-8 sm:py-6">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl sm:text-3xl text-white">Compare colleges</DialogTitle>
            </DialogHeader>
            <p className="text-white/80 text-sm mt-1">Green highlights the best value in each row.</p>
          </div>
          <div className="p-6 sm:p-8 overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid gap-0" style={{ gridTemplateColumns: `200px repeat(${compare.length}, 1fr)` }}>
                {/* header row */}
                <div className="p-4 font-semibold text-sm text-muted-foreground border-b"></div>
                {compare.map((c) => (
                  <div key={c.id} className="p-4 border-b border-l text-center">
                    <div className="h-16 w-16 mx-auto rounded-2xl bg-white border flex items-center justify-center overflow-hidden mb-3">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt={c.shortName ?? c.name} className="h-full w-full object-contain p-2" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <span className="font-display font-bold text-orange-600 text-xl">{(c.shortName ?? c.name).slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-lg leading-tight">{c.shortName ?? c.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><MapPin className="h-3 w-3" /> {c.city}</p>
                  </div>
                ))}

                {[
                  { label: "NIRF rank", key: "nirfRank", fmt: (v: number | null) => v ?? "—", better: "lower" },
                  { label: "Total fees", key: "fees", fmt: (v: number) => formatFees(v), better: "lower" },
                  { label: "Avg package", key: "avgPackage", fmt: (v: number | null) => formatLPA(v), better: "higher" },
                  { label: "Highest package", key: "highestPackage", fmt: (v: number | null) => formatLPA(v), better: "higher" },
                  { label: "Accepted exams", key: "exams", fmt: (v: string | null) => v ?? "—", better: null },
                  { label: "Cutoff", key: "cutoff", fmt: (v: string | null) => v ?? "—", better: null },
                  { label: "Established", key: "established", fmt: (v: number | null) => String(v ?? "—"), better: null },
                  { label: "Type", key: "type", fmt: (v: string) => v, better: null },
                ].map((row) => {
                  const values = compare.map((c) => c[row.key as keyof College]);
                  let bestIdx = -1;
                  if (row.better === "lower") {
                    const nums = values.map((v) => (typeof v === "number" ? v : Infinity));
                    const best = Math.min(...nums);
                    bestIdx = nums.indexOf(best);
                  } else if (row.better === "higher") {
                    const nums = values.map((v) => (typeof v === "number" ? v : -Infinity));
                    const best = Math.max(...nums);
                    bestIdx = nums.indexOf(best);
                  }
                  return (
                    <>
                      <div className="p-4 border-b font-medium text-sm text-muted-foreground flex items-center">{row.label}</div>
                      {compare.map((c, i) => (
                        <div
                          key={`${c.id}-${row.key}`}
                          className={`p-4 border-b border-l text-sm flex items-center justify-center text-center ${i === bestIdx ? "bg-green-50 text-green-800 font-semibold" : ""}`}
                        >
                          {row.fmt(c[row.key as keyof College] as never)}
                        </div>
                      ))}
                    </>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}
