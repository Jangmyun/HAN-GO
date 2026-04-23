/**
 * OrdersPage 통합 테스트
 * MSW로 ordersApi.list()를 모킹하고, 인증 여부에 따른 동작을 검증한다.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { createOrderList } from "@/mocks/fixtures";
import OrdersPage from "@/app/(user)/orders/page";

// Next.js 라우터 모킹
const mockReplace = vi.fn();
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
}));

// Next.js Link 모킹
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// auth를 부분 모킹 — getToken 등 다른 export는 실제 구현을 유지하고 isAuthenticated만 교체
vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    isAuthenticated: vi.fn(),
  };
});

import { isAuthenticated } from "@/lib/auth";
const mockIsAuthenticated = vi.mocked(isAuthenticated);

beforeEach(() => {
  mockReplace.mockClear();
  mockBack.mockClear();
});

describe("OrdersPage — 주문 목록", () => {
  it("비인증 사용자는 /auth로 리다이렉트된다", async () => {
    mockIsAuthenticated.mockReturnValue(false);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth");
    });
  });

  it("인증된 사용자의 주문 목록을 렌더링한다", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    const orders = createOrderList(2, { status: "paid" });
    server.use(
      http.get("http://localhost:8000/orders", () => HttpResponse.json(orders))
    );

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText(orders[0].order_code)).toBeInTheDocument();
      expect(screen.getByText(orders[1].order_code)).toBeInTheDocument();
    });
  });

  it("주문이 없으면 빈 상태 메시지를 표시한다", async () => {
    mockIsAuthenticated.mockReturnValue(true);
    server.use(
      http.get("http://localhost:8000/orders", () => HttpResponse.json([]))
    );

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("주문 내역이 없습니다.")).toBeInTheDocument();
    });
  });
});
