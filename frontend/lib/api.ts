import { clearToken, getToken } from "./auth";
import type {
  OrderResponse,
  PerformanceSchedule,
  ProductResponse,
  StoreResponse,
  TicketResponse,
  TicketVerifyResponse,
  TokenResponse,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── 코어 fetch 래퍼 ─────────────────────────────────────────────────────────

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") window.location.href = "/auth";
    throw new Error("unauthenticated");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "api_error");
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  kakaoCallback: (code: string) =>
    request<TokenResponse>("/auth/kakao/callback", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  guestLogin: (phone: string) =>
    request<TokenResponse>("/auth/guest", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  storeLogin: (email: string, password: string) =>
    request<TokenResponse>("/auth/store/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  adminLogin: (email: string, password: string) =>
    request<TokenResponse>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

// ─── Stores API ──────────────────────────────────────────────────────────────

export const storesApi = {
  list: () => request<StoreResponse[]>("/stores"),
  get: (id: string) => request<StoreResponse>(`/stores/${id}`),
  getBySlug: (slug: string) => request<StoreResponse>(`/stores/by-slug/${slug}`),
  update: (id: string, body: Partial<StoreResponse>) =>
    request<StoreResponse>(`/stores/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

// ─── Products API ─────────────────────────────────────────────────────────────

export const productsApi = {
  list: (storeId: string) => request<ProductResponse[]>(`/stores/${storeId}/products`),
  get: (storeId: string, productId: string) =>
    request<ProductResponse>(`/stores/${storeId}/products/${productId}`),
  create: (storeId: string, body: unknown) =>
    request<ProductResponse>(`/stores/${storeId}/products`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (storeId: string, productId: string, body: unknown) =>
    request<ProductResponse>(`/stores/${storeId}/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (storeId: string, productId: string) =>
    request<void>(`/stores/${storeId}/products/${productId}`, { method: "DELETE" }),
};

// ─── Schedules API ───────────────────────────────────────────────────────────

export const schedulesApi = {
  list: (storeId: string, productId: string) =>
    request<PerformanceSchedule[]>(`/stores/${storeId}/products/${productId}/schedules`),
};

// ─── Orders API ───────────────────────────────────────────────────────────────

export const ordersApi = {
  create: (body: unknown) =>
    request<OrderResponse>("/orders", { method: "POST", body: JSON.stringify(body) }),
  list: () => request<OrderResponse[]>("/orders"),
  get: (id: string) => request<OrderResponse>(`/orders/${id}`),
  guestLookup: (order_code: string, phone: string) =>
    request<OrderResponse>("/orders/guest/lookup", {
      method: "POST",
      body: JSON.stringify({ order_code, phone }),
    }),
  paymentSubmit: (id: string, method: string) =>
    request<OrderResponse>(`/orders/${id}/payment-submit`, {
      method: "POST",
      body: JSON.stringify({ method }),
    }),
  paymentConfirm: (id: string) =>
    request<OrderResponse>(`/orders/${id}/payment-confirm`, { method: "POST" }),
  paymentReject: (id: string) =>
    request<OrderResponse>(`/orders/${id}/payment-reject`, { method: "POST" }),
  cancel: (id: string, reason?: string) =>
    request<OrderResponse>(`/orders/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  cancelApprove: (id: string) =>
    request<OrderResponse>(`/orders/${id}/cancel-approve`, { method: "POST" }),
  prepare: (id: string) =>
    request<OrderResponse>(`/orders/${id}/prepare`, { method: "POST" }),
  ready: (id: string) =>
    request<OrderResponse>(`/orders/${id}/ready`, { method: "POST" }),
  complete: (id: string) =>
    request<OrderResponse>(`/orders/${id}/complete`, { method: "POST" }),
  storeList: () => request<OrderResponse[]>("/orders/store/list"),
};

// ─── Tickets API ──────────────────────────────────────────────────────────────

export const ticketsApi = {
  get: (id: string) => request<TicketResponse>(`/tickets/${id}`),
  verify: (qr_token: string) =>
    request<TicketVerifyResponse>("/tickets/verify", {
      method: "POST",
      body: JSON.stringify({ qr_token }),
    }),
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  listStores: () => request<StoreResponse[]>("/admin/stores"),
  createStore: (body: unknown) =>
    request<StoreResponse>("/admin/stores", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateStoreStatus: (storeId: string, status: string) =>
    request<unknown>(`/admin/stores/${storeId}/status?status=${status}`, { method: "PATCH" }),
};
