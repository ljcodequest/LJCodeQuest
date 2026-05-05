"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { QuantumShardField } from "@/components/layout/quantum-shard-field";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <QuantumShardField />
      <Navbar />
      <main className="relative z-10 flex-1 pt-20">{children}</main>
      <Footer />
    </>
  );
}
