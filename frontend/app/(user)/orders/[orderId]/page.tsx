"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import type { OrderResponse, OrderStatus } from "@/lib/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TERMINAL: OrderStatus[] = ["completed", "cancelled_by_user", "cancelled_by_store", "payment_rejected"];

const STATUS_HEADER: Record<string, { label: string; desc: string; color: string; icon: string }> = {
  pending:               { label: "주문 완료",    desc: "결제를 진행해주세요",                              color: "#6B7280", icon: "doc" },
  payment_submitted:     { label: "입금 확인 중", desc: "스토어 운영자가 입금을 확인하고 있습니다",          color: "#D97706", icon: "clock" },
  paid:                  { label: "결제 확인됨",  desc: "결제가 확인되었습니다",                            color: "#16A34A", icon: "check" },
  preparing:             { label: "준비 중",      desc: "스토어에서 상품을 준비하고 있습니다",               color: "#F5670A", icon: "check" },
  ready:                 { label: "수령 대기",    desc: "상품이 준비되었습니다. 수령해주세요!",              color: "#16A34A", icon: "check" },
  completed:             { label: "수령 완료",    desc: "주문이 완료되었습니다. 이용해주셔서 감사합니다.",    color: "#6B7280", icon: "check" },
  payment_rejected:      { label: "결제 거절",    desc: "입금이 확인되지 않았습니다. 스토어에 문의해주세요.", color: "#DC2626", icon: "error" },
  cancelled_by_user:     { label: "취소됨",       desc: "주문이 취소되었습니다.",                           color: "#DC2626", icon: "error" },
  cancelled_by_store:    { label: "취소됨",       desc: "스토어에서 주문을 취소하였습니다.",                 color: "#DC2626", icon: "error" },
  cancellation_requested:{ label: "취소 요청",    desc: "취소 요청이 스토어에 전달되었습니다.",              color: "#D97706", icon: "clock" },
};

const TIMELINE_STEPS = [
  { status: "pending" as OrderStatus,           label: "주문 생성" },
  { status: "payment_submitted" as OrderStatus, label: "입금 완료 요청" },
  { status: "paid" as OrderStatus,              label: "결제 확인" },
  { status: "completed" as OrderStatus,         label: "수령 완료" },
];

const FOOD_TIMELINE_STEPS = [
  { status: "paid" as OrderStatus,              label: "결제 확인" },
  { status: "preparing" as OrderStatus,         label: "조리 중" },
  { status: "ready" as OrderStatus,             label: "픽업 가능" },
  { status: "completed" as OrderStatus,         label: "수령 완료" },
];

const FOOD_STATUS_ORDER: OrderStatus[] = ["paid", "preparing", "ready", "completed"];

function deriveWaitingNumber(orderId: string): number {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) hash = (hash * 31 + orderId.charCodeAt(i)) & 0xffff;
  return (hash % 900) + 100; // 100–999
}

