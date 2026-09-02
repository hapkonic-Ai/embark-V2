import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function ExpertProfileEdit() {
  const navigate = useNavigate();
  const { data, isLoading } = trpc.expert.myProfile.useQuery();
  const utils = trpc.useUtils();
  const upsert = trpc.expert.upsertProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile saved");
      utils.expert.myProfile.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const uploadImage = trpc.expert.uploadImage.useMutation({
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
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
    languages: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    websiteUrl: "",
    publicSlug: "",
  });

  useEffect(() => {
    if (data?.profile) {
      const p = data.profile;
      setForm({
        displayName: p.displayName ?? "",
        headline: p.headline ?? "",
        bio: p.bio ?? "",
        profileImage: p.profileImage ?? "",
        coverImage: p.coverImage ?? "",
        location: p.location ?? "",
        country: p.country ?? "",
        timezone: p.timezone || "Asia/Kolkata",
        currentRole: p.currentRole ?? "",
        company: p.company ?? "",
        expertise: p.expertise ?? "",
        industries: p.industries ?? "",
        languages: p.languages ?? "",
        linkedinUrl: p.linkedinUrl ?? "",
        githubUrl: p.githubUrl ?? "",
        portfolioUrl: p.portfolioUrl ?? "",
        websiteUrl: p.websiteUrl ?? "",
        publicSlug: p.publicSlug ?? "",
      });
    }
  }, [data]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 pt-24">
          <Skeleton className="h-[60vh] rounded-3xl" />
        </div>
      </>
    );
  }

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-24 pb-16">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Edit profile</h1>
              <p className="mt-1.5 text-muted-foreground">Keep your public expert page up to date.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full" onClick={() => navigate("/expert/dashboard")}>
                Cancel
              </Button>
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
                <Save className="mr-1.5 h-4 w-4" /> Save
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-lg">Basic information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name" value={form.displayName} onChange={(v) => update("displayName", v)} />
                <Field label="Headline" value={form.headline} onChange={(v) => update("headline", v)} />
                <div className="sm:col-span-2">
                  <Field label="About / Bio" value={form.bio} onChange={(v) => update("bio", v)} textarea />
                </div>
                <div className="flex gap-6 sm:col-span-2">
                  <ImageUploadField
                    label="Profile photo"
                    value={form.profileImage}
                    onChange={(v) => update("profileImage", v)}
                    onUpload={async (dataUrl) => {
                      const fileMime = dataUrl.match(/^data:([^;]+)/)?.[1] ?? "image/png";
                      const base64 = dataUrl.split(",")[1] ?? "";
                      const result = await uploadImage.mutateAsync({
                        fileName: "profile.png",
                        fileMime,
                        fileBase64: base64,
                      });
                      return result.url;
                    }}
                    disabled={upsert.isPending || uploadImage.isPending}
                  />
                  <ImageUploadField
                    label="Cover image"
                    value={form.coverImage}
                    onChange={(v) => update("coverImage", v)}
                    onUpload={async (dataUrl) => {
                      const fileMime = dataUrl.match(/^data:([^;]+)/)?.[1] ?? "image/png";
                      const base64 = dataUrl.split(",")[1] ?? "";
                      const result = await uploadImage.mutateAsync({
                        fileName: "cover.png",
                        fileMime,
                        fileBase64: base64,
                      });
                      return result.url;
                    }}
                    disabled={upsert.isPending || uploadImage.isPending}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-lg">Professional details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Current role" value={form.currentRole} onChange={(v) => update("currentRole", v)} />
                <Field label="Company" value={form.company} onChange={(v) => update("company", v)} />
                <Field label="Expertise (comma separated)" value={form.expertise} onChange={(v) => update("expertise", v)} />
                <Field label="Industries (comma separated)" value={form.industries} onChange={(v) => update("industries", v)} />
                <Field label="Languages (comma separated)" value={form.languages} onChange={(v) => update("languages", v)} />
                <Field label="Years of experience" value={String(data?.profile?.yearsExp ?? 0)} onChange={() => {}} />
              </CardContent>
            </Card>

            <Card className="rounded-3xl border shadow-sm">
              <CardHeader>
                <CardTitle className="font-display text-lg">Location & links</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="Location" value={form.location} onChange={(v) => update("location", v)} />
                <Field label="Country" value={form.country} onChange={(v) => update("country", v)} />
                <Field label="Timezone" value={form.timezone} onChange={(v) => update("timezone", v)} />
                <Field label="LinkedIn" value={form.linkedinUrl} onChange={(v) => update("linkedinUrl", v)} />
                <Field label="GitHub" value={form.githubUrl} onChange={(v) => update("githubUrl", v)} />
                <Field label="Portfolio" value={form.portfolioUrl} onChange={(v) => update("portfolioUrl", v)} />
                <Field label="Website" value={form.websiteUrl} onChange={(v) => update("websiteUrl", v)} />
                <Field
                  label="Public slug"
                  value={form.publicSlug}
                  onChange={(v) => update("publicSlug", v.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
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
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
