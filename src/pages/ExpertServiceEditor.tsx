import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Clock,
  Eye,
  Globe,
  IndianRupee,
  Loader2,
  MapPin,
  Monitor,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ImageUploadField from "@/components/expert/ImageUploadField";
import { formatINR } from "@/lib/format";

const SERVICE_TYPES = [
  { value: "one_on_one", label: "1:1 Session" },
  { value: "review", label: "Review" },
  { value: "consultation", label: "Consultation" },
  { value: "mentorship", label: "Mentorship Package" },
] as const;

const DELIVERY_MODES = [
  { value: "online", label: "Online", icon: Monitor },
  { value: "offline", label: "Offline", icon: MapPin },
  { value: "async", label: "Async", icon: Clock },
  { value: "hybrid", label: "Hybrid", icon: Globe },
] as const;

const COMMUNICATION_MODES = [
  { value: "none", label: "None (in-app only)" },
  { value: "whatsapp_direct", label: "WhatsApp Direct" },
  { value: "whatsapp_group", label: "Private WhatsApp Group" },
  { value: "whatsapp_direct_and_group", label: "WhatsApp Direct + Group" },
] as const;

const GROUP_ACCESS_POLICIES = [
  { value: "after_booking", label: "After booking is confirmed" },
  { value: "after_payment", label: "After payment is successful" },
  { value: "after_completion", label: "After session is completed" },
  { value: "manual", label: "Manual (I will share separately)" },
] as const;

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
  { value: 240, label: "4 hours" },
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

type FormState = {
  title: string;
  slug: string;
  description: string;
  serviceType: string;
  price: string;
  currency: string;
  durationMinutes: string;
  deliveryMode: string;
  requirements: string;
  outcomes: string;
  image: string;
  status: string;
  communicationMode: string;
  whatsappDirectNumber: string;
  whatsappGroupInviteUrl: string;
  whatsappGroupAccessPolicy: string;
};

function emptyForm(): FormState {
  return {
    title: "",
    slug: "",
    description: "",
    serviceType: "one_on_one",
    price: "",
    currency: "INR",
    durationMinutes: "",
    deliveryMode: "online",
    requirements: "",
    outcomes: "",
    image: "",
    status: "draft",
    communicationMode: "none",
    whatsappDirectNumber: "",
    whatsappGroupInviteUrl: "",
    whatsappGroupAccessPolicy: "after_payment",
  };
}

function parseNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export default function ExpertServiceEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const numericId = isNew ? null : Number(id);

  const { data, isLoading } = trpc.expertServices.getServiceById.useQuery(
    { id: numericId! },
    { enabled: !isNew && !!numericId },
  );
  const { data: pageData } = trpc.expertPage.myPage.useQuery();

  const createMutation = trpc.expertServices.createService.useMutation({
    onSuccess: (res) => {
      toast.success("Service created");
      navigate(`/expert/services/${res.service.id}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.expertServices.updateService.useMutation({
    onSuccess: () => {
      toast.success("Service saved");
    },
    onError: (e) => toast.error(e.message),
  });
  const publishMutation = trpc.expertServices.publishService.useMutation({
    onSuccess: () => {
      toast.success("Service published");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const unpublishMutation = trpc.expertServices.unpublishService.useMutation({
    onSuccess: () => {
      toast.success("Service unpublished");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const archiveMutation = trpc.expertServices.archiveService.useMutation({
    onSuccess: () => {
      toast.success("Service archived");
      refetch();
      navigate("/expert/services");
    },
    onError: (e) => toast.error(e.message),
  });

  const refetch = trpc.expertServices.getServiceById.useQuery(
    { id: numericId! },
    { enabled: false },
  ).refetch;

  const [form, setForm] = useState<FormState>(emptyForm());
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        title: data.title ?? "",
        slug: data.slug ?? "",
        description: data.description ?? "",
        serviceType: data.serviceType ?? "one_on_one",
        price: String(data.price ?? ""),
        currency: data.currency ?? "INR",
        durationMinutes: data.durationMinutes ? String(data.durationMinutes) : "",
        deliveryMode: data.deliveryMode ?? "online",
        requirements: data.requirements ?? "",
        outcomes: data.outcomes ?? "",
        image: data.image ?? "",
        status: data.status ?? "draft",
        communicationMode: data.communicationMode ?? "none",
        whatsappDirectNumber: data.whatsappDirectNumber ?? "",
        whatsappGroupInviteUrl: data.whatsappGroupInviteUrl ?? "",
        whatsappGroupAccessPolicy: data.whatsappGroupAccessPolicy ?? "after_payment",
      });
    }
  }, [data]);

  const priceNum = parseNumber(form.price) ?? 0;
  const durationNum = parseNumber(form.durationMinutes);

  const publicUrl = useMemo(() => {
    if (!pageData?.page?.slug || !form.slug) return null;
    return `/m/${pageData.page.slug}/services/${form.slug}`;
  }, [pageData, form.slug]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "title" && (f.slug === "" || slugify(f.title) === f.slug)) {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  function buildPayload(): Record<string, unknown> {
    return {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      serviceType: form.serviceType,
      price: priceNum,
      currency: form.currency.trim().toUpperCase() || "INR",
      durationMinutes: durationNum,
      deliveryMode: form.deliveryMode,
      requirements: form.requirements.trim() || null,
      outcomes: form.outcomes.trim() || null,
      image: form.image || null,
      status: form.status as "draft" | "published" | "unpublished" | "archived",
      communicationMode: form.communicationMode as "none" | "whatsapp_direct" | "whatsapp_group" | "whatsapp_direct_and_group",
      whatsappDirectNumber: form.whatsappDirectNumber.trim() || null,
      whatsappGroupInviteUrl: form.whatsappGroupInviteUrl.trim() || null,
      whatsappGroupAccessPolicy: form.whatsappGroupAccessPolicy as "after_booking" | "after_payment" | "after_completion" | "manual",
    };
  }

  function save() {
    if (!form.title.trim()) {
      toast.error("Service title is required");
      return;
    }
    if (priceNum < 0) {
      toast.error("Price cannot be negative");
      return;
    }
    const payload = buildPayload();
    if (isNew) {
      createMutation.mutate(payload as Parameters<typeof createMutation.mutate>[0]);
    } else {
      updateMutation.mutate({ id: numericId!, data: payload as Parameters<typeof updateMutation.mutate>[0]["data"] });
    }
  }

  function publish() {
    if (isNew) {
      toast.error("Save the service as a draft before publishing");
      return;
    }
    publishMutation.mutate({ id: numericId! });
  }

  function unpublish() {
    if (isNew) return;
    unpublishMutation.mutate({ id: numericId! });
  }

  function archive() {
    if (isNew) return;
    archiveMutation.mutate({ id: numericId! });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isPublishing = publishMutation.isPending;

  if (!isNew && isLoading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 pt-28 pb-16">
          <Skeleton className="h-[70vh] rounded-3xl" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-28 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full" asChild>
                  <Link to="/expert/services">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <h1 className="font-display text-3xl font-bold tracking-tight">
                  {isNew ? "Create service" : "Edit service"}
                </h1>
              </div>
              <p className="mt-1 text-muted-foreground">
                {isNew
                  ? "Define what you offer, set a price, and publish when ready."
                  : "Update your service details and publishing status."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isNew && data?.status === "published" && publicUrl && (
                <Button variant="outline" className="rounded-full" asChild>
                  <a href={publicUrl} target="_blank" rel="noreferrer">
                    <Eye className="mr-1.5 h-4 w-4" /> View public
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setShowPreview((v) => !v)}
              >
                <Eye className="mr-1.5 h-4 w-4" /> {showPreview ? "Hide preview" : "Preview"}
              </Button>
              <Button className="rounded-full" disabled={isSaving} onClick={save}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-1.5 h-4 w-4" /> Save
              </Button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="rounded-3xl border bg-card p-7 shadow-sm space-y-5">
                <h2 className="font-display text-xl font-semibold">Basic information</h2>
                <div className="space-y-2">
                  <Label>Service title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="e.g. 1:1 Product Management Mentorship"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Public slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="service-slug"
                    className="rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from title. Used in the public URL.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="What will the student get from this service?"
                    rows={4}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="rounded-3xl border bg-card p-7 shadow-sm space-y-5">
                <h2 className="font-display text-xl font-semibold">Service details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Service type</Label>
                    <Select value={form.serviceType} onValueChange={(v) => update("serviceType", v)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Delivery mode</Label>
                    <Select value={form.deliveryMode} onValueChange={(v) => update("deliveryMode", v)}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_MODES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            <span className="flex items-center gap-2">
                              <m.icon className="h-4 w-4" /> {m.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price (INR)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={0}
                        value={form.price}
                        onChange={(e) => update("price", e.target.value)}
                        placeholder="999"
                        className="rounded-xl pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select
                      value={form.durationMinutes}
                      onValueChange={(v) => update("durationMinutes", v)}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No fixed duration</SelectItem>
                        {DURATION_OPTIONS.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border bg-card p-7 shadow-sm space-y-5">
                <h2 className="font-display text-xl font-semibold">Communication</h2>
                <p className="text-sm text-muted-foreground">
                  Tell students how they will connect with you after booking.
                </p>
                <div className="space-y-2">
                  <Label>Communication mode</Label>
                  <Select value={form.communicationMode} onValueChange={(v) => update("communicationMode", v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMUNICATION_MODES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(form.communicationMode === "whatsapp_direct" || form.communicationMode === "whatsapp_direct_and_group") && (
                  <div className="space-y-2">
                    <Label>WhatsApp number</Label>
                    <Input
                      value={form.whatsappDirectNumber}
                      onChange={(e) => update("whatsappDirectNumber", e.target.value)}
                      placeholder="+91 98765 43210"
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Include country code. This is shown to eligible students.
                    </p>
                  </div>
                )}

                {(form.communicationMode === "whatsapp_group" || form.communicationMode === "whatsapp_direct_and_group") && (
                  <>
                    <div className="space-y-2">
                      <Label>Private WhatsApp group invite URL</Label>
                      <Input
                        value={form.whatsappGroupInviteUrl}
                        onChange={(e) => update("whatsappGroupInviteUrl", e.target.value)}
                        placeholder="https://chat.whatsapp.com/..."
                        className="rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground">
                        Never share this publicly. Eligible students will see it after booking.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Group access policy</Label>
                      <Select value={form.whatsappGroupAccessPolicy} onValueChange={(v) => update("whatsappGroupAccessPolicy", v)}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {GROUP_ACCESS_POLICIES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div className="rounded-3xl border bg-card p-7 shadow-sm space-y-5">
                <h2 className="font-display text-xl font-semibold">Service image</h2>
                <ImageUploadField
                  label="Service image"
                  value={form.image}
                  onChange={(v) => update("image", v)}
                  disabled={isSaving}
                />
              </div>

              <div className="rounded-3xl border bg-card p-7 shadow-sm space-y-5">
                <h2 className="font-display text-xl font-semibold">Student information</h2>
                <div className="space-y-2">
                  <Label>Requirements from student</Label>
                  <Textarea
                    value={form.requirements}
                    onChange={(e) => update("requirements", e.target.value)}
                    placeholder="e.g. Please share your current resume and target B-schools."
                    rows={3}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expected outcomes</Label>
                  <Textarea
                    value={form.outcomes}
                    onChange={(e) => update("outcomes", e.target.value)}
                    placeholder="e.g. Action plan, resume feedback, career direction."
                    rows={3}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {!isNew && (
                <div className="rounded-3xl border bg-card p-7 shadow-sm space-y-5">
                  <h2 className="font-display text-xl font-semibold">Publishing</h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-sm text-muted-foreground">
                        {data?.status === "published"
                          ? "This service is visible on your public page."
                          : data?.status === "unpublished"
                            ? "This service is hidden from your public page."
                            : data?.status === "archived"
                              ? "This service is archived."
                              : "This service is still a draft."}
                      </p>
                    </div>
                    <Badge
                      variant={
                        data?.status === "published"
                          ? "default"
                          : data?.status === "unpublished"
                            ? "outline"
                            : data?.status === "archived"
                              ? "destructive"
                              : "secondary"
                      }
                    >
                      {data?.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data?.status === "published" ? (
                      <Button variant="outline" className="rounded-full" onClick={unpublish} disabled={isPublishing}>
                        {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Unpublish
                      </Button>
                    ) : (
                      <Button className="rounded-full" onClick={publish} disabled={isPublishing}>
                        {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Send className="mr-1.5 h-4 w-4" /> Publish service
                      </Button>
                    )}
                    {data?.status !== "archived" && (
                      <Button variant="outline" className="rounded-full text-destructive" onClick={archive}>
                        <Trash2 className="mr-1.5 h-4 w-4" /> Archive
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5" /> Preview
                </h2>
                <ServicePreview form={form} priceNum={priceNum} durationNum={durationNum} />
              </div>

              <div className="rounded-3xl border bg-card p-6 shadow-sm">
                <h2 className="font-display text-lg font-semibold mb-3">Publishing checklist</h2>
                <ul className="space-y-2 text-sm">
                  <CheckItem done={form.title.trim().length >= 2} label="Title is set" />
                  <CheckItem done={form.description.trim().length >= 10} label="Description is detailed" />
                  <CheckItem done={priceNum >= 0} label="Price is valid" />
                  <CheckItem done={!!form.durationMinutes} label="Duration is selected" />
                  <CheckItem done={form.slug.trim().length > 0} label="Slug is set" />
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {done ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <div className="h-4 w-4 rounded-full border border-muted-foreground" />
      )}
      <span className={done ? "text-green-700" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

function ServicePreview({
  form,
  priceNum,
  durationNum,
}: {
  form: FormState;
  priceNum: number;
  durationNum: number | null;
}) {
  const typeLabel = SERVICE_TYPES.find((t) => t.value === form.serviceType)?.label ?? form.serviceType;
  const deliveryLabel = DELIVERY_MODES.find((m) => m.value === form.deliveryMode)?.label ?? form.deliveryMode;

  return (
    <div className="rounded-2xl border p-5 bg-card">
      {form.image && (
        <img
          src={form.image}
          alt={form.title}
          className="h-32 w-full rounded-xl object-cover mb-4 border"
        />
      )}
      <h3 className="font-display text-xl font-bold">
        {form.title.trim() || "Service title"}
      </h3>
      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
        <Badge variant="secondary">{typeLabel}</Badge>
        <Badge variant="outline">{deliveryLabel}</Badge>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <span className="font-display text-2xl font-bold">{formatINR(priceNum)}</span>
        {durationNum && (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-4 w-4" /> {formatDuration(durationNum)}
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
        {form.description.trim() || "Service description will appear here."}
      </p>
      {form.outcomes.trim() && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-1">What you&apos;ll get</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {form.outcomes.split("\n").map((line, i) => (
              <li key={i}>{line.trim()}</li>
            ))}
          </ul>
        </div>
      )}
      {form.requirements.trim() && (
        <div className="mt-4 p-3 rounded-xl bg-muted/40 text-sm">
          <p className="font-medium mb-1">Please share</p>
          <p className="text-muted-foreground">{form.requirements}</p>
        </div>
      )}
      <Button className="w-full mt-5 rounded-full" disabled>
        View service
      </Button>
    </div>
  );
}
