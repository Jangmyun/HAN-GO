"use client";

import { useState } from "react";

type ColId = "received" | "preparing" | "ready";

interface KitchenOrder {
  id: string;
  name: string;
  opts: string;
  time: string;
  urgent: boolean;
}

interface KanbanCol {
  id: ColId;
  label: string;
  color: string;
  orders: KitchenOrder[];
}

const INITIAL_COLS: KanbanCol[] = [
  {
    id: "received", label: "접수됨", color: "#D97706",
    orders: [
      { id: "HG-C1A2", name: "부대찌개 세트 ×2 + 라볶이 ×1", opts: "보통, 매운맛 / 떡 추가", time: "2분 전", urgent: false },
      { id: "HG-D3B4", name: "라볶이 ×3",                     opts: "순한맛 ×2, 보통 ×1",   time: "5분 전", urgent: false },
      { id: "HG-E5C6", name: "부대찌개 세트 ×1",               opts: "아주매운맛 / 계란·공기밥", time: "9분 전", urgent: true },
    ],
  },
  {
    id: "preparing", label: "조리 중", color: "#4B5FFF",
    orders: [
      { id: "HG-F7D8", name: "부대찌개 세트 ×1",        opts: "매운맛 / 공기밥", time: "12분 전", urgent: false },
      { id: "HG-G9E0", name: "라볶이 ×2 + 음료 ×2",     opts: "순한맛",          time: "15분 전", urgent: true },
    ],
  },
  {
    id: "ready", label: "준비 완료", color: "#16A34A",
    orders: [
      { id: "HG-H1F2", name: "부대찌개 세트 ×2", opts: "보통, 순한맛", time: "21분 전", urgent: false },
      { id: "HG-I3G4", name: "라볶이 ×1",         opts: "매운맛",       time: "24분 전", urgent: false },
    ],
  },
];

const NEXT_ACTION: Record<ColId, string> = {
  received:  "조리 시작",
  preparing: "준비 완료",
  ready:     "수령 확인",
};
const NEXT_COL: Record<ColId, ColId | null> = {
  received:  "preparing",
  preparing: "ready",
  ready:     null,
};

export default function KitchenPage() {
  const [cols, setCols] = useState(INITIAL_COLS);

  const advance = (colId: ColId, orderId: string) => {
    const nextColId = NEXT_COL[colId];
    if (!nextColId) {
      // 수령 확인 → 제거
      setCols((prev) => prev.map((c) => c.id === colId ? { ...c, orders: c.orders.filter((o) => o.id !== orderId) } : c));
      return;
    }
    let movedOrder: KitchenOrder | undefined;
    const next = cols.map((c) => {
      if (c.id === colId) {
        const o = c.orders.find((x) => x.id === orderId);
        movedOrder = o;
        return { ...c, orders: c.orders.filter((x) => x.id !== orderId) };
      }
      return c;
    });
    if (!movedOrder) return;
    const moved = movedOrder;
    setCols(next.map((c) => c.id === nextColId ? { ...c, orders: [...c.orders, { ...moved, urgent: false }] } : c));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* 페이지 헤더 */}
      <div style={{
        height: 52, background: "#fff", borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 12, flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>FOOD 주문 접수</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* 요약 */}
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "접수됨",   val: cols[0].orders.length, color: "#D97706",  bg: "#FEF3C7" },
            { label: "조리 중",  val: cols[1].orders.length, color: "#4B5FFF",  bg: "#EEF0FF" },
            { label: "준비 완료", val: cols[2].orders.length, color: "#16A34A",  bg: "#F0FDF4" },
            { label: "오늘 완료", val: 34,                    color: "#374151",  bg: "#F9FAFB" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: s.bg, borderRadius: 12, padding: "12px 14px", border: `1px solid ${s.color}22` }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, letterSpacing: -1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#16A34A", boxShadow: "0 0 6px #16A34A" }} />
            <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>실시간 수신 중</span>
          </div>
        </div>

        {/* Kanban */}
        <div style={{ display: "flex", gap: 14, flex: 1, minHeight: 400 }}>
          {cols.map((col) => (
            <div key={col.id} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
              {/* 컬럼 헤더 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0" }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: col.color }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{col.label}</span>
                <span style={{
                  marginLeft: "auto", background: col.color + "22", color: col.color,
                  borderRadius: 10, fontSize: 11, fontWeight: 700, padding: "2px 8px",
                }}>{col.orders.length}</span>
              </div>

              {/* 카드들 */}
              {col.orders.map((order) => (
                <div key={order.id} style={{
                  background: "#fff", borderRadius: 12,
                  border: `1px solid ${order.urgent ? "#DC262644" : "#E5E7EB"}`,
                  boxShadow: order.urgent ? "0 0 0 2px rgba(220,38,38,0.12)" : "0 1px 3px rgba(17,24,39,0.06)",
                  padding: "14px 14px 12px", display: "flex", flexDirection: "column", gap: 8,
                }}>
                  {order.urgent && (
                    <div style={{ background: "#FEE2E2", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "#DC2626" }}>
                      ⚠ 대기 시간 초과
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", lineHeight: 1.4 }}>{order.name}</div>
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{order.opts}</div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "ui-monospace,monospace" }}>{order.id}</div>
                      <div style={{ fontSize: 11, color: order.urgent ? "#DC2626" : "#6B7280", fontWeight: order.urgent ? 700 : 400, marginTop: 2 }}>{order.time}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => advance(col.id, order.id)}
                      style={{
                        flex: 1, height: 34, borderRadius: 9,
                        background: col.color, color: "#fff",
                        border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {NEXT_ACTION[col.id]}
                    </button>
                    {col.id !== "ready" && (
                      <button style={{
                        width: 34, height: 34, borderRadius: 9,
                        border: "1px solid #E5E7EB", background: "#F9FAFB",
                        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                      }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <circle cx="7" cy="7" r="5.5" stroke="#9CA3AF" strokeWidth="1.4"/>
                          <path d="M7 4v3.5l2 2" stroke="#9CA3AF" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* 비어있을 때 */}
              {col.orders.length === 0 && (
                <div style={{
                  borderRadius: 12, border: "1.5px dashed #E5E7EB",
                  padding: "24px", textAlign: "center",
                  fontSize: 12, color: "#9CA3AF",
                }}>
                  주문 없음
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
