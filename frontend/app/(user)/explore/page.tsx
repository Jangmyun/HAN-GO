"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { storesApi } from "@/lib/api";
import type { StoreResponse } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

const FILTERS = ["전체", "공연", "음식", "굿즈", "이벤트"] as const;
type Filter = (typeof FILTERS)[number];

const TYPE_FILTER_MAP: Record<Filter, string | null> = {
  전체: null,
  공연: "PERFORMANCE",
  음식: "FOOD",
  굿즈: "MERCH",
  이벤트: null,
};

const TYPE_CONFIG = {
  PERFORMANCE: { color: "#4B5FFF", bg: "#EEF0FF", label: "PERFORMANCE" },
  FOOD: { color: "#F5670A", bg: "#FFF0E8", label: "FOOD" },
  MERCH: { color: "#6B7280", bg: "#F3F4F6", label: "MERCH" },
};

const EVENTS = [
  { name: "2026 봄 공연 시즌", period: "4.20 ~ 5.15", stores: 4, colorA: "#EEF0FF", colorB: "#DDE1FF" },
  { name: "CRA 해커톤 2026", period: "5.3 (1일)", stores: 1, colorA: "#FFF0E8", colorB: "#FFE0CC" },
];

export default function ExplorePage() {
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("전체");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storesApi.list().then(setStores).finally(() => setLoading(false));
  }, []);

  const filtered = stores.filter((s) => {
    const typeMatch = TYPE_FILTER_MAP[filter] === null || s.type === TYPE_FILTER_MAP[filter];
    const queryMatch =
      query === "" ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(query.toLowerCase());
    return typeMatch && queryMatch;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#F9FAFB", minHeight: "100%" }}>
      {/* 헤더 + 검색 + 필터 */}
      <div
        style={{
          background: "#fff",
          padding: "8px 16px 12px",
          flexShrink: 0,
          boxShadow: "0 1px 0 rgba(0,0,0,0.05)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        {/* 검색 */}
        <div
          style={{
            height: 44, background: "#F9FAFB", borderRadius: 14,
            display: "flex", alignItems: "center", padding: "0 14px", gap: 9,
            border: "1px solid #E5E7EB", marginBottom: 10,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="4.5" stroke="#6B7280" strokeWidth="1.5"/>
            <path d="M11 11l2.5 2.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="스토어, 이벤트 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, fontSize: 14, color: "#111827",
              border: "none", outline: "none", background: "transparent",
            }}
          />
        </div>

        {/* 필터 칩 */}
        <div style={{ display: "flex", gap: 7, overflowX: "auto", scrollbarWidth: "none" as const }}>
          {FILTERS.map((f) => {
            const active = f === filter;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 16px", borderRadius: 100,
                  background: active ? "#4B5FFF" : "#fff",
                  color: active ? "#fff" : "#6B7280",
                  border: active ? "none" : "1px solid #E5E7EB",
                  boxShadow: active ? "0 2px 8px rgba(75,95,255,0.30)" : "0 1px 2px rgba(0,0,0,0.05)",
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" as const,
                  transition: "all 0.15s",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 이벤트 섹션 (전체/이벤트 필터일 때만) */}
        {(filter === "전체" || filter === "이벤트") && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>진행 중인 이벤트</span>
            </div>
            {EVENTS.map((e, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10, borderRadius: 16, overflow: "hidden", cursor: "pointer",
                  background: "#fff", border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)",
                  display: "flex", userSelect: "none",
                }}
              >
                <div
                  style={{
                    width: 80, height: 80, flexShrink: 0,
                    backgroundImage: `repeating-linear-gradient(135deg, ${e.colorA} 0px, ${e.colorA} 10px, ${e.colorB} 10px, ${e.colorB} 20px)`,
                  }}
                />
                <div style={{ padding: "14px 16px", flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: -0.4, marginBottom: 4 }}>
                    {e.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>
                    {e.period} · 참여 스토어 {e.stores}개
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span
                      style={{
                        background: "#DCFCE7", color: "#16A34A",
                        borderRadius: 6, padding: "3px 8px",
                        fontSize: 11, fontWeight: 700,
                        display: "inline-flex", alignItems: "center",
                      }}
                    >
                      진행중
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 스토어 그리드 */}
        {filter !== "이벤트" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>전체 스토어</span>
            </div>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#6B7280", fontSize: 14 }}>
                검색 결과가 없습니다.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {filtered.map((store) => {
                  const cfg = TYPE_CONFIG[store.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.FOOD;
                  const isOpen = store.status === "active";
                  return (
                    <Link key={store.id} href={`/stores/${store.slug}`}>
                      <div
                        style={{
                          background: "#fff", borderRadius: 16,
                          border: "1px solid #E5E7EB", overflow: "hidden",
                          cursor: "pointer", userSelect: "none",
                          boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)",
                        }}
                      >
                        {/* 이미지 플레이스홀더 */}
                        <div
                          style={{
                            height: 88,
                            backgroundImage: `repeating-linear-gradient(135deg, ${cfg.bg} 0px, ${cfg.bg} 10px, ${cfg.color}22 10px, ${cfg.color}22 20px)`,
                          }}
                        />
                        <div style={{ padding: "12px 12px 14px" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 6, letterSpacing: -0.2 }}>
                            {store.name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span
                              style={{
                                background: cfg.bg, color: cfg.color,
                                borderRadius: 6, padding: "3px 8px",
                                fontSize: 11, fontWeight: 700,
                                display: "inline-flex", alignItems: "center",
                              }}
                            >
                              {cfg.label}
                            </span>
                            <span style={{ fontSize: 10, color: isOpen ? "#16A34A" : "#6B7280", fontWeight: isOpen ? 700 : 500 }}>
                              {isOpen ? "운영중" : "준비중"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <div style={{ height: 8 }}/>
      </div>
    </div>
  );
}
