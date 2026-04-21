"use client";

import OrderCard from "@/components/hango/OrderCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api";
import { clearToken, getRole, isAuthenticated } from "@/lib/auth";
import type { OrderResponse } from "@/lib/types";
import { LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MyPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const authenticated = isAuthenticated();
  const role = getRole();

  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    ordersApi.list().then(setOrders).finally(() => setLoading(false));
  }, [authenticated]);

  return (
    <div>
      {/* 앱바 */}
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3">
        <p className="font-bold text-base">마이페이지</p>
      </header>

      {/* 프로필 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-7 h-7 text-primary/60" />
          </div>
          <div>
            {authenticated ? (
              <>
                <p className="font-semibold">
                  {role === "guest" ? "비회원" : "카카오 회원"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {role === "guest" ? "비회원으로 이용 중" : "카카오 계정으로 로그인됨"}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">로그인이 필요합니다</p>
            )}
          </div>
        </div>
        {authenticated ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => { clearToken(); window.location.href = "/auth"; }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        ) : (
          <Link href="/auth">
            <Button className="mt-3 w-full" size="sm">
              <LogIn className="w-4 h-4 mr-2" />
              로그인 / 시작하기
            </Button>
          </Link>
        )}
      </div>

      {/* 주문 내역 */}
      <div className="p-4">
        <h2 className="font-semibold text-sm mb-3">최근 주문 내역</h2>
        {!authenticated ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground">로그인 후 주문 내역을 확인할 수 있습니다.</p>
            <Link href="/orders/guest" className="text-sm text-primary underline">
              비회원 주문 조회
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">주문 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        )}
      </div>
    </div>
  );
}
