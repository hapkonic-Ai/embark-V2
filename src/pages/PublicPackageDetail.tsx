import { useMemo } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Check,
  Clock,
  Package,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/site/Navbar";
import { SafeImg } from "@/components/site/SafeImg";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/format";

function formatDuration(minutes: number | null): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function PublicPackageDetail() {
  const { slug, packageSlug } = useParams<{ slug: string; packageSlug: string }>();
  const { data: pkg, isLoading } = trpc.catalog.expertPackageBySlug.useQuery(
    { expertSlug: slug ?? "", packageSlug: packageSlug ?? "" },
    { enabled: !!slug && !!packageSlug },
  );

  const totalDuration = useMemo(() => {
    return (pkg?.items ?? []).reduce((sum, item) => sum + (item.service.durationMinutes ?? 0), 0);
  }, [pkg]);

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

  if (!pkg) {
    return (
      <div className="min-h-screen bg-muted/40">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 pt-28 pb-16 text-center">
          <h1 className="font-display text-3xl font-bold">Package not found</h1>
          <p className="mt-2 text-muted-foreground">
            This package does not exist or is not published.
          </p>
          <Button className="mt-6 rounded-full" asChild>
            <Link to={`/m/${slug}`}>Back to profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 pt-28 pb-16">
        <Button variant="ghost" className="rounded-full mb-6" asChild>
          <Link to={`/m/${slug}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to profile
          </Link>
        </Button>

        <div className="rounded-3xl border bg-card p-8 shadow-sm overflow-hidden">
          <SafeImg
            src={pkg.image || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80"}
            alt={pkg.title}
            className="w-full h-48 sm:h-64 object-cover rounded-2xl mb-6 border"
          />

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> Package
            </Badge>
            {totalDuration > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {formatDuration(totalDuration)} total
              </Badge>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            {pkg.title}
          </h1>

          <div className="mt-4 font-display text-3xl font-bold">
            {pkg.price != null ? formatINR(pkg.price) : "Custom"}
          </div>

          {pkg.description && (
            <p className="mt-6 text-base leading-relaxed whitespace-pre-line">
              {pkg.description}
            </p>
          )}

          <div className="mt-8">
            <h2 className="font-display text-lg font-semibold mb-4">Included services</h2>
            <div className="space-y-3">
              {pkg.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 rounded-2xl border bg-muted/40 p-4"
                >
                  <div className="mt-0.5">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium">{item.service.title}</h3>
                      <span className="text-sm font-semibold">{formatINR(item.service.price)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {item.service.description || "No description"}
                    </p>
                    {item.service.durationMinutes && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {formatDuration(item.service.durationMinutes)}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full flex-shrink-0" asChild>
                    <Link to={`/m/${slug}/services/${item.service.slug}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="rounded-full" asChild>
              <Link to={`/m/${slug}`}>View expert profile</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
