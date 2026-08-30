import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckSquare,
  Eye,
  Loader2,
  Save,
  Send,
  Square,
  Trash2,
  XCircle,
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ImageUploadField from "@/components/expert/ImageUploadField";
import { formatINR } from "@/lib/format";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
  { value: "archived", label: "Archived" },
] as const;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function parseNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

type FormState = {
  title: string;
  slug: string;
  description: string;
  image: string;
  price: string;
  currency: string;
  status: string;
  serviceIds: number[];
};

function emptyForm(): FormState {
  return {
    title: "",
    slug: "",
    description: "",
    image: "",
    price: "",
    currency: "INR",
    status: "draft",
    serviceIds: [],
  };
}

export default function ExpertServicePackageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === "new";
  const numericId = isNew ? null : Number(id);

  const { data, isLoading } = trpc.expertServicePackages.getPackageById.useQuery(
    { id: numericId! },
    { enabled: !isNew && !!numericId },
  );
  const { data: servicesData, isLoading: servicesLoading } =
    trpc.expertServices.listMyServices.useQuery();
  const { data: pageData } = trpc.expertPage.myPage.useQuery();

  const createMutation = trpc.expertServicePackages.createPackage.useMutation({
    onSuccess: (res) => {
      toast.success("Package created");
      navigate(`/expert/service-packages/${res.package.id}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.expertServicePackages.updatePackage.useMutation({
    onSuccess: () => toast.success("Package saved"),
    onError: (e) => toast.error(e.message),
  });

  const publishMutation = trpc.expertServicePackages.publishPackage.useMutation({
    onSuccess: () => {
      toast.success("Package published");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const unpublishMutation = trpc.expertServicePackages.unpublishPackage.useMutation({
    onSuccess: () => {
      toast.success("Package unpublished");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.expertServicePackages.deletePackage.useMutation({
    onSuccess: () => {
      toast.success("Package deleted");
      navigate("/expert/services");
    },
    onError: (e) => toast.error(e.message),
  });

  const refetch = trpc.expertServicePackages.getPackageById.useQuery(
    { id: numericId! },
    { enabled: false },
  ).refetch;

  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    if (data) {
      setForm({
        title: data.title ?? "",
        slug: data.slug ?? "",
        description: data.description ?? "",
        image: data.image ?? "",
        price: data.price ? String(data.price) : "",
        currency: data.currency ?? "INR",
        status: data.status ?? "draft",
        serviceIds: data.serviceIds ?? [],
      });
    }
  }, [data]);

  const services = servicesData ?? [];

  const selectedServices = useMemo(
    () => (servicesData ?? []).filter((s) => form.serviceIds.includes(s.id)),
    [servicesData, form.serviceIds],
  );

  const computedPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + (s.price ?? 0), 0);
  }, [selectedServices]);

  const priceNum = parseNumber(form.price);
  const displayPrice = priceNum ?? computedPrice ?? 0;

  const publicUrl = useMemo(() => {
    if (!pageData?.page?.slug || !form.slug || form.status !== "published") return null;
    return `/m/${pageData.page.slug}/packages/${form.slug}`;
  }, [pageData, form.slug, form.status]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "title" && (f.slug === "" || slugify(f.title) === f.slug)) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  }

  function toggleService(id: number) {
    setForm((f) => {
      const has = f.serviceIds.includes(id);
      const serviceIds = has ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id];
      return { ...f, serviceIds };
    });
  }

  function buildPayload(): Record<string, unknown> {
    return {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      image: form.image || null,
      price: priceNum,
      currency: form.currency.trim().toUpperCase() || "INR",
      status: form.status as "draft" | "published" | "unpublished" | "archived",
      serviceIds: form.serviceIds,
    };
  }

  function save() {
    if (!form.title.trim()) {
      toast.error("Package title is required");
      return;
    }
    if (form.serviceIds.length === 0) {
      toast.error("Select at least one service to include in the package");
      return;
    }
    const payload = buildPayload();
    if (isNew) {
      createMutation.mutate(payload as Parameters<typeof createMutation.mutate>[0]);
    } else {
      updateMutation.mutate({
        id: numericId!,
        data: payload as Parameters<typeof updateMutation.mutate>[0]["data"],
      });
    }
  }

  function publish() {
    if (isNew) {
      toast.error("Save the package first");
      return;
    }
    publishMutation.mutate({ id: numericId! });
  }

  function unpublish() {
    if (isNew) return;
    unpublishMutation.mutate({ id: numericId! });
  }

  function remove() {
    if (isNew) return;
    if (!confirm("Delete this package? This cannot be undone.")) return;
    deleteMutation.mutate({ id: numericId! });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isPublishing = publishMutation.isPending || unpublishMutation.isPending;

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
                  {isNew ? "Create package" : "Edit package"}
                </h1>
              </div>
              <p className="mt-1 text-muted-foreground">
                {isNew
                  ? "Bundle services together and offer them as a package."
                  : "Update your package details and included services."}
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
                disabled={isSaving}
                onClick={save}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-1.5 h-4 w-4" /> Save
              </Button>
              {!isNew && data?.status !== "published" && (
                <Button className="rounded-full" disabled={isPublishing} onClick={publish}>
                  {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-1.5 h-4 w-4" /> Publish
                </Button>
              )}
              {!isNew && data?.status === "published" && (
                <Button variant="outline" className="rounded-full" disabled={isPublishing} onClick={unpublish}>
                  {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <XCircle className="mr-1.5 h-4 w-4" /> Unpublish
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="rounded-3xl border bg-card p-7 shadow-sm space-y-5">
                <h2 className="font-display text-xl font-semibold">Package details</h2>
                <div className="space-y-2">
                  <Label>Package title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    placeholder="e.g. Career Switch Combo"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Public slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="package-slug"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    placeholder="What does this package include and who is it for?"
                    rows={4}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="rounded-3xl border bg-card p-7 shadow-sm space-y-5">
                <h2 className="font-display text-xl font-semibold">Included services</h2>
                {servicesLoading ? (
                  <Skeleton className="h-32 rounded-2xl" />
                ) : services.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      You don&apos;t have any services yet. Create a service first.
                    </p>
                    <Button className="mt-4 rounded-full" asChild>
                      <Link to="/expert/services/new">Create service</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {services.map((s) => {
                      const selected = form.serviceIds.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleService(s.id)}
                          className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-colors ${
                            selected ? "bg-orange-50 border-orange-200" : "bg-card hover:bg-muted/40"
                          }`}
                        >
                          {selected ? (
                            <CheckSquare className="mt-0.5 h-5 w-5 text-orange-600" />
                          ) : (
                            <Square className="mt-0.5 h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{s.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatINR(s.price)} · {s.serviceType.replace(/_/g, " ")}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border bg-card p-7 shadow-sm space-y-5">
                <h2 className="font-display text-xl font-semibold">Pricing</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Package price (INR)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={(e) => update("price", e.target.value)}
                      placeholder={`${computedPrice}`}
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use the default total ({formatINR(computedPrice)}).
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input
                      value={form.currency}
                      onChange={(e) => update("currency", e.target.value.toUpperCase())}
                      className="rounded-xl"
                      maxLength={3}
                    />
                  </div>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <div className="text-sm text-muted-foreground">Students will see</div>
                  <div className="font-display text-2xl font-bold mt-1">{formatINR(displayPrice)}</div>
                </div>
              </div>

              <div className="rounded-3xl border bg-card p-7 shadow-sm space-y-5">
                <h2 className="font-display text-xl font-semibold">Package image</h2>
                <ImageUploadField
                  label="Package image"
                  value={form.image}
                  onChange={(v) => update("image", v)}
                  disabled={isSaving}
                />
              </div>

              <div className="rounded-3xl border bg-card p-7 shadow-sm space-y-5">
                <h2 className="font-display text-xl font-semibold">Status</h2>
                <Select value={form.status} onValueChange={(v) => update("status", v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge
                  variant={
                    form.status === "published"
                      ? "default"
                      : form.status === "archived"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {form.status}
                </Badge>
              </div>

              {!isNew && (
                <Button
                  variant="outline"
                  className="w-full rounded-full text-destructive hover:text-destructive"
                  onClick={remove}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete package
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
