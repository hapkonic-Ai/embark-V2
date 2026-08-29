import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  Briefcase,
  Check,
  ChevronRight,
  FileText,
  GraduationCap,
  Loader2,
  Upload,
  User,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/site/Navbar";
import ImageUploadField from "@/components/expert/ImageUploadField";

function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

type ResumeIdentity = { name?: string; email?: string; phone?: string };
type ResumeLinks = { linkedin?: string; github?: string; portfolio?: string; website?: string };
type ResumeExperience = {
  company?: string;
  role?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
};
type ResumeEducation = {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  description?: string;
};
type ParsedProposal = {
  identity: ResumeIdentity;
  links: ResumeLinks;
  headline?: string;
  summary?: string;
  currentRole?: string;
  currentCompany?: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
};

const STEPS = [
  { id: "resume", label: "Upload resume", icon: FileText },
  { id: "resume_review", label: "Review details", icon: User },
  { id: "profile", label: "Basic profile", icon: User },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "verification", label: "Submit", icon: Check },
] as const;

type OnboardingStep = (typeof STEPS)[number]["id"] | "account";

export default function ExpertOnboarding() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("resume");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedProposal | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const me = trpc.expert.me.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const existingResume = trpc.expert.getResume.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const uploadMutation = trpc.expert.uploadResume.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const confirmMutation = trpc.expert.confirmParsedProfile.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const updateOnboarding = trpc.expert.updateOnboarding.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const utils = trpc.useUtils();
  const submitVerification = trpc.expert.submitVerification.useMutation({
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (me.data?.onboarding?.currentStep) {
      const step = me.data.onboarding.currentStep as OnboardingStep;
      setCurrentStep(step === "account" ? "resume" : step);
    }
  }, [me.data]);

  useEffect(() => {
    if (existingResume.data?.parsedData) {
      setParsed(existingResume.data.parsedData as ParsedProposal);
    }
  }, [existingResume.data]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Resume must be under 8 MB.");
      return;
    }
    const accepted = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!accepted.includes(file.type)) {
      toast.error("Please upload a PDF, DOC, DOCX, or TXT file.");
      return;
    }
    setResumeFile(file);
  }

  async function uploadResume() {
    if (!resumeFile) return;
    setIsUploading(true);
    try {
      const base64 = await fileToBase64(resumeFile);
      const result = await uploadMutation.mutateAsync({
        fileName: resumeFile.name,
        fileMime: resumeFile.type,
        fileBase64: base64.split(",")[1],
      });
      setParsed(result.parsed);
      toast.success("Resume uploaded and parsed.");
      goToStep("resume_review");
    } finally {
      setIsUploading(false);
    }
  }

  function goToStep(step: OnboardingStep) {
    setCurrentStep(step);
    updateOnboarding.mutate({ currentStep: step, status: "in_progress" });
  }

  if (authLoading || me.isLoading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 pt-24">
          <Skeleton className="h-[60vh] rounded-3xl" />
        </div>
      </>
    );
  }

  if (!user) return null;

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = Math.round((((stepIndex < 0 ? 0 : stepIndex) + 1) / STEPS.length) * 100);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-24 pb-16">
          <div className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Become an Embark Expert
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              Complete your profile so students can discover and book you.
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Onboarding progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
            <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const active = s.id === currentStep;
                const done = stepIndex > i;
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentStep(s.id)}
                    className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors text-left ${
                      active
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                        : done
                          ? "text-green-700 bg-green-50"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                    {done && <Check className="ml-auto h-3.5 w-3.5" />}
                  </button>
                );
              })}
            </nav>

            <div className="min-w-0">
              {currentStep === "resume" && (
                <ResumeUploadStep
                  file={resumeFile}
                  onFileSelect={handleFileSelect}
                  onUpload={uploadResume}
                  isUploading={isUploading}
                  onSkip={() => goToStep("profile")}
                />
              )}
              {currentStep === "resume_review" && parsed && (
                <ParsedReviewStep
                  parsed={parsed}
                  onContinue={(confirmed) => {
                    confirmMutation.mutate(confirmed as Parameters<typeof confirmMutation.mutate>[0], {
                      onSuccess: () => goToStep("profile"),
                    });
                  }}
                  isLoading={confirmMutation.isPending}
                />
              )}
              {currentStep === "profile" && (
                <ProfileStep
                  onComplete={() => goToStep("experience")}
                />
              )}
              {currentStep === "experience" && (
                <ExperienceStep
                  onComplete={() => goToStep("education")}
                />
              )}
              {currentStep === "education" && (
                <EducationStep
                  onComplete={() => goToStep("verification")}
                />
              )}
              {currentStep === "verification" && (
                <CompleteStep
                  onSubmit={async () => {
                    submitVerification.mutate(undefined, {
                      onSuccess: async () => {
                        toast.success("Profile submitted for verification.");
                        await utils.expert.me.invalidate();
                        await utils.expert.myProfile.invalidate();
                        navigate("/expert/dashboard", { replace: true });
                      },
                    });
                  }}
                  isLoading={submitVerification.isPending}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ResumeUploadStep({
  file,
  onFileSelect,
  onUpload,
  isUploading,
  onSkip,
}: {
  file: File | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  isUploading: boolean;
  onSkip: () => void;
}) {
  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <h2 className="font-display text-xl font-semibold">Upload your resume</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We will extract your profile details. You can review and edit everything before publishing.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed p-10 text-center">
        <Upload className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">PDF, DOC, DOCX or TXT — max 8 MB</p>
        <Label className="mt-4 cursor-pointer">
          <Input type="file" className="hidden" onChange={onFileSelect} accept=".pdf,.doc,.docx,.txt" />
          <Button variant="outline" className="rounded-full" asChild>
            <span>Choose file</span>
          </Button>
        </Label>
        {file && (
          <div className="mt-4 text-sm">
            <span className="font-medium">{file.name}</span>
            <span className="ml-2 text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <Button
          className="rounded-full"
          disabled={!file || isUploading}
          onClick={onUpload}
        >
          {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Upload & parse
        </Button>
      </div>
    </div>
  );
}

function ParsedReviewStep({
  parsed,
  onContinue,
  isLoading,
}: {
  parsed: ParsedProposal;
  onContinue: (confirmed: ParsedProposal) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState(() => ({
    identity: {
      name: parsed.identity?.name ?? "",
      email: parsed.identity?.email ?? "",
      phone: parsed.identity?.phone ?? "",
    },
    links: {
      linkedin: parsed.links?.linkedin ?? "",
      github: parsed.links?.github ?? "",
      portfolio: parsed.links?.portfolio ?? "",
      website: parsed.links?.website ?? "",
    },
    headline: parsed.headline ?? "",
    summary: parsed.summary ?? "",
    currentRole: parsed.currentRole ?? "",
    currentCompany: parsed.currentCompany ?? "",
    experience: parsed.experience?.map((e: ResumeExperience) => ({
      company: e.company ?? "",
      role: e.role ?? "",
      location: e.location ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      isCurrent: e.isCurrent ?? false,
      description: e.description ?? "",
    })) ?? [],
    education: parsed.education?.map((e: ResumeEducation) => ({
      institution: e.institution ?? "",
      degree: e.degree ?? "",
      fieldOfStudy: e.fieldOfStudy ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      grade: e.grade ?? "",
      description: e.description ?? "",
    })) ?? [],
    skills: parsed.skills?.join(", ") ?? "",
  }));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-7 shadow-sm">
        <h2 className="font-display text-xl font-semibold">Review extracted details</h2>
        <p className="text-sm text-muted-foreground">Edit anything that looks incorrect.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={form.identity.name} onChange={(v) => setForm((f) => ({ ...f, identity: { ...f.identity, name: v } }))} />
          <Field label="Email" value={form.identity.email} onChange={(v) => setForm((f) => ({ ...f, identity: { ...f.identity, email: v } }))} />
          <Field label="Phone" value={form.identity.phone} onChange={(v) => setForm((f) => ({ ...f, identity: { ...f.identity, phone: v } }))} />
          <Field label="Headline" value={form.headline} onChange={(v) => setForm((f) => ({ ...f, headline: v }))} />
          <Field label="Current role" value={form.currentRole} onChange={(v) => setForm((f) => ({ ...f, currentRole: v }))} />
          <Field label="Current company" value={form.currentCompany} onChange={(v) => setForm((f) => ({ ...f, currentCompany: v }))} />
          <Field label="LinkedIn" value={form.links.linkedin} onChange={(v) => setForm((f) => ({ ...f, links: { ...f.links, linkedin: v } }))} />
          <Field label="GitHub" value={form.links.github} onChange={(v) => setForm((f) => ({ ...f, links: { ...f.links, github: v } }))} />
          <div className="sm:col-span-2">
            <Field label="Summary" value={form.summary} onChange={(v) => setForm((f) => ({ ...f, summary: v }))} textarea />
          </div>
          <div className="sm:col-span-2">
            <Field label="Skills (comma separated)" value={form.skills} onChange={(v) => setForm((f) => ({ ...f, skills: v }))} />
          </div>
        </div>

        <h3 className="mt-8 font-semibold">Experience</h3>
        <div className="mt-3 space-y-3">
          {form.experience.map((exp, i) => (
            <div key={i} className="rounded-2xl border bg-muted/40 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Company" value={exp.company} onChange={(v) => {
                  const next = [...form.experience];
                  next[i].company = v;
                  setForm((f) => ({ ...f, experience: next }));
                }} />
                <Field label="Role" value={exp.role} onChange={(v) => {
                  const next = [...form.experience];
                  next[i].role = v;
                  setForm((f) => ({ ...f, experience: next }));
                }} />
                <Field label="Start date" value={exp.startDate} onChange={(v) => {
                  const next = [...form.experience];
                  next[i].startDate = v;
                  setForm((f) => ({ ...f, experience: next }));
                }} />
                <Field label="End date" value={exp.endDate} onChange={(v) => {
                  const next = [...form.experience];
                  next[i].endDate = v;
                  setForm((f) => ({ ...f, experience: next }));
                }} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`current-${i}`}
                  checked={exp.isCurrent}
                  onChange={(e) => {
                    const next = [...form.experience];
                    next[i].isCurrent = e.target.checked;
                    setForm((f) => ({ ...f, experience: next }));
                  }}
                />
                <Label htmlFor={`current-${i}`} className="text-sm">Current role</Label>
              </div>
            </div>
          ))}
          {form.experience.length === 0 && <p className="text-sm text-muted-foreground">No experience found.</p>}
        </div>

        <h3 className="mt-8 font-semibold">Education</h3>
        <div className="mt-3 space-y-3">
          {form.education.map((edu, i) => (
            <div key={i} className="rounded-2xl border bg-muted/40 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Institution" value={edu.institution} onChange={(v) => {
                  const next = [...form.education];
                  next[i].institution = v;
                  setForm((f) => ({ ...f, education: next }));
                }} />
                <Field label="Degree" value={edu.degree} onChange={(v) => {
                  const next = [...form.education];
                  next[i].degree = v;
                  setForm((f) => ({ ...f, education: next }));
                }} />
                <Field label="Field of study" value={edu.fieldOfStudy} onChange={(v) => {
                  const next = [...form.education];
                  next[i].fieldOfStudy = v;
                  setForm((f) => ({ ...f, education: next }));
                }} />
                <Field label="End date" value={edu.endDate} onChange={(v) => {
                  const next = [...form.education];
                  next[i].endDate = v;
                  setForm((f) => ({ ...f, education: next }));
                }} />
              </div>
            </div>
          ))}
          {form.education.length === 0 && <p className="text-sm text-muted-foreground">No education found.</p>}
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            className="rounded-full"
            disabled={isLoading}
            onClick={() => {
              const payload = {
                ...form,
                skills: form.skills
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              };
              onContinue(payload);
            }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & continue
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProfileStep({ onComplete }: { onComplete: () => void }) {
  const { data, isLoading } = trpc.expert.myProfile.useQuery();
  const upsert = trpc.expert.upsertProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile saved");
      onComplete();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState(() => ({
    displayName: "",
    headline: "",
    bio: "",
    profileImage: "",
    coverImage: "",
    location: "",
    country: "",
    timezone: "Asia/Kolkata",
    currentRole: "",
    company: "",
    expertise: "",
    industries: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    websiteUrl: "",
    publicSlug: "",
  }));

  useEffect(() => {
    if (data?.profile) {
      setForm({
        displayName: data.profile.displayName ?? "",
        headline: data.profile.headline ?? "",
        bio: data.profile.bio ?? "",
        profileImage: data.profile.profileImage ?? "",
        coverImage: data.profile.coverImage ?? "",
        location: data.profile.location ?? "",
        country: data.profile.country ?? "",
        timezone: data.profile.timezone || "Asia/Kolkata",
        currentRole: data.profile.currentRole ?? "",
        company: data.profile.company ?? "",
        expertise: data.profile.expertise ?? "",
        industries: data.profile.industries ?? "",
        linkedinUrl: data.profile.linkedinUrl ?? "",
        githubUrl: data.profile.githubUrl ?? "",
        portfolioUrl: data.profile.portfolioUrl ?? "",
        websiteUrl: data.profile.websiteUrl ?? "",
        publicSlug: data.profile.publicSlug ?? "",
      });
    }
  }, [data]);

  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />;

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <h2 className="font-display text-xl font-semibold">Basic profile</h2>
      <p className="text-sm text-muted-foreground">This is what students will see on your public page.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Display name" value={form.displayName} onChange={(v) => update("displayName", v)} />
        <Field label="Professional headline" value={form.headline} onChange={(v) => update("headline", v)} />
        <div className="sm:col-span-2">
          <Field label="About you" value={form.bio} onChange={(v) => update("bio", v)} textarea />
        </div>
        <div className="flex gap-6 sm:col-span-2">
          <ImageUploadField
            label="Profile photo"
            value={form.profileImage}
            onChange={(v) => update("profileImage", v)}
            disabled={upsert.isPending}
          />
          <ImageUploadField
            label="Cover image"
            value={form.coverImage}
            onChange={(v) => update("coverImage", v)}
            disabled={upsert.isPending}
          />
        </div>
        <Field label="Location" value={form.location} onChange={(v) => update("location", v)} />
        <Field label="Country" value={form.country} onChange={(v) => update("country", v)} />
        <Field label="Timezone" value={form.timezone} onChange={(v) => update("timezone", v)} />
        <Field label="Current role" value={form.currentRole} onChange={(v) => update("currentRole", v)} />
        <Field label="Company" value={form.company} onChange={(v) => update("company", v)} />
        <Field label="Expertise (comma separated)" value={form.expertise} onChange={(v) => update("expertise", v)} />
        <Field label="Industries (comma separated)" value={form.industries} onChange={(v) => update("industries", v)} />
        <Field label="LinkedIn" value={form.linkedinUrl} onChange={(v) => update("linkedinUrl", v)} />
        <Field label="GitHub" value={form.githubUrl} onChange={(v) => update("githubUrl", v)} />
        <Field label="Portfolio" value={form.portfolioUrl} onChange={(v) => update("portfolioUrl", v)} />
        <Field label="Website" value={form.websiteUrl} onChange={(v) => update("websiteUrl", v)} />
        <div className="sm:col-span-2">
          <Field
            label="Public profile slug"
            value={form.publicSlug}
            onChange={(v) => update("publicSlug", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button
          className="rounded-full"
          disabled={upsert.isPending}
          onClick={() => {
            if (!form.timezone || !isValidTimezone(form.timezone)) {
              toast.error("Please choose a valid timezone such as Asia/Kolkata.");
              return;
            }
            upsert.mutate(form);
          }}
        >
          {upsert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save & continue
        </Button>
      </div>
    </div>
  );
}

function ExperienceStep({ onComplete }: { onComplete: () => void }) {
  const { data, isLoading, refetch } = trpc.expert.myExperience.useQuery();
  const create = trpc.expert.createExperience.useMutation({
    onSuccess: () => {
      toast.success("Experience added");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    company: "",
    role: "",
    employmentType: "",
    location: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />;

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <h2 className="font-display text-xl font-semibold">Experience</h2>
      <p className="text-sm text-muted-foreground">Add at least one role to build credibility.</p>
      <div className="mt-6 space-y-4">
        {data?.map((exp) => (
          <div key={exp.id} className="rounded-2xl border bg-muted/40 p-4">
            <div className="font-semibold">
              {exp.role || "Role"} at {exp.company}
            </div>
            <div className="text-sm text-muted-foreground">
              {exp.startDate} — {exp.isCurrent ? "Present" : exp.endDate}
            </div>
          </div>
        ))}
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Company *" value={form.company} onChange={(v) => setForm((f) => ({ ...f, company: v }))} />
            <Field label="Role" value={form.role} onChange={(v) => setForm((f) => ({ ...f, role: v }))} />
            <Field label="Employment type" value={form.employmentType} onChange={(v) => setForm((f) => ({ ...f, employmentType: v }))} />
            <Field label="Location" value={form.location} onChange={(v) => setForm((f) => ({ ...f, location: v }))} />
            <Field label="Start date" value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} />
            <Field label="End date" value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="exp-current"
              checked={form.isCurrent}
              onChange={(e) => setForm((f) => ({ ...f, isCurrent: e.target.checked }))}
            />
            <Label htmlFor="exp-current" className="text-sm">Current role</Label>
          </div>
          <Field label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} textarea />
          <Button
            variant="outline"
            className="rounded-full"
            disabled={!form.company || create.isPending}
            onClick={() => {
              create.mutate(form, {
                onSuccess: () => setForm({ company: "", role: "", employmentType: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" }),
              });
            }}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add experience
          </Button>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button className="rounded-full" onClick={onComplete}>
          Continue <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function EducationStep({ onComplete }: { onComplete: () => void }) {
  const { data, isLoading, refetch } = trpc.expert.myEducation.useQuery();
  const create = trpc.expert.createEducation.useMutation({
    onSuccess: () => {
      toast.success("Education added");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    grade: "",
    description: "",
  });

  if (isLoading) return <Skeleton className="h-96 rounded-3xl" />;

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <h2 className="font-display text-xl font-semibold">Education</h2>
      <p className="text-sm text-muted-foreground">Add your academic background.</p>
      <div className="mt-6 space-y-4">
        {data?.map((edu) => (
          <div key={edu.id} className="rounded-2xl border bg-muted/40 p-4">
            <div className="font-semibold">{edu.degree || "Degree"} — {edu.institution}</div>
            <div className="text-sm text-muted-foreground">{edu.startDate} — {edu.endDate}</div>
          </div>
        ))}
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Institution *" value={form.institution} onChange={(v) => setForm((f) => ({ ...f, institution: v }))} />
            <Field label="Degree" value={form.degree} onChange={(v) => setForm((f) => ({ ...f, degree: v }))} />
            <Field label="Field of study" value={form.fieldOfStudy} onChange={(v) => setForm((f) => ({ ...f, fieldOfStudy: v }))} />
            <Field label="Grade" value={form.grade} onChange={(v) => setForm((f) => ({ ...f, grade: v }))} />
            <Field label="Start date" value={form.startDate} onChange={(v) => setForm((f) => ({ ...f, startDate: v }))} />
            <Field label="End date" value={form.endDate} onChange={(v) => setForm((f) => ({ ...f, endDate: v }))} />
          </div>
          <Field label="Description" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} textarea />
          <Button
            variant="outline"
            className="rounded-full"
            disabled={!form.institution || create.isPending}
            onClick={() => {
              create.mutate(form, {
                onSuccess: () => setForm({ institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "", description: "" }),
              });
            }}
          >
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add education
          </Button>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button className="rounded-full" onClick={onComplete}>
          Continue <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CompleteStep({
  onSubmit,
  isLoading,
}: {
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const { data } = trpc.expert.me.useQuery();
  const completion = data?.completion;
  const verification = data?.verification;
  const navigate = useNavigate();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isPending = verification?.status === "pending" || verification?.status === "approved";

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm text-center">
      {isPending ? (
        <>
          <h2 className="font-display text-xl font-semibold">Verification pending</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your profile is under review. You will be notified once it is approved.
          </p>
        </>
      ) : (
        <>
          <h2 className="font-display text-xl font-semibold">Ready to submit?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Our team will review your profile. You can continue editing while verification is pending.
          </p>
        </>
      )}
      {completion && (
        <div className="mt-6 mx-auto max-w-sm">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Profile completion</span>
            <span className="font-medium">{completion.percentage}%</span>
          </div>
          <Progress value={completion.percentage} className="h-2" />
          <div className="mt-4 text-left text-sm space-y-1">
            {completion.completedSections.map((s: string) => (
              <div key={s} className="flex items-center gap-2 text-green-700">
                <Check className="h-3.5 w-3.5" /> {s}
              </div>
            ))}
            {completion.missingRequiredSections.map((s: string) => (
              <div key={s} className="flex items-center gap-2 text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> {s}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-8">
        {isPending ? (
          <Button className="rounded-full" onClick={() => navigate("/expert/dashboard")}>
            Go to dashboard
          </Button>
        ) : (
          <Button
            className="rounded-full"
            disabled={isLoading || hasSubmitted || (completion && completion.percentage < 60)}
            onClick={() => {
              setHasSubmitted(true);
              onSubmit();
            }}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit for verification
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
