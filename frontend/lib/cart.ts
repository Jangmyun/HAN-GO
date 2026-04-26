"use client";

import type { CartItem } from "./types";

const CART_KEY = "hango_cart";
const CART_STORE_KEY = "hango_cart_store_id";

function safeStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function getCartStoreId(): string | null {
  return safeStorage()?.getItem(CART_STORE_KEY) ?? null;
}

export function getCart(storeId: string): CartItem[] {
  const current = getCartStoreId();
  if (current !== storeId) return [];
  const raw = safeStorage()?.getItem(CART_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export function addToCart(storeId: string, item: CartItem): "added" | "store_mismatch" {
  const current = getCartStoreId();
  if (current && current !== storeId) return "store_mismatch";

  const storage = safeStorage();
  if (!storage) return "added";

  const items = getCart(storeId);
  items.push(item);
  storage.setItem(CART_STORE_KEY, storeId);
  storage.setItem(CART_KEY, JSON.stringify(items));
  return "added";
}

export function removeFromCart(storeId: string, productId: string) {
  const items = getCart(storeId).filter((i) => i.product_id !== productId);
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(CART_KEY, JSON.stringify(items));
}

export function clearCart() {
  const storage = safeStorage();
  if (!storage) return;
  storage.removeItem(CART_KEY);
  storage.removeItem(CART_STORE_KEY);
}

export function getCartTotal(storeId: string): number {
  return getCart(storeId).reduce((sum, item) => sum + item.subtotal, 0);
}
