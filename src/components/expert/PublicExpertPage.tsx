import {
  ArrowRight,
  Briefcase,
  Check,
  Clock,
  GraduationCap,
  Link2,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Github,
  Globe,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../api/router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";

type ExpertPageData = inferRouterOutputs<AppRouter>["catalog"]["expertPageBySlug"];
type Section = NonNullable<ExpertPageData>["sections"][number];
type Experience = NonNullable<ExpertPageData>["experiences"][number];
type Education = NonNullable<ExpertPageData>["educations"][number];
type Service = NonNullable<ExpertPageData>["services"][number];
type Package = NonNullable<ExpertPageData>["packages"][number];

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  about: "About",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  services: "Services",
  social_links: "Connect",
  cta: "Get in touch",
};

const SOCIAL_ICONS: Record<string, typeof Linkedin> = {
  linkedinUrl: Linkedin,
  githubUrl: Github,
  portfolioUrl: Globe,
  websiteUrl: Link2,
};

function ReviewSummary({ expertUserId }: { expertUserId: number }) {
  const { data, isLoading } = trpc.reviews.summaryForExpert.useQuery({ expertUserId });
  if (isLoading || !data || data.reviewCount === 0) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center text-amber-500">
        <Star className="h-4 w-4 fill-current" />
      </div>
      <span className="text-sm font-medium">{data.averageRating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">({data.reviewCount} reviews)</span>
    </div>
  );
}

