import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Briefcase,
  Clock,
  Edit,
  Eye,
  Loader2,
  MoreHorizontal,
  Plus,
  Archive,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/site/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";

type ServiceStatus = "draft" | "published" | "unpublished" | "archived";

type Service = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  serviceType: string;
  price: number;
  currency: string;
  durationMinutes: number | null;
  deliveryMode: string | null;
  status: ServiceStatus;
  displayOrder: number;
  image: string | null;
  updatedAt: Date;
};

type Package = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image: string | null;
  price: number | null;
  currency: string;
  status: ServiceStatus;
  displayOrder: number;
  serviceIds: number[];
  updatedAt: Date;
};

const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "default" },
  unpublished: { label: "Unpublished", variant: "outline" },
  archived: { label: "Archived", variant: "destructive" },
};

function formatDuration(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function PackageCardRow({
  pkg,
  expertSlug,
  onAction,
}: {
  pkg: Package;
  expertSlug?: string | null;
  onAction: () => void;
}) {
  const navigate = useNavigate();
  const publish = trpc.expertServicePackages.publishPackage.useMutation({
    onSuccess: () => {
      toast.success("Package published");
      onAction();
    },
    onError: (e) => toast.error(e.message),
  });
  const unpublish = trpc.expertServicePackages.unpublishPackage.useMutation({
    onSuccess: () => {
      toast.success("Package unpublished");
      onAction();
    },
    onError: (e) => toast.error(e.message),
  });
  const deletePkg = trpc.expertServicePackages.deletePackage.useMutation({
    onSuccess: () => {
      toast.success("Package deleted");
      onAction();
    },
    onError: (e) => toast.error(e.message),
  });

  const status = STATUS_CONFIG[pkg.status];
  const isLoading = publish.isPending || unpublish.isPending || deletePkg.isPending;
  const publicUrl = expertSlug && pkg.status === "published" ? `/m/${expertSlug}/packages/${pkg.slug}` : null;

  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {pkg.image ? (
            <img
              src={pkg.image}
              alt={pkg.title}
              className="h-16 w-16 rounded-2xl object-cover border flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Package className="h-7 w-7 text-orange-500" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-semibold truncate">{pkg.title}</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {pkg.description || "No description yet."}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
              <span className="font-medium">{pkg.price ? formatINR(pkg.price) : "Auto-priced"}</span>
              <span className="text-muted-foreground">{pkg.serviceIds.length} service{pkg.serviceIds.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/expert/service-packages/${pkg.id}`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            {publicUrl && (
              <DropdownMenuItem asChild>
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <Eye className="mr-2 h-4 w-4" /> View public page
                </a>
              </DropdownMenuItem>
            )}
            {pkg.status === "draft" && (
              <DropdownMenuItem onClick={() => publish.mutate({ id: pkg.id })}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Publish
              </DropdownMenuItem>
            )}
            {pkg.status === "published" && (
              <DropdownMenuItem onClick={() => unpublish.mutate({ id: pkg.id })}>
                <XCircle className="mr-2 h-4 w-4" /> Unpublish
              </DropdownMenuItem>
            )}
            {(pkg.status === "draft" || pkg.status === "unpublished") && (
              <DropdownMenuItem
                onClick={() => deletePkg.mutate({ id: pkg.id })}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  expertSlug,
  onAction,
}: {
  service: Service;
  expertSlug?: string | null;
  onAction: () => void;
}) {
  const navigate = useNavigate();
  const publish = trpc.expertServices.publishService.useMutation({
    onSuccess: () => {
      toast.success("Service published");
      onAction();
    },
    onError: (e) => toast.error(e.message),
  });
  const unpublish = trpc.expertServices.unpublishService.useMutation({
    onSuccess: () => {
      toast.success("Service unpublished");
      onAction();
    },
    onError: (e) => toast.error(e.message),
  });
  const archive = trpc.expertServices.archiveService.useMutation({
    onSuccess: () => {
      toast.success("Service archived");
      onAction();
    },
    onError: (e) => toast.error(e.message),
  });

  const status = STATUS_CONFIG[service.status];
  const isLoading = publish.isPending || unpublish.isPending || archive.isPending;
  const publicUrl = expertSlug ? `/m/${expertSlug}/services/${service.slug}` : null;

  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {service.image ? (
            <img
              src={service.image}
              alt={service.title}
              className="h-16 w-16 rounded-2xl object-cover border flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-7 w-7 text-orange-500" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-semibold truncate">{service.title}</h3>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {service.description || "No description yet."}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
              <span className="font-medium">{formatINR(service.price)}</span>
              {service.durationMinutes && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDuration(service.durationMinutes)}
                </span>
              )}
              <span className="text-muted-foreground capitalize">
                {service.serviceType.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/expert/services/${service.id}`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            {publicUrl && service.status === "published" && (
              <DropdownMenuItem asChild>
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <Eye className="mr-2 h-4 w-4" /> View public page
                </a>
              </DropdownMenuItem>
            )}
            {service.status === "draft" && (
              <DropdownMenuItem onClick={() => publish.mutate({ id: service.id })}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Publish
              </DropdownMenuItem>
            )}
            {service.status === "published" && (
              <DropdownMenuItem onClick={() => unpublish.mutate({ id: service.id })}>
                <XCircle className="mr-2 h-4 w-4" /> Unpublish
              </DropdownMenuItem>
            )}
            {(service.status === "draft" || service.status === "unpublished") && (
              <DropdownMenuItem
                onClick={() => archive.mutate({ id: service.id })}
                className="text-destructive focus:text-destructive"
              >
                <Archive className="mr-2 h-4 w-4" /> Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function ExpertServices() {
  const { data, isLoading, refetch } = trpc.expertServices.listMyServices.useQuery();
  const { data: packagesData, isLoading: packagesLoading, refetch: refetchPackages } =
    trpc.expertServicePackages.listMyPackages.useQuery();
  const { data: pageData } = trpc.expertPage.myPage.useQuery();
  const [reorderMode, setReorderMode] = useState(false);
  const reorder = trpc.expertServices.reorderServices.useMutation({
    onSuccess: () => {
      toast.success("Services reordered");
      setReorderMode(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const [ordered, setOrdered] = useState<Service[]>([]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 pt-28 pb-16">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl mt-4" />
        </div>
      </>
    );
  }

  const services = (data ?? []) as Service[];
  const expertSlug = pageData?.page?.slug;

  const grouped: Record<ServiceStatus, Service[]> = {
    draft: [],
    published: [],
    unpublished: [],
    archived: [],
  };
  for (const s of services) {
    grouped[s.status].push(s);
  }

  function moveItem(index: number, direction: "up" | "down") {
    setOrdered((prev) => {
      const next = [...prev];
      if (direction === "up" && index > 0) {
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
      } else if (direction === "down" && index < next.length - 1) {
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
      }
      return next;
    });
  }

  function saveOrder() {
    reorder.mutate(
      ordered.map((s, i) => ({ id: s.id, displayOrder: i })),
    );
  }

  const publishedCount = grouped.published.length;
  const totalCount = services.length;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-28 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full" asChild>
                  <Link to="/expert/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <h1 className="font-display text-3xl font-bold tracking-tight">Services</h1>
              </div>
              <p className="mt-1 text-muted-foreground">
                {totalCount === 0
                  ? "Create your first service so students can book you."
                  : `You have ${publishedCount} published service${publishedCount === 1 ? "" : "s"} out of ${totalCount}.`}
                {packagesData && packagesData.length > 0 && (
                  <>
                    {" "}
                    · {packagesData.filter((p) => p.status === "published").length} published package
                    {packagesData.filter((p) => p.status === "published").length === 1 ? "" : "s"}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {services.length > 1 && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    if (reorderMode) {
                      setReorderMode(false);
                    } else {
                      setOrdered([...services]);
                      setReorderMode(true);
                    }
                  }}
                >
                  <ArrowUpDown className="mr-1.5 h-4 w-4" />
                  {reorderMode ? "Cancel reorder" : "Reorder"}
                </Button>
              )}
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/expert/service-packages/new">
                  <Plus className="mr-1.5 h-4 w-4" /> Create package
                </Link>
              </Button>
              <Button className="rounded-full" asChild>
                <Link to="/expert/services/new">
                  <Plus className="mr-1.5 h-4 w-4" /> Create service
                </Link>
              </Button>
            </div>
          </div>

          {services.length === 0 ? (
            <div className="rounded-3xl border bg-card p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-orange-500" />
              </div>
              <h2 className="mt-5 font-display text-xl font-semibold">No services yet</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Services are what students book. Create a mentorship, review, or consultation offering.
              </p>
              <Button className="mt-6 rounded-full" asChild>
                <Link to="/expert/services/new">Create your first service</Link>
              </Button>
            </div>
          ) : reorderMode ? (
            <div className="rounded-3xl border bg-card p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold mb-4">Reorder services</h2>
              <div className="space-y-2">
                {ordered.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-2xl border bg-muted/40 px-4 py-3"
                  >
                    <span className="font-medium">{s.title}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        disabled={i === 0}
                        onClick={() => moveItem(i, "up")}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        disabled={i === ordered.length - 1}
                        onClick={() => moveItem(i, "down")}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" className="rounded-full" onClick={() => setReorderMode(false)}>
                  Cancel
                </Button>
                <Button
                  className="rounded-full"
                  disabled={reorder.isPending}
                  onClick={saveOrder}
                >
                  {reorder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save order
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {(packagesLoading || (packagesData && packagesData.length > 0)) && (
                <section>
                  <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" /> Packages
                  </h2>
                  {packagesLoading ? (
                    <Skeleton className="h-32 rounded-3xl" />
                  ) : (
                    <div className="space-y-3">
                      {packagesData!.map((pkg) => (
                        <PackageCardRow
                          key={pkg.id}
                          pkg={pkg as Package}
                          expertSlug={pageData?.page?.slug}
                          onAction={refetchPackages}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
              {grouped.published.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" /> Published
                  </h2>
                  <div className="space-y-3">
                    {grouped.published.map((s) => (
                      <ServiceCard key={s.id} service={s} expertSlug={expertSlug} onAction={refetch} />
                    ))}
                  </div>
                </section>
              )}
              {grouped.draft.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" /> Draft
                  </h2>
                  <div className="space-y-3">
                    {grouped.draft.map((s) => (
                      <ServiceCard key={s.id} service={s} expertSlug={expertSlug} onAction={refetch} />
                    ))}
                  </div>
                </section>
              )}
              {grouped.unpublished.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-stone-500" /> Unpublished
                  </h2>
                  <div className="space-y-3">
                    {grouped.unpublished.map((s) => (
                      <ServiceCard key={s.id} service={s} expertSlug={expertSlug} onAction={refetch} />
                    ))}
                  </div>
                </section>
              )}
              {grouped.archived.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                    <Archive className="h-5 w-5 text-red-600" /> Archived
                  </h2>
                  <div className="space-y-3">
                    {grouped.archived.map((s) => (
                      <ServiceCard key={s.id} service={s} expertSlug={expertSlug} onAction={refetch} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
