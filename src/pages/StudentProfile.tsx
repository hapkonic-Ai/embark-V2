import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Check, GraduationCap, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type ParsedDetails = {
  headline?: string;
  summary?: string;
  skills?: string[];
  education?: {
    institution?: string; degree?: string; fieldOfStudy?: string;
    startDate?: string; endDate?: string; grade?: string;
  }[];
  experience?: {
    company?: string; role?: string; startDate?: string; endDate?: string; isCurrent?: boolean;
  }[];
};

export default function StudentProfile() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 pt-24"><Skeleton className="h-96 rounded-3xl" /></div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="min-h-screen bg-muted/40">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-24 pb-16">
        <Button variant="outline" className="rounded-full" asChild>
          <Link to="/dashboard"><ArrowLeft className="mr-1.5 h-4 w-4" /> Back to dashboard</Link>
        </Button>
        <div className="mt-6">
          <ProfileContent />
        </div>
      </div>
    </div>
  );
}

export function ProfileContent() {
  const { user, isLoading } = useAuth();
  const utils = trpc.useUtils();
  const { data: onboarding } = trpc.candidate.studentOnboarding.useQuery();
  const [form, setForm] = useState({ name: "", phone: "", linkedinUrl: "" });
  const [hasHydrated, setHasHydrated] = useState(false);

  const update = trpc.account.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile saved");
      await utils.auth.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!hasHydrated && user) {
      setHasHydrated(true);
      setForm({
        name: user.name ?? "",
        phone: user.phone ?? "",
        linkedinUrl: user.linkedinUrl ?? "",
      });
    }
  }, [user, hasHydrated]);

  if (isLoading) {
    return <Skeleton className="h-96 rounded-3xl" />;
  }
  if (!user) return null;

  const profileComplete = !!(user.phone && user.linkedinUrl);
  const parsed = (onboarding?.parsedData ?? null) as ParsedDetails | null;
  const hasParsedDetails = !!parsed && !!(
    parsed.headline || parsed.summary || (parsed.skills?.length ?? 0) > 0 ||
    (parsed.education?.length ?? 0) > 0 || (parsed.experience?.length ?? 0) > 0
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-7 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">My profile</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                These basic details help mentors vet you before accepting a mentorship.
              </p>
            </div>
            {profileComplete && (
              <div className="flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                <Check className="h-3.5 w-3.5" /> Complete
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Email</Label>
              <Input value={user.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Full name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Phone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">LinkedIn profile *</Label>
              <Input
                value={form.linkedinUrl}
                onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/your-handle"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              className="rounded-full"
              disabled={update.isPending || form.name.trim().length < 2}
              onClick={() => update.mutate({
                name: form.name.trim(),
                phone: form.phone.trim(),
                linkedinUrl: form.linkedinUrl.trim(),
              })}
            >
              {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save profile
            </Button>
          </div>
        </div>

        {/* resume-derived details */}
        <div className="rounded-3xl border bg-card p-7 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Resume profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Details extracted from your resume during onboarding.
              </p>
            </div>
            <Button variant="outline" className="rounded-full shrink-0" asChild>
              <Link to="/student/onboarding">
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Update from resume
              </Link>
            </Button>
          </div>

          {hasParsedDetails ? (
            <div className="mt-6 space-y-6">
              {parsed?.headline && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Headline</div>
                  <p className="mt-1 text-sm font-medium">{parsed.headline}</p>
                </div>
              )}
              {parsed?.summary && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Summary</div>
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{parsed.summary}</p>
                </div>
              )}
              {(parsed?.skills?.length ?? 0) > 0 && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Skills</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {parsed?.skills?.map((s) => (
                      <span key={s} className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700 dark:bg-orange-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(parsed?.education?.length ?? 0) > 0 && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" /> Education
                  </div>
                  <div className="mt-2 space-y-2">
                    {parsed?.education?.map((e, i) => (
                      <div key={i} className="rounded-2xl border bg-muted/40 p-3 text-sm">
                        <div className="font-medium">{e.degree || "Degree"}{e.fieldOfStudy ? ` · ${e.fieldOfStudy}` : ""}</div>
                        <div className="text-muted-foreground">{e.institution}{e.grade ? ` · ${e.grade}` : ""}</div>
                        {(e.startDate || e.endDate) && (
                          <div className="text-xs text-muted-foreground">{e.startDate} — {e.endDate || "Present"}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(parsed?.experience?.length ?? 0) > 0 && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Experience</div>
                  <div className="mt-2 space-y-2">
                    {parsed?.experience?.map((e, i) => (
                      <div key={i} className="rounded-2xl border bg-muted/40 p-3 text-sm">
                        <div className="font-medium">{e.role || "Role"}{e.company ? ` at ${e.company}` : ""}</div>
                        <div className="text-xs text-muted-foreground">
                          {e.startDate} — {e.isCurrent ? "Present" : e.endDate || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              No resume details yet. Upload your resume in the onboarding to auto-fill your education,
              experience and skills.
            </p>
          )}
        </div>
    </div>
  );
}
