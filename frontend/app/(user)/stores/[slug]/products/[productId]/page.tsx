"use client";

import { productsApi, schedulesApi, storesApi } from "@/lib/api";
import { addToCart, clearCart } from "@/lib/cart";
import type { PerformanceSchedule, ProductResponse, SeatCell, StoreResponse } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function seatKey(row: number, col: number) {
  return `${String.fromCharCode(65 + row)}-${col + 1}`;
}

function formatDatetime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" }) +
    " " + d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}

// ── Step Indicator ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ["좌석선택", "주문확인", "결제"];
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "14px 24px", background: "#fff", borderBottom: "1px solid #E5E7EB" }}>
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                background: done ? "#16A34A" : active ? "#4B5FFF" : "#E5E7EB",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: active ? "0 2px 8px rgba(75,95,255,0.30)" : "none",
                transition: "all 0.2s",
              }}>
                {done ? (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 6.5l3 3 6-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? "#fff" : "#9CA3AF" }}>{i + 1}</span>
                )}
              </div>
              <span style={{ fontSize: 10, color: active ? "#4B5FFF" : done ? "#16A34A" : "#9CA3AF", fontWeight: active ? 700 : 500, whiteSpace: "nowrap" }}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2,
                background: done ? "#16A34A" : "#E5E7EB",
                marginBottom: 14, marginLeft: 4, marginRight: 4, borderRadius: 1,
                transition: "background 0.3s",
              }} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Seat Grid (PERFORMANCE) ────────────────────────────────────────────────────

