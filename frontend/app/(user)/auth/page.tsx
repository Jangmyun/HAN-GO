"use client";

import Link from "next/link";

const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize?` +
  `client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? ""}&` +
  `redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ?? "http://localhost:3000/auth/kakao/callback")}&` +
  `response_type=code`;

export default function AuthPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#fff" }}>
      {/* 상단 그라디언트 장식 */}
      <div
        style={{
          position: "relative",
          height: 220,
          background: "linear-gradient(160deg, #F0F2FF 0%, #fff 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: 100, background: "#4B5FFF0C" }}/>
        <div style={{ position: "absolute", bottom: -20, left: -30, width: 140, height: 140, borderRadius: 70, background: "#F5670A0A" }}/>
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div
            style={{
              width: 72, height: 72,
              background: "#4B5FFF",
              borderRadius: 22,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 48px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06)",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: -2 }}>H</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "#111827", letterSpacing: -1.5 }}>
            HAN<span style={{ color: "#4B5FFF" }}>:</span>GO
          </div>
          <div style={{ fontSize: 14, color: "#6B7280", marginTop: 6, lineHeight: 1.5 }}>
            한동대 주문·결제·예매 플랫폼
          </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div style={{ flex: 1, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
        {/* 카카오 로그인 */}
        <a href={KAKAO_AUTH_URL}>
          <button
            style={{
              width: "100%", height: 54,
              background: "#FEE500",
              border: "none", borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(254,229,0,0.4)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2.5C6.3 2.5 2.5 5.6 2.5 9.4c0 2.5 1.7 4.7 4.2 5.9l-1 3.6 4-2.6c.4.05.85.1 1.3.1 4.7 0 8.5-3.1 8.5-6.9S15.7 2.5 11 2.5z" fill="#3C1E1E"/>
            </svg>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#3C1E1E", letterSpacing: -0.3 }}>
              카카오로 로그인
            </span>
          </button>
        </a>

        {/* 구분선 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }}/>
          <span style={{ fontSize: 12, color: "#6B7280" }}>또는</span>
          <div style={{ flex: 1, height: 1, background: "#E5E7EB" }}/>
        </div>

        {/* 비회원 주문 */}
        <Link href="/auth/guest" style={{ display: "block" }}>
          <button
            style={{
              width: "100%", height: 54,
              background: "transparent",
              border: "1.5px solid #4B5FFF",
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              fontSize: 15, fontWeight: 700, color: "#4B5FFF",
              letterSpacing: -0.3,
            }}
          >
            비회원으로 주문하기
          </button>
        </Link>

        <div style={{ textAlign: "center", marginTop: 4 }}>
          <span style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.7 }}>
            로그인 시{" "}
            <span style={{ color: "#4B5FFF", cursor: "pointer" }}>이용약관</span>
            {" "}및{" "}
            <span style={{ color: "#4B5FFF", cursor: "pointer" }}>개인정보처리방침</span>에 동의합니다
          </span>
        </div>

        {/* 비회원 조회 링크 */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <Link href="/orders/guest">
            <span style={{ fontSize: 13, color: "#6B7280", textDecoration: "underline", cursor: "pointer" }}>
              비회원 주문 조회
            </span>
          </Link>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "0 0 24px", flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: "#E5E7EB" }}>Built by CRA @ Handong University</span>
      </div>
    </div>
  );
}
