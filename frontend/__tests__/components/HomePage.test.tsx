/**
 * HomePage 통합 테스트
 * MSW로 storesApi.list()를 모킹하여 백엔드 없이 렌더링을 검증한다.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import type { StoreResponse } from "@/lib/types";
import HomePage from "@/app/(user)/page";

// Next.js Link 컴포넌트 모킹
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe("HomePage — 스토어 목록", () => {
  it("스토어 목록을 렌더링한다", async () => {
    // 테스트 내에서 직접 데이터 정의 (카운터 상태에 독립적)
    const stores: StoreResponse[] = [
      { id: "s1", name: "국밥 부스", slug: "gukbap", status: "active", payment_methods: [], created_at: new Date().toISOString() },
      { id: "s2", name: "타코야끼 부스", slug: "takoyaki", status: "active", payment_methods: [], created_at: new Date().toISOString() },
    ];
    server.use(
      http.get("http://localhost:8000/stores", () => HttpResponse.json(stores))
    );

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("국밥 부스")).toBeInTheDocument();
      expect(screen.getByText("타코야끼 부스")).toBeInTheDocument();
    });
  });

  it("스토어가 없으면 빈 상태 메시지를 표시한다", async () => {
    server.use(
      http.get("http://localhost:8000/stores", () => HttpResponse.json([]))
    );

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("현재 운영 중인 스토어가 없습니다.")).toBeInTheDocument();
    });
  });

  it("API 오류 시 콘솔 에러를 출력하고 빈 목록을 유지한다", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("http://localhost:8000/stores", () => new HttpResponse(null, { status: 500 }))
    );

    render(<HomePage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(screen.getByText("현재 운영 중인 스토어가 없습니다.")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it("기본 핸들러(3개 스토어)로 목록을 렌더링한다", async () => {
    // server.use() 없이 handlers.ts의 기본 인메모리 상태(createStoreList(3))를 사용
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText("테스트 부스 1")).toBeInTheDocument();
      expect(screen.getByText("테스트 부스 2")).toBeInTheDocument();
      expect(screen.getByText("테스트 부스 3")).toBeInTheDocument();
    });
  });
});
