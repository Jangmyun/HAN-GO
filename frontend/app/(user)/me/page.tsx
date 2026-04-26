"use client";

import { ordersApi } from "@/lib/api";
import { clearToken, getRole, isAuthenticated } from "@/lib/auth";
import type { OrderResponse } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

const ORDER_STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "결제 대기", bg: "#FEF3C7", color: "#D97706" },
  payment_submitted: { label: "결제 확인 중", bg: "#EEF0FF", color: "#4B5FFF" },
  paid: { label: "결제확인", bg: "#EEF0FF", color: "#4B5FFF" },
  preparing: { label: "준비 중", bg: "#FFF0E8", color: "#F5670A" },
  ready: { label: "수령 대기", bg: "#DCFCE7", color: "#16A34A" },
  completed: { label: "수령완료", bg: "#DCFCE7", color: "#16A34A" },
  cancelled_by_user: { label: "취소됨", bg: "#FEE2E2", color: "#DC2626" },
  cancelled_by_store: { label: "취소됨", bg: "#FEE2E2", color: "#DC2626" },
  cancellation_requested: { label: "취소 요청", bg: "#FEE2E2", color: "#DC2626" },
  payment_rejected: { label: "결제 거절", bg: "#FEE2E2", color: "#DC2626" },
};

const MENU_ITEMS = [
  { label: "이용약관", icon: "📄" },
  { label: "개인정보처리방침", icon: "🔒" },
  { label: "고객센터", icon: "💬" },
];

