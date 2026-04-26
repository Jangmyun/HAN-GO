"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { ticketsApi } from "@/lib/api";
import type { TicketResponse } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TicketPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    ticketsApi.get(params.ticketId)
      .then(setTicket)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "티켓 로드 실패"))
      .finally(() => setLoading(false));
  }, [params.ticketId]);

  const isUsed = ticket?.status === "used";
  const isRevoked = ticket?.status === "revoked";

  return (
    <div
      style={{
        display: "flex", flexDirection: "column",
        minHeight: "100%",
        background: "#111827",
      }}
    >
      {/* 앱바 */}
      <div
        style={{
          height: 52, background: "transparent",
          display: "flex", alignItems: "center", padding: "0 8px 0 4px",
          gap: 4, position: "sticky", top: 0, zIndex: 40,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", borderRadius: 10 }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 4L7 11l7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>QR 티켓</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px" }}>
        {loading ? (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
            <Skeleton className="h-48 rounded-3xl bg-white/10" />
            <Skeleton className="h-64 rounded-3xl bg-white/10" />
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", color: "#F87171", padding: "48px 0" }}>{error}</div>
        ) : ticket ? (
          <>
            {/* 티켓 카드 */}
            <div
              style={{
                width: "100%",
                background: "#fff", borderRadius: 24, overflow: "hidden",
                boxShadow: "0 32px 64px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.2)",
              }}
            >
              {/* 티켓 상단 헤더 */}
              <div
                style={{
                  background: "linear-gradient(135deg, #4B5FFF, #7B8BFF)",
                  padding: "22px 24px", position: "relative" as const, overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", right: -24, top: -24, width: 120, height: 120, borderRadius: 60, background: "rgba(255,255,255,0.08)" }}/>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 2, textTransform: "uppercase" as const }}>
                  HAN:GO TICKET
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginTop: 6, lineHeight: 1.3, letterSpacing: -0.5 }}>
                  티켓
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>발급일</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                      {new Date(ticket.issued_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}>상태</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                      {isUsed ? "사용됨" : isRevoked ? "무효" : "입장 가능"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 점선 분리선 (티켓 절취선) */}
              <div style={{ display: "flex", alignItems: "center", position: "relative" as const, overflow: "hidden", height: 22 }}>
                <div style={{ position: "absolute", left: -11, width: 22, height: 22, borderRadius: 11, background: "#111827" }}/>
                <div style={{ flex: 1, borderTop: "2px dashed #E5E7EB", margin: "0 16px" }}/>
                <div style={{ position: "absolute", right: -11, width: 22, height: 22, borderRadius: 11, background: "#111827" }}/>
              </div>

              {/* QR 코드 영역 */}
              <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    background: "#fff", borderRadius: 16, padding: 16,
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
                    opacity: isUsed || isRevoked ? 0.3 : 1,
                  }}
                >
                  <QRCodeSVG value={ticket.qr_token} size={160} bgColor="#ffffff" fgColor="#111827"/>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>티켓 코드</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: 2, fontFamily: "ui-monospace,monospace" }}>
                    {ticket.id.slice(0, 12).toUpperCase()}
                  </div>
                </div>
                {/* 상태 배지 */}
                {isUsed ? (
                  <span style={{ background: "#374151", color: "#D1D5DB", borderRadius: 100, padding: "6px 18px", fontSize: 13, fontWeight: 700 }}>
                    ✓ 사용됨
                  </span>
                ) : isRevoked ? (
                  <span style={{ background: "#7F1D1D", color: "#FCA5A5", borderRadius: 100, padding: "6px 18px", fontSize: 13, fontWeight: 700 }}>
                    무효 티켓
                  </span>
                ) : (
                  <span style={{ background: "#16A34A", color: "#fff", borderRadius: 100, padding: "6px 18px", fontSize: 13, fontWeight: 700 }}>
                    ✓ 입장 가능
                  </span>
                )}
              </div>
            </div>

            {/* 안내 텍스트 */}
            <div style={{ marginTop: 20, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                공연장 입장 시 스토어 운영자에게 이 화면을 보여주세요.<br/>
                QR 코드는 1회만 스캔 가능합니다.
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "center" }}>
                <button
                  onClick={() => router.back()}
                  style={{
                    background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 10, padding: "9px 16px",
                    fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                  }}
                >
                  주문 상세 보기
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
