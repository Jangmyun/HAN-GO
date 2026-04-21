"use client";

import ProductCard from "@/components/hango/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { productsApi, storesApi } from "@/lib/api";
import type { ProductResponse, StoreResponse } from "@/lib/types";
import { ChevronLeft, MapPin } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function StoreDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storesApi
      .getBySlug(params.slug)
      .then(async (s) => {
        setStore(s);
        const prods = await productsApi.list(s.id);
        setProducts(prods);
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted-foreground">
        스토어를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div>
      {/* 앱바 */}
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold">{store.name}</span>
      </header>

      {/* 스토어 헤더 */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 h-40 flex items-center justify-center">
        <span className="text-6xl font-extrabold text-primary/30">{store.name[0]}</span>
      </div>

      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between">
          <h1 className="font-bold text-xl">{store.name}</h1>
          <span
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              store.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {store.status === "active" ? "운영 중" : "미운영"}
          </span>
        </div>
        {store.location && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {store.location}
          </p>
        )}
        {store.opening_hours && (
          <p className="text-sm text-muted-foreground mt-0.5">🕐 {store.opening_hours}</p>
        )}
        {store.description && (
          <p className="text-sm text-foreground/80 mt-2">{store.description}</p>
        )}
      </div>

      {/* 상품 목록 */}
      <div className="p-4 space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">상품 목록</h2>
        {products.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">등록된 상품이 없습니다.</p>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} storeSlug={store.slug} />
          ))
        )}
      </div>
    </div>
  );
}
