"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// The public site's header and footer are for visitors. The portals (/portal/...) have their own header, so
// the site header and footer are left out there.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const inPortal = (usePathname() || "").startsWith("/portal");
  return (
    <>
      {!inPortal && <Navbar />}
      <main className="flex-1">{children}</main>
      {!inPortal && <Footer />}
    </>
  );
}
