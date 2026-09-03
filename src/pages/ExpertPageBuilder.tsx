import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Briefcase,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Save,
  Star,
  X,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/use-debounce";
import type { AppRouter } from "../../api/router";
import type { inferRouterOutputs } from "@trpc/server";

type ExpertPageData = inferRouterOutputs<AppRouter>["expertPage"]["myPage"];
type Experience = ExpertPageData["experiences"][number];
type Education = ExpertPageData["educations"][number];
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/site/Navbar";
import ImageUploadField from "@/components/expert/ImageUploadField";

const THEME_OPTIONS = ["minimal", "professional", "modern"] as const;
const BACKGROUND_OPTIONS = ["light", "dark", "muted"] as const;
const PROFILE_STYLE_OPTIONS = ["rounded", "square", "circle"] as const;
const COVER_STYLE_OPTIONS = ["gradient", "image", "solid", "none"] as const;
const BUTTON_STYLE_OPTIONS = ["rounded", "square", "pill"] as const;
const CTA_TYPE_OPTIONS = [
  "none",
  "booking",
  "service",
  "external_url",
  "contact",
] as const;
const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  about: "About",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  services: "Services",
  reviews: "Reviews",
  social_links: "Social links",
  cta: "Call to action",
};

type SettingsDraft = {
  theme: string;
  accentColor: string;
  background: string;
  profileImageStyle: string;
  coverStyle: string;
  buttonStyle: string;
  ctaType: string;
  ctaLabel: string | null;
  ctaTarget: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
};

function buildSettingsDraft(config: ExpertPageData["config"], page: ExpertPageData["page"]): SettingsDraft {
  return {
    theme: config?.theme ?? "professional",
    accentColor: config?.accentColor ?? "#F97316",
    background: config?.background ?? "light",
    profileImageStyle: config?.profileImageStyle ?? "rounded",
    coverStyle: config?.coverStyle ?? "gradient",
    buttonStyle: config?.buttonStyle ?? "rounded",
    ctaType: config?.ctaType ?? "none",
    ctaLabel: config?.ctaLabel ?? null,
    ctaTarget: config?.ctaTarget ?? null,
    metaTitle: page?.metaTitle ?? null,
    metaDescription: page?.metaDescription ?? null,
    ogImage: page?.ogImage ?? null,
  };
}

type ContentDraft = {
  displayName: string;
  headline: string;
  bio: string;
  profileImage: string;
  coverImage: string;
  location: string;
  country: string;
  timezone: string;
  currentRole: string;
  company: string;
  expertise: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  websiteUrl: string;
};

function buildContentDraft(profile?: ExpertPageData["profile"]): ContentDraft {
  return {
    displayName: profile?.displayName ?? "",
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    profileImage: profile?.profileImage ?? "",
    coverImage: profile?.coverImage ?? "",
    location: profile?.location ?? "",
    country: profile?.country ?? "",
    timezone: profile?.timezone ?? "",
    currentRole: profile?.currentRole ?? "",
    company: profile?.company ?? "",
    expertise: profile?.expertise ?? "",
    linkedinUrl: profile?.linkedinUrl ?? "",
    githubUrl: profile?.githubUrl ?? "",
    portfolioUrl: profile?.portfolioUrl ?? "",
    websiteUrl: profile?.websiteUrl ?? "",
  };
}

