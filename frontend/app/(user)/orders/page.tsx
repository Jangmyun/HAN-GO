"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { OrderResponse, OrderStatus } from "@/lib/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:               { label: "결제 대기",    bg: "#FEF3C7", color: "#D97706" },
  payment_submitted:     { label: "입금 확인 중", bg: "#EEF0FF", color: "#4B5FFF" },
  paid:                  { label: "결제 확인됨",  bg: "#DCFCE7", color: "#16A34A" },
  preparing:             { label: "준비 중",      bg: "#FFF0E8", color: "#F5670A" },
  ready:                 { label: "수령 대기",    bg: "#DCFCE7", color: "#16A34A" },
  completed:             { label: "수령 완료",    bg: "#F3F4F6", color: "#6B7280" },
  payment_rejected:      { label: "결제 거절",    bg: "#FEE2E2", color: "#DC2626" },
  cancelled_by_user:     { label: "취소됨",       bg: "#FEE2E2", color: "#DC2626" },
  cancelled_by_store:    { label: "취소됨",       bg: "#FEE2E2", color: "#DC2626" },
  cancellation_requested:{ label: "취소 요청",    bg: "#FEE2E2", color: "#DC2626" },
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/auth"); return; }
    ordersApi.list().then(setOrders).finally(() => setLoading(false));
  }, [router]);

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#F9FAFB", minHeight: "100%" }}>
      {/* 앱바 */}
      <div
        style={{
          background: "#fff", height: 52,
          display: "flex", alignItems: "center", padding: "0 16px",
          borderBottom: "1px solid #E5E7EB",
          position: "sticky", top: 0, zIndex: 40,
        }}
      >
        <span style={{ fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>주문 내역</span>
      </div>

      <div style={{ flex: 1, padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#6B7280" }}>
            <p style={{ fontSize: 14 }}>주문 내역이 없습니다.</p>
            <Link href="/">
              <span style={{ fontSize: 14, color: "#4B5FFF", textDecoration: "underline", marginTop: 8, display: "block" }}>
                스토어 보러 가기
              </span>
            </Link>
          </div>
        ) : (
          orders.map((o) => {
            const cfg = STATUS_CFG[o.status] ?? { label: o.status, bg: "#F3F4F6", color: "#6B7280" };
            return (
              <Link key={o.id} href={`/orders/${o.id}`}>
                <div
                  style={{
                    background: "#fff", borderRadius: 16,
                    border: "1px solid #E5E7EB",
                    boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)",
                    padding: "14px 16px", cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: 0.5, fontFamily: "ui-monospace,monospace" }}>
                        {o.order_code}
                      </span>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
                        {new Date(o.created_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        {o.items.length > 0 && ` · ${o.items.length}개 상품`}
                      </div>
                    </div>
                    <span
                      style={{
                        background: cfg.bg, color: cfg.color,
                        borderRadius: 6, padding: "3px 8px",
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #F3F4F6" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#111827", letterSpacing: -0.5 }}>
                      {o.total_price.toLocaleString()}원
                    </span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })
        )}

        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <Link href="/orders/guest">
            <span style={{ fontSize: 13, color: "#6B7280", textDecoration: "underline" }}>비회원 주문 조회</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