function SeatPicker({
  schedule,
  selectedSeats,
  onToggle,
  onProceed,
}: {
  schedule: PerformanceSchedule;
  selectedSeats: string[];
  onToggle: (key: string) => void;
  onProceed: () => void;
}) {
  const { rows, cols, cells, tier_prices } = schedule.seat_layout;
  const cellMap: Record<string, SeatCell> = {};
  for (const c of cells) cellMap[`${c.row}-${c.col}`] = c;

  const totalPrice = selectedSeats.reduce((sum, sk) => {
    const [rowStr, colStr] = sk.split("-");
    const rowIdx = rowStr.charCodeAt(0) - 65;
    const colIdx = parseInt(colStr) - 1;
    const cell = cellMap[`${rowIdx}-${colIdx}`];
    return sum + (tier_prices[cell?.tier ?? "GENERAL"] ?? 0);
  }, 0);

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {/* Stage */}
        <div style={{ padding: "16px 16px 8px", display: "flex", justifyContent: "center" }}>
          <div style={{
            background: "linear-gradient(180deg, #111827CC, #11182788)",
            borderRadius: "4px 4px 40px 40px",
            width: 200, height: 28,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 3, textTransform: "uppercase" }}>STAGE</span>
          </div>
        </div>

        {/* Seat Grid */}
        <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          {Array.from({ length: rows }, (_, ri) => (
            <div key={ri} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, width: 14, textAlign: "right", flexShrink: 0, fontFamily: "ui-monospace,monospace" }}>
                {String.fromCharCode(65 + ri)}
              </span>
              {Array.from({ length: cols }, (_, ci) => {
                const gridKey = `${ri}-${ci}`;
                const cell = cellMap[gridKey];
                const sk = seatKey(ri, ci);
                const isSelected = selectedSeats.includes(sk);
                const isUnavail = cell?.status === "UNAVAILABLE";
                const isSold = cell?.status === "SOLD";
                const isVip = cell?.status === "VIP";

                if (isUnavail || !cell) {
                  return (
                    <div key={ci} style={{
                      width: 26, height: 22, borderRadius: 5,
                      background: "transparent",
                      border: "1.5px dashed #E5E7EB",
                    }} />
                  );
                }

                const bg = isSelected
                  ? "#F5670A"
                  : isSold ? "#D1D5DB"
                  : isVip ? "#F5670A44"
                  : "#4B5FFF55";
                const border = isSelected
                  ? "#F5670A"
                  : isSold ? "#9CA3AF"
                  : isVip ? "#F5670A"
                  : "#4B5FFF";

                return (
                  <div
                    key={ci}
                    onClick={() => !isSold && onToggle(sk)}
                    style={{
                      width: 26, height: 22, borderRadius: 5,
                      background: bg, border: `1.5px solid ${border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: isSold ? "default" : "pointer",
                      opacity: isSold ? 0.5 : 1,
                      transform: isSelected ? "scale(1.15)" : "scale(1)",
                      boxShadow: isSelected ? "0 2px 8px rgba(245,103,10,0.55)" : "none",
                      transition: "all 0.1s",
                      userSelect: "none",
                    }}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                );
              })}
              <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, width: 14, flexShrink: 0, fontFamily: "ui-monospace,monospace" }}>
                {String.fromCharCode(65 + ri)}
              </span>
            </div>
          ))}
          {/* Col numbers */}
          <div style={{ display: "flex", gap: 5, marginLeft: 19 }}>
            {Array.from({ length: cols }, (_, ci) => (
              <span key={ci} style={{ width: 26, textAlign: "center", fontSize: 9, color: "#6B7280", fontFamily: "ui-monospace,monospace" }}>{ci + 1}</span>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ padding: "0 20px 16px", display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {[
            { color: "#4B5FFF55", border: "#4B5FFF", label: "일반석" },
            { color: "#F5670A44", border: "#F5670A", label: "VIP" },
            { color: "#F5670A",   border: "#F5670A", label: "선택됨" },
            { color: "#D1D5DB",   border: "#9CA3AF", label: "매진" },
          ].map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 14, height: 12, borderRadius: 3, background: l.color, border: `1.5px solid ${l.border}` }} />
              <span style={{ fontSize: 11, color: "#6B7280" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 선택 요약 + CTA */}
      <div style={{
        background: "#fff", borderTop: "1px solid #E5E7EB",
        padding: "12px 16px 28px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>선택된 좌석</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {selectedSeats.length === 0 ? (
                <span style={{ fontSize: 13, color: "#9CA3AF" }}>좌석을 선택해주세요</span>
              ) : (
                selectedSeats.map((s) => (
                  <div key={s} style={{
                    background: "#FFF0E8", color: "#F5670A",
                    borderRadius: 7, padding: "4px 10px",
                    fontSize: 13, fontWeight: 700,
                  }}>{s}</div>
                ))
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#6B7280" }}>합계</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: -0.5 }}>
              ₩{totalPrice.toLocaleString()}
            </div>
          </div>
        </div>
        <button
          disabled={selectedSeats.length === 0}
          onClick={onProceed}
          style={{
            width: "100%", height: 54,
            background: selectedSeats.length === 0 ? "#E5E7EB" : "#4B5FFF",
            color: selectedSeats.length === 0 ? "#9CA3AF" : "#fff",
            border: "none", borderRadius: 14,
            fontSize: 15, fontWeight: 700,
            cursor: selectedSeats.length === 0 ? "default" : "pointer",
            boxShadow: selectedSeats.length === 0 ? "none" : "0 2px 8px rgba(75,95,255,0.30)",
            transition: "all 0.15s",
          }}
        >
          다음 — 주문 확인
        </button>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const params = useParams<{ slug: string; productId: string }>();
  const router = useRouter();

  const [store, setStore] = useState<StoreResponse | null>(null);
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [schedules, setSchedules] = useState<PerformanceSchedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<PerformanceSchedule | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    storesApi.getBySlug(params.slug).then(async (s) => {
      setStore(s);
      const p = await productsApi.get(s.id, params.productId);
      setProduct(p);
      if (p.type === "PERFORMANCE") {
        const scheds = await schedulesApi.list(s.id, p.id);
        setSchedules(scheds);
        if (scheds.length > 0) setSelectedSchedule(scheds[0]);
      }
    }).catch(() => setError("상품 정보를 불러올 수 없습니다.")).finally(() => setLoading(false));
  }, [params.slug, params.productId]);

  const handleSeatToggle = (sk: string) => {
    setSelectedSeats((prev) =>
      prev.includes(sk) ? prev.filter((k) => k !== sk) : [...prev, sk]
    );
  };

  const handleProceedToCart = () => {
    if (!store || !product || selectedSeats.length === 0) return;
    setError("");

    const tierPrices = selectedSchedule?.seat_layout.tier_prices ?? {};
    const cells = selectedSchedule?.seat_layout.cells ?? [];
    const cellMap: Record<string, { tier: string }> = {};
    for (const c of cells) cellMap[`${c.row}-${c.col}`] = c;

    const totalSubtotal = selectedSeats.reduce((sum, sk) => {
      const [rowStr, colStr] = sk.split("-");
      const rowIdx = rowStr.charCodeAt(0) - 65;
      const colIdx = parseInt(colStr) - 1;
      const cell = cellMap[`${rowIdx}-${colIdx}`];
      return sum + (tierPrices[cell?.tier ?? "GENERAL"] ?? product.base_price);
    }, 0);

    const result = addToCart(store.id, {
      product_id: product.id,
      product_name: product.name,
      schedule_id: selectedSchedule?.id,
      seat_keys: selectedSeats,
      quantity: selectedSeats.length,
      selected_options: {},
      unit_price: totalSubtotal / selectedSeats.length,
      subtotal: totalSubtotal,
    });

    if (result === "store_mismatch") {
      if (confirm("다른 스토어의 상품이 장바구니에 있습니다. 장바구니를 초기화할까요?")) {
        clearCart();
        addToCart(store.id, {
          product_id: product.id,
          product_name: product.name,
          schedule_id: selectedSchedule?.id,
          seat_keys: selectedSeats,
          quantity: selectedSeats.length,
          selected_options: {},
          unit_price: totalSubtotal / selectedSeats.length,
          subtotal: totalSubtotal,
        });
      } else return;
    }
    router.push("/cart");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "#F9FAFB" }}>
        <div style={{ height: 52, background: "#fff", borderBottom: "1px solid #E5E7EB" }} />
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {[140, 60, 240, 80].map((h, i) => (
            <div key={i} style={{ height: h, background: "#E5E7EB", borderRadius: 16, opacity: 0.5 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !store || !product) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#6B7280", fontSize: 14 }}>
        {error || "상품을 찾을 수 없습니다."}
      </div>
    );
  }

  // ── PERFORMANCE 좌석 선택 화면 ─────────────────────────────────────────────
  if (product.type === "PERFORMANCE") {
    return (
      <div style={{ display: "flex", flexDirection: "column", background: "#F9FAFB", minHeight: "100%", height: "100%" }}>
        {/* AppBar */}
        <div style={{
          height: 52, background: "#fff",
          display: "flex", alignItems: "center", padding: "0 8px 0 4px",
          borderBottom: "1px solid #E5E7EB",
          position: "sticky", top: 0, zIndex: 40, gap: 4,
        }}>
          <button
            onClick={() => router.back()}
            style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", borderRadius: 10 }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M14 4L7 11l7 7" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>좌석 선택</span>
        </div>

        {/* Step indicator */}
        <StepIndicator current={0} />

        {/* 공연 정보 */}
        <div style={{
          background: "#fff", padding: "12px 16px 14px",
          borderBottom: "1px solid #E5E7EB", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", letterSpacing: -0.4 }}>
                {product.name}
              </div>
              {selectedSchedule && (
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 3 }}>
                  {formatDatetime(selectedSchedule.datetime)}{selectedSchedule.venue ? ` · ${selectedSchedule.venue}` : ""}
                </div>
              )}
            </div>
            <div style={{
              background: "#EEF0FF", color: "#4B5FFF",
              borderRadius: 8, padding: "4px 10px",
              fontSize: 11, fontWeight: 700,
            }}>
              GENERAL ₩{(selectedSchedule?.seat_layout.tier_prices.GENERAL ?? product.base_price).toLocaleString()}
            </div>
          </div>

          {/* 회차 선택 (여러 일정일 때) */}
          {schedules.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto", scrollbarWidth: "none" }}>
              {schedules.map((s, i) => {
                const active = selectedSchedule?.id === s.id;
                const d = new Date(s.datetime);
                return (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSchedule(s); setSelectedSeats([]); }}
                    style={{
                      flexShrink: 0, padding: "7px 14px", borderRadius: 10,
                      background: active ? "#4B5FFF" : "#fff",
                      color: active ? "#fff" : "#6B7280",
                      border: active ? "none" : "1px solid #E5E7EB",
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      boxShadow: active ? "0 2px 8px rgba(75,95,255,0.30)" : "none",
                      userSelect: "none",
                    }}
                  >
                    {i + 1}회차 {d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Seat grid + summary */}
        {selectedSchedule ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
            <SeatPicker
              schedule={selectedSchedule}
              selectedSeats={selectedSeats}
              onToggle={handleSeatToggle}
              onProceed={handleProceedToCart}
            />
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontSize: 14 }}>
            공연 일정을 불러오는 중입니다.
          </div>
        )}
      </div>
    );
  }

  // ── FOOD / MERCH 상품 상세 ─────────────────────────────────────────────────
  return <FoodProductDetail store={store} product={product} router={router} />;
}

// ── FOOD/MERCH 상세 컴포넌트 ───────────────────────────────────────────────────
function FoodProductDetail({
  store,
  product,
  router,
}: {
  store: StoreResponse;
  product: ProductResponse;
  router: ReturnType<typeof useRouter>;
}) {
  // 옵션 상태 (select → 선택값 string, boolean → "true"/"false")
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of product.option_schema) {
      if (f.type === "select" && f.values && f.values.length > 0) init[f.key] = f.values[0];
      if (f.type === "boolean") init[f.key] = "false";
    }
    return init;
  });
  const [qty, setQty] = useState(1);
  const [cartError, setCartError] = useState("");

  const selectFields = product.option_schema.filter((f) => f.type === "select");
  const boolFields   = product.option_schema.filter((f) => f.type === "boolean");

  const extraTotal = product.option_schema.reduce((sum, f) => {
    if (f.type === "boolean" && selectedOptions[f.key] === "true") return sum + f.price_delta;
    return sum;
  }, 0);
  const unitPrice = product.base_price + extraTotal;
  const total     = unitPrice * qty;

  const handleAddToCart = () => {
    setCartError("");
    const result = addToCart(store.id, {
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      selected_options: selectedOptions,
      unit_price: unitPrice,
      subtotal: total,
    });
    if (result === "store_mismatch") {
      if (confirm("다른 스토어의 상품이 장바구니에 있습니다. 초기화할까요?")) {
        clearCart();
        addToCart(store.id, {
          product_id: product.id,
          product_name: product.name,
          quantity: qty,
          selected_options: selectedOptions,
          unit_price: unitPrice,
          subtotal: total,
        });
      } else return;
    }
    router.push("/cart");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#F9FAFB", minHeight: "100%", height: "100%" }}>
      {/* AppBar */}
      <div style={{
        height: 52, background: "#fff",
        display: "flex", alignItems: "center", padding: "0 8px 0 4px",
        borderBottom: "1px solid #E5E7EB",
        position: "sticky", top: 0, zIndex: 40, gap: 4,
      }}>
        <button
          onClick={() => router.back()}
          style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", cursor: "pointer", borderRadius: 10 }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 4L7 11l7 7" stroke="#111827" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>{product.name}</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* 상품 이미지 플레이스홀더 */}
        <div style={{
          height: 200, background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect x="4" y="16" width="48" height="30" rx="4" stroke="#C2410C" strokeWidth="2" fill="#FFF7ED"/>
            <path d="M12 24h32M12 32h20" stroke="#C2410C" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        {/* 상품명 + 기본 정보 */}
        <div style={{ padding: "18px 18px 14px", background: "#fff", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", letterSpacing: -0.6, lineHeight: 1.2 }}>{product.name}</div>
              {product.description && (
                <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4, lineHeight: 1.6 }}>{product.description}</div>
              )}
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: -0.8 }}>₩{product.base_price.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>기본가</div>
            </div>
          </div>
          {product.stock !== undefined && product.stock_mode === "tracked" && (
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" as const }}>
              <span style={{ fontSize: 11, color: product.stock > 10 ? "#16A34A" : "#DC2626", background: product.stock > 10 ? "#F0FDF4" : "#FEF2F2", borderRadius: 20, padding: "3px 10px", fontWeight: 600, border: `1px solid ${product.stock > 10 ? "#BBF7D0" : "#FECACA"}` }}>
                재고 잔여 {product.stock}
              </span>
            </div>
          )}
        </div>

        {/* Select 옵션들 */}
        {selectFields.map((field) => (
          <div key={field.key} style={{ padding: "16px 18px 14px", background: "#fff", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{field.label}</span>
              {field.required && <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 600 }}>필수 선택</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {(field.values ?? []).map((opt) => {
                const active = selectedOptions[field.key] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setSelectedOptions((prev) => ({ ...prev, [field.key]: opt }))}
                    style={{
                      padding: "11px 14px", borderRadius: 12,
                      border: `1.5px solid ${active ? "#4B5FFF" : "#E5E7EB"}`,
                      background: active ? "#EEF0FF" : "transparent",
                      display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                      transition: "all 0.12s", userSelect: "none" as const,
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 8,
                      border: `2px solid ${active ? "#4B5FFF" : "#D1D5DB"}`,
                      background: active ? "#4B5FFF" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      {active && <div style={{ width: 6, height: 6, borderRadius: 3, background: "#fff" }} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#4B5FFF" : "#374151" }}>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Boolean 옵션들 (추가 선택) */}
        {boolFields.length > 0 && (
          <div style={{ padding: "16px 18px 14px", background: "#fff", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>추가 선택</span>
              <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 8 }}>선택 사항</span>
            </div>
            {boolFields.map((field) => {
              const checked = selectedOptions[field.key] === "true";
              return (
                <div
                  key={field.key}
                  onClick={() => setSelectedOptions((prev) => ({ ...prev, [field.key]: checked ? "false" : "true" }))}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${checked ? "#4B5FFF" : "#E5E7EB"}`,
                    background: checked ? "#EEF0FF44" : "transparent",
                    marginBottom: 8, cursor: "pointer", transition: "all 0.12s",
                    userSelect: "none" as const,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: checked ? 700 : 500, color: checked ? "#111827" : "#374151" }}>{field.label}</div>
                  </div>
                  {field.price_delta > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#4B5FFF" }}>+₩{field.price_delta.toLocaleString()}</span>
                  )}
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: checked ? "#4B5FFF" : "#F9FAFB",
                    border: `1.5px solid ${checked ? "#4B5FFF" : "#E5E7EB"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {checked && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l2.5 2.5 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 수량 */}
        <div style={{ padding: "14px 18px 20px", background: "#fff" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>수량</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10 }}>
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              style={{ width: 38, height: 38, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10" stroke="#111827" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#111827", minWidth: 28, textAlign: "center" }}>{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              style={{ width: 38, height: 38, borderRadius: 12, border: "1.5px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="#111827" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>합계</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#111827", letterSpacing: -0.5 }}>₩{total.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {cartError && (
          <div style={{ margin: "0 18px 16px", fontSize: 13, color: "#DC2626", background: "#FEE2E2", borderRadius: 10, padding: "12px 16px" }}>
            {cartError}
          </div>
        )}
        <div style={{ height: 8 }} />
      </div>

      {/* 하단 CTA */}
      <div style={{ padding: "12px 18px 32px", borderTop: "1px solid #E5E7EB", background: "#fff", flexShrink: 0, display: "flex", gap: 10 }}>
        <button
          onClick={() => {
            setCartError("");
            const result = addToCart(store.id, {
              product_id: product.id,
              product_name: product.name,
              quantity: qty,
              selected_options: selectedOptions,
              unit_price: unitPrice,
              subtotal: total,
            });
            if (result === "store_mismatch") {
              if (confirm("다른 스토어의 상품이 장바구니에 있습니다. 초기화할까요?")) {
                clearCart();
                addToCart(store.id, {
                  product_id: product.id,
                  product_name: product.name,
                  quantity: qty,
                  selected_options: selectedOptions,
                  unit_price: unitPrice,
                  subtotal: total,
                });
              } else return;
            }
          }}
          style={{ width: 48, height: 50, borderRadius: 14, border: "1.5px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M3 6h16l-1.5 9H4.5L3 6z" stroke="#111827" strokeWidth="1.6" strokeLinejoin="round"/>
            <circle cx="8" cy="18" r="1.5" fill="#111827"/>
            <circle cx="15" cy="18" r="1.5" fill="#111827"/>
          </svg>
        </button>
        <button
          onClick={handleAddToCart}
          style={{
            flex: 1, height: 50, background: "#4B5FFF", color: "#fff",
            border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 2px 8px rgba(75,95,255,0.30)",
          }}
        >
          담기 — ₩{total.toLocaleString()}
        </button>
      </div>
    </div>
  );
}
