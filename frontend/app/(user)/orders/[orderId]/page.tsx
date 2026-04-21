"use client";

import StatusBadge from "@/components/hango/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import type { OrderResponse, OrderStatus } from "@/lib/types";
import { ChevronLeft, Copy } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TIMELINE: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "주문 접수" },
  { status: "payment_submitted", label: "입금 확인 중" },
  { status: "paid", label: "결제 완료" },
  { status: "preparing", label: "조리 중" },
  { status: "ready", label: "수령 대기" },
  { status: "completed", label: "수령 완료" },
];

const TERMINAL_STATUSES: OrderStatus[] = [
  "completed", "cancelled_by_user", "cancelled_by_store", "payment_rejected"
];

function PaymentGuide({ order, onSubmit }: { order: OrderResponse; onSubmit: () => void }) {
  const [method, setMethod] = useState<"KAKAOPAY_URL" | "BANK_TRANSFER">("BANK_TRANSFER");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await ordersApi.paymentSubmit(order.id, method);
      onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-4 space-y-4 border-primary/30">
      <h3 className="font-semibold text-sm">결제 안내</h3>
      <div className="bg-primary/5 rounded-lg p-3 text-center">
        <p className="text-xs text-muted-foreground">입금자명 (반드시 정확히 입력)</p>
        <p className="font-mono font-bold text-lg text-primary mt-1">{order.order_code}</p>
        <p className="text-xs text-muted-foreground mt-1">총 결제 금액</p>
        <p className="font-bold text-xl">{order.total_price.toLocaleString()}원</p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">결제 방법 선택</p>
        {["BANK_TRANSFER", "KAKAOPAY_URL"].map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m as typeof method)}
            className={`w-full p-3 rounded-lg border text-sm text-left transition-colors ${
              method === m ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            {m === "KAKAOPAY_URL" ? "💛 카카오페이로 송금" : "🏦 계좌이체"}
          </button>
        ))}
      </div>

      <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "처리 중..." : "입금했어요"}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        입금 확인은 최대 10분 소요될 수 있습니다
      </p>
    </Card>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrder = async () => {
    const o = await ordersApi.get(params.orderId);
    setOrder(o);
    if (TERMINAL_STATUSES.includes(o.status) && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    fetchOrder().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchOrder, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [params.orderId]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return <div className="p-4 text-center text-muted-foreground">주문을 찾을 수 없습니다.</div>;
  }

  const statusIdx = TIMELINE.findIndex((t) => t.status === order.status);

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold">주문 상세</span>
      </header>

      <div className="p-4 space-y-4">
        {/* 주문 헤더 */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono font-bold text-lg">{order.order_code}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(order.created_at).toLocaleString("ko-KR")}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(order.order_code)}
            className="flex items-center gap-1 text-xs text-muted-foreground mt-2 hover:text-primary"
          >
            <Copy className="w-3 h-3" />주문 번호 복사
          </button>
        </Card>

        {/* 타임라인 */}
        {!["cancelled_by_user", "cancelled_by_store", "payment_rejected"].includes(order.status) && (
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-3">진행 상황</h3>
            <div className="space-y-2">
              {TIMELINE.map((step, i) => {
                const done = statusIdx >= i;
                const current = statusIdx === i;
                return (
                  <div key={step.status} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      done ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={`text-sm ${current ? "font-semibold text-primary" : done ? "text-foreground" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                    {current && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">현재</span>}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 취소/거절 상태 */}
        {["cancelled_by_user", "cancelled_by_store", "payment_rejected"].includes(order.status) && (
          <Card className="p-4 border-destructive/30">
            <p className="font-semibold text-destructive text-sm">
              {order.status === "payment_rejected" ? "결제가 거절되었습니다" : "주문이 취소되었습니다"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">환불은 스토어 운영자에게 직접 문의해주세요.</p>
          </Card>
        )}

        {/* 결제 안내 */}
        {order.status === "pending" && (
          <PaymentGuide order={order} onSubmit={fetchOrder} />
        )}

        {/* 주문 상품 */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">주문 상품</h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  상품 ID: {item.product_id.slice(0, 8)}...
                  {item.seat_keys && ` (좌석: ${item.seat_keys.join(", ")})`}
                </span>
                <span className="font-medium">{item.subtotal.toLocaleString()}원</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>합계</span>
              <span>{order.total_price.toLocaleString()}원</span>
            </div>
          </div>
        </Card>

        {/* QR 티켓 보기 */}
        {order.status === "paid" && (
          <div className="text-center">
            <Link href={`/tickets/${order.items[0]?.id}`} className="text-sm text-primary underline">
              🎫 QR 티켓 보기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
