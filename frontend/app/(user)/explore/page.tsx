"use client";

import ProductCard from "@/components/hango/ProductCard";
import StoreCard from "@/components/hango/StoreCard";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { storesApi } from "@/lib/api";
import type { StoreResponse } from "@/lib/types";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

const CATEGORIES = ["전체", "FOOD", "PERFORMANCE", "MERCH"] as const;
type Category = (typeof CATEGORIES)[number];

export default function ExplorePage() {
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storesApi.list().then(setStores).finally(() => setLoading(false));
  }, []);

  const filtered = stores.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    (s.description ?? "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      {/* 앱바 */}
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3">
        <p className="font-bold text-base mb-3">스토어 탐색</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="스토어 이름으로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="p-4 space-y-3">
        {loading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            검색 결과가 없습니다.
          </div>
        ) : (
          filtered.map((store) => <StoreCard key={store.id} store={store} />)
        )}
      </div>
    </div>
  );
}
