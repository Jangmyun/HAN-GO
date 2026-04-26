"use client";

import { ordersApi } from "@/lib/api";
import { clearCart, getCart, getCartStoreId, removeFromCart } from "@/lib/cart";
import type { CartItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CartPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sid = getCartStoreId();
    setStoreId(sid);
    if (sid) setItems(getCart(sid));
  }, []);

  const total = items.reduce((s, i) => s + i.subtotal, 0);

  const handleRemove = (productId: string) => {
    if (!storeId) return;
    removeFromCart(storeId, productId);
    setItems(getCart(storeId));
  };

  const handleCheckout = async () => {
    if (!storeId || items.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const order = await ordersApi.create({
        store_id: storeId,
        items: items.map((item) => ({
          product_id: item.product_id,
          schedule_id: item.schedule_id,
          seat_keys: item.seat_keys,
          quantity: item.quantity,
          selected_options: item.selected_options,
        })),
      });
      clearCart();
      router.push(`/orders/${order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "주문 실패. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

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
        <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>주문 확인</span>
      </div>

      {items.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#6B7280" }}>
          <p style={{ fontSize: 14 }}>장바구니가 비어 있습니다.</p>
          <button
            onClick={() => router.push("/")}
            style={{ fontSize: 14, color: "#4B5FFF", textDecoration: "underline", background: "transparent", border: "none", cursor: "pointer" }}
          >
            스토어 보러 가기
          </button>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {/* 주문 항목 */}
            <div
              style={{
                background: "#fff", borderRadius: 16,
                border: "1px solid #E5E7EB",
                boxShadow: "0 1px 3px rgba(17,24,39,0.06)",
                padding: "16px",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>주문 항목</div>
              {items.map((item, i) => (
                <div
                  key={`${item.product_id}-${i}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    paddingBottom: i < items.length - 1 ? 12 : 0,
                    borderBottom: i < items.length - 1 ? "1px solid #F3F4F6" : "none",
                    marginBottom: i < items.length - 1 ? 12 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: "#EEF0FF",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <rect x="3" y="3" width="12" height="12" rx="2" stroke="#4B5FFF" strokeWidth="1.4" fill="none"/>
                      <path d="M6 9l2 2 4-4" stroke="#4B5FFF" strokeWidth="1.4" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{item.product_name}</div>
                    {item.seat_keys && item.seat_keys.length > 0 && (
                      <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>좌석: {item.seat_keys.join(", ")}</div>
                    )}
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 1 }}>수량: {item.quantity}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                      ₩{item.subtotal.toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleRemove(item.product_id)}
                      style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, color: "#9CA3AF" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 결제 수단 안내 */}
            <div
              style={{
                background: "#F0F2FF", borderRadius: 14, padding: "14px 16px",
                border: "1px solid #4B5FFF22",
              }}
            >
              <div style={{ fontSize: 13, color: "#4B5FFF", fontWeight: 700, marginBottom: 6 }}>💡 결제 안내</div>
              <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
                주문 후 스토어의 카카오페이 또는 계좌로 직접 입금해주세요.<br/>
                입금자명에 <strong>주문 번호</strong>를 반드시 입력해주세요.
              </div>
            </div>

            {/* 취소 정책 */}
            <div
              style={{
                background: "#F9FAFB", borderRadius: 12, padding: "12px 14px",
                border: "1px solid #E5E7EB", fontSize: 12, color: "#6B7280", lineHeight: 1.7,
              }}
            >
              ⚠️ 공연 시작 전까지 취소 요청이 가능합니다. 환불은 스토어 운영자가 직접 처리합니다.
            </div>

            {error && (
              <div style={{ fontSize: 13, color: "#DC2626", background: "#FEE2E2", borderRadius: 10, padding: "12px 16px" }}>
                {error}
              </div>
            )}
            <div style={{ height: 8 }}/>
          </div>

          {/* 합계 + 주문 CTA */}
          <div style={{ padding: "14px 16px 32px", background: "#fff", borderTop: "1px solid #E5E7EB", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 14, color: "#6B7280" }}>최종 결제금액</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: -0.8 }}>
                ₩{total.toLocaleString()}
              </span>
            </div>
            <button
              onClick={handleCheckout}
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
              {submitting ? "주문 처리 중..." : "결제 진행하기"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
