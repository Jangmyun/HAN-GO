---
name: frontend-test
description: HAN:GO Next.js 프론트엔드 테스트 작성 — Vitest + React Testing Library + MSW 패턴
user-invocable: true
---

# HAN:GO 프론트엔드 테스트 스킬

## 핵심 원칙 (출처: frontend-testing-expert, testing-patterns 방법론)

- **사용자 관점 테스트**: 구현 세부사항이 아닌 사용자가 보는 동작을 테스트
- **접근성 우선 쿼리**: `getByRole`, `getByLabelText` 우선, `getByTestId`는 최후 수단
- **TDD 권장**: 실패하는 테스트 먼저 → 구현 → 리팩토링 (RED-GREEN-REFACTOR)
- **1 테스트 1 동작**: 하나의 테스트에서 하나의 사용자 상호작용만 검증

## 테스트 스택

```
Vitest                    # 테스트 러너 (Vite 기반, Next.js 호환)
@testing-library/react    # React 컴포넌트 렌더링 + 쿼리
@testing-library/user-event  # 실제 사용자 상호작용 시뮬레이션
@testing-library/jest-dom # 커스텀 matchers (toBeInTheDocument 등)
MSW (msw)                 # API 목킹 (Service Worker)
jsdom                     # 브라우저 환경 시뮬레이션
```

## 파일 구조

```
frontend/
├── vitest.config.ts        # Vitest 설정
├── vitest.setup.ts         # jest-dom, MSW 초기화
├── __tests__/
│   ├── components/         # UI 컴포넌트 테스트
│   ├── hooks/              # 커스텀 훅 테스트
│   └── pages/              # 페이지 통합 테스트 (선택)
└── mocks/
    ├── handlers.ts         # MSW API 핸들러
    └── server.ts           # MSW 서버 설정
```

## 기본 설정 (vitest.config.ts)

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

## 컴포넌트 테스트 패턴

### 기본 렌더링 테스트

```typescript
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/ProductCard";

describe("ProductCard", () => {
  const defaultProps = {
    name: "라면",
    price: 5000,
    status: "active" as const,
  };

  it("상품명과 가격을 표시한다", () => {
    render(<ProductCard {...defaultProps} />);
    expect(screen.getByText("라면")).toBeInTheDocument();
    expect(screen.getByText("5,000원")).toBeInTheDocument();
  });

  it("품절 상태일 때 '품절' 배지를 표시한다", () => {
    render(<ProductCard {...defaultProps} status="sold_out" />);
    expect(screen.getByRole("status", { name: /품절/i })).toBeInTheDocument();
  });
});
```

### 사용자 상호작용 테스트

```typescript
import userEvent from "@testing-library/user-event";

it("수량 증가 버튼 클릭 시 수량이 1 증가한다", async () => {
  const user = userEvent.setup();
  render(<QuantitySelector initialValue={1} onChange={onChange} />);

  await user.click(screen.getByRole("button", { name: /수량 증가/i }));
  expect(onChange).toHaveBeenCalledWith(2);
});
```

### MSW API 목킹

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/stores/:storeId/products", () =>
    HttpResponse.json([
      { id: "1", name: "라면", price: 5000 },
    ])
  ),
  http.post("/api/orders", () =>
    HttpResponse.json({ order_code: "HG-A3F7", status: "pending" }, { status: 201 })
  ),
];

// 특정 테스트에서 오류 시나리오 재정의
server.use(
  http.post("/api/orders", () => HttpResponse.json({ detail: "품절" }, { status: 409 }))
);
```

### 훅 테스트

```typescript
import { renderHook, act } from "@testing-library/react";
import { useCart } from "@/hooks/useCart";

it("상품 추가 시 장바구니에 항목이 생긴다", () => {
  const { result } = renderHook(() => useCart());

  act(() => {
    result.current.addItem({ productId: "1", quantity: 1 });
  });

  expect(result.current.items).toHaveLength(1);
});
```

## 쿼리 우선순위

```
1순위: getByRole          — 접근성 역할 (button, heading, textbox 등)
2순위: getByLabelText     — 폼 레이블
3순위: getByPlaceholderText — 플레이스홀더
4순위: getByText          — 텍스트 콘텐츠
5순위: getByDisplayValue  — 폼 입력값
6순위: getByAltText       — 이미지 alt
7순위: getByTitle         — title 속성
최후: getByTestId         — data-testid (구현 세부사항 의존 지양)
```

## 실행 명령

```bash
# 전체 테스트 (watch 모드)
npm run test

# 커버리지
npm run test:coverage

# 특정 파일
npx vitest run __tests__/components/ProductCard.test.tsx
```

## 피해야 할 패턴 (Anti-patterns)

```typescript
// ❌ 구현 세부사항 테스트
expect(component.state.isLoading).toBe(false);

// ✅ 사용자 관점 테스트
expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

// ❌ 불필요한 모킹 (실제 동작 검증 불가)
jest.mock("@/lib/utils");

// ✅ MSW로 네트워크만 목킹, 나머지는 실제 코드 실행
```

## Next.js App Router 주의사항

- Server Components는 Vitest로 직접 테스트 불가 → E2E (Playwright)로 커버
- Client Components (`"use client"`)만 Vitest 테스트 대상
- `next/navigation` (useRouter, useParams 등)은 `vi.mock`으로 목킹 필요
- `next/image`, `next/link`는 jsdom에서 자동 처리됨
