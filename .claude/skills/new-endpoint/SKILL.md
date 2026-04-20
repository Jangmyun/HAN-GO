---
name: new-endpoint
description: FastAPI 엔드포인트 + Pydantic 스키마 + TypeScript 타입을 HAN:GO PRD 기준으로 전체 스택 스캐폴딩
---

PRD(`HAN-GO_PRD_v0.3.md`)와 `CLAUDE.md`를 참고하여 아래 리소스에 대한 엔드포인트를 전체 스택으로 구현하라.

## 대상

$ARGUMENTS

## 구현 체크리스트

1. **PRD 확인**: §4 역할(Admin/Store/User/Guest), §8 데이터 모델에서 관련 엔티티와 필드를 확인한다.

2. **Pydantic 스키마** (`backend/schemas/`)
   - `XxxCreate` / `XxxResponse` 를 분리한다.
   - Guest 주문 관련이면 `guest_phone` 필드 포함 여부를 확인한다.

3. **FastAPI 라우터** (`backend/routers/`)
   - 의존성: Admin·Store·User·Guest 세션 중 맞는 것을 주입한다.
   - 주문 금액 계산은 반드시 `calculate_order_total()` 단일 진입점을 사용한다 (§9.2).
   - 좌석 선점이 포함되면 DB 행 락 + 5분 홀드 TTL을 적용한다 (§7.1).

4. **TypeScript 타입** (`frontend/types/`)
   - Pydantic 스키마와 1:1 대응하는 타입을 작성한다.

5. **단위 테스트 스텁** (`backend/tests/`)
   - 정상 케이스 / 권한 오류(403) / 잘못된 상태 전이 케이스를 포함한다.
