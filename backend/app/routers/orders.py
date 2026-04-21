"""주문 라우터 — 생성, 상태 전이, 결제 흐름, 취소 처리."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_store_account, get_current_user_or_guest
from app.core.order_code import generate_order_code
from app.core.security import verify_phone
from app.models.order import (
    CancellationRequest,
    CancellationStatus,
    Order,
    OrderItem,
    OrderStatus,
    Payment,
    PaymentStatus,
)
from app.models.product import PerformanceSchedule, Product, ProductStatus, ProductType, StockMode
from app.models.store import StoreAccount
from app.models.ticket import Ticket, TicketStatus
from app.models.user import AuthType, User
from app.schemas.order import (
    CancellationRequestCreate,
    GuestOrderLookup,
    OrderCreate,
    OrderItemResponse,
    OrderResponse,
    PaymentSubmitRequest,
)

router = APIRouter(prefix="/orders", tags=["orders"])


# ─── 헬퍼 ────────────────────────────────────────────────────────────────────

def _assert_status(order: Order, allowed: list[OrderStatus]) -> None:
    if order.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"invalid_order_status:{order.status}",
        )


async def _load_order_with_items(order_id: uuid.UUID, db: AsyncSession) -> Order:
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="order_not_found")
    return order


async def _get_order_items(order_id: uuid.UUID, db: AsyncSession) -> list[OrderItem]:
    result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    return list(result.scalars().all())


def _build_order_response(order: Order, items: list[OrderItem]) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        order_code=order.order_code,
        store_id=order.store_id,
        user_id=order.user_id,
        total_price=order.total_price,
        status=order.status,
        items=[OrderItemResponse.model_validate(i) for i in items],
        guest_phone=_mask_phone(order.guest_phone),
        created_at=order.created_at,
        paid_at=order.paid_at,
        cancelled_at=order.cancelled_at,
        completed_at=order.completed_at,
    )


def _mask_phone(phone: str | None) -> str | None:
    if not phone:
        return None
    digits = "".join(c for c in phone if c.isdigit())
    return f"***-****-{digits[-4:]}" if len(digits) >= 4 else "***"


# ─── 주문 생성 ────────────────────────────────────────────────────────────────

@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    body: OrderCreate,
    current_user: User = Depends(get_current_user_or_guest),
    db: AsyncSession = Depends(get_db),
):
    """주문 생성 (§5.7: pending). 재고/좌석 원자적 처리."""
    # 상품 조회 및 잠금 (FOR UPDATE)
    product_ids = [item.product_id for item in body.items]
    result = await db.execute(
        select(Product)
        .where(Product.id.in_(product_ids), Product.store_id == body.store_id)
        .with_for_update()
    )
    products = {p.id: p for p in result.scalars().all()}

    if len(products) != len(set(product_ids)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invalid_products")

    order_items_data: list[dict] = []
    total_price = 0

    for item_req in body.items:
        product = products[item_req.product_id]
        if product.status == ProductStatus.DELETED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"product_unavailable:{product.id}")

        # 옵션 가격 계산
        option_delta = 0
        if item_req.selected_options and product.option_schema:
            for field in product.option_schema:
                key = field.get("key")
                if key in item_req.selected_options:
                    option_delta += field.get("price_delta", 0)

        unit_price = product.base_price + option_delta
        quantity = item_req.quantity if product.type != ProductType.PERFORMANCE else len(item_req.seat_keys or [])
        if quantity < 1:
            quantity = 1
        subtotal = unit_price * quantity

        # 재고 검증/차감
        if product.stock_mode == StockMode.TRACKED:
            if product.stock is None or product.stock < quantity:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"out_of_stock:{product.id}")
            product.stock -= quantity
        elif product.stock_mode == StockMode.MANUAL_SOLD_OUT:
            if product.status == ProductStatus.SOLD_OUT:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"sold_out:{product.id}")

        # PERFORMANCE: 좌석 잠금
        schedule_id = item_req.schedule_id
        if product.type == ProductType.PERFORMANCE:
            if not schedule_id or not item_req.seat_keys:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="seat_required_for_performance")
            sched_result = await db.execute(
                select(PerformanceSchedule)
                .where(PerformanceSchedule.id == schedule_id, PerformanceSchedule.product_id == product.id)
                .with_for_update()
            )
            schedule = sched_result.scalar_one_or_none()
            if not schedule:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="schedule_not_found")

            layout = schedule.seat_layout or {}
            cells = {f"{c['row']}-{c['col']}": c for c in layout.get("cells", [])}
            for seat_key in item_req.seat_keys:
                cell = cells.get(seat_key)
                if not cell or cell.get("status") not in ("AVAILABLE", "VIP"):
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT, detail=f"seat_unavailable:{seat_key}"
                    )
                cell["status"] = "SOLD"
            # JSONB 업데이트 — 전체 교체
            layout["cells"] = list(cells.values())
            schedule.seat_layout = layout

        total_price += subtotal
        order_items_data.append({
            "product_id": product.id,
            "schedule_id": schedule_id,
            "seat_keys": item_req.seat_keys,
            "quantity": quantity,
            "selected_options": item_req.selected_options,
            "unit_price": unit_price,
            "subtotal": subtotal,
        })

    # 주문 코드 생성 (최대 3회 재시도)
    order_code = None
    for _ in range(3):
        candidate = generate_order_code()
        check = await db.execute(select(Order).where(Order.order_code == candidate))
        if check.scalar_one_or_none() is None:
            order_code = candidate
            break
    if not order_code:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="order_code_generation_failed")

    # 비회원인 경우 phone 원문 임시 저장 (마스킹 표시용, 해시는 user.phone_hash에 있음)
    guest_phone: str | None = None
    if current_user.auth_type == AuthType.GUEST:
        guest_phone = current_user.phone_hash  # 해시값 저장 (verify_phone으로 검증)

    order = Order(
        order_code=order_code,
        user_id=current_user.id,
        store_id=body.store_id,
        total_price=total_price,
        status=OrderStatus.PENDING,
        guest_phone=guest_phone,
    )
    db.add(order)
    await db.flush()

    items: list[OrderItem] = []
    for data in order_items_data:
        oi = OrderItem(order_id=order.id, **data)
        db.add(oi)
        items.append(oi)

    # 결제 레코드 (기본값)
    payment = Payment(
        order_id=order.id,
        method="BANK_TRANSFER",
        amount=total_price,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)

    await db.commit()
    await db.refresh(order)
    for oi in items:
        await db.refresh(oi)

    return _build_order_response(order, items)


# ─── 주문 목록 ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[OrderResponse])
async def list_orders(
    current_user: User = Depends(get_current_user_or_guest),
    db: AsyncSession = Depends(get_db),
):
    """현재 유저의 주문 목록 (최신순 20건)."""
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .limit(20)
    )
    orders = result.scalars().all()
    responses = []
    for order in orders:
        items = await _get_order_items(order.id, db)
        responses.append(_build_order_response(order, items))
    return responses


# ─── 주문 상세 ────────────────────────────────────────────────────────────────

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    current_user: User = Depends(get_current_user_or_guest),
    db: AsyncSession = Depends(get_db),
):
    """주문 상세 (Member/Guest 본인 주문만)."""
    order = await _load_order_with_items(order_id, db)
    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_order")
    items = await _get_order_items(order_id, db)
    return _build_order_response(order, items)


# ─── 비회원 조회 ──────────────────────────────────────────────────────────────

@router.post("/guest/lookup", response_model=OrderResponse)
async def guest_order_lookup(body: GuestOrderLookup, db: AsyncSession = Depends(get_db)):
    """비회원 주문 조회 — order_code + phone 매칭."""
    result = await db.execute(select(Order).where(Order.order_code == body.order_code))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="order_not_found")

    # 유저 phone_hash로 검증
    user_result = await db.execute(select(User).where(User.id == order.user_id))
    user = user_result.scalar_one_or_none()
    if not user or user.auth_type != AuthType.GUEST or not user.phone_hash:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="order_not_found")

    if not verify_phone(body.phone, user.phone_hash):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="order_not_found")

    items = await _get_order_items(order.id, db)
    return _build_order_response(order, items)


# ─── 결제 제출 (User) ─────────────────────────────────────────────────────────

@router.post("/{order_id}/payment-submit", response_model=OrderResponse)
async def payment_submit(
    order_id: uuid.UUID,
    body: PaymentSubmitRequest,
    current_user: User = Depends(get_current_user_or_guest),
    db: AsyncSession = Depends(get_db),
):
    """입금 완료 신고 (§5.7: pending → payment_submitted)."""
    order = await _load_order_with_items(order_id, db)
    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_order")
    _assert_status(order, [OrderStatus.PENDING])

    order.status = OrderStatus.PAYMENT_SUBMITTED

    # Payment 업데이트
    payment_result = await db.execute(select(Payment).where(Payment.order_id == order_id))
    payment = payment_result.scalar_one_or_none()
    if payment:
        payment.method = body.method
        payment.status = PaymentStatus.SUBMITTED

    await db.commit()
    await db.refresh(order)
    items = await _get_order_items(order_id, db)
    return _build_order_response(order, items)


# ─── 결제 확인 (Store) ────────────────────────────────────────────────────────

@router.post("/{order_id}/payment-confirm", response_model=OrderResponse)
async def payment_confirm(
    order_id: uuid.UUID,
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """결제 확인 (Store, §5.7: payment_submitted → paid). PERFORMANCE는 티켓 자동 발급."""
    order = await _load_order_with_items(order_id, db)
    if order.store_id != current_store.store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_store_order")
    _assert_status(order, [OrderStatus.PAYMENT_SUBMITTED])

    now = datetime.now(timezone.utc)
    order.status = OrderStatus.PAID
    order.paid_at = now

    # Payment 확인
    payment_result = await db.execute(select(Payment).where(Payment.order_id == order_id))
    payment = payment_result.scalar_one_or_none()
    if payment:
        payment.status = PaymentStatus.CONFIRMED
        payment.confirmed_by = current_store.id
        payment.confirmed_at = now

    await db.flush()

    # PERFORMANCE 상품 → 티켓 발급
    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order_id))
    items = list(items_result.scalars().all())

    for oi in items:
        product_result = await db.execute(select(Product).where(Product.id == oi.product_id))
        product = product_result.scalar_one_or_none()
        if product and product.type == ProductType.PERFORMANCE:
            from nanoid import generate as nanoid_generate
            for seat_key in (oi.seat_keys or [""]):
                ticket = Ticket(
                    order_item_id=oi.id,
                    qr_token=nanoid_generate(size=22),
                    status=TicketStatus.ISSUED,
                )
                db.add(ticket)

    await db.commit()
    await db.refresh(order)
    return _build_order_response(order, items)


# ─── 결제 거부 (Store) ────────────────────────────────────────────────────────

@router.post("/{order_id}/payment-reject", response_model=OrderResponse)
async def payment_reject(
    order_id: uuid.UUID,
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """결제 거부 (Store, §5.7: payment_submitted → payment_rejected)."""
    order = await _load_order_with_items(order_id, db)
    if order.store_id != current_store.store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_store_order")
    _assert_status(order, [OrderStatus.PAYMENT_SUBMITTED])

    order.status = OrderStatus.PAYMENT_REJECTED

    payment_result = await db.execute(select(Payment).where(Payment.order_id == order_id))
    payment = payment_result.scalar_one_or_none()
    if payment:
        payment.status = PaymentStatus.REJECTED

    await db.commit()
    await db.refresh(order)
    items = await _get_order_items(order_id, db)
    return _build_order_response(order, items)


# ─── 취소 요청 (User) ─────────────────────────────────────────────────────────

@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: uuid.UUID,
    body: CancellationRequestCreate,
    current_user: User = Depends(get_current_user_or_guest),
    db: AsyncSession = Depends(get_db),
):
    """취소 요청 (User: pending → cancelled_by_user / paid → cancellation_requested)."""
    order = await _load_order_with_items(order_id, db)
    if order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_order")
    _assert_status(order, [OrderStatus.PENDING, OrderStatus.PAYMENT_SUBMITTED, OrderStatus.PAID])

    now = datetime.now(timezone.utc)
    if order.status in (OrderStatus.PENDING, OrderStatus.PAYMENT_SUBMITTED):
        order.status = OrderStatus.CANCELLED_BY_USER
        order.cancelled_at = now
    else:
        order.status = OrderStatus.CANCELLATION_REQUESTED
        cancellation = CancellationRequest(
            order_id=order.id,
            requested_by=current_user.id,
            reason=body.reason,
            status=CancellationStatus.REQUESTED,
        )
        db.add(cancellation)

    await db.commit()
    await db.refresh(order)
    items = await _get_order_items(order_id, db)
    return _build_order_response(order, items)


# ─── 취소 승인 (Store) ────────────────────────────────────────────────────────

@router.post("/{order_id}/cancel-approve", response_model=OrderResponse)
async def cancel_approve(
    order_id: uuid.UUID,
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """취소 승인 (Store: cancellation_requested → cancelled_by_store)."""
    order = await _load_order_with_items(order_id, db)
    if order.store_id != current_store.store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_store_order")
    _assert_status(order, [OrderStatus.CANCELLATION_REQUESTED])

    now = datetime.now(timezone.utc)
    order.status = OrderStatus.CANCELLED_BY_STORE
    order.cancelled_at = now

    cr_result = await db.execute(
        select(CancellationRequest)
        .where(CancellationRequest.order_id == order_id, CancellationRequest.status == CancellationStatus.REQUESTED)
    )
    cr = cr_result.scalar_one_or_none()
    if cr:
        cr.status = CancellationStatus.APPROVED
        cr.resolved_by = current_store.id
        cr.resolved_at = now

    await db.commit()
    await db.refresh(order)
    items = await _get_order_items(order_id, db)
    return _build_order_response(order, items)


# ─── 상태 전이 (Store) ────────────────────────────────────────────────────────

@router.post("/{order_id}/prepare", response_model=OrderResponse)
async def prepare_order(
    order_id: uuid.UUID,
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """조리 시작 (Store, §5.7: paid → preparing)."""
    order = await _load_order_with_items(order_id, db)
    if order.store_id != current_store.store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_store_order")
    _assert_status(order, [OrderStatus.PAID])
    order.status = OrderStatus.PREPARING
    await db.commit()
    await db.refresh(order)
    items = await _get_order_items(order_id, db)
    return _build_order_response(order, items)


@router.post("/{order_id}/ready", response_model=OrderResponse)
async def ready_order(
    order_id: uuid.UUID,
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """준비 완료 (Store, §5.7: preparing → ready)."""
    order = await _load_order_with_items(order_id, db)
    if order.store_id != current_store.store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_store_order")
    _assert_status(order, [OrderStatus.PREPARING])
    order.status = OrderStatus.READY
    await db.commit()
    await db.refresh(order)
    items = await _get_order_items(order_id, db)
    return _build_order_response(order, items)


@router.post("/{order_id}/complete", response_model=OrderResponse)
async def complete_order(
    order_id: uuid.UUID,
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """수령 확인 (Store, §5.7: ready → completed)."""
    order = await _load_order_with_items(order_id, db)
    if order.store_id != current_store.store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_store_order")
    _assert_status(order, [OrderStatus.READY])
    now = datetime.now(timezone.utc)
    order.status = OrderStatus.COMPLETED
    order.completed_at = now
    await db.commit()
    await db.refresh(order)
    items = await _get_order_items(order_id, db)
    return _build_order_response(order, items)


# ─── 스토어 주문 목록 (Store) ─────────────────────────────────────────────────

@router.get("/store/list", response_model=list[OrderResponse])
async def store_order_list(
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """스토어 오너용 주문 목록 (최신순 50건)."""
    result = await db.execute(
        select(Order)
        .where(Order.store_id == current_store.store_id)
        .order_by(Order.created_at.desc())
        .limit(50)
    )
    orders = result.scalars().all()
    responses = []
    for order in orders:
        items = await _get_order_items(order.id, db)
        responses.append(_build_order_response(order, items))
    return responses
