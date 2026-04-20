---
name: backend-test
description: HAN:GO FastAPI 백엔드 테스트 작성 — pytest-asyncio, httpx.AsyncClient, dependency_overrides 패턴
user-invocable: true
---

# HAN:GO 백엔드 테스트 스킬

## 핵심 원칙 (출처: unit-test-design, async-testing-expert 방법론)

- **Arrange-Act-Assert** 구조를 모든 테스트에 적용
- **dependency_overrides**로 실제 DB 대신 테스트 세션 주입 (네트워크 없음)
- **pytest-asyncio auto mode** — `async def test_*`는 자동으로 비동기 실행
- **격리**: 각 테스트는 롤백으로 격리, 테스트 간 상태 공유 금지
- **1 테스트 1 동작**: 하나의 테스트에서 하나의 동작만 검증

## 테스트 스택

```
pytest + pytest-asyncio    # 비동기 테스트 실행
httpx.AsyncClient          # FastAPI ASGI 직접 호출 (네트워크 없음)
SQLite + aiosqlite         # 인메모리 테스트 DB (JSONB→JSON, UUID→String 자동 변환)
app.dependency_overrides   # get_db 주입 교체
```

## 파일 구조

```
backend/tests/
├── conftest.py          # 공통 픽스처 (client, db_session)
├── factories.py         # 테스트 데이터 팩토리 함수
├── test_health.py       # 스모크 테스트
├── test_auth.py         # 인증 엔드포인트
├── test_orders.py       # 주문 상태 머신
├── test_tickets.py      # QR 검증 (L-2)
└── ...
```

## 기본 픽스처 (conftest.py)

```python
@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

## 테스트 작성 패턴

### 기본 엔드포인트 테스트

```python
async def test_get_store(client, db_session):
    # Arrange: DB에 직접 데이터 생성
    store = Store(name="테스트부스", slug="test-booth", ...)
    db_session.add(store)
    await db_session.commit()

    # Act
    response = await client.get(f"/stores/{store.id}")

    # Assert
    assert response.status_code == 200
    assert response.json()["name"] == "테스트부스"
```

### 팩토리 함수 패턴 (재사용 가능한 테스트 데이터)

```python
# tests/factories.py
def make_user(auth_type=AuthType.KAKAO, **overrides) -> User:
    return User(
        id=uuid.uuid4(),
        auth_type=auth_type,
        nickname="테스트유저",
        **overrides,
    )

def make_store(**overrides) -> Store:
    slug = overrides.pop("slug", f"store-{uuid.uuid4().hex[:8]}")
    return Store(name="테스트스토어", slug=slug, **overrides)
```

### 주문 상태 머신 테스트 (§5.7)

```python
async def test_payment_submit_transitions_to_payment_submitted(client, db_session):
    # Arrange
    order = make_order(status=OrderStatus.PENDING)
    db_session.add(order)
    await db_session.commit()

    # Act
    response = await client.post(
        f"/orders/{order.id}/payment-submit",
        json={"method": "BANK_TRANSFER"},
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["status"] == "payment_submitted"
```

### 허용되지 않는 상태 전이 테스트

```python
async def test_cannot_submit_payment_for_completed_order(client, db_session):
    order = make_order(status=OrderStatus.COMPLETED)
    db_session.add(order)
    await db_session.commit()

    response = await client.post(f"/orders/{order.id}/payment-submit", json={"method": "BANK_TRANSFER"})
    assert response.status_code == 409  # Conflict
```

### QR 검증 원자성 테스트 (L-2)

```python
async def test_qr_verify_marks_ticket_used(client, db_session):
    ticket = make_ticket(status=TicketStatus.ISSUED)
    db_session.add(ticket)
    await db_session.commit()

    response = await client.post("/tickets/verify", json={"qr_token": ticket.qr_token})
    assert response.status_code == 200
    assert response.json()["success"] is True

async def test_qr_verify_rejects_already_used(client, db_session):
    ticket = make_ticket(status=TicketStatus.USED)
    db_session.add(ticket)
    await db_session.commit()

    response = await client.post("/tickets/verify", json={"qr_token": ticket.qr_token})
    assert response.status_code == 409
```

## 실행 명령

```bash
# 전체 테스트
uv run pytest

# 특정 파일
uv run pytest tests/test_orders.py -v

# 커버리지
uv run pytest --cov=app --cov-report=term-missing
```

## 주의사항

- SQLite는 PostgreSQL Enum을 String으로 저장 — Enum 비교 시 `.value` 사용
- `UUIDType`, `JSONType`은 `app/core/types.py`에 정의된 dialect-aware 커스텀 타입
- 외부 서비스(카카오 OAuth, S3) 호출은 `unittest.mock.patch`로 목킹
