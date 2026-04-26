"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "홈",
    icon: (color: string) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 10.5L11 3l8 7.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5 9V19h4.5v-5h3V19H17V9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/explore",
    label: "탐색",
    icon: (color: string) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="10" cy="10" r="6.5" stroke={color} strokeWidth="1.8"/>
        <path d="M15 15l4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/orders",
    label: "주문내역",
    icon: (color: string) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="4" y="2" width="14" height="18" rx="2" stroke={color} strokeWidth="1.8"/>
        <path d="M8 8h6M8 12h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/me",
    label: "마이페이지",
    icon: (color: string) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="4" stroke={color} strokeWidth="1.8"/>
        <path d="M3 20c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
      style={{ background: "#fff", borderTop: "1px solid #E5E7EB", height: 70, boxShadow: "0 -1px 0 rgba(0,0,0,0.04)" }}
    >
      <div className="max-w-[430px] mx-auto w-full flex items-start pt-2.5">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          const color = active ? "#4B5FFF" : "#6B7280";
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer select-none"
            >
              <div className="relative">
                {icon(color)}
                {active && (
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full"
                    style={{ width: 4, height: 4, background: "#4B5FFF" }}
                  />
                )}
              </div>
              <span
                className="text-[10px]"
                style={{ color, fontWeight: active ? 700 : 500 }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
