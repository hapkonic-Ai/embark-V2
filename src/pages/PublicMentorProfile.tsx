import { useParams } from "react-router";
import { Link } from "react-router";
import { Check, Linkedin, Lock, MessageCircle, Users } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/format";

export default function PublicMentorProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.catalog.mentorBySlug.useQuery({ slug: slug ?? "" }, { enabled: !!slug });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/40">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 pt-28 pb-16">
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <div className="min-h-screen bg-muted/40">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 text-center">
          <h1 className="font-display text-3xl font-bold">Profile not found</h1>
          <p className="mt-2 text-muted-foreground">This mentor page does not exist or is not verified yet.</p>
          <Button className="mt-6 rounded-full" asChild><Link to="/mentors">Browse mentors</Link></Button>
        </div>
      </div>
    );
  }

  const { profile, name } = data;
  const expertise = profile.expertise?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-muted/40">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-28 pb-16">
        <div className="rounded-3xl border bg-card p-8 shadow-sm overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-orange-500 to-amber-500 -mx-8 -mt-8" />
          <div className="relative -mt-14 flex items-end justify-between gap-4">
            <img
              src={`https://i.pravatar.cc/300?u=${profile.id}`}
              alt={name ?? "Mentor"}
              className="h-28 w-28 rounded-3xl border-4 border-card object-cover"
              onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name ?? "EM")}&background=f97316&color=fff`; }}
            />
            {profile.isVerified && (
              <Badge className="mb-4 bg-green-100 text-green-700 border-0">
                <Check className="mr-1 h-3 w-3" /> Verified
              </Badge>
            )}
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold">{name}</h1>
          <p className="text-orange-600 font-medium">{profile.headline}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {profile.bschool}</span>
            <span>·</span>
            <span>{profile.company}</span>
            <span>·</span>
            <span>{profile.yearsExp} years exp</span>
          </div>

          {expertise.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {expertise.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}

          {profile.bio && (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
          )}

          <div className="mt-8 rounded-2xl border bg-muted/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Full mentorship package</div>
                {isAuthenticated ? (
                  <div className="font-display text-3xl font-bold">{formatINR(profile.price)}</div>
                ) : (
                  <div className="font-display text-3xl font-bold text-muted-foreground flex items-center gap-2">
                    <Lock className="h-5 w-5" /> —
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">Includes {profile.mockGds} mock GDs + {profile.mockPis} mock PIs</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.linkedinUrl && (
                  <Button variant="outline" className="rounded-full" asChild>
                    <a href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                      <Linkedin className="mr-1.5 h-4 w-4" /> LinkedIn
                    </a>
                  </Button>
                )}
                {profile.whatsapp && (
                  <Button className="rounded-full" asChild>
                    <a href={`https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                    </a>
                  </Button>
                )}
                <Button className="rounded-full bg-orange-600 hover:bg-orange-700" asChild>
                  <Link to={`/mentors/${profile.id}`}>Book on Embark</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Powered by Embark</p>
            <Button variant="link" className="px-0 text-xs text-orange-600" asChild>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
              >
                Share on LinkedIn
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
