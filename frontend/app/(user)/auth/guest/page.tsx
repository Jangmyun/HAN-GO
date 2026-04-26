"use client";

import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GuestPhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!phone || !agreed) return;
    setLoading(true);
    setError("");
    try {
      const res = await authApi.guestLogin(phone);
      setToken(res.access_token, "guest", { user_id: res.user_id });
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다. 다시 시도해주세요.");
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
          borderBottom: "1px solid #E5E7EB", flexShrink: 0, gap: 4,
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
        <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>비회원 주문</span>
      </div>

      <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#111827", letterSpacing: -0.8, marginBottom: 8 }}>
            전화번호를 입력해주세요
          </div>
          <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.7 }}>
            주문 조회에 사용됩니다.<br/>주문번호와 전화번호로 언제든 확인 가능해요.
          </div>
        </div>

        {/* 전화번호 입력 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>전화번호</span>
          <div
            style={{
              height: 52,
              border: `1.5px solid ${phone ? "#4B5FFF" : "#E5E7EB"}`,
              borderRadius: 12,
              display: "flex", alignItems: "center", padding: "0 16px",
              background: "#fff",
              boxShadow: phone ? "0 0 0 3px #4B5FFF1A" : "none",
              gap: 8, transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 14, color: "#6B7280", flexShrink: 0 }}>🇰🇷 +82</span>
            <input
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                flex: 1, fontSize: 15, color: "#111827",
                border: "none", outline: "none", background: "transparent",
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
            하이픈(-) 없이 숫자만 입력해도 됩니다
          </span>
        </div>

        {/* 동의 체크 */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <button
            onClick={() => setAgreed(!agreed)}
            style={{
              width: 22, height: 22, borderRadius: 7,
              background: agreed ? "#4B5FFF" : "#fff",
              border: agreed ? "none" : "1.5px solid #E5E7EB",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: 1, cursor: "pointer",
              boxShadow: agreed ? "0 2px 8px rgba(75,95,255,0.30)" : "none",
              transition: "all 0.15s",
            }}
          >
            {agreed && (
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2.5 6.5l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
            전화번호 수집 및 이용에 동의합니다. (
            <span style={{ color: "#4B5FFF", cursor: "pointer", fontWeight: 600 }}>개인정보처리방침</span>)
          </span>
        </div>

        {/* 안내 박스 */}
        <div
          style={{
            background: "#F0F2FF", borderRadius: 14, padding: "16px 18px",
            border: "1px solid #4B5FFF22",
          }}
        >
          <div style={{ fontSize: 13, color: "#4B5FFF", fontWeight: 700, marginBottom: 6 }}>💡 주문 조회 안내</div>
          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.7 }}>
            주문 후 전달되는 링크로 언제든지 주문 상태를 확인할 수 있어요.
          </div>
          <div
            style={{
              fontSize: 11, color: "#6B7280", fontFamily: "ui-monospace,monospace",
              background: "rgba(255,255,255,0.7)", borderRadius: 8,
              padding: "6px 10px", marginTop: 8,
            }}
          >
            /orders/guest?code=HG-A3F7
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 13, color: "#DC2626", background: "#FEE2E2", borderRadius: 10, padding: "12px 16px" }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ padding: "0 24px 36px", flexShrink: 0 }}>
        <button
          onClick={handleSubmit}
          disabled={loading || !phone || !agreed}
          style={{
            width: "100%", height: 54,
            background: loading || !phone || !agreed ? "#E5E7EB" : "#4B5FFF",
            color: loading || !phone || !agreed ? "#9CA3AF" : "#fff",
            border: "none", borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: loading || !phone || !agreed ? "default" : "pointer",
            boxShadow: loading || !phone || !agreed ? "none" : "0 2px 8px rgba(75,95,255,0.30)",
            transition: "all 0.15s",
          }}
        >
          {loading ? "확인 중..." : "계속하기"}
        </button>
      </div>
    </div>
  );
}
