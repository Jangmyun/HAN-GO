// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  role?: "user" | "guest" | "store" | "admin";
  user_id?: string;
  store_id?: string;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export type StoreStatus = "active" | "suspended" | "deleted";

export interface PaymentMethod {
  type: "kakaopay_url" | "bank_account";
  value?: string;
  bank?: string;
  number?: string;
  holder?: string;
}

export type StoreType = "FOOD" | "PERFORMANCE" | "MERCH";

export interface StoreResponse {
  id: string;
  name: string;
  slug: string;
  type: StoreType;
  location?: string;
  opening_hours?: string;
  description?: string;
  payment_methods: PaymentMethod[];
  status: StoreStatus;
  created_at: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductType = "FOOD" | "PERFORMANCE" | "MERCH";
export type ProductStatus = "active" | "sold_out" | "hidden" | "deleted";
export type StockMode = "unlimited" | "tracked" | "manual_sold_out";

export interface OptionField {
  key: string;
  label: string;
  type: "select" | "boolean" | "text";
  values?: string[];
  required: boolean;
  price_delta: number;
}

export interface SeatCell {
  row: number;
  col: number;
  label?: string;
  status: "AVAILABLE" | "UNAVAILABLE" | "VIP" | "SOLD";
  tier: string;
}

export interface SeatLayout {
  rows: number;
  cols: number;
  cells: SeatCell[];
  tier_prices: Record<string, number>;
}

export interface PerformanceSchedule {
  id: string;
  product_id: string;
  datetime: string;
  venue?: string;
  seat_layout: SeatLayout;
}

export interface ProductResponse {
  id: string;
  store_id: string;
  event_id?: string;
  type: ProductType;
  name: string;
  description?: string;
  base_price: number;
  status: ProductStatus;
  stock_mode: StockMode;
  stock?: number;
  option_schema: OptionField[];
  created_at: string;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "payment_submitted"
  | "paid"
  | "preparing"
  | "ready"
  | "completed"
  | "payment_rejected"
  | "cancelled_by_user"
  | "cancellation_requested"
  | "cancelled_by_store";

export type PaymentMethodType = "KAKAOPAY_URL" | "BANK_TRANSFER" | "OTHER";

export interface OrderItemResponse {
  id: string;
  product_id: string;
  schedule_id?: string;
  seat_keys?: string[];
  quantity: number;
  selected_options: Record<string, unknown>;
  unit_price: number;
  subtotal: number;
}

export interface OrderResponse {
  id: string;
  order_code: string;
  store_id: string;
  user_id: string;
  total_price: number;
  status: OrderStatus;
  items: OrderItemResponse[];
  guest_phone?: string;
  created_at: string;
  paid_at?: string;
  cancelled_at?: string;
  completed_at?: string;
}

// ─── Ticket ──────────────────────────────────────────────────────────────────

export type TicketStatus = "issued" | "used" | "revoked";

export interface TicketResponse {
  id: string;
  order_item_id: string;
  qr_token: string;
  status: TicketStatus;
  issued_at: string;
  used_at?: string;
}

export interface TicketVerifyResponse {
  success: boolean;
  ticket_id?: string;
  message: string;
}

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface CartItem {
  product_id: string;
  product_name: string;
  schedule_id?: string;
  seat_keys?: string[];
  quantity: number;
  selected_options: Record<string, unknown>;
  unit_price: number;
  subtotal: number;
}
