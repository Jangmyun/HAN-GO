"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ordersApi } from "@/lib/api";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function GuestLookupPage() {
  const router = useRouter();
  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const order = await ordersApi.guestLookup(orderCode.toUpperCase().trim(), phone.trim());
      router.push(`/orders/${order.id}`);
    } catch {
      setError("주문을 찾을 수 없습니다. 주문 번호와 전화번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold">비회원 주문 조회</span>
      </header>

      <div className="p-6">
        <p className="text-sm text-muted-foreground mb-6">
          주문 시 받으신 주문 번호와 입력한 전화번호로 주문을 조회할 수 있습니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="orderCode">주문 번호</Label>
            <Input
              id="orderCode"
              placeholder="HG-XXXX"
              value={orderCode}
              onChange={(e) => setOrderCode(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">전화번호</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "조회 중..." : "주문 조회"}
          </Button>
        </form>
      </div>
    </div>
  );
}
