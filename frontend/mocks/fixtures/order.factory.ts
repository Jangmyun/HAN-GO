import type { OrderResponse, OrderItemResponse } from "@/lib/types";

let orderCounter = 1;
let itemCounter = 1;

export function resetOrderCounter() {
  orderCounter = 1;
  itemCounter = 1;
}

export function createOrderItem(overrides: Partial<OrderItemResponse> = {}): OrderItemResponse {
  const id = String(itemCounter++);
  return {
    id,
    product_id: "1",
    quantity: 1,
    selected_options: {},
    unit_price: 5000,
    subtotal: 5000,
    ...overrides,
  };
}

export function createOrder(overrides: Partial<OrderResponse> = {}): OrderResponse {
  const id = String(orderCounter++);
  const paddedId = String(orderCounter).padStart(4, "0");
  return {
    id,
    order_code: `HG-${paddedId}`,
    store_id: "1",
    user_id: "user-1",
    total_price: 5000,
    status: "pending",
    items: [createOrderItem()],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function createOrderList(count: number, overrides: Partial<OrderResponse> = {}): OrderResponse[] {
  return Array.from({ length: count }, () => createOrder(overrides));
}