function FoodStatusHero({ order }: { order: OrderResponse }) {
  const isReady = order.status === "ready";
  const isPreparing = order.status === "preparing";
  if (!isPreparing && !isReady) return null;

  const waitNum = deriveWaitingNumber(order.id);
  const statusIdx = FOOD_STATUS_ORDER.indexOf(order.status);

  return (
    <>
      {/* 상태 히어로 */}
      <div style={{
        background: "#fff", borderRadius: 20, padding: "24px 20px",
        border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(17,24,39,0.06)",
        textAlign: "center", position: "relative" as const, overflow: "hidden",
      }}>
        {isReady && (
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(22,163,74,0.09) 0%, transparent 70%)" }} />
        )}
        <div style={{
          width: 72, height: 72, borderRadius: 36,
          background: isReady ? "#F0FDF4" : "#FEF3C7",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
          boxShadow: `0 0 0 12px ${isReady ? "rgba(22,163,74,0.05)" : "rgba(245,158,11,0.05)"}`,
        }}>
          {isReady ? (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 16l6 6 14-14" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 8h16v2c0 6-3 10-8 12-5-2-8-6-8-12V8z" stroke="#F59E0B" strokeWidth="2" strokeLinejoin="round" fill="none"/>
              <path d="M12 14l2.5 2.5 5-5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: -0.6, marginBottom: 6 }}>
          {isReady ? "픽업 가능합니다! 🎉" : "조리 중입니다"}
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
          {isReady ? "카운터에서 아래 번호를 말씀해 주세요." : "잠시만 기다려주세요. 완료되면 알림을 드립니다."}
        </div>
        {/* 대기 번호 */}
        <div style={{
          marginTop: 18, padding: "14px 24px",
          background: isReady ? "#F0FDF4" : "#FEF3C7",
          borderRadius: 14, display: "inline-block",
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: isReady ? "#16A34A" : "#D97706", marginBottom: 2 }}>대기 번호</div>
          <div style={{ fontSize: 44, fontWeight: 900, color: isReady ? "#16A34A" : "#D97706", fontFamily: "ui-monospace,monospace", letterSpacing: -1 }}>
            {String(waitNum).padStart(3, "0")}
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <span style={{
            fontSize: 12, color: "#9CA3AF", fontFamily: "ui-monospace,monospace",
            background: "#F9FAFB", borderRadius: 20, padding: "4px 12px",
            border: "1px solid #E5E7EB",
          }}>{order.order_code}</span>
        </div>
      </div>

      {/* FOOD 타임라인 */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(17,24,39,0.06)", padding: "18px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 14 }}>진행 현황</div>
        {FOOD_TIMELINE_STEPS.map((s, i, arr) => {
          const done = statusIdx > i;
          const active = statusIdx === i && order.status !== "completed";
          return (
            <div key={s.status} style={{ display: "flex", gap: 12, paddingBottom: i < arr.length - 1 ? 14 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 11,
                  background: done ? "#16A34A" : active ? "#F59E0B" : "#F3F4F6",
                  border: active ? `2px solid #F59E0B` : done ? "none" : "1.5px solid #E5E7EB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {done && (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5l2 2 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                  {active && <div style={{ width: 8, height: 8, borderRadius: 4, background: "#F59E0B" }} />}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 12, marginTop: 3, background: done ? "#16A34A" : "#F3F4F6", borderRadius: 1 }} />
                )}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: done || active ? 600 : 400, color: done ? "#111827" : active ? "#D97706" : "#6B7280" }}>{s.label}</div>
                {done && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>완료</div>}
                {active && <div style={{ fontSize: 11, color: "#D97706", marginTop: 1 }}>진행 중…</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function StatusIcon({ type, color }: { type: string; color: string }) {
  if (type === "check") return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M8 13l3 3 6-6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  if (type === "clock") return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M13 8v5.5l3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  if (type === "error") return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="9" stroke={color} strokeWidth="1.8"/>
      <path d="M9 9l8 8M17 9l-8 8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <rect x="4" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="1.8"/>
      <path d="M9 13h8M9 9h5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function PaymentGuide({ order, onSubmit }: { order: OrderResponse; onSubmit: () => void }) {
  const [method, setMethod] = useState<"KAKAOPAY_URL" | "BANK_TRANSFER">("KAKAOPAY_URL");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await ordersApi.paymentSubmit(order.id, method);
      onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 주문번호 강조 카드 */}
      <div
        style={{
          background: "linear-gradient(135deg, #4B5FFF, #7B8BFF)",
          borderRadius: 18, padding: "20px",
          boxShadow: "0 10px 24px rgba(0,0,0,0.09), 0 4px 8px rgba(0,0,0,0.05)",
          position: "relative" as const, overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: 60, background: "rgba(255,255,255,0.07)" }}/>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, textTransform: "uppercase" as const, marginBottom: 8 }}>
          주문번호
        </div>
        <div style={{ fontSize: 34, fontWeight: 900, color: "#fff", letterSpacing: 2, fontFamily: "ui-monospace,monospace" }}>
          {order.order_code}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 6, lineHeight: 1.6 }}>
          송금 시 <strong style={{ color: "#fff" }}>입금자명</strong>에 이 주문번호를 입력해주세요
        </div>
      </div>

      {/* 카카오페이 */}
      <div
        style={{
          background: "#fff", borderRadius: 16,
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(17,24,39,0.06)",
          padding: "18px",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, background: "#FEE500", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1C4 1 2 2.8 2 5c0 1.4.9 2.6 2.2 3.3L3.7 10l2.1-1.4c.2.02.47.06.7.06 2.5 0 4.5-1.8 4.5-4S9 1 6.5 1z" fill="#3C1E1E"/>
            </svg>
          </div>
          카카오페이 송금
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%", height: 50,
            background: submitting ? "#E5E7EB" : "#FEE500",
            border: "none", borderRadius: 12,
            fontSize: 15, fontWeight: 700, color: "#3C1E1E",
            cursor: submitting ? "default" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: submitting ? "none" : "0 2px 8px rgba(254,229,0,0.4)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2C5.7 2 3 4.2 3 7c0 1.8 1.1 3.3 2.8 4.2l-.8 2.8 2.9-1.9c.3.04.7.07 1.1.07 3.3 0 6-2.2 6-5S12.3 2 9 2z" fill="#3C1E1E"/>
          </svg>
          {submitting ? "처리 중..." : `카카오페이로 ₩${order.total_price.toLocaleString()} 송금하기`}
        </button>
        <div style={{ fontSize: 11, color: "#6B7280", textAlign: "center", marginTop: 8, lineHeight: 1.6 }}>
          송금 후 아래 "입금 완료" 버튼을 눌러주세요
        </div>
      </div>

      {/* 계좌이체 */}
      <div
        style={{
          background: "#fff", borderRadius: 16,
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(17,24,39,0.06)",
          padding: "18px",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 12 }}>또는 계좌이체</div>
        <div style={{ background: "#F9FAFB", borderRadius: 12, padding: "14px", display: "flex", flexDirection: "column" as const, gap: 8, border: "1px solid #E5E7EB" }}>
          {[
            { label: "입금자명 (필수)", value: order.order_code, highlight: true },
            { label: "금액", value: `₩${order.total_price.toLocaleString()}` },
          ].map((f) => (
            <div key={f.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#6B7280" }}>{f.label}</span>
              <span
                style={{
                  fontSize: 13, fontWeight: f.highlight ? 800 : 600,
                  color: f.highlight ? "#F5670A" : "#111827",
                  fontFamily: f.highlight ? "ui-monospace,monospace" : "inherit",
                  letterSpacing: f.highlight ? 1 : 0,
                }}
              >
                {f.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 입금 완료 CTA */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          width: "100%", height: 54,
          background: submitting ? "#E5E7EB" : "#4B5FFF",
          color: submitting ? "#9CA3AF" : "#fff",
          border: "none", borderRadius: 14,
          fontSize: 15, fontWeight: 700,
          cursor: submitting ? "default" : "pointer",
          boxShadow: submitting ? "none" : "0 2px 8px rgba(75,95,255,0.30)",
        }}
      >
        {submitting ? "처리 중..." : "입금 완료 — 확인 요청하기"}
      </button>

      {/* 안내 */}
      <div style={{ background: "#F0F2FF", borderRadius: 12, padding: "13px 15px", border: "1px solid #4B5FFF22", fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
        ℹ️ 스토어 운영자가 입금 확인 후 수동으로 결제를 확인합니다.<br/>
        확인까지 최대 10분 소요될 수 있습니다.
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = async () => {
    const o = await ordersApi.get(params.orderId);
    setOrder(o);
    if (TERMINAL.includes(o.status) && intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    fetchOrder().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchOrder, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [params.orderId]);

  if (loading) return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );

  if (!order) return (
    <div style={{ textAlign: "center", padding: "80px 16px", color: "#6B7280" }}>주문을 찾을 수 없습니다.</div>
  );

  const hdr = STATUS_HEADER[order.status] ?? { label: order.status, desc: "", color: "#6B7280", icon: "doc" };
  const isTicketReady = order.status === "paid" || order.status === "ready" || order.status === "completed";
  const isCancelled = ["cancelled_by_user", "cancelled_by_store", "payment_rejected"].includes(order.status);

  // 타임라인 완료 여부
  const orderIdx = ["pending", "payment_submitted", "paid", "completed"].indexOf(order.status);

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#F9FAFB", minHeight: "100%" }}>
      {/* 앱바 */}
      <div
        style={{
          height: 52, background: "#fff",
          display: "flex", alignItems: "center", padding: "0 8px 0 4px",
          borderBottom: "1px solid #E5E7EB",
          position: "sticky", top: 0, zIndex: 40, gap: 4,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", borderRadius: 10 }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 4L7 11l7 7" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>주문 상세</span>
        <button
          onClick={() => navigator.clipboard.writeText(order.order_code)}
          style={{ marginRight: 8, fontSize: 12, color: "#6B7280", background: "transparent", border: "1px solid #E5E7EB", borderRadius: 9, padding: "6px 12px", cursor: "pointer" }}
        >
          복사
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* 상태 헤더 */}
        <div
          style={{
            background: "#fff", borderRadius: 18, padding: "22px 20px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56, height: 56, borderRadius: 28,
              background: hdr.color + "18",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 12,
              boxShadow: `0 0 0 8px ${hdr.color}0C`,
            }}
          >
            <StatusIcon type={hdr.icon} color={hdr.color} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", letterSpacing: -0.5, marginBottom: 6 }}>{hdr.label}</div>
          <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>{hdr.desc}</div>
          <div style={{ marginTop: 12, padding: "6px 14px", background: hdr.color + "12", borderRadius: 20, display: "inline-block" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: hdr.color, fontFamily: "ui-monospace,monospace" }}>
              {order.order_code}
            </span>
          </div>
        </div>

        {/* 결제 안내 (pending 상태) */}
        {order.status === "pending" && <PaymentGuide order={order} onSubmit={fetchOrder} />}

        {/* FOOD 조리중/픽업 가능 히어로 */}
        {(order.status === "preparing" || order.status === "ready") && (
          <FoodStatusHero order={order} />
        )}

        {/* 진행 타임라인 (FOOD preparing/ready일 때는 FoodStatusHero 내에 포함) */}
        {!isCancelled && order.status !== "preparing" && order.status !== "ready" && (
          <div
            style={{
              background: "#fff", borderRadius: 16,
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 3px rgba(17,24,39,0.06)",
              padding: "18px",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 14 }}>진행 현황</div>
            {TIMELINE_STEPS.map((s, i, arr) => {
              const done = orderIdx >= i;
              return (
                <div key={s.status} style={{ display: "flex", gap: 12, paddingBottom: i < arr.length - 1 ? 14 : 0 }}>
                  <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", flexShrink: 0 }}>
                    <div
                      style={{
                        width: 20, height: 20, borderRadius: 10,
                        background: done ? "#16A34A" : "#F3F4F6",
                        border: done ? "none" : "1.5px solid #E5E7EB",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {done && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 14, background: done ? "#16A34A" : "#F3F4F6", borderRadius: 1, marginTop: 3 }}/>
                    )}
                  </div>
                  <div style={{ paddingBottom: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: done ? "#111827" : "#6B7280" }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                      {done ? new Date(order.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "대기 중"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 취소/거절 */}
        {isCancelled && (
          <div
            style={{
              background: "#FEE2E2", borderRadius: 16,
              border: "1px solid #FECACA",
              padding: "16px 18px",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "#DC2626", marginBottom: 4 }}>
              {order.status === "payment_rejected" ? "결제가 거절되었습니다" : "주문이 취소되었습니다"}
            </div>
            <div style={{ fontSize: 12, color: "#7F1D1D" }}>환불은 스토어 운영자에게 직접 문의해주세요.</div>
          </div>
        )}

        {/* 주문 내용 */}
        <div
          style={{
            background: "#fff", borderRadius: 16,
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(17,24,39,0.06)",
            padding: "16px",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>주문 내용</div>
          {order.items.map((item, i) => (
            <div
              key={item.id}
              style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: i < order.items.length - 1 ? "1px solid #F3F4F6" : "none",
              }}
            >
              <span style={{ fontSize: 13, color: "#374151" }}>
                상품 ID: {item.product_id.slice(0, 8)}...
                {item.seat_keys && item.seat_keys.length > 0 && ` (좌석: ${item.seat_keys.join(", ")})`}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.subtotal.toLocaleString()}원</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>합계</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{order.total_price.toLocaleString()}원</span>
          </div>
        </div>

        {/* 취소 버튼 */}
        {!isCancelled && order.status !== "completed" && (
          <button
            style={{
              width: "100%", height: 48,
              background: "#F9FAFB",
              color: "#6B7280",
              border: "1px solid #E5E7EB",
              borderRadius: 14,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            취소 요청
          </button>
        )}

        <div style={{ height: 8 }}/>
      </div>

      {/* QR 티켓 보기 CTA */}
      {isTicketReady && order.items.length > 0 && (
        <div style={{ padding: "12px 16px 32px", background: "#fff", borderTop: "1px solid #E5E7EB", flexShrink: 0 }}>
          <Link href={`/tickets/${order.items[0].id}`}>
            <button
              style={{
                width: "100%", height: 54,
                background: "#4B5FFF", color: "#fff",
                border: "none", borderRadius: 14,
                fontSize: 15, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(75,95,255,0.30)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" stroke="#fff" strokeWidth="1.5"/>
                <rect x="11" y="2" width="5" height="5" rx="1" stroke="#fff" strokeWidth="1.5"/>
                <rect x="2" y="11" width="5" height="5" rx="1" stroke="#fff" strokeWidth="1.5"/>
                <path d="M11 11h2v2h-2zM15 11v2h2M11 15h2M15 15h2v2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              QR 티켓 보기
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
