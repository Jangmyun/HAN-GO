"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { productsApi } from "@/lib/api";
import { getStoreId } from "@/lib/auth";
import type { ProductResponse } from "@/lib/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const TYPE_LABEL = { FOOD: "푸드", PERFORMANCE: "공연", MERCH: "굿즈" };
const STATUS_LABEL = { active: "판매 중", sold_out: "품절", hidden: "숨김", deleted: "삭제" };

export default function StoreProductsPage() {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const storeId = getStoreId();

  const load = () => {
    if (!storeId) return;
    productsApi.list(storeId).then(setProducts).finally(() => setLoading(false));
  };

  useEffect(load, [storeId]);

  const handleDelete = async (productId: string) => {
    if (!storeId || !confirm("정말 삭제하시겠습니까?")) return;
    await productsApi.delete(storeId, productId);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-xl">상품 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">스토어 상품을 등록·수정·삭제합니다.</p>
        </div>
        <Link href="/store/products/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            상품 등록
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">등록된 상품이 없습니다.</p>
          <Link href="/store/products/new" className="text-sm text-primary underline mt-2 block">
            첫 상품 등록하기
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <Card key={product.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{product.name}</p>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {TYPE_LABEL[product.type]}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-sm text-primary font-semibold">
                    {product.base_price.toLocaleString()}원
                  </p>
                  <span className={`text-xs ${product.status === "active" ? "text-green-600" : "text-muted-foreground"}`}>
                    {STATUS_LABEL[product.status]}
                  </span>
                  {product.stock_mode === "tracked" && product.stock !== null && (
                    <span className="text-xs text-muted-foreground">재고: {product.stock}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/store/products/${product.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
