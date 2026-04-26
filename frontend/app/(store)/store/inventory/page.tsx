"use client";

import { useState } from "react";

type ProductType = "FOOD" | "PERFORMANCE" | "MERCH";
type StockMode = "tracked" | "unlimited" | "manual_sold_out";
type Filter = "전체" | "FOOD" | "PERFORMANCE" | "MERCH";

interface InventoryProduct {
  name: string;
  type: ProductType;
  mode: StockMode;
  stock: number | null;
  cap: number | null;
  sold: number;
  status: "active" | "soldout";
}

const PRODUCTS: InventoryProduct[] = [
  { name: "부대찌개 세트",        type: "FOOD",        mode: "tracked",         stock: 88, cap: 100, sold: 12, status: "active" },
  { name: "라볶이",               type: "FOOD",        mode: "tracked",         stock: 45, cap: 80,  sold: 35, status: "active" },
  { name: "음료 (캔)",            type: "FOOD",        mode: "unlimited",       stock: null, cap: null, sold: 21, status: "active" },
  { name: "봄 정기공연 — 1회차",   type: "PERFORMANCE", mode: "tracked",         stock: 71, cap: 76,  sold: 5,  status: "active" },
  { name: "봄 정기공연 — 2회차",   type: "PERFORMANCE", mode: "tracked",         stock: 76, cap: 76,  sold: 0,  status: "active" },
  { name: "한동굿즈 — 에코백",     type: "MERCH",       mode: "manual_sold_out", stock: 0,  cap: null, sold: 30, status: "soldout" },
];

const MODE_LABEL: Record<StockMode, string> = {
  tracked:         "수량 추적",
  unlimited:       "무제한",
  manual_sold_out: "수동 품절",
};

const TYPE_COLOR: Record<ProductType, { bg: string; color: string }> = {
  FOOD:        { bg: "#FFF7ED", color: "#C2410C" },
  PERFORMANCE: { bg: "#EEF0FF", color: "#4B5FFF" },
  MERCH:       { bg: "#F3F4F6", color: "#6B7280" },
};

const MODE_COLOR: Record<StockMode, { bg: string; color: string }> = {
  tracked:         { bg: "#EEF0FF", color: "#4B5FFF" },
  unlimited:       { bg: "#F0FDF4", color: "#16A34A" },
  manual_sold_out: { bg: "#FEF3C7", color: "#D97706" },
};

export default function InventoryPage() {
  const [filter, setFilter] = useState<Filter>("전체");
  const FILTERS: Filter[] = ["전체", "FOOD", "PERFORMANCE", "MERCH"];

  const visible = filter === "전체" ? PRODUCTS : PRODUCTS.filter((p) => p.type === filter);
  const lowStock = PRODUCTS.filter((p) => p.mode === "tracked" && p.cap !== null && p.stock !== null && (p.stock / p.cap) < 0.3);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* 페이지 헤더 */}
      <div style={{
        height: 52, background: "#fff", borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: "#9CA3AF", cursor: "pointer" }}>상품 관리</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 3l4 4-4 4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>재고 관리</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 필터 + 추가 버튼 */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 16px", borderRadius: 20,
                background: filter === f ? "#4B5FFF" : "#fff",
                color: filter === f ? "#fff" : "#6B7280",
                border: filter === f ? "none" : "1px solid #E5E7EB",
                fontSize: 12, fontWeight: filter === f ? 700 : 500,
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
          <div style={{ marginLeft: "auto" }}>
            <button style={{ padding: "7px 16px", borderRadius: 10, background: "#4B5FFF", border: "none", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
              + 상품 추가
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(17,24,39,0.06)", overflow: "hidden" }}>
          {/* 헤더 */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px 110px 160px 80px 80px",
            padding: "10px 20px", background: "#F9FAFB",
            borderBottom: "1px solid #E5E7EB", gap: 12,
          }}>
            {["상품명", "타입", "재고 모드", "재고 현황", "판매", "상태"].map((h) => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase" as const, letterSpacing: 0.5 }}>{h}</span>
            ))}
          </div>

          {/* 행들 */}
          {visible.map((p, i) => {
            const pct = p.cap && p.stock !== null ? (p.stock / p.cap) * 100 : null;
            const isSoldout = p.status === "soldout";
            const isLow = pct !== null && pct < 30;
            const typeC = TYPE_COLOR[p.type];
            const modeC = MODE_COLOR[p.mode];

            return (
              <div key={p.name} style={{
                display: "grid",
                gridTemplateColumns: "1fr 90px 110px 160px 80px 80px",
                padding: "13px 20px",
                borderBottom: i < visible.length - 1 ? "1px solid #F3F4F6" : "none",
                alignItems: "center", gap: 12,
                background: isSoldout ? "#FAFAFA" : "#fff",
              }}>
                {/* 상품명 */}
                <div style={{ fontSize: 13, fontWeight: 600, color: isSoldout ? "#6B7280" : "#111827" }}>{p.name}</div>

                {/* 타입 뱃지 */}
                <div style={{ display: "inline-flex", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: typeC.color, background: typeC.bg, borderRadius: 20, padding: "3px 10px" }}>
                    {p.type}
                  </span>
                </div>

                {/* 재고 모드 뱃지 */}
                <div style={{ display: "inline-flex", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: modeC.color, background: modeC.bg, borderRadius: 20, padding: "3px 10px" }}>
                    {MODE_LABEL[p.mode]}
                  </span>
                </div>

                {/* 재고 바 */}
                <div>
                  {p.mode === "unlimited" ? (
                    <span style={{ fontSize: 12, color: "#6B7280" }}>제한 없음</span>
                  ) : p.mode === "manual_sold_out" ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", borderRadius: 20, padding: "3px 10px" }}>
                      품절 처리됨
                    </span>
                  ) : (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isLow ? "#DC2626" : "#111827" }}>{p.stock}</span>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>/ {p.cap}</span>
                      </div>
                      <div style={{ height: 5, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct ?? 0}%`, borderRadius: 3, background: isLow ? "#DC2626" : isSoldout ? "#9CA3AF" : "#16A34A", transition: "width 0.3s" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* 판매 */}
                <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{p.sold}건</span>

                {/* 상태 + 편집 */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ width: 7, height: 7, borderRadius: 4, background: isSoldout ? "#DC2626" : "#16A34A" }} />
                  <button style={{ fontSize: 11, color: "#4B5FFF", fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: "3px 6px", borderRadius: 6 }}>
                    편집
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 재고 경고 */}
        {lowStock.length > 0 && (
          <div style={{
            background: "#FEF3C7", borderRadius: 12, padding: "14px 18px",
            border: "1px solid rgba(245,158,11,0.3)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7.5" stroke="#D97706" strokeWidth="1.5"/>
              <path d="M9 5.5v4M9 11.5v1" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 12, color: "#D97706", fontWeight: 600, flex: 1 }}>
              재고 30% 미만 상품 {lowStock.length}개 — {lowStock.map((p) => `${p.name}(${Math.round(((p.stock ?? 0) / (p.cap ?? 1)) * 100)}%)`).join(", ")} 재고 확인 필요
            </span>
            <button style={{ padding: "6px 14px", borderRadius: 9, background: "#D97706", border: "none", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
              확인하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
