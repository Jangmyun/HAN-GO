"use client";

import { ticketsApi } from "@/lib/api";
import type { TicketVerifyResponse } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

type ScanState = "scanning" | "ok" | "used" | "fail";

function cornerStyle(pos: React.CSSProperties, frameColor: string): React.CSSProperties {
  return { position: "absolute", width: 30, height: 30, borderRadius: 4, ...pos };
}

function getFrameColor(state: ScanState) {
  if (state === "ok")   return "#16A34A";
  if (state === "fail" || state === "used") return "#DC2626";
  return "#4B5FFF";
}

export default function ScannerPage() {
  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [verifyResult, setVerifyResult] = useState<TicketVerifyResponse | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scanner = new Html5Qrcode("qr-reader-hidden") as any;
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 230 },
          async (decodedText: string) => {
            if (processingRef.current) return;
            processingRef.current = true;
            try {
              const res = await ticketsApi.verify(decodedText);
              setVerifyResult(res);
              if (res.success) setScanState("ok");
              else if (res.message === "already_used" || res.message?.includes("사용")) setScanState("used");
              else setScanState("fail");
              await scanner.stop();
            } catch {
              setVerifyResult({ success: false, message: "검증 실패" });
              setScanState("fail");
            }
          },
          () => {}
        )
        .catch(() => {
          setScanState("fail");
        });
    });

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const handleReset = () => {
    setVerifyResult(null);
    processingRef.current = false;
    setScanState("scanning");
    window.location.reload();
  };

  const frameColor = getFrameColor(scanState);
  const isScanning = scanState === "scanning";
  const isOK       = scanState === "ok";
  const isUsed     = scanState === "used";
  const isFail     = scanState === "fail";

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      background: "#0A0A12", fontFamily: "Pretendard, -apple-system, sans-serif",
      overflow: "hidden",
    }}>
      {/* 숨김 QR 리더 (html5-qrcode 마운트 지점) */}
      <div id="qr-reader-hidden" style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }} />

      {/* 헤더 */}
      <div style={{
        height: 56, display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button
          onClick={() => window.history.back()}
          style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 3L5 9l6 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>QR 스캐너</span>
      </div>

      {/* 카메라 영역 */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {/* 카메라 배경 시뮬레이션 */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(160deg, #111820 0%, #0D1117 40%, #131B26 100%)",
        }}>
          {/* 그리드 오버레이 */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.04,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        </div>

        {/* 스캔 프레임 */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -54%)",
          width: 230, height: 230,
        }}>
          {/* 코너 마커 */}
          {[
            { top: 0, left: 0, borderTop: `3px solid ${frameColor}`, borderLeft: `3px solid ${frameColor}` },
            { top: 0, right: 0, borderTop: `3px solid ${frameColor}`, borderRight: `3px solid ${frameColor}` },
            { bottom: 0, left: 0, borderBottom: `3px solid ${frameColor}`, borderLeft: `3px solid ${frameColor}` },
            { bottom: 0, right: 0, borderBottom: `3px solid ${frameColor}`, borderRight: `3px solid ${frameColor}` },
          ].map((s, i) => (
            <div key={i} style={cornerStyle(s as React.CSSProperties, frameColor)} />
          ))}

          {/* 스캔 라인 */}
          {isScanning && (
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${frameColor}, transparent)`,
              boxShadow: `0 0 8px ${frameColor}`,
              animation: "scanLine 2s ease-in-out infinite",
            }} />
          )}

          {/* 결과 오버레이 */}
          {!isScanning && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: 12,
              background: isOK ? "rgba(22,163,74,0.13)" : isUsed ? "rgba(245,158,11,0.13)" : "rgba(220,38,38,0.13)",
              border: `2px solid ${frameColor}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 28,
                background: frameColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 24px ${frameColor}88`,
              }}>
                {isOK ? (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M5 14l5 5 13-13" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : isUsed ? (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M14 8v7M14 18v2" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M7 7l14 14M21 7L7 21" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 안내 텍스트 */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, calc(-54% + 135px))",
          textAlign: "center", width: 280,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
            {isScanning ? "QR 코드를 프레임 안에 맞춰주세요" :
             isOK       ? "입장 확인 완료" :
             isUsed     ? "이미 사용된 티켓" :
                          "유효하지 않은 QR"}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            {isScanning ? "카메라를 QR 코드 위에 고정하세요" :
             isOK       ? "서버 검증 완료 · used 처리됨" :
             isUsed     ? "중복 스캔 방지 · 이미 스캔됨" :
                          "다른 스토어의 티켓이거나 만료되었습니다"}
          </div>
        </div>

        {/* 결과 카드 (OK / Used) */}
        {(isOK || isUsed) && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(15,15,25,0.92)", backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.08)", padding: "18px 20px 32px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: isOK ? "#F0FDF4" : "#FEF3C7",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="5" width="16" height="13" rx="2" stroke={isOK ? "#16A34A" : "#D97706"} strokeWidth="1.5" fill="none"/>
                  <path d="M7 5V4a4 4 0 018 0v1" stroke={isOK ? "#16A34A" : "#D97706"} strokeWidth="1.5" fill="none"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
                  {verifyResult?.message === "입장이 확인되었습니다." ? "봄 정기공연" : "이미 확인된 티켓"}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>C-4 · GENERAL</div>
              </div>
              <div style={{
                background: isOK ? "#16A34A22" : "#D9770622",
                color: isOK ? "#16A34A" : "#D97706",
                border: `1px solid ${isOK ? "#16A34A44" : "#D9770644"}`,
                borderRadius: 20, fontSize: 11, fontWeight: 700, padding: "3px 10px",
              }}>
                {isOK ? "입장 완료" : "중복 스캔"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[
                { label: "주문번호", value: "HG-A3F7" },
                { label: "고객", value: "김민준" },
                { label: "좌석", value: "C-4" },
              ].map((item) => (
                <div key={item.label} style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "ui-monospace,monospace" }}>{item.value}</div>
                </div>
              ))}
            </div>
            <button
              onClick={handleReset}
              style={{
                width: "100%", height: 46,
                background: isOK ? "#16A34A" : "#D97706",
                border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700,
                color: "#fff", cursor: "pointer",
              }}
            >
              {isOK ? "다음 스캔하기" : "확인 후 다음 스캔"}
            </button>
          </div>
        )}

        {/* 오류 카드 */}
        {isFail && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(15,15,25,0.92)", backdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.08)", padding: "18px 20px 32px",
          }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 12 }}>
              이 QR은 이 스토어 소유가 아니거나 공연 시간 범위를 벗어났습니다.
            </div>
            <button
              onClick={handleReset}
              style={{ width: "100%", height: 46, background: "#DC2626", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}
            >
              다시 스캔
            </button>
          </div>
        )}

        {/* 스캔 중: 하단 버튼 */}
        {isScanning && (
          <div style={{ position: "absolute", bottom: 48, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 24 }}>
            {[
              {
                label: "플래시",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M12 2L5 13h7l-3 7 10-11h-7l3-7z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
                  </svg>
                ),
              },
              {
                label: "앨범",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="11" r="4" stroke="#fff" strokeWidth="1.6"/>
                    <circle cx="11" cy="11" r="8.5" stroke="#fff" strokeWidth="1.6" strokeDasharray="3 3"/>
                  </svg>
                ),
              },
            ].map((btn) => (
              <div key={btn.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <div style={{ width: 52, height: 52, borderRadius: 26, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {btn.icon}
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{btn.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 0;               opacity: 1; }
          48%  { top: calc(100% - 2px); opacity: 1; }
          50%  { top: calc(100% - 2px); opacity: 0; }
          52%  { top: 0;               opacity: 0; }
          54%  { top: 0;               opacity: 1; }
          100% { top: 0;               opacity: 1; }
        }
      `}</style>
    </div>
  );
}
