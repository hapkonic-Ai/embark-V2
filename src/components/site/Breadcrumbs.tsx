import { Link, useLocation } from "react-router";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  mentors: "Mentors",
  "mentor": "Mentor",
  events: "Events",
  playbooks: "Playbooks",
  colleges: "Compare Colleges",
  "guest-lecturer": "Guest Lecturer",
  terms: "Terms of Service",
  privacy: "Privacy Policy",
  m: "Profile",
  login: "Sign in",
  dashboard: "Dashboard",
  expert: "Expert",
  admin: "Admin",
  superadmin: "Super Admin",
  campus: "Campus",
  services: "Service",
  packages: "Package",
};

function isDynamicSegment(segment: string) {
  return /^\d+$/.test(segment) || /^[a-z0-9-]{8,}$/i.test(segment);
}

export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.reduce<{ label: string; href: string }[]>((acc, segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const prev = segments[index - 1];

    let label = SEGMENT_LABELS[segment];
    if (!label) {
      if (isDynamicSegment(segment)) {
        if (prev === "mentors") label = "Mentor profile";
        else if (prev === "events") label = "Event detail";
        else if (prev === "m") label = "Public profile";
        else if (prev === "services") label = "Service detail";
        else if (prev === "packages") label = "Package detail";
        else label = "Details";
      } else {
        label = segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
    acc.push({ label, href });
    return acc;
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://arenafograds.com/" },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.label,
        item: `https://arenafograds.com${c.href}`,
      })),
    ],
  };

  return (
    <nav aria-label="Breadcrumb" className="border-b bg-background/80 backdrop-blur-sm">
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      <ol className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto">
        <li className="shrink-0">
          <Link to="/" className="flex items-center gap-1 hover:text-orange-600 transition-colors">
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.href} className="flex items-center gap-2 shrink-0">
              <ChevronRight className="h-3.5 w-3.5 text-stone-300" />
              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">{crumb.label}</span>
              ) : (
                <Link to={crumb.href} className="hover:text-orange-600 transition-colors whitespace-nowrap">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
