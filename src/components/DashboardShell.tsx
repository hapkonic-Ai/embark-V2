import { type ReactNode, useState } from "react";
import { Link, Navigate } from "react-router";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/site/Navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/site/Logo";

export type DashTab = { id: string; label: string; icon: LucideIcon };

export default function DashboardShell({
  title,
  subtitle,
  tabs,
  roles,
  children,
}: {
  title: string;
  subtitle?: string;
  tabs: DashTab[];
  roles: string[];
  children: (activeTab: string) => ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const [active, setActive] = useState(tabs[0].id);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 pt-24"><Skeleton className="h-96 rounded-3xl" /></div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-muted/40">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active === t.id
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </nav>
          <div className="min-w-0">{children(active)}</div>
        </div>
      </div>

      <footer className="border-t bg-background mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <Logo />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Mentorship, hackathons, playbooks and B-school comparisons for India's MBA aspirants.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold">Explore</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/mentors" className="hover:text-orange-600">Mentors</Link></li>
                <li><Link to="/events" className="hover:text-orange-600">Events</Link></li>
                <li><Link to="/playbooks" className="hover:text-orange-600">Playbooks</Link></li>
                <li><Link to="/colleges" className="hover:text-orange-600">Compare Colleges</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold">Support</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-orange-600">Help Center</Link></li>
                <li><Link to="/" className="hover:text-orange-600">Terms & Conditions</Link></li>
                <li><Link to="/" className="hover:text-orange-600">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold">Connect</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-orange-600">LinkedIn</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-orange-600">Instagram</a></li>
                <li><a href="mailto:hello@embark.in" className="hover:text-orange-600">hello@embark.in</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Embark. Built for India's next B-school cohort.
          </div>
        </div>
      </footer>
    </div>
  );
}
