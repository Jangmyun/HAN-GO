"use client";

import SeatGrid from "@/components/hango/SeatGrid";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { productsApi, storesApi } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import type { PerformanceSchedule, ProductResponse, StoreResponse } from "@/lib/types";
import { ChevronLeft, ShoppingCart } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string; productId: string }>();
  const router = useRouter();
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [schedules, setSchedules] = useState<PerformanceSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<PerformanceSchedule | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    storesApi.getBySlug(params.slug).then(async (s) => {
      setStore(s);
      const p = await productsApi.get(s.id, params.productId);
      setProduct(p);
      // PERFORMANCE: 스케줄 목록은 별도 API 미지원 (MVP) — 상품에 embed 안됨
      // 실제로는 GET /stores/{id}/products/{id}/schedules 가 필요하나 MVP에서는 생략
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.slug, params.productId]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    );
  }

  if (!store || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        상품을 찾을 수 없습니다.
      </div>
    );
  }

  const handleAddToCart = () => {
    setError("");
    const totalDelta = product.option_schema
      .filter((f) => selectedOptions[f.key] !== undefined)
      .reduce((sum, f) => sum + f.price_delta, 0);
    const unitPrice = product.base_price + totalDelta;

    const qty = product.type === "PERFORMANCE" ? selectedSeats.length : quantity;
    if (product.type === "PERFORMANCE" && selectedSeats.length === 0) {
      setError("좌석을 선택해주세요.");
      return;
    }

    const result = addToCart(store.id, {
      product_id: product.id,
      product_name: product.name,
      schedule_id: selectedSchedule?.id,
      seat_keys: product.type === "PERFORMANCE" ? selectedSeats : undefined,
      quantity: qty,
      selected_options: selectedOptions,
      unit_price: unitPrice,
      subtotal: unitPrice * qty,
    });

    if (result === "store_mismatch") {
      if (confirm("다른 스토어의 상품이 장바구니에 있습니다. 장바구니를 초기화하고 이 상품을 추가할까요?")) {
        const { clearCart } = require("@/lib/cart");
        clearCart();
        addToCart(store.id, {
          product_id: product.id,
          product_name: product.name,
          schedule_id: selectedSchedule?.id,
          seat_keys: product.type === "PERFORMANCE" ? selectedSeats : undefined,
          quantity: qty,
          selected_options: selectedOptions,
          unit_price: unitPrice,
          subtotal: unitPrice * qty,
        });
      } else {
        return;
      }
    }
    router.push("/cart");
  };

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold truncate">{product.name}</span>
      </header>

      <div className="p-4 space-y-5">
        {/* 상품 정보 */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-bold text-xl">{product.name}</h1>
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
          )}
          <p className="font-bold text-primary text-xl mt-2">
            {product.base_price.toLocaleString()}원~
          </p>
        </div>

        {/* FOOD 옵션 */}
        {product.type === "FOOD" && product.option_schema.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">옵션 선택</h3>
            {product.option_schema.map((field) => (
              <div key={field.key}>
                <Label className="text-sm">{field.label}{field.required && " *"}</Label>
                {field.type === "select" && (
                  <Select onValueChange={(v) => setSelectedOptions((o) => ({ ...o, [field.key]: v }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.values?.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {field.type === "boolean" && (
                  <div className="flex gap-2 mt-1">
                    {["없음", "추가"].map((label, i) => (
                      <button
                        key={label}
                        onClick={() => setSelectedOptions((o) => ({ ...o, [field.key]: i === 1 }))}
                        className={`flex-1 py-2 rounded-lg text-sm border transition-colors ${
                          selectedOptions[field.key] === (i === 1)
                            ? "bg-primary text-white border-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {label}{i === 1 && field.price_delta > 0 ? ` (+${field.price_delta.toLocaleString()}원)` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* 수량 */}
            <div>
              <Label className="text-sm">수량</Label>
              <div className="flex items-center gap-3 mt-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-sm"
                >−</button>
                <span className="font-semibold w-6 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-sm"
                >+</button>
              </div>
            </div>
          </div>
        )}

        {/* PERFORMANCE 좌석 선택 */}
        {product.type === "PERFORMANCE" && (
          <div className="space-y-3">
            {schedules.length > 0 ? (
              <>
                <h3 className="font-semibold text-sm">일정 선택</h3>
                <div className="grid grid-cols-2 gap-2">
                  {schedules.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSchedule(s); setSelectedSeats([]); }}
                      className={`p-3 rounded-xl border text-left text-sm transition-colors ${
                        selectedSchedule?.id === s.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {new Date(s.datetime).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {s.venue && <p className="text-xs text-muted-foreground">{s.venue}</p>}
                    </button>
                  ))}
                </div>
                {selectedSchedule && (
                  <SeatGrid
                    layout={selectedSchedule.seat_layout}
                    selectedSeats={selectedSeats}
                    onSeatToggle={(key) =>
                      setSelectedSeats((prev) =>
                        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
                      )
                    }
                  />
                )}
              </>
            ) : (
              <div className="p-4 bg-muted rounded-xl text-center text-sm text-muted-foreground">
                공연 일정 정보를 불러오는 중입니다.
                <br />
                스토어에 문의해주세요.
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* 하단 CTA */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border max-w-[430px] mx-auto">
        <Button className="w-full" onClick={handleAddToCart}>
          <ShoppingCart className="w-4 h-4 mr-2" />
          장바구니 담기
        </Button>
      </div>
    </div>
  );
}
