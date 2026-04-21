"use client";

import StoreLayout from "@/components/hango/StoreLayout";
import { getRole } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StoreRootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/store/auth") return;
    const role = getRole();
    if (role !== "store") {
      router.replace("/store/auth");
    }
  }, [pathname, router]);

  if (pathname === "/store/auth") return <>{children}</>;
  return <StoreLayout>{children}</StoreLayout>;
}
