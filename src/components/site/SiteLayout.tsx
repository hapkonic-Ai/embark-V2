import type { ReactNode, ReactElement } from "react";
import { useLocation } from "react-router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";

export default function SiteLayout({
  children,
  hero,
}: {
  children: ReactNode;
  hero?: ReactElement;
}) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {!isHome && <Breadcrumbs />}
      {hero && <div className="relative">{hero}</div>}
      <main className={`flex-1 ${hero ? "" : "pt-16"}`}>{children}</main>
      <Footer />
    </div>
  );
}
