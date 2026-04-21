"use client";

import StatusBadge from "@/components/hango/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import type { OrderResponse } from "@/lib/types";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StoreOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");

  const fetchOrder = () => ordersApi.get(params.orderId).then(setOrder).finally(() => setLoading(false));

  useEffect(() => { fetchOrder(); }, [params.orderId]);

  const doAction = async (action: string, fn: () => Promise<OrderResponse>) => {
    setActionLoading(action);
    try {
      const updated = await fn();
      setOrder(updated);
    } finally {
      setActionLoading("");
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-1/2" />{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (!order) return <p className="text-muted-foreground">주문을 찾을 수 없습니다.</p>;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-xl">주문 상세</h1>
      </div>

      {/* 주문 헤더 */}
      <Card className="p-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono font-bold text-lg">{order.order_code}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleString("ko-KR")}</p>
          {order.guest_phone && <p className="text-xs text-muted-foreground mt-0.5">연락처: {order.guest_phone}</p>}
        </div>
        <StatusBadge status={order.status} />
      </Card>

      {/* 결제 확인/거부 버튼 */}
      {order.status === "payment_submitted" && (
        <Card className="p-4 space-y-3 border-yellow-300 bg-yellow-50/50">
          <p className="font-semibold text-sm">결제 확인이 필요합니다</p>
          <p className="text-xs text-muted-foreground">
            입금자명 <strong className="text-yellow-700">{order.order_code}</strong>으로 {order.total_price.toLocaleString()}원 입금을 확인해주세요.
          </p>
          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => doAction("confirm", () => ordersApi.paymentConfirm(order.id))}
              disabled={!!actionLoading}
            >
              {actionLoading === "confirm" ? "처리 중..." : "✓ 결제 확인"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-destructive text-destructive hover:bg-destructive/5"
              onClick={() => doAction("reject", () => ordersApi.paymentReject(order.id))}
              disabled={!!actionLoading}
            >
              {actionLoading === "reject" ? "처리 중..." : "✗ 미입금"}
            </Button>
          </div>
        </Card>
      )}

      {/* 상태 전환 버튼 */}
      <Card className="p-4 space-y-3">
        <p className="font-semibold text-sm">상태 변경</p>
        <div className="flex flex-wrap gap-2">
          {order.status === "paid" && (
            <Button size="sm" variant="outline" onClick={() => doAction("prepare", () => ordersApi.prepare(order.id))} disabled={!!actionLoading}>
              조리 시작
            </Button>
          )}
          {order.status === "preparing" && (
            <Button size="sm" variant="outline" onClick={() => doAction("ready", () => ordersApi.ready(order.id))} disabled={!!actionLoading}>
              준비 완료
            </Button>
          )}
          {order.status === "ready" && (
            <Button size="sm" onClick={() => doAction("complete", () => ordersApi.complete(order.id))} disabled={!!actionLoading}>
              수령 확인
            </Button>
          )}
          {order.status === "cancellation_requested" && (
            <Button size="sm" variant="destructive" onClick={() => doAction("cancelApprove", () => ordersApi.cancelApprove(order.id))} disabled={!!actionLoading}>
              취소 승인
            </Button>
          )}
          {!["completed", "cancelled_by_user", "cancelled_by_store", "payment_rejected"].includes(order.status) && (
            <p className="text-xs text-muted-foreground self-center">
              현재 상태: <strong>{order.status}</strong>
            </p>
          )}
        </div>
      </Card>

      {/* 주문 상품 */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3">주문 상품</h3>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                상품 ×{item.quantity}
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
    </div>
  );
}
