import type { ReactNode, ReactElement } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function SiteLayout({
  children,
  hero,
}: {
  children: ReactNode;
  hero?: ReactElement;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {hero && <div className="relative">{hero}</div>}
      <main className={`flex-1 ${hero ? "" : "pt-16"}`}>{children}</main>
      <Footer />
    </div>
  );
}
