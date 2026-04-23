import type { ProductResponse } from "@/lib/types";

let counter = 1;

export function resetProductCounter() {
  counter = 1;
}

export function createProduct(overrides: Partial<ProductResponse> = {}): ProductResponse {
  const id = String(counter++);
  return {
    id,
    store_id: "1",
    type: "FOOD",
    name: `테스트 상품 ${id}`,
    description: "맛있는 테스트 음식",
    base_price: 5000,
    status: "active",
    stock_mode: "unlimited",
    option_schema: [],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createPerformanceProduct(overrides: Partial<ProductResponse> = {}): ProductResponse {
  return createProduct({ type: "PERFORMANCE", base_price: 15000, ...overrides });
}

export function createProductList(count: number, overrides: Partial<ProductResponse> = {}): ProductResponse[] {
  return Array.from({ length: count }, () => createProduct(overrides));
}