export default function MyPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const authenticated = isAuthenticated();
  const role = getRole();

  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    ordersApi.list().then(setOrders).finally(() => setLoading(false));
  }, [authenticated]);

  const activeOrders = orders.filter((o) => !["completed", "cancelled_by_user", "cancelled_by_store"].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "completed");
  const cancelledOrders = orders.filter((o) => ["cancelled_by_user", "cancelled_by_store"].includes(o.status));
  const recentOrders = orders.slice(0, 3);

  return (
    <div style={{ background: "#F9FAFB", minHeight: "100%" }}>
      {/* 앱바 */}
      <div
        style={{
          background: "#fff", height: 52,
          display: "flex", alignItems: "center", padding: "0 16px",
          borderBottom: "1px solid #E5E7EB", flexShrink: 0,
          position: "sticky", top: 0, zIndex: 40,
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>마이페이지</span>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* 프로필 카드 */}
        <div
          style={{
            background: "#fff", borderRadius: 16,
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)",
            padding: "20px 18px",
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div
              style={{
                width: 60, height: 60, borderRadius: 30,
                background: "linear-gradient(135deg, #4B5FFF, #7B8BFF)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 900, color: "#fff" }}>
                {authenticated ? (role === "guest" ? "비" : "한") : "?"}
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", letterSpacing: -0.4 }}>
                {authenticated ? (role === "guest" ? "비회원" : "카카오 회원") : "로그인 필요"}
              </div>
              {authenticated && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  {role === "guest" ? (
                    <span style={{ fontSize: 12, color: "#6B7280" }}>비회원으로 이용 중</span>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                        <path d="M11 2.5C6.3 2.5 2.5 5.6 2.5 9.4c0 2.5 1.7 4.7 4.2 5.9l-1 3.6 4-2.6c.4.05.85.1 1.3.1 4.7 0 8.5-3.1 8.5-6.9S15.7 2.5 11 2.5z" fill="#FEE500"/>
                      </svg>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>카카오 계정 연동됨</span>
                    </>
                  )}
                </div>
              )}
            </div>
            {authenticated ? (
              <button
                style={{
                  fontSize: 12, color: "#4B5FFF", fontWeight: 600,
                  background: "#F0F2FF", border: "none", borderRadius: 9,
                  padding: "7px 12px", cursor: "pointer",
                }}
              >
                편집
              </button>
            ) : (
              <Link href="/auth">
                <button
                  style={{
                    fontSize: 12, color: "#fff", fontWeight: 600,
                    background: "#4B5FFF", border: "none", borderRadius: 9,
                    padding: "7px 12px", cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(75,95,255,0.30)",
                  }}
                >
                  로그인
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* 주문 현황 */}
        {authenticated && (
          <div
            style={{
              background: "#fff", borderRadius: 16,
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)",
              padding: "18px 18px 14px",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 14, letterSpacing: -0.3 }}>
              주문 현황
            </div>
            <div style={{ display: "flex", gap: 0 }}>
              {[
                { label: "진행중", count: activeOrders.length, color: "#F5670A" },
                { label: "완료", count: completedOrders.length, color: "#16A34A" },
                { label: "취소", count: cancelledOrders.length, color: "#DC2626" },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, textAlign: "center", padding: "10px 0",
                    borderRight: i < 2 ? "1px solid #E5E7EB" : "none",
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.count ? s.color : "#6B7280", letterSpacing: -0.5 }}>
                    {s.count}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 최근 주문 */}
        {authenticated && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>최근 주문</span>
              <Link href="/orders">
                <span style={{ fontSize: 13, color: "#4B5FFF", cursor: "pointer", fontWeight: 600 }}>전체보기</span>
              </Link>
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2].map((i) => (
                  <div key={i} style={{ height: 80, background: "#E5E7EB", borderRadius: 16, animation: "pulse 2s infinite" }}/>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "#6B7280", fontSize: 14 }}>
                주문 내역이 없습니다.
              </div>
            ) : (
              recentOrders.map((o) => {
                const statusCfg = ORDER_STATUS_LABEL[o.status] ?? { label: o.status, bg: "#F3F4F6", color: "#6B7280" };
                const hasPaidTicket = o.status === "paid" && o.items.length > 0;
                return (
                  <Link key={o.id} href={`/orders/${o.id}`}>
                    <div
                      style={{
                        background: "#fff", borderRadius: 16,
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)",
                        padding: "14px 16px", marginBottom: 10, cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", letterSpacing: -0.3, marginBottom: 3 }}>
                            {o.order_code}
                          </div>
                          <div style={{ fontSize: 12, color: "#6B7280" }}>
                            {o.items.length > 0 ? `${o.items.length}개 상품` : "상품 없음"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              background: statusCfg.bg, color: statusCfg.color,
                              borderRadius: 6, padding: "3px 8px",
                              fontSize: 11, fontWeight: 700,
                              display: "inline-flex", alignItems: "center",
                            }}
                          >
                            {statusCfg.label}
                          </span>
                          <div style={{ fontSize: 11, color: "#6B7280", marginTop: 5 }}>
                            {new Date(o.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          paddingTop: 10, borderTop: "1px solid #F3F4F6",
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: -0.4 }}>
                          {o.total_price.toLocaleString()}원
                        </span>
                        {hasPaidTicket && (
                          <button
                            style={{
                              display: "flex", alignItems: "center", gap: 5,
                              background: "#EEF0FF", border: "none", borderRadius: 9,
                              padding: "7px 12px", cursor: "pointer",
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="#4B5FFF" strokeWidth="1.3"/>
                              <path d="M5 7h4M7 5v4" stroke="#4B5FFF" strokeWidth="1.3" strokeLinecap="round"/>
                            </svg>
                            <span style={{ fontSize: 12, color: "#4B5FFF", fontWeight: 700 }}>QR 티켓 보기</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* 메뉴 */}
        <div
          style={{
            background: "#fff", borderRadius: 16,
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)",
            overflow: "hidden",
          }}
        >
          {MENU_ITEMS.map((m, i) => (
            <div
              key={m.label}
              style={{
                display: "flex", alignItems: "center", padding: "15px 18px",
                borderBottom: i < MENU_ITEMS.length - 1 ? "1px solid #F3F4F6" : "none",
                cursor: "pointer", userSelect: "none",
              }}
            >
              <span style={{ fontSize: 14, marginRight: 10 }}>{m.icon}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#111827" }}>{m.label}</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ))}
          {authenticated && (
            <button
              onClick={() => { clearToken(); window.location.href = "/auth"; }}
              style={{
                display: "flex", alignItems: "center", padding: "15px 18px",
                borderTop: "1px solid #F3F4F6",
                cursor: "pointer", width: "100%", background: "transparent", border: "none",
                textAlign: "left" as const,
              }}
            >
              <span style={{ fontSize: 14, marginRight: 10 }}>🚪</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#DC2626" }}>로그아웃</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <span style={{ fontSize: 11, color: "#E5E7EB" }}>Built by CRA @ Handong University · v0.1.0</span>
        </div>
        <div style={{ height: 8 }}/>
      </div>
    </div>
  );
}
