import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";
import {
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
  { id: "review", label: "Your details", icon: User },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const ACCEPTED = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<StepId>("resume");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedProposal | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const hasHydratedStep = useRef(false);

  const onboarding = trpc.candidate.studentOnboarding.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });
  const utils = trpc.useUtils();
  const uploadMutation = trpc.candidate.uploadStudentResume.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const completeMutation = trpc.candidate.completeStudentOnboarding.useMutation({
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!hasHydratedStep.current && onboarding.data) {
      hasHydratedStep.current = true;
      if (
        onboarding.data.currentStep === "review" &&
        onboarding.data.parsedData
      ) {
        setParsed(onboarding.data.parsedData as ParsedProposal);
        setCurrentStep("review");
      }
    }
  }, [onboarding.data]);

  if (authLoading || onboarding.isLoading) {
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

  if (onboarding.data?.status === "completed") {
    return <Navigate to="/dashboard" replace />;
  }

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

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
      if (result.parsed) setParsed(result.parsed as ParsedProposal);
      if (result.error) toast.warning("We had trouble reading some parts of your resume — please review the details.");
      else toast.success("Resume uploaded and parsed.");
      setCurrentStep("review");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-24 pb-16">
          <div className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Set up your student profile
            </h1>
            <p className="mt-1.5 text-muted-foreground">
              Upload your resume and we will pre-fill your profile. You can edit everything before saving.
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
                  defaultFileName={onboarding.data?.resumeFileName}
                  onFileSelect={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 8 * 1024 * 1024) {
                      toast.error("Resume must be under 8 MB.");
                      return;
                    }
                    if (!ACCEPTED.includes(file.type)) {
                      toast.error("Please upload a PDF, DOC, DOCX, or TXT file.");
                      return;
                    }
                    setResumeFile(file);
                  }}
                  onUpload={uploadResume}
                  isUploading={isUploading}
                  onSkip={() => setCurrentStep("review")}
                />
              )}
              {currentStep === "review" && (
                <ReviewStep
                  user={user}
                  parsed={parsed}
                  isLoading={completeMutation.isPending}
                  onFinish={(payload) => {
                    completeMutation.mutate(payload, {
                      onSuccess: async () => {
                        toast.success("Profile completed. Welcome aboard!");
                        await utils.candidate.studentOnboarding.invalidate();
                        await utils.auth.me.invalidate();
                        navigate("/dashboard", { replace: true });
                      },
                    });
                  }}
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
  defaultFileName,
  onFileSelect,
  onUpload,
  isUploading,
  onSkip,
}: {
  file: File | null;
  defaultFileName?: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  isUploading: boolean;
  onSkip: () => void;
}) {
  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <h2 className="font-display text-xl font-semibold">Upload your resume</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        We will extract your education, experience and contact details. You can review and edit everything next.
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
        {!file && defaultFileName && (
          <p className="mt-4 text-sm text-muted-foreground">
            Previously uploaded: <span className="font-medium">{defaultFileName}</span>
          </p>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <Button className="rounded-full" disabled={!file || isUploading} onClick={onUpload}>
          {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Upload & parse
        </Button>
      </div>
    </div>
  );
}

function ReviewStep({
  user,
  parsed,
  isLoading,
  onFinish,
}: {
  user: { name?: string | null; email?: string | null; phone?: string | null; linkedinUrl?: string | null };
  parsed: ParsedProposal | null;
  isLoading: boolean;
  onFinish: (payload: {
    name: string;
    phone: string;
    linkedinUrl: string;
    headline: string;
    summary: string;
    skills: string[];
    education: {
      institution: string; degree: string; fieldOfStudy: string;
      startDate: string; endDate: string; grade: string; description: string;
    }[];
    experience: {
      company: string; role: string; location: string;
      startDate: string; endDate: string; isCurrent: boolean; description: string;
    }[];
  }) => void;
}) {
  const [form, setForm] = useState(() => ({
    name: parsed?.identity?.name || user.name || "",
    phone: parsed?.identity?.phone || user.phone || "",
    linkedin: parsed?.links?.linkedin || user.linkedinUrl || "",
    headline: parsed?.headline ?? "",
    summary: parsed?.summary ?? "",
    skills: parsed?.skills?.join(", ") ?? "",
    education: (parsed?.education ?? []).map((e) => ({
      institution: e.institution ?? "",
      degree: e.degree ?? "",
      fieldOfStudy: e.fieldOfStudy ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      grade: e.grade ?? "",
      description: e.description ?? "",
    })),
    experience: (parsed?.experience ?? []).map((e) => ({
      company: e.company ?? "",
      role: e.role ?? "",
      location: e.location ?? "",
      startDate: e.startDate ?? "",
      endDate: e.endDate ?? "",
      isCurrent: e.isCurrent ?? false,
      description: e.description ?? "",
    })),
  }));

  const [attempted, setAttempted] = useState(false);

  const nameInvalid = form.name.trim().length < 2;
  const phoneInvalid = form.phone.trim().length < 3;
  const linkedinInvalid = !form.linkedin.trim();

  return (
    <div className="rounded-3xl border bg-card p-7 shadow-sm">
      <h2 className="font-display text-xl font-semibold">Your details</h2>
      <p className="text-sm text-muted-foreground">
        Name, phone and LinkedIn are required so mentors can vet you. Everything else is optional.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Field label="Full name *" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
          {attempted && nameInvalid && <p className="text-xs text-red-600">Please enter your full name.</p>}
        </div>
        <div className="space-y-1.5">
          <Field label="Phone *" value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          {attempted && phoneInvalid && <p className="text-xs text-red-600">Please enter your phone number.</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Email</Label>
          <Input value={user.email ?? ""} disabled />
        </div>
        <div className="space-y-1.5">
          <Field label="LinkedIn *" value={form.linkedin} onChange={(v) => setForm((f) => ({ ...f, linkedin: v }))} placeholder="https://linkedin.com/in/your-handle" />
          {attempted && linkedinInvalid && <p className="text-xs text-red-600">Please add your LinkedIn profile URL (the resume parser often misses it).</p>}
        </div>
        <Field label="Headline" value={form.headline} onChange={(v) => setForm((f) => ({ ...f, headline: v }))} />
        <Field label="Skills (comma separated)" value={form.skills} onChange={(v) => setForm((f) => ({ ...f, skills: v }))} />
        <div className="sm:col-span-2">
          <Field label="Summary" value={form.summary} onChange={(v) => setForm((f) => ({ ...f, summary: v }))} textarea />
        </div>
      </div>

      <h3 className="mt-8 font-semibold flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-orange-600" /> Education
      </h3>
      <div className="mt-3 space-y-3">
        {form.education.map((edu, i) => (
          <div key={i} className="rounded-2xl border bg-muted/40 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Institution" value={edu.institution} onChange={(v) => {
                const next = [...form.education];
                next[i] = { ...next[i], institution: v };
                setForm((f) => ({ ...f, education: next }));
              }} />
              <Field label="Degree" value={edu.degree} onChange={(v) => {
                const next = [...form.education];
                next[i] = { ...next[i], degree: v };
                setForm((f) => ({ ...f, education: next }));
              }} />
              <Field label="Field of study" value={edu.fieldOfStudy} onChange={(v) => {
                const next = [...form.education];
                next[i] = { ...next[i], fieldOfStudy: v };
                setForm((f) => ({ ...f, education: next }));
              }} />
              <Field label="Grade" value={edu.grade} onChange={(v) => {
                const next = [...form.education];
                next[i] = { ...next[i], grade: v };
                setForm((f) => ({ ...f, education: next }));
              }} />
              <Field label="Start date" value={edu.startDate} onChange={(v) => {
                const next = [...form.education];
                next[i] = { ...next[i], startDate: v };
                setForm((f) => ({ ...f, education: next }));
              }} />
              <Field label="End date" value={edu.endDate} onChange={(v) => {
                const next = [...form.education];
                next[i] = { ...next[i], endDate: v };
                setForm((f) => ({ ...f, education: next }));
              }} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => setForm((f) => ({ ...f, education: f.education.filter((_, j) => j !== i) }))}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() =>
            setForm((f) => ({
              ...f,
              education: [...f.education, { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "", description: "" }],
            }))
          }
        >
          + Add education
        </Button>
      </div>

      <h3 className="mt-8 font-semibold">Experience</h3>
      <div className="mt-3 space-y-3">
        {form.experience.map((exp, i) => (
          <div key={i} className="rounded-2xl border bg-muted/40 p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company" value={exp.company} onChange={(v) => {
                const next = [...form.experience];
                next[i] = { ...next[i], company: v };
                setForm((f) => ({ ...f, experience: next }));
              }} />
              <Field label="Role" value={exp.role} onChange={(v) => {
                const next = [...form.experience];
                next[i] = { ...next[i], role: v };
                setForm((f) => ({ ...f, experience: next }));
              }} />
              <Field label="Start date" value={exp.startDate} onChange={(v) => {
                const next = [...form.experience];
                next[i] = { ...next[i], startDate: v };
                setForm((f) => ({ ...f, experience: next }));
              }} />
              <Field label="End date" value={exp.endDate} onChange={(v) => {
                const next = [...form.experience];
                next[i] = { ...next[i], endDate: v };
                setForm((f) => ({ ...f, experience: next }));
              }} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`exp-current-${i}`}
                checked={exp.isCurrent}
                onChange={(e) => {
                  const next = [...form.experience];
                  next[i] = { ...next[i], isCurrent: e.target.checked };
                  setForm((f) => ({ ...f, experience: next }));
                }}
              />
              <Label htmlFor={`exp-current-${i}`} className="text-sm">Current role</Label>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              onClick={() => setForm((f) => ({ ...f, experience: f.experience.filter((_, j) => j !== i) }))}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() =>
            setForm((f) => ({
              ...f,
              experience: [...f.experience, { company: "", role: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "" }],
            }))
          }
        >
          + Add experience
        </Button>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          className="rounded-full"
          disabled={isLoading}
          onClick={() => {
            setAttempted(true);
            if (nameInvalid) {
              toast.error("Please enter your full name.");
              return;
            }
            if (phoneInvalid) {
              toast.error("Please enter your phone number — the resume parser often misses it.");
              return;
            }
            if (linkedinInvalid) {
              toast.error("Please add your LinkedIn profile URL — the resume parser often misses it.");
              return;
            }
            onFinish({
              name: form.name.trim(),
              phone: form.phone.trim(),
              linkedinUrl: form.linkedin.trim(),
              headline: form.headline.trim(),
              summary: form.summary.trim(),
              skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
              education: form.education.filter((e) => e.institution || e.degree),
              experience: form.experience.filter((e) => e.company || e.role),
            });
          }}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save & continue <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={placeholder} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
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
