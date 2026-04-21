"use client";

import SeatGrid from "@/components/hango/SeatGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productsApi } from "@/lib/api";
import { getStoreId } from "@/lib/auth";
import type { ProductType, SeatLayout, StockMode } from "@/lib/types";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEFAULT_LAYOUT: SeatLayout = {
  rows: 5,
  cols: 8,
  cells: Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => ({
      row: r, col: c,
      label: `${String.fromCharCode(65 + r)}${c + 1}`,
      status: "AVAILABLE" as const,
      tier: "GENERAL",
    }))
  ).flat(),
  tier_prices: { GENERAL: 0 },
};

export default function NewProductPage() {
  const router = useRouter();
  const storeId = getStoreId();

  const [type, setType] = useState<ProductType | "">("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stockMode, setStockMode] = useState<StockMode>("unlimited");
  const [stock, setStock] = useState("");
  const [seatLayout, setSeatLayout] = useState<SeatLayout>(DEFAULT_LAYOUT);
  const [scheduleDate, setScheduleDate] = useState("");
  const [venue, setVenue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSeatToggle = (key: string) => {
    setSeatLayout((prev) => ({
      ...prev,
      cells: prev.cells.map((c) => {
        const k = `${c.row}-${c.col}`;
        if (k !== key) return c;
        const cycle: SeatCell["status"][] = ["AVAILABLE", "VIP", "UNAVAILABLE"];
        const next = cycle[(cycle.indexOf(c.status) + 1) % cycle.length];
        return { ...c, status: next };
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !type) return;
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        type,
        name,
        description: description || undefined,
        base_price: Number(basePrice),
        stock_mode: stockMode,
        stock: stockMode === "tracked" ? Number(stock) : undefined,
      };
      if (type === "PERFORMANCE" && scheduleDate) {
        body.schedules = [{
          datetime: new Date(scheduleDate).toISOString(),
          venue: venue || undefined,
          seat_layout: seatLayout,
        }];
      }
      await productsApi.create(storeId, body);
      router.push("/store/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "상품 등록 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-xl">상품 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 타입 선택 */}
        <div className="space-y-1.5">
          <Label>상품 유형 *</Label>
          <div className="grid grid-cols-3 gap-3">
            {(["FOOD", "PERFORMANCE", "MERCH"] as ProductType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                  type === t ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
                }`}
              >
                {t === "FOOD" ? "🍔 푸드" : t === "PERFORMANCE" ? "🎵 공연" : "🛍 굿즈"}
              </button>
            ))}
          </div>
        </div>

        {type && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="name">상품명 *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">설명</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">기본 가격 (원) *</Label>
              <Input id="price" type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
            </div>

            {type !== "PERFORMANCE" && (
              <div className="space-y-1.5">
                <Label>재고 관리</Label>
                <Select value={stockMode} onValueChange={(v) => setStockMode(v as StockMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">무제한</SelectItem>
                    <SelectItem value="tracked">수량 관리</SelectItem>
                    <SelectItem value="manual_sold_out">수동 품절</SelectItem>
                  </SelectContent>
                </Select>
                {stockMode === "tracked" && (
                  <Input type="number" min={0} placeholder="재고 수량" value={stock} onChange={(e) => setStock(e.target.value)} />
                )}
              </div>
            )}

            {type === "PERFORMANCE" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="scheduleDate">공연 일시 *</Label>
                  <Input id="scheduleDate" type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="venue">공연 장소</Label>
                  <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="예: 효암채플" />
                </div>
                <div>
                  <Label className="mb-2 block">좌석 배치 편집</Label>
                  <p className="text-xs text-muted-foreground mb-3">좌석을 클릭하면 일반→VIP→사용불가 순서로 변경됩니다.</p>
                  <SeatGrid
                    layout={seatLayout}
                    selectedSeats={[]}
                    onSeatToggle={handleSeatToggle}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
          <Button type="submit" disabled={!type || loading}>
            {loading ? "등록 중..." : "상품 등록"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// SeatCell 타입을 로컬에서 사용
type SeatCell = { row: number; col: number; label?: string; status: "AVAILABLE" | "UNAVAILABLE" | "VIP" | "SOLD"; tier: string };
