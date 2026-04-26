import type { PerformanceSchedule, SeatCell, SeatLayout } from "@/lib/types";

const UNAVAIL_KEYS = new Set(["0-3","0-4","0-5","0-6","5-0","5-1","6-0","6-1"]);
const SOLD_KEYS    = new Set(["1-2","1-3","2-5","2-6","3-7","3-8","4-4","4-5","4-6"]);
const VIP_KEYS     = new Set(["0-0","0-1","0-2","0-7","0-8","0-9"]);

function buildDefaultSeatLayout(): SeatLayout {
  const rows = 7, cols = 10;
  const cells: SeatCell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r}-${c}`;
      let status: SeatCell["status"] = "AVAILABLE";
      let tier = "GENERAL";
      if (UNAVAIL_KEYS.has(key)) { status = "UNAVAILABLE"; tier = "UNAVAILABLE"; }
      else if (SOLD_KEYS.has(key)) { status = "SOLD"; }
      else if (VIP_KEYS.has(key)) { status = "VIP"; tier = "VIP"; }
      cells.push({ row: r, col: c, status, tier });
    }
  }
  return { rows, cols, cells, tier_prices: { GENERAL: 10000, VIP: 20000 } };
}

let counter = 0;

export function resetScheduleCounter() {
  counter = 0;
}

export function createSchedule(
  params: { product_id: string } & Partial<PerformanceSchedule>
): PerformanceSchedule {
  return {
    id: params.id ?? `schedule-${++counter}`,
    product_id: params.product_id,
    datetime: params.datetime ?? "2026-05-10T10:00:00.000Z",
    venue: params.venue ?? "효암채플",
    seat_layout: params.seat_layout ?? buildDefaultSeatLayout(),
  };
}
