"use client";

import type { SeatCell, SeatLayout } from "@/lib/types";

interface Props {
  layout: SeatLayout;
  selectedSeats: string[];
  onSeatToggle: (key: string) => void;
  readonly?: boolean;
}

const SEAT_STYLES: Record<SeatCell["status"], string> = {
  AVAILABLE: "bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white cursor-pointer",
  VIP:       "bg-yellow-50 border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-400 hover:text-white cursor-pointer",
  SOLD:      "bg-gray-100 border border-gray-300 text-gray-400 cursor-not-allowed",
  UNAVAILABLE: "bg-gray-50 border border-dashed border-gray-200 text-gray-200 cursor-not-allowed",
};

const SELECTED_STYLE = "bg-primary text-white border-2 border-primary";
const SELECTED_VIP_STYLE = "bg-yellow-400 text-white border-2 border-yellow-400";

export default function SeatGrid({ layout, selectedSeats, onSeatToggle, readonly = false }: Props) {
  const cellMap: Record<string, SeatCell> = {};
  for (const cell of layout.cells) {
    cellMap[`${cell.row}-${cell.col}`] = cell;
  }

  return (
    <div>
      {/* 스크린 표시 */}
      <div className="mb-4 text-center">
        <div className="h-1.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full mx-8" />
        <p className="text-xs text-muted-foreground mt-1">STAGE</p>
      </div>

      {/* 좌석 그리드 */}
      <div
        className="grid gap-1.5 justify-center"
        style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: layout.rows }, (_, r) =>
          Array.from({ length: layout.cols }, (_, c) => {
            const key = `${r}-${c}`;
            const cell = cellMap[key];
            if (!cell) return <div key={key} className="w-8 h-8" />;

            const isSelected = selectedSeats.includes(key);
            const isVip = cell.status === "VIP";
            const isAvailable = cell.status === "AVAILABLE" || cell.status === "VIP";

            let style = SEAT_STYLES[cell.status];
            if (isSelected) style = isVip ? SELECTED_VIP_STYLE : SELECTED_STYLE;

            return (
              <button
                key={key}
                disabled={!isAvailable || readonly}
                onClick={() => isAvailable && !readonly && onSeatToggle(key)}
                title={`${cell.label || key}${isVip ? " (VIP)" : ""}`}
                className={`w-8 h-8 rounded text-[10px] font-medium transition-colors flex items-center justify-center ${style}`}
              >
                {cell.label?.replace(/^[A-Z]/, "") || c + 1}
              </button>
            );
          })
        )}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center text-xs">
        {[
          { style: "bg-white border-2 border-primary", label: "일반" },
          { style: "bg-yellow-50 border-2 border-yellow-400", label: "VIP" },
          { style: "bg-primary border-2 border-primary", label: "선택됨" },
          { style: "bg-gray-100 border border-gray-300", label: "매진" },
          { style: "bg-gray-50 border border-dashed border-gray-200", label: "불가" },
        ].map(({ style, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded ${style}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* 선택 요약 */}
      {selectedSeats.length > 0 && (
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm font-medium text-primary">
            선택된 좌석: {selectedSeats.map((k) => cellMap[k]?.label || k).join(", ")}
          </p>
          {Object.keys(layout.tier_prices).length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              합계:{" "}
              {selectedSeats
                .reduce((sum, k) => {
                  const cell = cellMap[k];
                  return sum + (layout.tier_prices[cell?.tier || "GENERAL"] ?? 0);
                }, 0)
                .toLocaleString()}
              원
            </p>
          )}
        </div>
      )}
    </div>
  );
}
