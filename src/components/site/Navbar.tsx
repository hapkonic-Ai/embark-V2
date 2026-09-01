import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X, LayoutDashboard, LogOut, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { isExpertEnabled } from "@contracts/features";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const LINKS = [
  { to: "/mentors", label: "Mentors" },
  { to: "/guest-lecturer", label: "Guest Lecturer" },
  { to: "/events", label: "Events" },
  { to: "/playbooks", label: "Playbooks" },
  { to: "/colleges", label: "Compare Colleges" },
];

export function dashboardPath(role?: string) {
  switch (role) {
    case "mentor": return "/mentor/dashboard";
    case "expert": return isExpertEnabled() ? "/expert/dashboard" : "/";
    case "campus": return "/campus/dashboard";
    case "admin": return "/admin";
    case "superadmin": return "/superadmin";
    default: return "/dashboard";
  }
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/85 backdrop-blur-xl border-b shadow-[0_8px_30px_-12px_rgba(234,88,12,0.15)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Logo />

          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => {
              const active = location.pathname === l.to || location.pathname.startsWith(`${l.to}/`);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`relative px-3.5 py-2 text-sm font-medium rounded-full transition-colors ${
                    active
                      ? "text-orange-600 bg-orange-100 dark:bg-orange-500/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-stone-100 dark:hover:bg-stone-800/40"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border bg-card px-2 py-1.5 hover:shadow-md transition-shadow">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.avatar ?? undefined} alt={user.name ?? ""} />
                      <AvatarFallback className="bg-orange-500 text-white text-xs font-bold">
                        {user.name?.slice(0, 2).toUpperCase() ?? "EM"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-[120px] truncate">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>
                    <div className="text-xs text-muted-foreground capitalize">{user.role} account</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(dashboardPath(user.role))}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                  {user.role === "candidate" && (
                    <DropdownMenuItem onClick={() => navigate("/bookings")}>
                      <Calendar className="mr-2 h-4 w-4" /> My bookings
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" /> Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" className="btn-shine rounded-full px-4" asChild>
                  <Link to="/login?mode=register">
                    Get started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-b bg-background/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-accent"
                >
                  {l.label}
                </Link>
              ))}
              <div className="pt-2 flex gap-2">
                {isAuthenticated ? (
                  <>
                    <Button className="flex-1" asChild>
                      <Link to={dashboardPath(user?.role)}>Dashboard</Link>
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => logout()}>
                      Log out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1" asChild>
                      <Link to="/login">Sign in</Link>
                    </Button>
                    <Button className="flex-1" asChild>
                      <Link to="/login?mode=register">Get started <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
