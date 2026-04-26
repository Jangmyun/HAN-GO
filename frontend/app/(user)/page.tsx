"use client";

import StoreCard from "@/components/hango/StoreCard";
import { Skeleton } from "@/components/ui/skeleton";
import { storesApi } from "@/lib/api";
import type { StoreResponse } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

const EVENTS = [
  { name: "봄 공연 시즌", date: "4.20~5.15", colorA: "#EEF0FF", colorB: "#E0E4FF" },
  { name: "CRA 해커톤", date: "5.3 (1일)", colorA: "#FFF0E8", colorB: "#FFE0CE" },
  { name: "동아리 굿즈", date: "상시", colorA: "#F0FDF4", colorB: "#DCFCE7" },
];

export default function HomePage() {
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storesApi.list()
      .then(setStores)
      .catch((err) => console.error("Failed to fetch stores:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#F9FAFB", minHeight: "100%" }}>
      {/* 헤더 */}
      <div
        style={{
          background: "#fff",
          padding: "10px 16px 14px",
          flexShrink: 0,
          boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          {/* 로고 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: "#4B5FFF",
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 900, color: "#fff", letterSpacing: -1 }}>H</span>
            </div>
            <span style={{ fontSize: 19, fontWeight: 900, color: "#111827", letterSpacing: -0.8 }}>
              HAN<span style={{ color: "#4B5FFF" }}>:</span>GO
            </span>
          </div>

          {/* 우측 버튼 */}
          <div style={{ display: "flex", gap: 2 }}>
            <Link href="/explore">
              <button
                style={{
                  width: 38, height: 38,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "transparent", border: "none", cursor: "pointer", borderRadius: 10,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="9" cy="9" r="5.5" stroke="#111827" strokeWidth="1.7"/>
                  <path d="M13.5 13.5l3 3" stroke="#111827" strokeWidth="1.7" strokeLinecap="round"/>
                </svg>
              </button>
            </Link>
            <button
              style={{
                width: 38, height: 38,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: "none", cursor: "pointer", borderRadius: 10,
                position: "relative",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M6 9a4 4 0 018 0v3.5l1.5 2H4.5l1.5-2V9z" stroke="#111827" strokeWidth="1.7" strokeLinejoin="round"/>
                <path d="M8.5 16.5a1.5 1.5 0 003 0" stroke="#111827" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
              <span
                style={{
                  position: "absolute", top: 7, right: 7,
                  width: 8, height: 8,
                  background: "#F5670A", borderRadius: 4,
                  border: "2px solid #fff",
                }}
              />
            </button>
          </div>
        </div>

        {/* 검색 필 */}
        <Link href="/explore">
          <div
            style={{
              height: 44, background: "#F9FAFB", borderRadius: 14,
              display: "flex", alignItems: "center", padding: "0 14px", gap: 9,
              border: "1px solid #E5E7EB", cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="#6B7280" strokeWidth="1.5"/>
              <path d="M11 11l2.5 2.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 14, color: "#6B7280" }}>스토어, 이벤트, 상품 검색</span>
          </div>
        </Link>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* 히어로 배너 */}
        <div style={{ padding: "16px 16px 0" }}>
          <div
            style={{
              borderRadius: 20, overflow: "hidden", position: "relative", height: 160,
              background: "linear-gradient(135deg, #4B5FFF 0%, #6B7BFF 60%, #8B6DFF 100%)",
              boxShadow: "0 10px 24px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: 80, background: "rgba(255,255,255,0.06)" }}/>
            <div style={{ position: "absolute", right: 20, bottom: -20, width: 100, height: 100, borderRadius: 50, background: "rgba(255,255,255,0.05)" }}/>
            <div style={{ position: "relative", zIndex: 1, padding: "22px 22px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, textTransform: "uppercase" }}>
                진행 중인 이벤트
              </span>
              <div style={{ fontSize: 21, fontWeight: 900, color: "#fff", marginTop: 6, lineHeight: 1.3, letterSpacing: -0.5 }}>
                2026 봄 공연 시즌
                <div style={{ fontSize: 13, fontWeight: 400, opacity: 0.85, marginTop: 2 }}>4월 20일 ~ 5월 15일</div>
              </div>
              <div style={{ marginTop: 14 }}>
                <button
                  style={{
                    background: "#F5670A", color: "#fff", border: "none", borderRadius: 10,
                    padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(245,103,10,0.30)",
                  }}
                >
                  보러가기 →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 이벤트 가로 스크롤 */}
        <div style={{ padding: "22px 0 0" }}>
          <div style={{ padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>이벤트</span>
            <span style={{ fontSize: 13, color: "#4B5FFF", cursor: "pointer", fontWeight: 600 }}>전체보기</span>
          </div>
          <div style={{ display: "flex", gap: 10, paddingLeft: 16, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" as const }}>
            {EVENTS.map((e, i) => (
              <div
                key={i}
                style={{
                  flexShrink: 0, width: 148, borderRadius: 14, overflow: "hidden",
                  cursor: "pointer", background: "#fff",
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)",
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    height: 72,
                    backgroundImage: `repeating-linear-gradient(135deg, ${e.colorA} 0px, ${e.colorA} 10px, ${e.colorB} 10px, ${e.colorB} 20px)`,
                  }}
                />
                <div style={{ padding: "10px 12px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", letterSpacing: -0.2 }}>{e.name}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>{e.date}</div>
                </div>
              </div>
            ))}
            <div style={{ width: 16, flexShrink: 0 }}/>
          </div>
        </div>

        {/* 스토어 목록 */}
        <div style={{ padding: "22px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>스토어</span>
            <Link href="/explore">
              <span style={{ fontSize: 13, color: "#4B5FFF", cursor: "pointer", fontWeight: 600 }}>전체보기</span>
            </Link>
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
          ) : stores.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#6B7280" }}>
              <p style={{ fontSize: 14 }}>현재 운영 중인 스토어가 없습니다.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {stores.map((store) => <StoreCard key={store.id} store={store} />)}
            </div>
          )}
        </div>
        <div style={{ height: 24 }}/>
      </div>
    </div>
  );
}
