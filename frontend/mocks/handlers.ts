import { http, HttpResponse } from "msw";
import type { OrderStatus, StoreStatus } from "@/lib/types";
import {
  createStore,
  createStoreList,
  createProduct,
  createOrder,
  createTicket,
  resetStoreCounter,
  resetProductCounter,
  resetOrderCounter,
  resetTicketCounter,
} from "./fixtures";

// ─── 인메모리 상태 ────────────────────────────────────────────────────────────

function buildInitialState() {
  const stores = createStoreList(3);
  const products = [
    createProduct({ store_id: stores[0].id, name: "불고기 버거", base_price: 6000 }),
    createProduct({ store_id: stores[0].id, name: "감자튀김", base_price: 3000 }),
    createProduct({ store_id: stores[1].id, type: "PERFORMANCE", name: "봄 공연", base_price: 15000 }),
  ];
  const orderList = [
    createOrder({ store_id: stores[0].id, status: "pending" }),
  ];
  const tickets = [
    createTicket({ id: "seed-ticket", order_item_id: "seed-item", qr_token: "seed-qr-token-abc123" }),
  ];
  return { stores, products, orderList, tickets };
}

let state = buildInitialState();

export function resetMockState() {
  resetStoreCounter();
  resetProductCounter();
  resetOrderCounter();
  resetTicketCounter();
  state = buildInitialState();
}

const BASE = "http://localhost:8000";