function ReviewsSection({ expertUserId, cardBg, mutedText }: { expertUserId: number; cardBg: string; mutedText: string }) {
  const { data, isLoading } = trpc.reviews.listForExpert.useQuery({ expertUserId });
  if (isLoading) return <Skeleton className={`h-48 rounded-3xl ${cardBg}`} />;
  if (!data || data.reviews.length === 0) return null;
  return (
    <section className={`rounded-3xl border p-6 sm:p-8 ${cardBg}`}>
      <h2 className="font-display text-xl font-semibold mb-5">Reviews</h2>
      <div className="space-y-5">
        {data.reviews.map((row) => (
          <div key={row.review.id} className="border-b last:border-0 pb-5 last:pb-0">
            <div className="flex items-center gap-1.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < row.review.rating ? "text-amber-500 fill-current" : "text-stone-300"}`}
                />
              ))}
              <span className="ml-2 text-sm font-medium">{row.review.title}</span>
            </div>
            {row.review.content && <p className={`text-sm leading-relaxed ${mutedText}`}>{row.review.content}</p>}
            <div className="mt-2 text-xs text-muted-foreground">
              {row.studentName} · {row.serviceTitle} · {new Date(row.review.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PublicExpertPage({ data }: { data: NonNullable<ExpertPageData> }) {
  const { config, sections, profile, user, experiences, educations, services, packages } = data;

  const isDark = config.background === "dark";
  const isMuted = config.background === "muted";
  const bgClass = isDark
    ? "bg-stone-950 text-stone-100"
    : isMuted
      ? "bg-stone-50 text-stone-900"
      : "bg-white text-stone-900";
  const cardBg = isDark ? "bg-stone-900/60 border-stone-800" : "bg-white/80 border-stone-200";
  const mutedText = isDark ? "text-stone-400" : "text-stone-500";
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

  const accentColor = config.accentColor;
  const accentStyle = { backgroundColor: accentColor, color: "#fff" };
  const chipStyle = { borderColor: accentColor, color: accentColor };

  const orderedSections = (sections ?? [])
    .filter((s: Section) => s.isVisible)
    .sort((a: Section, b: Section) => a.displayOrder - b.displayOrder)
    .map((s: Section) => s.sectionType);

  const socials = [
    { key: "linkedinUrl", label: "LinkedIn", url: profile?.linkedinUrl },
    { key: "githubUrl", label: "GitHub", url: profile?.githubUrl },
    { key: "portfolioUrl", label: "Portfolio", url: profile?.portfolioUrl },
    { key: "websiteUrl", label: "Website", url: profile?.websiteUrl },
  ].filter((s): s is { key: string; label: string; url: string } => !!s.url);

  const displayName = profile?.displayName || user?.name || "Expert";
  const headline = profile?.headline || profile?.currentRole || "";

  const expertise =
    profile?.expertise
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const industries =
    profile?.industries
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  const languages =
    profile?.languages
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Cover */}
      <div
        className={`relative h-56 sm:h-72 ${
          profile?.coverImage && config.coverStyle !== "none"
            ? ""
            : config.coverStyle === "gradient"
              ? "bg-gradient-to-br from-orange-500 via-rose-500 to-violet-600"
              : config.coverStyle === "solid"
                ? "bg-stone-200"
                : "bg-transparent border-b"
        }`}
      >
        {profile?.coverImage && config.coverStyle !== "none" && (
          <img
            src={profile.coverImage}
            alt="cover"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 pb-20 -mt-20 sm:-mt-24">
        {/* Profile hero card */}
        <div className={`rounded-3xl border p-6 sm:p-8 shadow-sm ${cardBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            {profile?.profileImage ? (
              <img
                src={profile.profileImage}
                alt={displayName}
                className={`h-28 w-28 sm:h-32 sm:w-32 border-4 ${cardBg.split(" ")[0]} object-cover shadow-lg ${radius}`}
              />
            ) : (
              <div
                className={`h-28 w-28 sm:h-32 sm:w-32 border-4 ${cardBg.split(" ")[0]} flex items-center justify-center bg-orange-100 text-orange-600 text-4xl font-bold shadow-lg ${radius}`}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {(profile?.verificationStatus === "verified" || profile?.isVerified) && (
                  <Badge className="bg-green-100 text-green-700 border-0">
                    <Check className="mr-1 h-3 w-3" /> Verified Expert
                  </Badge>
                )}
                <ReviewSummary expertUserId={user.id} />
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
                {displayName}
              </h1>
              {headline && <p className={`text-lg ${mutedText} mt-1`}>{headline}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                {profile?.currentRole && (
                  <span className="flex items-center gap-1.5">
                    <Briefcase className={`h-4 w-4 ${mutedText}`} />
                    {profile.currentRole}
                    {profile?.company && ` at ${profile.company}`}
                  </span>
                )}
                {profile?.location && (
                  <span className={`flex items-center gap-1.5 ${mutedText}`}>
                    <MapPin className="h-4 w-4" />
                    {profile.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {orderedSections.includes("cta") && config.ctaType !== "none" && (
                <button className={`px-6 py-2.5 text-sm font-medium ${btnRadius}`} style={accentStyle}>
                  {config.ctaLabel || "Get in touch"}
                </button>
              )}
              <ReviewCTA expertUserId={user.id} />
            </div>
          </div>

          {orderedSections.includes("social_links") && socials.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map((s) => {
                const Icon = SOCIAL_ICONS[s.key] || Globe;
                return (
                  <Button
                    key={s.key}
                    variant="outline"
                    size="sm"
                    className={`rounded-full ${btnRadius}`}
                    style={{ borderColor: accentColor, color: accentColor }}
                    asChild
                  >
                    <a href={s.url} target="_blank" rel="noreferrer">
                      <Icon className="mr-1.5 h-4 w-4" />
                      {s.label}
                    </a>
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {orderedSections.includes("about") && profile?.bio && (
              <section className={`rounded-3xl border p-6 sm:p-8 ${cardBg}`}>
                <h2 className="font-display text-xl font-semibold mb-3">
                  {SECTION_LABELS.about}
                </h2>
                <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${mutedText}`}>
                  {profile.bio}
                </p>
              </section>
            )}

            {orderedSections.includes("experience") && experiences.length > 0 && (
              <section className={`rounded-3xl border p-6 sm:p-8 ${cardBg}`}>
                <h2 className="font-display text-xl font-semibold mb-5 flex items-center gap-2">
                  <Briefcase className={`h-5 w-5 ${mutedText}`} />
                  {SECTION_LABELS.experience}
                </h2>
                <div className="space-y-6 relative pl-4">
                  <div
                    className="absolute left-[11px] top-2 bottom-2 w-px"
                    style={{ backgroundColor: accentColor, opacity: 0.3 }}
                  />
                  {experiences.map((exp: Experience) => (
                    <div key={exp.id} className="relative pl-6">
                      <div
                        className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2"
                        style={{ borderColor: accentColor, backgroundColor: isDark ? "#292524" : "#fff" }}
                      />
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-semibold">{exp.role || "Role"}</h3>
                        <span className={`text-xs ${mutedText}`}>
                          {exp.startDate} {exp.endDate ? `— ${exp.isCurrent ? "Present" : exp.endDate}` : ""}
                        </span>
                      </div>
                      <p className={`text-sm ${mutedText}`}>{exp.company}</p>
                      {exp.description && (
                        <p className={`text-sm mt-2 leading-relaxed whitespace-pre-line ${mutedText}`}>
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {orderedSections.includes("education") && educations.length > 0 && (
              <section className={`rounded-3xl border p-6 sm:p-8 ${cardBg}`}>
                <h2 className="font-display text-xl font-semibold mb-5 flex items-center gap-2">
                  <GraduationCap className={`h-5 w-5 ${mutedText}`} />
                  {SECTION_LABELS.education}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {educations.map((edu: Education) => (
                    <div
                      key={edu.id}
                      className={`rounded-2xl border p-4 ${cardBg}`}
                    >
                      <div className="font-semibold">{edu.institution}</div>
                      <div className={`text-sm ${mutedText}`}>
                        {edu.degree} {edu.fieldOfStudy ? `— ${edu.fieldOfStudy}` : ""}
                      </div>
                      <div className={`mt-2 flex flex-wrap items-center gap-3 text-xs ${mutedText}`}>
                        {(edu.startDate || edu.endDate) && (
                          <span>
                            {edu.startDate ?? ""}
                            {edu.startDate && edu.endDate ? " — " : ""}
                            {edu.endDate ?? ""}
                          </span>
                        )}
                        {edu.grade && <span>Grade: {edu.grade}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {orderedSections.includes("skills") && expertise.length > 0 && (
              <section className={`rounded-3xl border p-6 sm:p-8 ${cardBg}`}>
                <h2 className="font-display text-xl font-semibold mb-4">
                  {SECTION_LABELS.skills}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {expertise.map((skill: string) => (
                    <span
                      key={skill}
                      className="rounded-full border px-3 py-1 text-xs sm:text-sm font-medium"
                      style={chipStyle}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {industries.length > 0 && (
              <section className={`rounded-3xl border p-6 sm:p-8 ${cardBg}`}>
                <h2 className="font-display text-xl font-semibold mb-4">Industries</h2>
                <div className="flex flex-wrap gap-2">
                  {industries.map((industry: string) => (
                    <span
                      key={industry}
                      className="rounded-full border px-3 py-1 text-xs sm:text-sm font-medium"
                      style={chipStyle}
                    >
                      {industry}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {languages.length > 0 && (
              <section className={`rounded-3xl border p-6 sm:p-8 ${cardBg}`}>
                <h2 className="font-display text-xl font-semibold mb-4">Languages</h2>
                <div className="flex flex-wrap gap-2">
                  {languages.map((language: string) => (
                    <span
                      key={language}
                      className="rounded-full border px-3 py-1 text-xs sm:text-sm font-medium"
                      style={chipStyle}
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {(services.length > 0 || packages.length > 0) && (
              <section className={`rounded-3xl border p-6 sm:p-8 ${cardBg}`}>
                <h2 className="font-display text-xl font-semibold mb-5">
                  {SECTION_LABELS.services}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {packages.map((pkg: Package) => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      accentColor={accentColor}
                      expertSlug={data.page.slug}
                    />
                  ))}
                  {services.map((service: Service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      accentColor={accentColor}
                      expertSlug={data.page.slug}
                    />
                  ))}
                </div>
              </section>
            )}

            <ReviewsSection expertUserId={user.id} cardBg={cardBg} mutedText={mutedText} />
          </div>

          <div className="space-y-6">
            {(orderedSections.includes("cta") && config.ctaType !== "none") ||
            socials.length > 0 ? (
              <div className={`rounded-3xl border p-6 ${cardBg}`}>
                <h3 className="font-display text-lg font-semibold mb-4">Connect</h3>
                {socials.length > 0 && (
                  <div className="space-y-2">
                    {socials.map((s) => (
                      <a
                        key={s.key}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl p-2.5 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: accentColor }}
                        >
                          {s.key === "linkedinUrl" ? (
                            <Linkedin className="h-4 w-4" />
                          ) : s.key === "githubUrl" ? (
                            <Github className="h-4 w-4" />
                          ) : (
                            <Globe className="h-4 w-4" />
                          )}
                        </span>
                        <span className="truncate">{s.label}</span>
                      </a>
                    ))}
                  </div>
                )}
                {orderedSections.includes("cta") && config.ctaType !== "none" && (
                  <Button
                    className={`w-full mt-4 ${btnRadius}`}
                    style={accentStyle}
                    asChild
                  >
                    <a
                      href={
                        config.ctaType === "external_url"
                          ? config.ctaTarget || "#"
                          : config.ctaType === "contact"
                            ? `mailto:${user?.email ?? ""}`
                            : "#"
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Mail className="mr-1.5 h-4 w-4" />
                      {config.ctaLabel || "Get in touch"}
                    </a>
                  </Button>
                )}
              </div>
            ) : null}

            <div className={`rounded-3xl border p-6 ${cardBg}`}>
              <p className={`text-xs ${mutedText}`}>
                Powered by{" "}
                <span className="font-semibold text-orange-600">Embark</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackageCard({
  pkg,
  accentColor,
  expertSlug,
}: {
  pkg: Package;
  accentColor: string;
  expertSlug: string;
}) {
  const chipStyle = { borderColor: accentColor, color: accentColor };
  const btnStyle = { backgroundColor: accentColor, color: "#fff" };
  const included = pkg.items ?? [];

  return (
    <div className="rounded-2xl border p-5 flex flex-col h-full" style={{ borderColor: accentColor }}>
      {pkg.image && (
        <img
          src={pkg.image}
          alt={pkg.title}
          className="h-28 w-full rounded-xl object-cover mb-3 border"
        />
      )}
      <h3 className="font-display text-lg font-semibold leading-tight">{pkg.title}</h3>
      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
        <span className="rounded-full border px-2 py-0.5 font-medium" style={chipStyle}>
          Package
        </span>
        {included.length > 0 && (
          <span className="text-muted-foreground">{included.length} service{included.length === 1 ? "" : "s"}</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
        {pkg.description || "No description"}
      </p>
      {included.length > 0 && (
        <ul className="mt-3 space-y-1">
          {included.slice(0, 4).map((item) => (
            <li key={item.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-green-600" />
              <span className="line-clamp-1">{item.service.title}</span>
            </li>
          ))}
          {included.length > 4 && (
            <li className="text-xs text-muted-foreground">+ {included.length - 4} more</li>
          )}
        </ul>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="font-display text-lg font-bold">
          {pkg.price ? formatINR(pkg.price) : "Custom"}
        </span>
      </div>
      <Button
        asChild
        className="w-full mt-4 rounded-full"
        style={btnStyle}
        variant="ghost"
      >
        <Link to={`/m/${expertSlug}/packages/${pkg.slug}`}>
          View package <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function ServiceCard({
  service,
  accentColor,
  expertSlug,
}: {
  service: Service;
  accentColor: string;
  expertSlug: string;
}) {
  const chipStyle = { borderColor: accentColor, color: accentColor };
  const btnStyle = { backgroundColor: accentColor, color: "#fff" };
  const serviceTypeLabel = service.serviceType.replace(/_/g, " ");

  return (
    <div className="rounded-2xl border p-5 flex flex-col h-full" style={{ borderColor: accentColor }}>
      {service.image && (
        <img
          src={service.image}
          alt={service.title}
          className="h-28 w-full rounded-xl object-cover mb-3 border"
        />
      )}
      <h3 className="font-display text-lg font-semibold leading-tight">{service.title}</h3>
      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
        <span className="rounded-full border px-2 py-0.5 font-medium capitalize" style={chipStyle}>
          {serviceTypeLabel}
        </span>
        {service.deliveryMode && (
          <span className="text-muted-foreground capitalize">{service.deliveryMode.replace(/_/g, " ")}</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
        {service.description || "No description"}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <span className="font-display text-lg font-bold">
          {formatINR(service.price)}
        </span>
        {service.durationMinutes && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {formatDuration(service.durationMinutes)}
          </span>
        )}
      </div>
      <Button
        asChild
        className="w-full mt-4 rounded-full"
        style={btnStyle}
        variant="ghost"
      >
        <Link to={`/m/${expertSlug}/services/${service.slug}`}>
          View service <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}

function ReviewCTA({ expertUserId }: { expertUserId: number }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const isCandidate = user?.role === "candidate";

  const { data: pending, isLoading } = trpc.reviews.pendingForExpert.useQuery(
    { expertUserId },
    { enabled: isCandidate }
  );

  const utils = trpc.useUtils();
  const create = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Review submitted");
      setOpen(false);
      setRating(0);
      setTitle("");
      setContent("");
      utils.reviews.pendingForExpert.invalidate({ expertUserId });
      utils.reviews.listForExpert.invalidate({ expertUserId });
      utils.reviews.summaryForExpert.invalidate({ expertUserId });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isCandidate || isLoading || !pending) return null;

  const canSubmit = rating > 0 && !create.isPending;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-full border-amber-400 text-amber-700 hover:bg-amber-50"
        onClick={() => setOpen(true)}
      >
        <Star className="mr-1.5 h-4 w-4 fill-amber-400 text-amber-400" /> Write a review
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Write a review</DialogTitle>
            <DialogDescription>
              Share your experience to help other students.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const active = i < (hoverRating || rating);
                return (
                  <button
                    key={i}
                    type="button"
                    className="p-1"
                    onMouseEnter={() => setHoverRating(i + 1)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(i + 1)}
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        active ? "fill-amber-400 text-amber-400" : "text-stone-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-title">Title</Label>
              <Input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Insightful mock interview"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-content">Review</Label>
              <Textarea
                id="review-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What went well? What could be better?"
                rows={4}
                className="rounded-xl"
              />
            </div>

            <Button
              className="w-full rounded-full"
              disabled={!canSubmit}
              onClick={() =>
                create.mutate({
                  bookingId: pending.bookingId,
                  rating,
                  title: title || undefined,
                  content: content || undefined,
                })
              }
            >
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

