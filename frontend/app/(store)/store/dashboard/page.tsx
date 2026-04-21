"use client";

import StatusBadge from "@/components/hango/StatusBadge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import type { OrderResponse } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-bold text-2xl mt-1">{value}</p>
    </Card>
  );
}

export default function StoreDashboard() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.storeList().then(setOrders).finally(() => setLoading(false));
  }, []);

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const pendingPayment = orders.filter((o) => o.status === "payment_submitted").length;
  const todayRevenue = orders
    .filter((o) => new Date(o.created_at).toDateString() === today && o.status !== "cancelled_by_user" && o.status !== "cancelled_by_store")
    .reduce((s, o) => s + o.total_price, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-xl">대시보드</h1>
        <p className="text-sm text-muted-foreground mt-0.5">오늘의 주문 현황</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          <>
            <StatCard label="오늘 주문" value={todayOrders.length} />
            <StatCard label="결제 대기" value={pendingPayment} />
            <StatCard label="오늘 매출" value={`${todayRevenue.toLocaleString()}원`} />
          </>
        )}
      </div>

      {/* 최근 주문 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">최근 주문</h2>
          <Link href="/store/orders" className="text-xs text-primary">전체 보기</Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">주문이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => (
              <Link key={order.id} href={`/store/orders/${order.id}`}>
                <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm font-semibold">{order.order_code}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{order.total_price.toLocaleString()}원</span>
                    <StatusBadge status={order.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
