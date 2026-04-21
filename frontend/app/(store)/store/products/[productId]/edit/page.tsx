"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { productsApi } from "@/lib/api";
import { getStoreId } from "@/lib/auth";
import type { ProductResponse, ProductStatus, StockMode } from "@/lib/types";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProductPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const storeId = getStoreId();

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [status, setStatus] = useState<ProductStatus>("active");
  const [stockMode, setStockMode] = useState<StockMode>("unlimited");
  const [stock, setStock] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!storeId) return;
    productsApi.get(storeId, params.productId).then((p) => {
      setProduct(p);
      setName(p.name);
      setDescription(p.description ?? "");
      setBasePrice(String(p.base_price));
      setStatus(p.status);
      setStockMode(p.stock_mode);
      setStock(String(p.stock ?? ""));
    }).finally(() => setLoading(false));
  }, [storeId, params.productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    setSaving(true);
    setError("");
    try {
      await productsApi.update(storeId, params.productId, {
        name,
        description: description || undefined,
        base_price: Number(basePrice),
        status,
        stock_mode: stockMode,
        stock: stockMode === "tracked" ? Number(stock) : undefined,
      });
      router.push("/store/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "수정 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10" />{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;
  if (!product) return <p className="text-muted-foreground">상품을 찾을 수 없습니다.</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-xl">상품 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">상품명 *</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">설명</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">가격 (원) *</Label>
          <Input id="price" type="number" min={0} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>상태</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">판매 중</SelectItem>
              <SelectItem value="sold_out">품절</SelectItem>
              <SelectItem value="hidden">숨김</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {product.type !== "PERFORMANCE" && (
          <div className="space-y-1.5">
            <Label>재고 관리</Label>
            <Select value={stockMode} onValueChange={(v) => setStockMode(v as StockMode)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unlimited">무제한</SelectItem>
                <SelectItem value="tracked">수량 관리</SelectItem>
                <SelectItem value="manual_sold_out">수동 품절</SelectItem>
              </SelectContent>
            </Select>
            {stockMode === "tracked" && (
              <Input type="number" min={0} placeholder="재고 수량" value={stock} onChange={(e) => setStock(e.target.value)} />
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
          <Button type="submit" disabled={saving}>{saving ? "저장 중..." : "저장"}</Button>
        </div>
      </form>
    </div>
  );
}
