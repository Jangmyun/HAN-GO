"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { productsApi, storesApi } from "@/lib/api";
import type { ProductResponse, StoreResponse } from "@/lib/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TYPE_CONFIG = {
  PERFORMANCE: { color: "#4B5FFF", bg: "#EEF0FF", label: "PERFORMANCE" },
  FOOD: { color: "#F5670A", bg: "#FFF0E8", label: "FOOD" },
  MERCH: { color: "#6B7280", bg: "#F3F4F6", label: "MERCH" },
};

function ProductListCard({ product, storeSlug }: { product: ProductResponse; storeSlug: string }) {
  const isSoldOut = product.status === "sold_out" || product.status === "hidden";
  const cfg = TYPE_CONFIG[product.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.FOOD;

  return (
    <Link href={`/stores/${storeSlug}/products/${product.id}`}>
      <div
        style={{
          background: "#fff", borderRadius: 16,
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(17,24,39,0.06), 0 1px 2px rgba(17,24,39,0.04)",
          padding: "14px", display: "flex", gap: 12, cursor: "pointer",
          opacity: isSoldOut ? 0.6 : 1,
          position: "relative" as const, userSelect: "none",
        }}
      >
        {isSoldOut && (
          <div
            style={{
              position: "absolute", inset: 0, borderRadius: 16,
              background: "rgba(255,255,255,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 10,
            }}
          >
            <span style={{ fontWeight: 700, color: "#6B7280", fontSize: 14 }}>품절</span>
          </div>
        )}
        {/* 아이콘 */}
        <div
          style={{
            width: 50, height: 50, borderRadius: 13,
            background: cfg.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 22 }}>
            {product.type === "PERFORMANCE" ? "🎭" : product.type === "FOOD" ? "🍽️" : "🛍️"}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", letterSpacing: -0.3 }}>
              {product.name}
            </span>
          </div>
          {product.description && (
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>{product.description}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: cfg.color, letterSpacing: -0.4 }}>
              {product.base_price.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function StoreDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [store, setStore] = useState<StoreResponse | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

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
        <Skeleton className="h-48 rounded-none" />
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  if (!store) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", color: "#6B7280" }}>
        스토어를 찾을 수 없습니다.
      </div>
    );
  }

  const cfg = TYPE_CONFIG[store.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.FOOD;
  const isOpen = store.status === "active";
  const tabs = store.type === "PERFORMANCE"
    ? ["공연 예매", "스토어 정보"]
    : ["상품 목록", "스토어 정보"];

  return (
    <div style={{ display: "flex", flexDirection: "column", background: "#F9FAFB", minHeight: "100%" }}>
      {/* 히어로 */}
      <div style={{ position: "relative", flexShrink: 0, height: 200 }}>
        <div
          style={{
            height: 200,
            backgroundImage: `repeating-linear-gradient(135deg, ${cfg.bg} 0px, ${cfg.bg} 10px, ${cfg.color}33 10px, ${cfg.color}33 20px)`,
          }}
        />
        <div
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%)",
          }}
        />
        {/* 뒤로가기 */}
        <button
          onClick={() => router.back()}
          style={{
            position: "absolute", top: 12, left: 12,
            width: 38, height: 38,
            background: "rgba(0,0,0,0.30)",
            backdropFilter: "blur(8px)",
            borderRadius: 12, border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {/* 타이틀 오버레이 */}
        <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: -0.6, textShadow: "0 1px 4px rgba(0,0,0,0.3)" }}>
            {store.name}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <span
              style={{
                background: cfg.bg, color: cfg.color,
                borderRadius: 6, padding: "3px 8px",
                fontSize: 11, fontWeight: 700,
                display: "inline-flex", alignItems: "center",
              }}
            >
              {cfg.label}
            </span>
            <span
              style={{
                fontSize: 10, fontWeight: 700,
                color: isOpen ? "#16A34A" : "#6B7280",
                background: isOpen ? "#16A34A18" : "#6B728018",
                borderRadius: 5, padding: "2px 6px",
                display: "inline-flex", alignItems: "center",
              }}
            >
              {isOpen ? "운영중" : "준비중"}
            </span>
          </div>
        </div>
      </div>

      {/* 스토어 메타 */}
      <div
        style={{
          background: "#fff",
          padding: "14px 16px 12px",
          borderBottom: "1px solid #E5E7EB",
          display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" as const,
        }}
      >
        {store.location && (
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1a4 4 0 00-4 4c0 3 4 8 4 8s4-5 4-8a4 4 0 00-4-4z" stroke="#6B7280" strokeWidth="1.4"/>
              <circle cx="7" cy="5" r="1.5" stroke="#6B7280" strokeWidth="1.4"/>
            </svg>
            <span style={{ fontSize: 12, color: "#6B7280" }}>{store.location}</span>
          </div>
        )}
        {store.opening_hours && (
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#6B7280" strokeWidth="1.4"/>
              <path d="M7 4v3l2 2" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 12, color: "#6B7280" }}>{store.opening_hours}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="3" width="10" height="8" rx="1.5" stroke="#6B7280" strokeWidth="1.4"/>
            <path d="M4 7h2M4 9h4" stroke="#6B7280" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 12, color: "#6B7280" }}>카카오페이 · 계좌이체</span>
        </div>
      </div>

      {/* 탭 */}
      <div
        style={{
          background: "#fff",
          display: "flex",
          borderBottom: "1px solid #E5E7EB",
          flexShrink: 0,
        }}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1, textAlign: "center", padding: "13px 0",
              fontSize: 14, fontWeight: activeTab === i ? 700 : 500,
              color: activeTab === i ? "#4B5FFF" : "#6B7280",
              cursor: "pointer", background: "transparent", border: "none",
              borderBottom: activeTab === i ? "2px solid #4B5FFF" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeTab === 0 && (
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {products.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#6B7280", fontSize: 14 }}>
                등록된 상품이 없습니다.
              </div>
            ) : (
              products.map((product) => (
                <ProductListCard key={product.id} product={product} storeSlug={store.slug} />
              ))
            )}
          </div>
        )}
        {activeTab === 1 && (
          <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {store.description && (
              <div
                style={{
                  background: "#fff", borderRadius: 16,
                  border: "1px solid #E5E7EB",
                  boxShadow: "0 1px 3px rgba(17,24,39,0.06)",
                  padding: "16px 18px",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 8 }}>스토어 소개</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{store.description}</div>
              </div>
            )}
          </div>
        )}
        <div style={{ height: 24 }}/>
      </div>

      {/* 하단 CTA — PERFORMANCE: 첫 번째 상품(공연)으로 이동 */}
      {activeTab === 0 && products.length > 0 && store.type === "PERFORMANCE" && (
        <div
          style={{
            padding: "12px 16px 28px",
            background: "#fff",
            borderTop: "1px solid #E5E7EB",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => router.push(`/stores/${store.slug}/products/${products[0].id}`)}
            style={{
              width: "100%", height: 54,
              background: "#4B5FFF", color: "#fff",
              border: "none", borderRadius: 14,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 2px 8px rgba(75,95,255,0.30)",
            }}
          >
            예매하기
          </button>
        </div>
      )}
    </div>
  );
}
