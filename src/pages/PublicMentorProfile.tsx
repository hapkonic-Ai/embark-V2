import { useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, BadgeCheck, Briefcase, GraduationCap, Linkedin, Lock, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { isExpertEnabled } from "@contracts/features";
import SiteLayout from "@/components/site/SiteLayout";
import { DocumentHead } from "@/components/site/DocumentHead";
import PublicExpertPage from "@/components/expert/PublicExpertPage";
import PaymentModal from "@/components/PaymentModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";
import { mentorImage, fallbackFace } from "@/lib/images";

export default function PublicMentorProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated } = useAuth();
  const expertEnabled = isExpertEnabled();
  const [payOpen, setPayOpen] = useState(false);

  const { data: expertData, isLoading: expertLoading } = trpc.catalog.expertPageBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug && expertEnabled },
  );
  const { data, isLoading: mentorLoading } = trpc.catalog.mentorBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug && (!expertEnabled || !expertData) },
  );

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
      setPayOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const isLoading = (expertEnabled && expertLoading) || (mentorLoading && (!expertEnabled || !expertData));

  if (isLoading) {
    return (
      <SiteLayout>
        <DocumentHead title="Profile" path={`m/${slug}`} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-28 pb-16">
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </SiteLayout>
    );
  }

  if (expertEnabled && expertData?.page) {
    const expertProfile = expertData.profile;
    const expertTitle = expertProfile?.displayName || expertData.user?.name || "Expert profile";
    return (
      <>
        <DocumentHead
          title={expertTitle}
          description={expertProfile?.headline || expertProfile?.bio || `${expertTitle} on Arena for grads`}
          path={`m/${slug}`}
        />
        <PublicExpertPage data={expertData} />
      </>
    );
  }

  if (!data?.profile) {
    return (
      <SiteLayout>
        <DocumentHead title="Profile not found" path={`m/${slug}`} noIndex />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-28 pb-16 text-center">
          <h1 className="font-display text-3xl font-bold">Profile not found</h1>
          <p className="mt-2 text-muted-foreground">This mentor page does not exist or is not verified yet.</p>
          <Button className="mt-6 rounded-full" asChild><Link to="/mentors">Browse mentors</Link></Button>
        </div>
      </SiteLayout>
    );
  }

  const { profile, name, role } = data;
  const isExpert = role === "expert";
  const displayName = profile.displayName ?? name ?? "Mentor";
  const expertise = profile.expertise?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const isVerified = profile.isVerified || profile.verificationStatus === "verified";
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleBook = () => {
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
      <DocumentHead
        title={displayName}
        description={profile.headline || profile.bio || `${displayName} is a verified mentor on Arena for grads.`}
        path={`m/${slug}`}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-16">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/mentors"><ArrowLeft className="mr-1.5 h-4 w-4" /> All mentors</Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative h-48 sm:h-64 rounded-3xl overflow-hidden">
              {profile.coverImage ? (
                <img
                  src={profile.coverImage}
                  alt={`${displayName} cover photo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-r from-orange-500 to-amber-500" />
              )}
            </div>

            <div className="relative -mt-16 sm:-mt-20 px-2 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <img
                  src={profile.profileImage ?? mentorImage(displayName, profile.bschool ?? "IIM")}
                  alt={displayName}
                  className="h-32 w-32 sm:h-40 sm:w-40 rounded-3xl border-4 border-background object-cover shadow-xl"
                  onError={(e) => { e.currentTarget.src = fallbackFace(displayName); }}
                />
                {isVerified && (
                  <Badge className="mb-4 bg-green-100 text-green-700 border-0">
                    <BadgeCheck className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>

              <h1 className="mt-5 font-display text-3xl sm:text-4xl font-bold">{displayName}</h1>
              <p className="text-orange-600 font-medium text-lg">{profile.headline || profile.currentRole}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {!isExpert && <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {profile.bschool}</span>}
                {!isExpert && <span>·</span>}
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {profile.company}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {profile.yearsExp} years exp</span>
              </div>

              {expertise.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {expertise.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}

              {profile.bio && (
                <div className="mt-8 rounded-3xl border bg-card p-7">
                  <h2 className="font-display text-xl font-semibold">About</h2>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{profile.bio}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {profile.linkedinUrl && (
                  <Button variant="outline" className="rounded-full" asChild>
                    <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                      <Linkedin className="mr-1.5 h-4 w-4" /> View LinkedIn
                    </a>
                  </Button>
                )}
                {profile.whatsapp && (
                  <Button variant="outline" className="rounded-full" asChild>
                    <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="h-fit rounded-3xl border bg-card p-7 shadow-lg lg:sticky lg:top-24"
          >
            {!isExpert && (
              <div className="rounded-2xl bg-muted/40 p-5 mb-6">
                <div className="text-sm text-muted-foreground">Full mentorship package</div>
                {isAuthenticated ? (
                  <div className="font-display text-4xl font-bold">{formatINR(profile.price)}</div>
                ) : (
                  <div className="font-display text-4xl font-bold text-muted-foreground flex items-center gap-2">
                    <Lock className="h-5 w-5" /> —
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  Includes {profile.mockGds} mock GDs + {profile.mockPis} mock PIs
                </div>
              </div>
            )}

            <ul className="space-y-3 text-sm">
              <li className="flex justify-between"><span>Mock GDs included</span><b>{profile.mockGds}</b></li>
              <li className="flex justify-between"><span>Mock interviews included</span><b>{profile.mockPis}</b></li>
              <li className="flex justify-between"><span>1:1 guidance</span><b>∞</b></li>
              <li className="flex justify-between"><span>Channel</span><b className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5 text-green-600" /> WhatsApp</b></li>
            </ul>

            {isAuthenticated ? (
              <Button onClick={handleBook} className="mt-7 w-full btn-shine rounded-full h-11">
                Book this mentor
              </Button>
            ) : (
              <Button asChild className="mt-7 w-full rounded-full h-11">
                <Link to="/login">Sign in to book</Link>
              </Button>
            )}

            <p className="mt-3 text-center text-xs text-muted-foreground">
              WhatsApp number revealed right after booking.
            </p>

            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
              <span>Powered by Arena for grads</span>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="text-orange-600 hover:underline"
              >
                Share on LinkedIn
              </a>
            </div>
          </motion.aside>
        </div>
      </div>

      <PaymentModal
        open={payOpen}
        onOpenChange={setPayOpen}
        amount={profile.price}
        title={`Mentorship with ${displayName}`}
        onConfirm={async () => { await purchase.mutateAsync({ mentorProfileId: profile.id }); }}
      />
    </SiteLayout>
  );
}