export default function ExpertPageBuilder() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"content" | "sections" | "design" | "seo">("content");
  const [slugEdit, setSlugEdit] = useState(false);
  const [slugDraft, setSlugDraft] = useState("");
  const debouncedSlugDraft = useDebounce(slugDraft, 400);
  const slugCheck = trpc.expert.checkSlugAvailability.useQuery(
    { slug: debouncedSlugDraft },
    { enabled: slugEdit && debouncedSlugDraft.length >= 2 },
  );

  const { data, isLoading, refetch } = trpc.expertPage.myPage.useQuery(undefined, {
    enabled: !!user,
  });

  const updateConfig = trpc.expertPage.updatePageConfig.useMutation({
    onSuccess: () => {
      toast.success("Page settings saved");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const saveProfile = trpc.expert.upsertProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile content saved");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateSections = trpc.expertPage.updatePageSections.useMutation({
    onSuccess: () => {
      toast.success("Sections saved");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const updateSlug = trpc.expertPage.updateSlug.useMutation({
    onSuccess: () => {
      toast.success("Slug updated");
      setSlugEdit(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const publish = trpc.expertPage.publishPage.useMutation({
    onSuccess: (res) => {
      toast.success(`Page published at /m/${res.slug}`);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const unpublish = trpc.expertPage.unpublishPage.useMutation({
    onSuccess: () => {
      toast.success("Page unpublished");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [sectionDraft, setSectionDraft] = useState(data?.sections ?? []);
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft | null>(null);
  const [contentDraft, setContentDraft] = useState(buildContentDraft(data?.profile));

  useEffect(() => {
    if (data) {
      setSectionDraft(data.sections);
      setSettingsDraft(buildSettingsDraft(data.config, data.page));
      setContentDraft(buildContentDraft(data.profile));
    }
  }, [data]);

  const dirtySections = useMemo(() => {
    if (!data) return false;
    if (sectionDraft.length !== data.sections.length) return true;
    return sectionDraft.some((s, i) => {
      const original = data.sections[i];
      return (
        s.sectionType !== original.sectionType ||
        s.displayOrder !== original.displayOrder ||
        s.isVisible !== original.isVisible
      );
    });
  }, [sectionDraft, data]);

  const dirtySettings = useMemo(() => {
    if (!data || !settingsDraft) return false;
    const baseline = buildSettingsDraft(data.config, data.page);
    const keys = Object.keys(settingsDraft) as (keyof SettingsDraft)[];
    return keys.some((key) => settingsDraft[key] !== baseline[key]);
  }, [settingsDraft, data]);

  const dirtyContent = useMemo(() => {
    if (!data || !contentDraft) return false;
    const baseline = buildContentDraft(data.profile);
    const keys = Object.keys(contentDraft) as (keyof ContentDraft)[];
    return keys.some((key) => contentDraft[key] !== baseline[key]);
  }, [contentDraft, data]);

  function saveContent() {
    if (!contentDraft) return;
    const payload = {
      displayName: contentDraft.displayName || undefined,
      headline: contentDraft.headline || undefined,
      bio: contentDraft.bio || undefined,
      profileImage: contentDraft.profileImage || undefined,
      coverImage: contentDraft.coverImage || undefined,
      location: contentDraft.location || undefined,
      country: contentDraft.country || undefined,
      timezone: contentDraft.timezone || undefined,
      currentRole: contentDraft.currentRole || undefined,
      company: contentDraft.company || undefined,
      expertise: contentDraft.expertise || undefined,
      linkedinUrl: contentDraft.linkedinUrl || undefined,
      githubUrl: contentDraft.githubUrl || undefined,
      portfolioUrl: contentDraft.portfolioUrl || undefined,
      websiteUrl: contentDraft.websiteUrl || undefined,
    } as Parameters<typeof saveProfile.mutate>[0];
    saveProfile.mutate(payload);
  }

  if (authLoading || isLoading || !data || !settingsDraft || !contentDraft) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 pt-24">
          <Skeleton className="h-[70vh] rounded-3xl" />
        </div>
      </>
    );
  }

  if (!user) return null;

  const page = data.page;
  const profile = data.profile;
  const publicUrl = `${window.location.origin}/m/${page.slug}`;

  function moveSection(index: number, direction: "up" | "down") {
    setSectionDraft((prev) => {
      const next = [...prev];
      if (direction === "up" && index > 0) {
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
      } else if (direction === "down" && index < next.length - 1) {
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
      }
      return next.map((s, i) => ({ ...s, displayOrder: i }));
    });
  }

  function toggleVisibility(index: number) {
    setSectionDraft((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], isVisible: !next[index].isVisible };
      return next;
    });
  }

  function saveSections() {
    updateSections.mutate({
      sections: sectionDraft.map((s) => ({
        sectionType: s.sectionType,
        displayOrder: s.displayOrder,
        isVisible: s.isVisible,
        config: (s.config as Record<string, unknown>) ?? {},
      })),
    } as Parameters<typeof updateSections.mutate>[0]);
  }

  function saveSettings() {
    if (!settingsDraft) return;
    const payload = {
      theme: settingsDraft.theme,
      accentColor: settingsDraft.accentColor,
      background: settingsDraft.background,
      profileImageStyle: settingsDraft.profileImageStyle,
      coverStyle: settingsDraft.coverStyle,
      buttonStyle: settingsDraft.buttonStyle,
      ctaType: settingsDraft.ctaType,
      ctaLabel: settingsDraft.ctaLabel ?? "",
      ctaTarget: settingsDraft.ctaTarget ?? "",
      metaTitle: settingsDraft.metaTitle ?? "",
      metaDescription: settingsDraft.metaDescription ?? "",
      ogImage: settingsDraft.ogImage ?? "",
    } as Parameters<typeof updateConfig.mutate>[0];
    updateConfig.mutate(payload);
  }

  function handlePublish() {
    if (dirtySettings || dirtySections) {
      toast.info("Save your changes before publishing.");
      return;
    }
    publish.mutate();
  }

  const sortedSections = [...sectionDraft].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  const visibleSections = sortedSections.filter((s) => s.isVisible);

  function updateSetting(key: keyof SettingsDraft, value: unknown) {
    setSettingsDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                My Page
              </h1>
              <p className="mt-1.5 text-muted-foreground">
                Customize how students see your public profile.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={
                  page.status === "published"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : page.status === "unpublished"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-stone-50 text-stone-600 border-stone-200"
                }
              >
                {page.status}
              </Badge>
              {page.status === "published" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  asChild
                >
                  <a href={publicUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    View public page
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <div className="flex gap-2 mb-4">
                  {(["content", "sections", "design", "seo"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? "bg-orange-500 text-white"
                          : "text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {tab[0].toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {activeTab === "content" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Edit the actual profile content shown on your public page.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Display name">
                        <Input
                          value={contentDraft.displayName}
                          onChange={(e) =>
                            setContentDraft((c) => ({ ...c!, displayName: e.target.value }))
                          }
                          className="rounded-xl"
                        />
                      </Field>
                      <Field label="Headline">
                        <Input
                          value={contentDraft.headline}
                          onChange={(e) =>
                            setContentDraft((c) => ({ ...c!, headline: e.target.value }))
                          }
                          className="rounded-xl"
                        />
                      </Field>
                      <Field label="Current role">
                        <Input
                          value={contentDraft.currentRole}
                          onChange={(e) =>
                            setContentDraft((c) => ({ ...c!, currentRole: e.target.value }))
                          }
                          className="rounded-xl"
                        />
                      </Field>
                      <Field label="Company">
                        <Input
                          value={contentDraft.company}
                          onChange={(e) =>
                            setContentDraft((c) => ({ ...c!, company: e.target.value }))
                          }
                          className="rounded-xl"
                        />
                      </Field>
                      <Field label="Location">
                        <Input
                          value={contentDraft.location}
                          onChange={(e) =>
                            setContentDraft((c) => ({ ...c!, location: e.target.value }))
                          }
                          className="rounded-xl"
                        />
                      </Field>
                      <Field label="Country">
                        <Input
                          value={contentDraft.country}
                          onChange={(e) =>
                            setContentDraft((c) => ({ ...c!, country: e.target.value }))
                          }
                          className="rounded-xl"
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Expertise (comma separated)">
                          <Input
                            value={contentDraft.expertise}
                            onChange={(e) =>
                              setContentDraft((c) => ({ ...c!, expertise: e.target.value }))
                            }
                            className="rounded-xl"
                          />
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <Field label="About you / Bio">
                          <Textarea
                            value={contentDraft.bio}
                            onChange={(e) =>
                              setContentDraft((c) => ({ ...c!, bio: e.target.value }))
                            }
                            rows={4}
                            className="rounded-xl"
                          />
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <Field label="Social links">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                              value={contentDraft.linkedinUrl}
                              onChange={(e) =>
                                setContentDraft((c) => ({ ...c!, linkedinUrl: e.target.value }))
                              }
                              className="rounded-xl"
                              placeholder="LinkedIn URL"
                            />
                            <Input
                              value={contentDraft.githubUrl}
                              onChange={(e) =>
                                setContentDraft((c) => ({ ...c!, githubUrl: e.target.value }))
                              }
                              className="rounded-xl"
                              placeholder="GitHub URL"
                            />
                            <Input
                              value={contentDraft.portfolioUrl}
                              onChange={(e) =>
                                setContentDraft((c) => ({ ...c!, portfolioUrl: e.target.value }))
                              }
                              className="rounded-xl"
                              placeholder="Portfolio URL"
                            />
                            <Input
                              value={contentDraft.websiteUrl}
                              onChange={(e) =>
                                setContentDraft((c) => ({ ...c!, websiteUrl: e.target.value }))
                              }
                              className="rounded-xl"
                              placeholder="Website URL"
                            />
                          </div>
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <div className="flex gap-6">
                          <ImageUploadField
                            label="Profile photo"
                            value={contentDraft.profileImage}
                            onChange={(v) =>
                              setContentDraft((c) => ({ ...c!, profileImage: v }))
                            }
                            disabled={saveProfile.isPending}
                          />
                          <ImageUploadField
                            label="Cover photo"
                            value={contentDraft.coverImage}
                            onChange={(v) => {
                              setContentDraft((c) => ({ ...c!, coverImage: v }));
                              if (v && settingsDraft && settingsDraft.coverStyle !== "image") {
                                setSettingsDraft((s) => (s ? { ...s, coverStyle: "image" } : s));
                              }
                            }}
                            disabled={saveProfile.isPending}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-muted/40 p-4 space-y-3">
                      <p className="text-sm font-medium">Structured sections</p>
                      <p className="text-xs text-muted-foreground">
                        Experience and education are managed from your full profile editor.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="rounded-full" asChild>
                          <Link to="/expert/profile/edit">
                            Edit experience / education <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="w-full rounded-full"
                      disabled={!dirtyContent || saveProfile.isPending}
                      onClick={saveContent}
                    >
                      {saveProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Save className="mr-1.5 h-4 w-4" />
                      Save content
                    </Button>
                  </div>
                )}

                {activeTab === "sections" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Reorder sections and show or hide them on your public page.
                    </p>
                    <div className="space-y-2">
                      {sortedSections.map((section, index) => (
                        <div
                          key={section.sectionType}
                          className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={section.isVisible}
                              onCheckedChange={() => toggleVisibility(index)}
                            />
                            <span className="text-sm font-medium">
                              {SECTION_LABELS[section.sectionType] ?? section.sectionType}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveSection(index, "up")}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-40"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              disabled={index === sortedSections.length - 1}
                              onClick={() => moveSection(index, "down")}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-40"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full rounded-full"
                      disabled={!dirtySections || updateSections.isPending}
                      onClick={saveSections}
                    >
                      {updateSections.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-1.5 h-4 w-4" />
                      Save sections
                    </Button>
                  </div>
                )}

                {activeTab === "design" && (
                  <div className="space-y-4">
                    <Field label="Theme">
                      <Select
                        value={settingsDraft.theme}
                        onValueChange={(v) => updateSetting("theme", v)}
                      >
                        <SelectTrigger className="w-full rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {THEME_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t[0].toUpperCase() + t.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Accent color">
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={settingsDraft.accentColor}
                          onChange={(e) => updateSetting("accentColor", e.target.value)}
                          className="h-10 w-14 rounded-xl border bg-transparent cursor-pointer"
                        />
                        <Input
                          value={settingsDraft.accentColor}
                          onChange={(e) => updateSetting("accentColor", e.target.value)}
                          className="flex-1 rounded-xl"
                        />
                      </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Background">
                        <Select
                          value={settingsDraft.background}
                          onValueChange={(v) => updateSetting("background", v)}
                        >
                          <SelectTrigger className="w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BACKGROUND_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t[0].toUpperCase() + t.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Profile image">
                        <Select
                          value={settingsDraft.profileImageStyle}
                          onValueChange={(v) => updateSetting("profileImageStyle", v)}
                        >
                          <SelectTrigger className="w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROFILE_STYLE_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t[0].toUpperCase() + t.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Cover">
                        <Select
                          value={settingsDraft.coverStyle}
                          onValueChange={(v) => updateSetting("coverStyle", v)}
                        >
                          <SelectTrigger className="w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COVER_STYLE_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t[0].toUpperCase() + t.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Buttons">
                        <Select
                          value={settingsDraft.buttonStyle}
                          onValueChange={(v) => updateSetting("buttonStyle", v)}
                        >
                          <SelectTrigger className="w-full rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {BUTTON_STYLE_OPTIONS.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t[0].toUpperCase() + t.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Field label="CTA type">
                      <Select
                        value={settingsDraft.ctaType}
                        onValueChange={(v) => updateSetting("ctaType", v)}
                      >
                        <SelectTrigger className="w-full rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CTA_TYPE_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t === "external_url"
                                ? "External URL"
                                : t[0].toUpperCase() + t.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    {settingsDraft.ctaType !== "none" && (
                      <>
                        <Field label="CTA label">
                          <Input
                            value={settingsDraft.ctaLabel ?? ""}
                            onChange={(e) => updateSetting("ctaLabel", e.target.value)}
                            className="rounded-xl"
                          />
                        </Field>
                        <Field label="CTA target">
                          <Input
                            value={settingsDraft.ctaTarget ?? ""}
                            onChange={(e) => updateSetting("ctaTarget", e.target.value)}
                            className="rounded-xl"
                            placeholder={
                              settingsDraft.ctaType === "external_url"
                                ? "https://..."
                                : ""
                            }
                          />
                        </Field>
                      </>
                    )}
                    <Button
                      className="w-full rounded-full"
                      disabled={!dirtySettings || updateConfig.isPending}
                      onClick={saveSettings}
                    >
                      {updateConfig.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-1.5 h-4 w-4" />
                      Save design
                    </Button>
                  </div>
                )}

                {activeTab === "seo" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border bg-muted/40 p-4 space-y-3">
                      <Label className="text-sm">Public URL slug</Label>
                      {slugEdit ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={slugDraft}
                              onChange={(e) =>
                                setSlugDraft(
                                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                                )
                              }
                              className="rounded-xl"
                              placeholder="your-name"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              className="rounded-xl"
                              disabled={!slugDraft || updateSlug.isPending || slugCheck.data?.available === false}
                              onClick={() => updateSlug.mutate({ slug: slugDraft })}
                            >
                              {updateSlug.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <SlugAvailabilityHint
                            slug={slugDraft}
                            currentSlug={page.slug}
                            check={slugCheck as SlugCheckState}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <code className="text-sm">/m/{page.slug}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-full"
                            onClick={() => {
                              setSlugDraft(page.slug);
                              setSlugEdit(true);
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                    <Field label="Meta title">
                      <Input
                        value={settingsDraft.metaTitle ?? ""}
                        onChange={(e) => updateSetting("metaTitle", e.target.value)}
                        className="rounded-xl"
                      />
                    </Field>
                    <Field label="Meta description">
                      <Input
                        value={settingsDraft.metaDescription ?? ""}
                        onChange={(e) => updateSetting("metaDescription", e.target.value)}
                        className="rounded-xl"
                      />
                    </Field>
                    <Field label="OG image URL">
                      <Input
                        value={settingsDraft.ogImage ?? ""}
                        onChange={(e) => updateSetting("ogImage", e.target.value)}
                        className="rounded-xl"
                      />
                    </Field>
                    <Button
                      className="w-full rounded-full"
                      disabled={!dirtySettings || updateConfig.isPending}
                      onClick={saveSettings}
                    >
                      {updateConfig.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-1.5 h-4 w-4" />
                      Save SEO
                    </Button>
                  </div>
                )}

                <div className="mt-6 border-t pt-6 space-y-3">
                  {page.status === "published" ? (
                    <Button
                      variant="outline"
                      className="w-full rounded-full"
                      disabled={unpublish.isPending}
                      onClick={() => unpublish.mutate()}
                    >
                      {unpublish.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Unpublish page
                    </Button>
                  ) : (
                    <Button
                      className="w-full rounded-full"
                      disabled={publish.isPending}
                      onClick={handlePublish}
                    >
                      {publish.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Publish page
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Preview</h2>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  {visibleSections.length === 0 ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {visibleSections.length} of {sortedSections.length} sections visible
                </span>
              </div>
              <PagePreview
                profile={profile}
                config={settingsDraft}
                sections={visibleSections.map((s) => s.sectionType)}
                experiences={data.experiences}
                educations={data.educations}
                expertUserId={data.page.userId}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function PagePreview({
  profile,
  config,
  sections,
  experiences,
  educations,
  expertUserId,
}: {
  profile: ExpertPageData["profile"];
  config: SettingsDraft;
  sections: string[];
  experiences: Experience[];
  educations: Education[];
  expertUserId: number;
}) {
  const isDark = config.background === "dark";
  const isMuted = config.background === "muted";
  const bgClass = isDark
    ? "bg-stone-950 text-stone-100"
    : isMuted
      ? "bg-stone-50 text-stone-900"
      : "bg-background text-foreground";
  const cardBg = isDark ? "bg-stone-900/60 border-stone-800" : "bg-card border-border";
  const mutedText = isDark ? "text-stone-400" : "text-muted-foreground";
  const radius =
    config.profileImageStyle === "circle"
      ? "rounded-full"
      : config.profileImageStyle === "square"
        ? "rounded-xl"
        : "rounded-3xl";
  const btnRadius =
    config.buttonStyle === "pill"
      ? "rounded-full"
      : config.buttonStyle === "square"
        ? "rounded-md"
        : "rounded-full";
  const accentStyle = { backgroundColor: config.accentColor, color: "#fff" };

  const socials = [
    { key: "linkedinUrl", label: "LinkedIn", url: profile?.linkedinUrl },
    { key: "githubUrl", label: "GitHub", url: profile?.githubUrl },
    { key: "portfolioUrl", label: "Portfolio", url: profile?.portfolioUrl },
    { key: "websiteUrl", label: "Website", url: profile?.websiteUrl },
  ].filter((s): s is { key: string; label: string; url: string } => !!s.url);

  const { data: reviewsData } = trpc.reviews.listForExpert.useQuery({ expertUserId });
  const publicReviews = reviewsData?.reviews ?? [];

  const displayName = profile?.displayName || "Your name";
  const headline = profile?.headline || profile?.currentRole || "";
  const expertise = profile?.expertise?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  return (
    <div className={`overflow-hidden rounded-3xl border shadow-sm ${bgClass}`}>
      <div
        className={`h-32 ${
          config.coverStyle === "gradient"
            ? "bg-gradient-to-r from-orange-400 to-rose-400"
            : config.coverStyle === "solid"
              ? "bg-stone-200"
              : "bg-transparent"
        }`}
      />
      <div className="px-6 pb-8 -mt-12">
        <div className={`rounded-3xl border p-5 shadow-lg ${cardBg}`}>
          <div className="flex items-end gap-4">
            {profile?.profileImage ? (
              <img
                src={profile.profileImage}
                alt={displayName}
                className={`h-20 w-20 border-4 ${cardBg.split(" ")[0]} object-cover shadow-md ${radius}`}
              />
            ) : (
              <div
                className={`h-20 w-20 border-4 ${cardBg.split(" ")[0]} flex items-center justify-center bg-orange-100 text-orange-600 text-2xl font-bold ${radius}`}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="mb-1">
              <h2 className="font-display text-xl font-bold">{displayName}</h2>
              {headline && <p className={`text-sm ${mutedText}`}>{headline}</p>}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(profile?.verificationStatus === "verified" || profile?.isVerified) && (
              <Badge className="rounded-full border-0 bg-green-100 text-green-700">
                <Check className="mr-1 h-3 w-3" /> Verified
              </Badge>
            )}
            {profile?.location && (
              <span className={`flex items-center gap-1 text-xs ${mutedText}`}>
                <MapPin className="h-3 w-3" /> {profile.location}
              </span>
            )}
          </div>

          {sections.includes("social_links") && socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {socials.map((s) => (
                <Button
                  key={s.key}
                  variant="outline"
                  size="sm"
                  className={`${btnRadius}`}
                  style={{ borderColor: config.accentColor, color: config.accentColor }}
                  asChild
                >
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.key === "linkedinUrl" ? <Linkedin className="mr-1.5 h-3.5 w-3.5" /> : s.key === "githubUrl" ? <Github className="mr-1.5 h-3.5 w-3.5" /> : <Globe className="mr-1.5 h-3.5 w-3.5" />}
                    {s.label}
                  </a>
                </Button>
              ))}
            </div>
          )}

          {sections.includes("cta") && config.ctaType !== "none" && (
            <Button className={`mt-4 w-full ${btnRadius}`} style={accentStyle}>
              <Mail className="mr-1.5 h-4 w-4" />
              {config.ctaLabel || "Get in touch"}
            </Button>
          )}
        </div>

        <div className="mt-6 space-y-6">
          {sections.includes("about") && profile?.bio && (
            <section className={`rounded-3xl border p-5 ${cardBg}`}>
              <h3 className="font-display text-base font-semibold mb-2">{SECTION_LABELS.about}</h3>
              <p className={`text-sm leading-relaxed whitespace-pre-line ${mutedText}`}>{profile.bio}</p>
            </section>
          )}

          {sections.includes("experience") && experiences.length > 0 && (
            <section className={`rounded-3xl border p-5 ${cardBg}`}>
              <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
                <Briefcase className={`h-4 w-4 ${mutedText}`} /> Experience
              </h3>
              <div className="space-y-3">
                {experiences.map((exp) => (
                  <div key={exp.id} className={`rounded-2xl border p-3 ${cardBg}`}>
                    <div className="text-sm font-semibold">{exp.role || "Role"}</div>
                    <div className={`text-xs ${mutedText}`}>{exp.company}</div>
                    <div className={`text-xs ${mutedText} mt-1`}>
                      {exp.startDate} {exp.endDate ? `— ${exp.isCurrent ? "Present" : exp.endDate}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {sections.includes("education") && educations.length > 0 && (
            <section className={`rounded-3xl border p-5 ${cardBg}`}>
              <h3 className="font-display text-base font-semibold mb-3 flex items-center gap-2">
                <GraduationCap className={`h-4 w-4 ${mutedText}`} /> Education
              </h3>
              <div className="space-y-3">
                {educations.map((edu) => (
                  <div key={edu.id} className={`rounded-2xl border p-3 ${cardBg}`}>
                    <div className="text-sm font-semibold">{edu.institution}</div>
                    <div className={`text-xs ${mutedText}`}>
                      {edu.degree} {edu.fieldOfStudy ? `— ${edu.fieldOfStudy}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {sections.includes("skills") && expertise.length > 0 && (
            <section className={`rounded-3xl border p-5 ${cardBg}`}>
              <h3 className="font-display text-base font-semibold mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {expertise.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border px-2.5 py-0.5 text-xs font-medium bg-secondary"
                    style={{ borderColor: config.accentColor, color: config.accentColor }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {sections.includes("reviews") && publicReviews.length > 0 && (
            <section className={`rounded-3xl border p-5 ${cardBg}`}>
              <h3 className="font-display text-base font-semibold mb-3">Reviews</h3>
              <div className="space-y-3">
                {publicReviews.slice(0, 3).map((row) => (
                  <div key={row.review.id} className={`rounded-2xl border p-3 ${cardBg}`}>
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < row.review.rating ? "text-amber-500 fill-current" : "text-stone-300"}`}
                        />
                      ))}
                    </div>
                    {row.review.title && <p className="text-sm font-medium">{row.review.title}</p>}
                    {row.review.content && <p className={`text-xs ${mutedText} mt-1 line-clamp-2`}>{row.review.content}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

type SlugCheckState = {
  isLoading: boolean;
  data?: { available: boolean; slug: string } | null;
  error?: { message: string } | null;
};

function SlugAvailabilityHint({
  slug,
  currentSlug,
  check,
}: {
  slug: string;
  currentSlug: string | null;
  check: SlugCheckState;
}) {
  if (!slug || slug.length < 2) return null;
  if (slug === currentSlug) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-green-600" />
        <span>This is your current slug</span>
      </div>
    );
  }
  if (check.isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Checking availability…</span>
      </div>
    );
  }
  if (check.data?.available) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <Check className="h-3.5 w-3.5" />
        <span>Available</span>
      </div>
    );
  }
  if (check.data && !check.data.available) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <X className="h-3.5 w-3.5" />
        <span>Already taken</span>
      </div>
    );
  }
  if (check.error) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>{check.error.message}</span>
      </div>
    );
  }
  return null;
}
