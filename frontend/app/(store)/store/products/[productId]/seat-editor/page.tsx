"use client";

import { useState } from "react";

type Tool = "available" | "vip" | "unavail" | "erase";

const ROWS = 8;
const COLS = 12;

const INITIAL_UNAVAIL = new Set(["0-0", "0-11", "7-0", "7-11", "6-0", "6-11", "7-1", "7-10"]);
const INITIAL_VIP     = new Set(["0-2", "0-3", "0-4", "0-5", "0-6", "0-7", "0-8", "0-9"]);
const INITIAL_SOLD    = new Set(["1-3", "1-4", "2-5", "3-6", "4-7"]);

type CellState = "available" | "vip" | "unavail" | "sold";

function buildInitialGrid(): Record<string, CellState> {
  const grid: Record<string, CellState> = {};
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = `${r}-${c}`;
      if (INITIAL_UNAVAIL.has(key)) grid[key] = "unavail";
      else if (INITIAL_VIP.has(key)) grid[key] = "vip";
      else if (INITIAL_SOLD.has(key)) grid[key] = "sold";
      else grid[key] = "available";
    }
  }
  return grid;
}

const TOOLS: { id: Tool; label: string; color: string }[] = [
  { id: "available", label: "일반석", color: "#4B5FFF" },
  { id: "vip",       label: "VIP",    color: "#F5670A" },
  { id: "unavail",   label: "비활성", color: "#9CA3AF" },
  { id: "erase",     label: "지우개", color: "#DC2626" },
];

function getCellStyle(state: CellState): { bg: string; border: string; cursor: string } {
  switch (state) {
    case "unavail":   return { bg: "transparent", border: "1.5px dashed #D1D5DB", cursor: "pointer" };
    case "sold":      return { bg: "#E5E7EB",     border: "1.5px solid #9CA3AF", cursor: "default" };
    case "vip":       return { bg: "#F5670A33",   border: "1.5px solid #F5670A", cursor: "pointer" };
    case "available": return { bg: "#4B5FFF22",   border: "1.5px solid #4B5FFF88", cursor: "pointer" };
  }
}

