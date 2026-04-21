"use client";

import StoreCard from "@/components/hango/StoreCard";
import { Skeleton } from "@/components/ui/skeleton";
import { storesApi } from "@/lib/api";
import type { StoreResponse } from "@/lib/types";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storesApi.list().then(setStores).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col">
      {/* 앱바 */}
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="font-extrabold text-xl text-primary tracking-tight">HAN:GO</span>
        <Link href="/explore" className="p-2 rounded-full hover:bg-muted">
          <Search className="w-5 h-5 text-muted-foreground" />
        </Link>
      </header>

      {/* 이벤트 배너 플레이스홀더 */}
      <div className="m-4 rounded-2xl bg-gradient-to-r from-primary to-[#7B8BFF] h-36 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="font-bold text-lg">2025 한동 축제</p>
          <p className="text-sm text-white/80">다양한 부스와 공연을 즐겨보세요</p>
        </div>
      </div>

      {/* 스토어 목록 */}
      <section className="px-4 pb-4">
        <h2 className="font-bold text-base mb-3">운영 중인 스토어</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">현재 운영 중인 스토어가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stores.map((store) => <StoreCard key={store.id} store={store} />)}
          </div>
        )}
      </section>
    </div>
  );
}
