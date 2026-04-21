"use client";

import OrderCard from "@/components/hango/OrderCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import type { OrderResponse } from "@/lib/types";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/auth"); return; }
    ordersApi.list().then(setOrders).finally(() => setLoading(false));
  }, [router]);

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold">주문 내역</span>
      </header>

      <div className="p-4 space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">주문 내역이 없습니다.</p>
            <Link href="/" className="text-sm text-primary underline mt-2 block">스토어 보러 가기</Link>
          </div>
        ) : (
          orders.map((o) => <OrderCard key={o.id} order={o} />)
        )}
      </div>

      <div className="px-4 pb-4 text-center">
        <Link href="/orders/guest" className="text-sm text-muted-foreground underline">
          비회원 주문 조회
        </Link>
      </div>
    </div>
  );
}
