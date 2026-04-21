"use client";

import { clearToken, getRole } from "@/lib/auth";
import { BarChart3, LogOut, Store } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const NAV = [
  { href: "/admin/stores", label: "스토어 관리", Icon: Store },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/admin/auth") return;
    if (getRole() !== "admin") router.replace("/admin/auth");
  }, [pathname, router]);

  if (pathname === "/admin/auth") return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-[#111827]">
      {/* 다크 사이드바 */}
      <aside className="w-56 bg-[#1F2937] flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span className="font-bold text-white">HAN:GO Admin</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? "bg-primary text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => { clearToken("admin"); window.location.href = "/admin/auth"; }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-white/10 w-full"
          >
            <LogOut className="w-4 h-4" />로그아웃
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-[#F9FAFB] overflow-auto p-6">{children}</main>
    </div>
  );
}