export default function SeatEditorPage() {
  const [grid, setGrid]         = useState(buildInitialGrid);
  const [activeTool, setTool]   = useState<Tool>("available");
  const [selectedCells, setSelected] = useState<Set<string>>(new Set());
  const [isDrawing, setDrawing] = useState(false);
  const [tierPrices, setTierPrices] = useState({ GENERAL: "10,000", VIP: "15,000" });
  const [schedule, setSchedule] = useState(0);

  const applyTool = (key: string) => {
    const state = grid[key];
    if (state === "sold") return; // 판매된 좌석은 편집 불가
    setGrid((prev) => {
      const next = { ...prev };
      if (activeTool === "erase")     next[key] = "available";
      else if (activeTool === "unavail") next[key] = "unavail";
      else if (activeTool === "vip")   next[key] = "vip";
      else                             next[key] = "available";
      return next;
    });
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(key)) s.delete(key); else s.add(key);
      return s;
    });
  };

  // 통계
  const cells = Object.values(grid);
  const totalSeats = cells.filter((s) => s !== "unavail").length;
  const vipCount   = cells.filter((s) => s === "vip").length;
  const soldCount  = cells.filter((s) => s === "sold").length;
  const genCount   = cells.filter((s) => s === "available").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* 페이지 헤더 */}
      <div style={{
        height: 52, background: "#fff", borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: "#9CA3AF", cursor: "pointer" }}>상품 관리 › 봄 정기공연</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 3l4 4-4 4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>좌석 레이아웃 편집기</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", gap: 18 }}>
        {/* 편집 영역 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {/* 회차 선택 */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 600 }}>회차:</span>
            {["1회차 05.10 19:00", "2회차 05.11 19:00"].map((s, i) => (
              <button
                key={i}
                onClick={() => setSchedule(i)}
                style={{
                  padding: "6px 14px", borderRadius: 20,
                  background: schedule === i ? "#4B5FFF" : "#fff",
                  color: schedule === i ? "#fff" : "#6B7280",
                  border: schedule === i ? "none" : "1px solid #E5E7EB",
                  fontSize: 12, fontWeight: schedule === i ? 700 : 500, cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {["행 추가", "열 추가"].map((label) => (
                <button key={label} style={{ padding: "6px 14px", borderRadius: 10, background: "#fff", border: "1px solid #E5E7EB", fontSize: 12, fontWeight: 600, color: "#6B7280", cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 그리드 */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(17,24,39,0.06)", padding: "20px", overflow: "auto" }}>
            {/* 스테이지 */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{
                background: "linear-gradient(180deg, rgba(17,24,39,0.8), rgba(17,24,39,0.47))",
                borderRadius: "4px 4px 32px 32px", width: 280, height: 24,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 3, textTransform: "uppercase" as const }}>STAGE</span>
              </div>
            </div>

            {/* 열 번호 */}
            <div style={{ display: "flex", gap: 4, marginLeft: 22, marginBottom: 4 }}>
              {Array.from({ length: COLS }, (_, ci) => (
                <span key={ci} style={{ width: 28, textAlign: "center", fontSize: 9, color: "#9CA3AF", fontFamily: "ui-monospace,monospace" }}>{ci + 1}</span>
              ))}
            </div>

            {/* 행 */}
            {Array.from({ length: ROWS }, (_, ri) => (
              <div key={ri} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                <span style={{ width: 18, textAlign: "right", fontSize: 10, color: "#9CA3AF", fontFamily: "ui-monospace,monospace", flexShrink: 0 }}>
                  {String.fromCharCode(65 + ri)}
                </span>
                {Array.from({ length: COLS }, (_, ci) => {
                  const key = `${ri}-${ci}`;
                  const state = grid[key] ?? "available";
                  const s = getCellStyle(state);
                  const isSel = selectedCells.has(key);
                  return (
                    <div
                      key={ci}
                      onMouseDown={() => { setDrawing(true); applyTool(key); }}
                      onMouseUp={() => setDrawing(false)}
                      onMouseEnter={() => isDrawing && applyTool(key)}
                      style={{
                        width: 28, height: 24, borderRadius: 5,
                        background: s.bg, border: isSel ? `2px solid #4B5FFF` : s.border,
                        cursor: s.cursor,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: isSel ? "0 0 0 2px rgba(75,95,255,0.25)" : "none",
                        transition: "all 0.08s", position: "relative" as const,
                        userSelect: "none" as const,
                      }}
                    >
                      {state === "sold" && (
                        <div style={{ width: 14, height: 1.5, background: "#9CA3AF", borderRadius: 1, transform: "rotate(45deg)" }} />
                      )}
                    </div>
                  );
                })}
                <span style={{ width: 18, textAlign: "left", paddingLeft: 4, fontSize: 10, color: "#9CA3AF", fontFamily: "ui-monospace,monospace", flexShrink: 0 }}>
                  {String.fromCharCode(65 + ri)}
                </span>
              </div>
            ))}

            {/* 범례 */}
            <div style={{ display: "flex", gap: 14, marginTop: 14, justifyContent: "center", flexWrap: "wrap" as const }}>
              {[
                { bg: "#4B5FFF22", border: "#4B5FFF88", label: "일반석" },
                { bg: "#F5670A33", border: "#F5670A",   label: "VIP" },
                { bg: "#E5E7EB",   border: "#9CA3AF",   label: "판매됨" },
                { bg: "transparent", border: "#D1D5DB", label: "비활성", dashed: true },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 14, height: 12, borderRadius: 3, background: l.bg, border: `1.5px ${l.dashed ? "dashed" : "solid"} ${l.border}` }} />
                  <span style={{ fontSize: 11, color: "#6B7280" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 선택 정보 */}
          {selectedCells.size > 0 && (
            <div style={{ background: "#EEF0FF", borderRadius: 12, padding: "12px 16px", border: "1px solid rgba(75,95,255,0.13)", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="#4B5FFF" strokeWidth="1.5"/>
                <path d="M8 7v5M8 5v1" stroke="#4B5FFF" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 12, color: "#4B5FFF", fontWeight: 600 }}>
                선택됨: {Array.from(selectedCells).slice(0, 6).join(", ")}{selectedCells.size > 6 ? ` 외 ${selectedCells.size - 6}석` : ""} ({selectedCells.size}석)
              </span>
            </div>
          )}
        </div>

        {/* 사이드 패널 */}
        <div style={{ width: 230, display: "flex", flexDirection: "column", gap: 14, flexShrink: 0 }}>
          {/* 도구 */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(17,24,39,0.06)", padding: "16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>편집 도구</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TOOLS.map((t) => {
                const active = activeTool === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTool(t.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 9, padding: "9px 12px",
                      borderRadius: 10,
                      border: `1.5px solid ${active ? t.color : "#E5E7EB"}`,
                      background: active ? t.color + "14" : "transparent",
                      cursor: "pointer", transition: "all 0.12s",
                    }}
                  >
                    <div style={{
                      width: 14, height: 14, borderRadius: 3, background: t.color, flexShrink: 0,
                      boxShadow: active ? `0 0 6px ${t.color}88` : "none",
                    }} />
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? t.color : "#374151" }}>{t.label}</span>
                    {active && <span style={{ marginLeft: "auto", fontSize: 10, color: t.color, fontWeight: 700 }}>선택</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 티어 가격 */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(17,24,39,0.06)", padding: "16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 12 }}>티어 가격</div>
            {([["GENERAL", "일반석 (GENERAL)"], ["VIP", "VIP"]] as const).map(([key, label]) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#6B7280", marginBottom: 4 }}>{label}</div>
                <div style={{ height: 38, border: "1.5px solid #E5E7EB", borderRadius: 9, display: "flex", alignItems: "center", padding: "0 12px", gap: 4 }}>
                  <span style={{ fontSize: 13, color: "#9CA3AF" }}>₩</span>
                  <input
                    value={tierPrices[key]}
                    onChange={(e) => setTierPrices((prev) => ({ ...prev, [key]: e.target.value }))}
                    style={{ border: "none", outline: "none", fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: "ui-monospace,monospace", width: "100%", background: "transparent" }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 좌석 현황 */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(17,24,39,0.06)", padding: "16px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 10 }}>좌석 현황</div>
            {[
              { label: "총 좌석",  val: `${totalSeats}석`, color: "#111827" },
              { label: "일반석",   val: `${genCount}석`,   color: "#4B5FFF" },
              { label: "VIP",      val: `${vipCount}석`,   color: "#F5670A" },
              { label: "판매됨",   val: `${soldCount}석`,  color: "#6B7280" },
              { label: "잔여",     val: `${totalSeats - soldCount}석`, color: "#16A34A" },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* 버튼 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button style={{ width: "100%", height: 44, background: "#4B5FFF", color: "#fff", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(75,95,255,0.3)" }}>
              저장하기
            </button>
            <button
              onClick={() => { setGrid(buildInitialGrid()); setSelected(new Set()); }}
              style={{ width: "100%", height: 44, background: "#fff", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
            >
              초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
