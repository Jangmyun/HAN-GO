"use client";

import { clearToken } from "@/lib/auth";
import { BarChart3, LogOut, Package, QrCode, ShoppingCart, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/store/dashboard", label: "대시보드", Icon: BarChart3 },
  { href: "/store/products", label: "상품 관리", Icon: Package },
  { href: "/store/orders", label: "주문 관리", Icon: ShoppingCart },
  { href: "/store/scanner", label: "QR 스캐너", Icon: QrCode },
];

interface Props {
  children: React.ReactNode;
}

export default function StoreLayout({ children }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-[#F9FAFB]">
      {/* 사이드바 */}
      <aside className="w-56 bg-background border-r border-border flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">HAN:GO</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">스토어 관리</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={() => {
              clearToken("store");
              window.location.href = "/store/auth";
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted w-full"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
