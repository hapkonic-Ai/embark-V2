import { useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Briefcase, ExternalLink, GraduationCap, Linkedin, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import SiteLayout from "@/components/site/SiteLayout";
import PaymentModal from "@/components/PaymentModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";

export default function MentorDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.catalog.mentor.useQuery({ id: Number(id) });
  const [payOpen, setPayOpen] = useState(false);
  const utils = trpc.useUtils();

  const purchase = trpc.candidate.purchaseMentorship.useMutation({
    onSuccess: (r) => {
      toast.success("Mentorship unlocked!", {
        description: r.whatsapp
          ? `Connect with your mentor on WhatsApp: ${r.whatsapp}`
          : "Check your dashboard for next steps.",
        duration: 10000,
      });
      utils.candidate.myMentorships.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-4 py-14"><Skeleton className="h-96 rounded-3xl" /></div>
      </SiteLayout>
    );
  }
  if (!data) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-4 py-24 text-center">Mentor not found.</div>
      </SiteLayout>
    );
  }
  const p = data.profile;

  const cta = () => {
    if (!isAuthenticated) {
      toast("Sign in first", { description: "Create a free candidate account to book a mentor." });
      return;
    }
    if (user?.role !== "candidate") {
      toast.error("Only candidate accounts can book mentorships.");
      return;
    }
    setPayOpen(true);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/mentors"><ArrowLeft className="mr-1.5 h-4 w-4" /> All mentors</Link>
        </Button>

        <div className="grid gap-8 md:grid-cols-[1fr_360px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-5">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-display text-4xl font-bold text-white shadow-xl shadow-orange-500/25">
                {data.name?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold flex items-center gap-2">
                  {data.name}
                  {p.isVerified && <BadgeCheck className="h-6 w-6 text-green-600" />}
                </h1>
                <p className="text-orange-600 font-medium mt-1">{p.headline}</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { icon: GraduationCap, label: p.bschool, sub: "Alma mater" },
                { icon: Briefcase, label: p.company, sub: "Worked at" },
                { icon: Users, label: `${p.yearsExp}+ yrs`, sub: "Experience" },
              ].map((s) => (
                <div key={s.sub} className="rounded-2xl border bg-card p-4 text-center">
                  <s.icon className="mx-auto h-5 w-5 text-orange-500" />
                  <div className="mt-2 font-display font-semibold text-sm">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {p.linkedinUrl && (
                <Button variant="outline" className="rounded-full" asChild>
                  <a href={p.linkedinUrl} target="_blank" rel="noreferrer">
                    <Linkedin className="mr-1.5 h-4 w-4" /> View LinkedIn
                  </a>
                </Button>
              )}
              {p.publicSlug && (
                <Button variant="outline" className="rounded-full" asChild>
                  <Link to={`/m/${p.publicSlug}`}>
                    <ExternalLink className="mr-1.5 h-4 w-4" /> Public profile
                  </Link>
                </Button>
              )}
            </div>

            <div className="mt-8 rounded-3xl border bg-card p-7">
              <h2 className="font-display text-xl font-semibold">About</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{p.bio}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {p.expertise?.split(",").map((t) => (
                  <Badge key={t} variant="secondary">{t.trim()}</Badge>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-fit rounded-3xl border bg-card p-7 shadow-lg sticky top-24"
          >
            <div className="font-display text-4xl font-bold">{formatINR(p.price)}</div>
            <p className="text-sm text-muted-foreground">complete mentorship package</p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex justify-between"><span>Mock GDs included</span><b>{p.mockGds}</b></li>
              <li className="flex justify-between"><span>Mock interviews included</span><b>{p.mockPis}</b></li>
              <li className="flex justify-between"><span>1:1 guidance</span><b>∞</b></li>
              <li className="flex justify-between"><span>Channel</span><b className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5 text-green-600" /> WhatsApp</b></li>
            </ul>
            <Button onClick={cta} className="mt-7 w-full btn-shine rounded-full h-11">
              Book this mentor
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              WhatsApp number revealed right after booking.
            </p>
          </motion.aside>
        </div>
      </div>

      <PaymentModal
        open={payOpen}
        onOpenChange={setPayOpen}
        amount={p.price}
        title={`Mentorship with ${data.name}`}
        onConfirm={async () => { await purchase.mutateAsync({ mentorProfileId: p.id }); }}
      />
    </SiteLayout>
  );
}
