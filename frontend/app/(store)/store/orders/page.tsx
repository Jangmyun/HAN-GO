"use client";

import StatusBadge from "@/components/hango/StatusBadge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ordersApi } from "@/lib/api";
import type { OrderResponse, OrderStatus } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

const TABS: { label: string; statuses: OrderStatus[] | null }[] = [
  { label: "전체", statuses: null },
  { label: "결제 대기", statuses: ["payment_submitted"] },
  { label: "조리 중", statuses: ["paid", "preparing"] },
  { label: "준비 완료", statuses: ["ready"] },
];

function OrderRow({ order }: { order: OrderResponse }) {
  return (
    <Link href={`/store/orders/${order.id}`}>
      <Card className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
        order.status === "payment_submitted" ? "border-yellow-300 bg-yellow-50/50" : ""
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono font-semibold text-sm">{order.order_code}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(order.created_at).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs text-muted-foreground">{order.items.length}개 상품</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm">{order.total_price.toLocaleString()}원</p>
            <StatusBadge status={order.status} className="mt-1" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function StoreOrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.storeList().then(setOrders).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-xl">주문 관리</h1>
        <p className="text-sm text-muted-foreground mt-0.5">들어온 주문을 확인하고 처리합니다.</p>
      </div>

      <Tabs defaultValue="전체">
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.label} value={tab.label}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => {
          const filtered = tab.statuses
            ? orders.filter((o) => tab.statuses!.includes(o.status))
            : orders;
          return (
            <TabsContent key={tab.label} value={tab.label} className="mt-4 space-y-2">
              {loading ? (
                [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">주문이 없습니다.</p>
              ) : (
                filtered.map((o) => <OrderRow key={o.id} order={o} />)
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
