import type { TicketResponse } from "@/lib/types";

let counter = 1;

export function resetTicketCounter() {
  counter = 1;
}

export function createTicket(overrides: Partial<TicketResponse> = {}): TicketResponse {
  const id = String(counter++);
  return {
    id,
    order_item_id: "1",
    qr_token: `qr-token-${id}-${Math.random().toString(36).slice(2, 10)}`,
    status: "issued",
    issued_at: new Date().toISOString(),
    ...overrides,
  };
}
