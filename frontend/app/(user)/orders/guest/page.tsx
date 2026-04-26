"use client";

import { ordersApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GuestLookupPage() {
  const router = useRouter();
  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!orderCode || !phone) return;
    setLoading(true);
    setError("");
    try {
      const order = await ordersApi.guestLookup(orderCode.toUpperCase().trim(), phone.trim());
      router.push(`/orders/${order.id}`);
    } catch {
      setError("주문을 찾을 수 없습니다. 주문 번호와 전화번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#fff" }}>
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
        <span style={{ fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>주문 조회</span>
      </div>

      <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: -0.8, marginBottom: 8 }}>
            비회원 주문 조회
          </div>
          <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
            주문 완료 시 전달된 주문번호와<br/>전화번호를 입력해주세요.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* 주문번호 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>주문번호</span>
            <div
              style={{
                height: 52, border: `1.5px solid ${orderCode ? "#4B5FFF" : "#E5E7EB"}`, borderRadius: 12,
                display: "flex", alignItems: "center", padding: "0 16px",
                background: "#fff",
                boxShadow: orderCode ? "0 0 0 3px #4B5FFF1A" : "none",
                transition: "all 0.15s",
              }}
            >
              <input
                type="text"
                placeholder="HG-A3F7"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                style={{ flex: 1, fontSize: 15, color: "#111827", border: "none", outline: "none", background: "transparent", fontFamily: "ui-monospace,monospace", letterSpacing: 0.5 }}
              />
            </div>
            <span style={{ fontSize: 12, color: "#6B7280" }}>주문 확인 문자/링크에서 확인하세요</span>
          </div>

          {/* 전화번호 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>전화번호</span>
            <div
              style={{
                height: 52, border: `1.5px solid ${phone ? "#4B5FFF" : "#E5E7EB"}`, borderRadius: 12,
                display: "flex", alignItems: "center", padding: "0 16px",
                background: "#fff",
                boxShadow: phone ? "0 0 0 3px #4B5FFF1A" : "none",
                transition: "all 0.15s",
              }}
            >
              <input
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ flex: 1, fontSize: 15, color: "#111827", border: "none", outline: "none", background: "transparent" }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !orderCode || !phone}
          style={{
            width: "100%", height: 54,
            background: loading || !orderCode || !phone ? "#E5E7EB" : "#4B5FFF",
            color: loading || !orderCode || !phone ? "#9CA3AF" : "#fff",
            border: "none", borderRadius: 14,
            fontSize: 15, fontWeight: 700,
            cursor: loading || !orderCode || !phone ? "default" : "pointer",
            boxShadow: loading || !orderCode || !phone ? "none" : "0 2px 8px rgba(75,95,255,0.30)",
            transition: "all 0.15s",
          }}
        >
          {loading ? "조회 중..." : "주문 조회하기"}
        </button>

        {error && (
          <div style={{ fontSize: 13, color: "#DC2626", background: "#FEE2E2", borderRadius: 10, padding: "12px 16px" }}>
            {error}
          </div>
        )}

        <div style={{ background: "#F9FAFB", borderRadius: 14, padding: "14px 16px", border: "1px solid #E5E7EB", fontSize: 13, color: "#6B7280", lineHeight: 1.7 }}>
          📌 주문 링크를 저장해두면 편리하게 재조회할 수 있어요.
        </div>
      </div>
    </div>
  );
}
