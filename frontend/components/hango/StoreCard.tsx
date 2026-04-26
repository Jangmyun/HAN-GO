import type { StoreResponse } from "@/lib/types";
import Link from "next/link";

const TYPE_CONFIG = {
  PERFORMANCE: {
    color: "#4B5FFF",
    bg: "#EEF0FF",
    label: "PERFORMANCE",
    icon: (c: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h3v12H4zM17 6h3v12h-3z" fill={c} opacity="0.4"/>
        <rect x="7" y="6" width="10" height="12" rx="2" fill={c} opacity="0.7"/>
        <path d="M10 10l4 2-4 2V10z" fill="#fff"/>
      </svg>
    ),
  },
  FOOD: {
    color: "#F5670A",
    bg: "#FFF0E8",
    label: "FOOD",
    icon: (c: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C9 3 6 5.5 6 9c0 2 .8 3.7 2 5v4a1 1 0 002 0v-2h4v2a1 1 0 002 0v-4c1.2-1.3 2-3 2-5 0-3.5-3-6-6-6z" fill={c} opacity="0.3"/>
        <path d="M12 3C9 3 6 5.5 6 9c0 2 .8 3.7 2 5v4a1 1 0 002 0v-2h4v2a1 1 0 002 0v-4c1.2-1.3 2-3 2-5 0-3.5-3-6-6-6z" stroke={c} strokeWidth="1.5" fill="none"/>
      </svg>
    ),
  },
  MERCH: {
    color: "#6B7280",
    bg: "#F3F4F6",
    label: "MERCH",
    icon: (c: string) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke={c} strokeWidth="1.5"/>
        <path d="M16 6V5a4 4 0 00-8 0v1" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
};

interface Props {
  store: StoreResponse;
}

export default function StoreCard({ store }: Props) {
  const cfg = TYPE_CONFIG[store.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.FOOD;
  const isOpen = store.status === "active";

  return (
    <Link href={`/stores/${store.slug}`}>
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)",
          padding: "14px",
          display: "flex",
          gap: 14,
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        {/* 타입 아이콘 */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: cfg.bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {cfg.icon(cfg.color)}
        </div>

        {/* 컨텐츠 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#111827",
                letterSpacing: -0.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {store.name}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: isOpen ? "#16A34A" : "#6B7280",
                background: isOpen ? "#16A34A18" : "#6B728018",
                borderRadius: 5,
                padding: "2px 6px",
                flexShrink: 0,
              }}
            >
              {isOpen ? "운영중" : "준비중"}
            </span>
          </div>
          <div style={{ marginBottom: 3 }}>
            <span
              style={{
                background: cfg.bg,
                color: cfg.color,
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              {cfg.label}
            </span>
          </div>
          {store.description && (
            <div style={{ fontSize: 12, color: "#6B7280" }}>{store.description}</div>
          )}
        </div>

        {/* 화살표 */}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
          <path d="M7 5l4 4-4 4" stroke="#E5E7EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </Link>
  );
}
