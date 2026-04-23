# HAN:GO 프론트엔드

한동대학교 주문·결제·예매 플랫폼 — Next.js 16 App Router 기반 프론트엔드.

## 로컬 개발

### 백엔드 없이 실행 (MSW 모킹)

백엔드 서버 없이도 개발할 수 있습니다. `.env.local`의 `NEXT_PUBLIC_API_MOCKING=enabled` 설정으로 MSW(Mock Service Worker)가 모든 API 요청을 가로채 인메모리 데이터를 반환합니다.

```bash
npm install
npm run dev
```

브라우저 DevTools Console에서 `[MSW] Mocking enabled.` 메시지가 보이면 정상입니다.
Network 탭에서 API 요청이 `(from ServiceWorker)` 로 표시됩니다.

### 백엔드와 함께 실행

```bash
# .env.local에서 아래 줄을 주석 처리하거나 disabled로 변경
# NEXT_PUBLIC_API_MOCKING=enabled

npm run dev
```

## 테스트

```bash
# 전체 테스트 실행
npm test

# 감시 모드 (파일 저장 시 자동 재실행)
npm test -- --watch

# 커버리지 리포트 생성
npm run test:coverage
```

### 테스트 구조

```
__tests__/
└── components/
    ├── smoke.test.tsx      # Vitest + RTL 설정 검증
    ├── HomePage.test.tsx   # 스토어 목록 페이지
    └── OrdersPage.test.tsx # 주문 목록 + 인증 리다이렉트
```

테스트에서 API를 모킹하는 방법:

```typescript
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";

it("예시", async () => {
  // 이 테스트에서만 핸들러 오버라이드
  server.use(
    http.get("http://localhost:8000/stores", () =>
      HttpResponse.json([{ id: "1", name: "테스트 부스", ... }])
    )
  );

  render(<MyPage />);
  await waitFor(() => expect(screen.getByText("테스트 부스")).toBeInTheDocument());
});
```

픽스처 팩토리를 사용하면 타입에 맞는 목 데이터를 간단하게 만들 수 있습니다:

```typescript
import { createStore, createOrder, createProduct } from "@/mocks/fixtures";

const store = createStore({ name: "커스텀 부스" });
const order = createOrder({ status: "paid", total_price: 15000 });
```

## 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | 백엔드 API 주소 |
| `NEXT_PUBLIC_API_MOCKING` | `enabled` | `enabled` 시 MSW 활성화 |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID` | — | 카카오 OAuth 앱 ID |
| `NEXT_PUBLIC_KAKAO_REDIRECT_URI` | — | 카카오 OAuth 콜백 URI |

## 주요 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
npm test         # Vitest 테스트 실행
```

## MSW 핸들러 업데이트

새 API 엔드포인트를 추가할 때는 `mocks/handlers.ts`에 핸들러를 추가합니다.
`onUnhandledRequest: "error"` 설정으로 인해 핸들러가 누락된 엔드포인트를 테스트가 호출하면 즉시 실패합니다.

서비스 워커 파일을 업데이트해야 할 경우:

```bash
npx msw init public/ --save
```
