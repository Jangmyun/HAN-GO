---
name: migration
description: HAN:GO PostgreSQL 스키마 변경에 대한 Alembic 마이그레이션 생성 및 검증
---

아래 변경 사항에 대한 Alembic 마이그레이션을 생성하고 검증하라.

## 변경 내용

$ARGUMENTS

## 작업 순서

1. **PRD 스키마 대조** (`HAN-GO_PRD_v0.3.md` §8)
   - 변경하려는 테이블/컬럼이 PRD 정의와 일치하는지 확인한다.

2. **현재 모델 확인** (`backend/models/`)
   - SQLAlchemy 모델을 읽어 변경 범위를 파악한다.

3. **마이그레이션 생성**
   ```bash
   alembic revision --autogenerate -m "<설명>"
   ```
   생성된 파일에서 다음을 검토한다.
   - JSONB 컬럼(`option_schema`, `seat_layout`, `payment_methods`)에 PostgreSQL dialect 타입이 명시됐는지 확인한다.
   - `Ticket.qr_token` 에 UNIQUE 인덱스가 있는지 확인한다.
   - `Order.order_code` 에 인덱스가 있는지 확인한다 (Guest 조회 쿼리 성능: §8 Guest 주문 조회 쿼리 참고).

4. **실행 및 롤백 테스트**
   ```bash
   alembic upgrade head && alembic downgrade -1 && alembic upgrade head
   ```