export const handlers = [

  // ── Auth ──────────────────────────────────────────────────────────────────

  http.post(`${BASE}/auth/kakao/callback`, () =>
    HttpResponse.json({
      access_token: "mock-user-token",
      token_type: "bearer",
      expires_in: 86400,
      role: "user",
      user_id: "mock-user-1",
    })
  ),

  http.post(`${BASE}/auth/guest`, async ({ request }) => {
    const body = await request.json() as { phone: string };
    return HttpResponse.json({
      access_token: `mock-guest-${body.phone}`,
      token_type: "bearer",
      expires_in: 86400,
      role: "guest",
    });
  }),

  http.post(`${BASE}/auth/store/login`, () =>
    HttpResponse.json({
      access_token: "mock-store-token",
      token_type: "bearer",
      expires_in: 86400,
      role: "store",
      store_id: state.stores[0].id,
    })
  ),

  http.post(`${BASE}/auth/admin/login`, () =>
    HttpResponse.json({
      access_token: "mock-admin-token",
      token_type: "bearer",
      expires_in: 86400,
      role: "admin",
    })
  ),

  // ── Stores ────────────────────────────────────────────────────────────────

  http.get(`${BASE}/stores`, () => HttpResponse.json(state.stores)),

  http.get(`${BASE}/stores/by-slug/:slug`, ({ params }) => {
    const store = state.stores.find((s) => s.slug === params.slug);
    if (!store) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(store);
  }),

  http.get(`${BASE}/stores/:id`, ({ params }) => {
    const store = state.stores.find((s) => s.id === params.id);
    if (!store) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(store);
  }),

  http.patch(`${BASE}/stores/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    state.stores = state.stores.map((s) =>
      s.id === params.id ? { ...s, ...body } : s
    );
    const updated = state.stores.find((s) => s.id === params.id);
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(updated);
  }),

  // ── Products ──────────────────────────────────────────────────────────────

  http.get(`${BASE}/stores/:id/products`, ({ params }) =>
    HttpResponse.json(state.products.filter((p) => p.store_id === params.id))
  ),

  http.get(`${BASE}/stores/:id/products/:productId`, ({ params }) => {
    const product = state.products.find(
      (p) => p.id === params.productId && p.store_id === params.id
    );
    if (!product) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(product);
  }),

  http.post(`${BASE}/stores/:id/products`, async ({ params, request }) => {
    const body = await request.json() as Parameters<typeof createProduct>[0];
    const product = createProduct({ ...body, store_id: params.id as string });
    state.products.push(product);
    return HttpResponse.json(product, { status: 201 });
  }),

  http.patch(`${BASE}/stores/:id/products/:productId`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    state.products = state.products.map((p) =>
      p.id === params.productId ? { ...p, ...body } : p
    );
    const updated = state.products.find((p) => p.id === params.productId);
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(updated);
  }),

  http.delete(`${BASE}/stores/:id/products/:productId`, ({ params }) => {
    state.products = state.products.filter((p) => p.id !== params.productId);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Orders ────────────────────────────────────────────────────────────────
  // 주의: /orders/store/list, /orders/guest/lookup 을 /orders/:id 보다 먼저 등록

  http.get(`${BASE}/orders/store/list`, () => HttpResponse.json(state.orderList)),

  http.post(`${BASE}/orders/guest/lookup`, async ({ request }) => {
    const body = await request.json() as { order_code: string; phone: string };
    const order = state.orderList.find((o) => o.order_code === body.order_code);
    if (!order) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(order);
  }),

  http.post(`${BASE}/orders`, async ({ request }) => {
    const body = await request.json() as { store_id?: string; total_price?: number };
    const order = createOrder({
      store_id: body.store_id ?? state.stores[0].id,
      total_price: body.total_price ?? 5000,
    });
    state.orderList.push(order);
    return HttpResponse.json(order, { status: 201 });
  }),

  http.get(`${BASE}/orders`, () => HttpResponse.json(state.orderList)),

  http.get(`${BASE}/orders/:id`, ({ params }) => {
    const order = state.orderList.find((o) => o.id === params.id);
    if (!order) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(order);
  }),

  http.post(`${BASE}/orders/:id/payment-submit`, ({ params }) => {
    state.orderList = state.orderList.map((o) =>
      o.id === params.id ? { ...o, status: "payment_submitted" as OrderStatus } : o
    );
    const updated = state.orderList.find((o) => o.id === params.id);
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(updated);
  }),

  http.post(`${BASE}/orders/:id/payment-confirm`, ({ params }) => {
    state.orderList = state.orderList.map((o) =>
      o.id === params.id
        ? { ...o, status: "paid" as OrderStatus, paid_at: new Date().toISOString() }
        : o
    );
    const updated = state.orderList.find((o) => o.id === params.id);
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(updated);
  }),

  http.post(`${BASE}/orders/:id/payment-reject`, ({ params }) => {
    state.orderList = state.orderList.map((o) =>
      o.id === params.id ? { ...o, status: "payment_rejected" as OrderStatus } : o
    );
    const updated = state.orderList.find((o) => o.id === params.id);
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(updated);
  }),

  http.post(`${BASE}/orders/:id/cancel`, ({ params }) => {
    state.orderList = state.orderList.map((o) =>
      o.id === params.id
        ? { ...o, status: "cancelled_by_user" as OrderStatus, cancelled_at: new Date().toISOString() }
        : o
    );
    const updated = state.orderList.find((o) => o.id === params.id);
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(updated);
  }),

  http.post(`${BASE}/orders/:id/cancel-approve`, ({ params }) => {
    state.orderList = state.orderList.map((o) =>
      o.id === params.id ? { ...o, status: "cancelled_by_store" as OrderStatus } : o
    );
    const updated = state.orderList.find((o) => o.id === params.id);
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(updated);
  }),

  http.post(`${BASE}/orders/:id/prepare`, ({ params }) => {
    state.orderList = state.orderList.map((o) =>
      o.id === params.id ? { ...o, status: "preparing" as OrderStatus } : o
    );
    const updated = state.orderList.find((o) => o.id === params.id);
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(updated);
  }),

  http.post(`${BASE}/orders/:id/ready`, ({ params }) => {
    state.orderList = state.orderList.map((o) =>
      o.id === params.id ? { ...o, status: "ready" as OrderStatus } : o
    );
    const updated = state.orderList.find((o) => o.id === params.id);
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(updated);
  }),

  http.post(`${BASE}/orders/:id/complete`, ({ params }) => {
    state.orderList = state.orderList.map((o) =>
      o.id === params.id
        ? { ...o, status: "completed" as OrderStatus, completed_at: new Date().toISOString() }
        : o
    );
    const updated = state.orderList.find((o) => o.id === params.id);
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(updated);
  }),

  // ── Tickets ───────────────────────────────────────────────────────────────

  http.get(`${BASE}/tickets/:id`, ({ params }) => {
    const ticket = state.tickets.find((t) => t.id === params.id);
    if (!ticket) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(ticket);
  }),

  http.post(`${BASE}/tickets/verify`, async ({ request }) => {
    const body = await request.json() as { qr_token: string };
    const ticket = state.tickets.find((t) => t.qr_token === body.qr_token);
    if (!ticket) {
      return HttpResponse.json({ success: false, message: "유효하지 않은 QR 코드입니다." });
    }
    if (ticket.status === "used") {
      return HttpResponse.json({ success: false, ticket_id: ticket.id, message: "이미 사용된 티켓입니다." });
    }
    state.tickets = state.tickets.map((t) =>
      t.qr_token === body.qr_token
        ? { ...t, status: "used" as const, used_at: new Date().toISOString() }
        : t
    );
    return HttpResponse.json({ success: true, ticket_id: ticket.id, message: "입장이 확인되었습니다." });
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────

  http.get(`${BASE}/admin/stores`, () => HttpResponse.json(state.stores)),

  http.post(`${BASE}/admin/stores`, async ({ request }) => {
    const body = await request.json() as Parameters<typeof createStore>[0];
    const store = createStore(body);
    state.stores.push(store);
    return HttpResponse.json(store, { status: 201 });
  }),

  http.patch(`${BASE}/admin/stores/:id/status`, ({ params, request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as StoreStatus;
    state.stores = state.stores.map((s) =>
      s.id === params.id ? { ...s, status } : s
    );
    const updated = state.stores.find((s) => s.id === params.id);
    if (!updated) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(updated);
  }),
];
