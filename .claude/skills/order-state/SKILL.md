---
name: order-state
description: PRD §5.7 상태 머신 기준으로 주문·티켓 상태 전이 구현 또는 디버깅
---

PRD(`HAN-GO_PRD_v0.3.md`) §5.7 상태 머신을 기준으로 아래 전이 로직을 구현하거나 디버깅하라.

## 전이 대상 또는 증상

$ARGUMENTS

## PRD 기준 상태 머신

**일반 주문 (FOOD / MERCH)**
```
pending → payment_submitted → paid → preparing → ready → completed
pending → cancelled_by_user
payment_submitted → payment_rejected
paid → cancellation_requested → cancelled_by_store
cancellation_requested → preparing  (스토어가 취소 거부)
```

**공연 (PERFORMANCE)**
```
pending → payment_submitted → paid → issued → used
```

## 확인 체크리스트

1. **허용 전이 Guard**: `ALLOWED_TRANSITIONS` 딕셔너리 같은 명시적 검증 함수가 있는지 확인한다. 없으면 추가한다.

2. **QR 원자성 (§5.6 L-2)**: `POST /tickets/verify` 에서 `UPDATE ... WHERE status='issued'` 원자적 업데이트를 사용하는지 확인한다. 동시 스캔 시 두 번째 요청이 409를 반환해야 한다.

3. **PERFORMANCE paid → issued**: `paid` 전환 시 `Ticket` 레코드가 즉시 생성되고 nanoid 22자+ `qr_token`이 부여되는지 확인한다.

4. **취소 정책 (확정 E)**: `preparing` 이후에는 스토어 승인 없이 `cancelled_by_user`로 직접 전이되지 않는지 확인한다.

5. **테스트 작성**: 유효 전이 + 무효 전이(예외 발생 여부)를 각각 단위 테스트로 작성한다.
