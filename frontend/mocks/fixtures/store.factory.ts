import type { StoreResponse } from "@/lib/types";

let counter = 1;

export function resetStoreCounter() {
  counter = 1;
}

export function createStore(overrides: Partial<StoreResponse> = {}): StoreResponse {
  const id = String(counter++);
  return {
    id,
    name: `테스트 부스 ${id}`,
    slug: `test-booth-${id}`,
    type: "FOOD",
    location: "한동대학교 운동장 A구역",
    opening_hours: "10:00 - 18:00",
    description: "테스트용 부스입니다.",
    payment_methods: [
      { type: "bank_account", bank: "카카오뱅크", number: "1234-5678", holder: "한동대" },
    ],
    status: "active",
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createStoreList(count: number, overrides: Partial<StoreResponse> = {}): StoreResponse[] {
  return Array.from({ length: count }, () => createStore(overrides));
}
