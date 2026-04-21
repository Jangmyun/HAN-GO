"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ordersApi } from "@/lib/api";
import { clearCart, getCart, getCartStoreId, getCartTotal, removeFromCart } from "@/lib/cart";
import type { CartItem } from "@/lib/types";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CartPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sid = getCartStoreId();
    setStoreId(sid);
    if (sid) setItems(getCart(sid));
  }, []);

  const total = items.reduce((s, i) => s + i.subtotal, 0);

  const handleRemove = (productId: string) => {
    if (!storeId) return;
    removeFromCart(storeId, productId);
    setItems(getCart(storeId));
  };

  const handleCheckout = async () => {
    if (!storeId || items.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const order = await ordersApi.create({
        store_id: storeId,
        items: items.map((item) => ({
          product_id: item.product_id,
          schedule_id: item.schedule_id,
          seat_keys: item.seat_keys,
          quantity: item.quantity,
          selected_options: item.selected_options,
        })),
      });
      clearCart();
      router.push(`/orders/${order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "주문 실패. 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold">장바구니</span>
      </header>

      <div className="p-4 space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">장바구니가 비어 있습니다.</p>
            <button onClick={() => router.push("/")} className="text-sm text-primary underline mt-2 block mx-auto">
              스토어 보러 가기
            </button>
          </div>
        ) : (
          <>
            {/* 상품 목록 */}
            <Card className="p-4 space-y-3">
              {items.map((item, i) => (
                <div key={`${item.product_id}-${i}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product_name}</p>
                      {item.seat_keys && (
                        <p className="text-xs text-muted-foreground">좌석: {item.seat_keys.join(", ")}</p>
                      )}
                      <p className="text-xs text-muted-foreground">수량: {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{item.subtotal.toLocaleString()}원</span>
                      <button onClick={() => handleRemove(item.product_id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {i < items.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </Card>

            {/* 주문 안내 */}
            <Card className="p-4 bg-primary/5 border-primary/20">
              <p className="text-xs text-muted-foreground font-medium mb-2">결제 안내</p>
              <p className="text-xs text-muted-foreground">
                주문 후 스토어의 계좌 또는 카카오페이로 직접 입금해주세요.
                입금자명에 <strong>주문 번호</strong>를 반드시 입력해주세요.
              </p>
            </Card>

            {/* 합계 */}
            <Card className="p-4">
              <div className="flex justify-between font-bold text-base">
                <span>합계</span>
                <span className="text-primary">{total.toLocaleString()}원</span>
              </div>
            </Card>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button className="w-full" size="lg" onClick={handleCheckout} disabled={submitting}>
              {submitting ? "주문 처리 중..." : "주문하기"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
