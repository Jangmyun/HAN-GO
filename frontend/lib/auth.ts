"use client";

type Role = "user" | "guest" | "store" | "admin";

const TOKEN_KEYS: Record<Role, string> = {
  user: "hango_user_token",
  guest: "hango_guest_token",
  store: "hango_store_token",
  admin: "hango_admin_token",
};

const ROLE_KEY = "hango_role";
const USER_ID_KEY = "hango_user_id";
const STORE_ID_KEY = "hango_store_id";

function safeLocalStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function setToken(token: string, role: Role, extra?: { user_id?: string; store_id?: string }) {
  const storage = safeLocalStorage();
  if (!storage) return;
  storage.setItem(TOKEN_KEYS[role], token);
  storage.setItem(ROLE_KEY, role);
  if (extra?.user_id) storage.setItem(USER_ID_KEY, extra.user_id);
  if (extra?.store_id) storage.setItem(STORE_ID_KEY, extra.store_id);
}

export function getToken(role?: Role): string | null {
  const storage = safeLocalStorage();
  if (!storage) return null;
  if (role) return storage.getItem(TOKEN_KEYS[role]);
  // role 미지정 시 현재 role의 토큰
  const currentRole = storage.getItem(ROLE_KEY) as Role | null;
  if (!currentRole) return null;
  return storage.getItem(TOKEN_KEYS[currentRole]);
}

export function getRole(): Role | null {
  return (safeLocalStorage()?.getItem(ROLE_KEY) as Role | null) ?? null;
}

export function getUserId(): string | null {
  return safeLocalStorage()?.getItem(USER_ID_KEY) ?? null;
}

export function getStoreId(): string | null {
  return safeLocalStorage()?.getItem(STORE_ID_KEY) ?? null;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function clearToken(role?: Role) {
  const storage = safeLocalStorage();
  if (!storage) return;
  if (role) {
    storage.removeItem(TOKEN_KEYS[role]);
  } else {
    (Object.values(TOKEN_KEYS) as string[]).forEach((k) => storage.removeItem(k));
    storage.removeItem(ROLE_KEY);
    storage.removeItem(USER_ID_KEY);
    storage.removeItem(STORE_ID_KEY);
  }
}
