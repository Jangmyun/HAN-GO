"""티켓 라우터 — QR 조회 + 원자적 스캔 검증 (L-2)."""
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_store_account, get_current_user_or_guest
from app.models.order import Order, OrderItem
from app.models.product import PerformanceSchedule, Product, ProductType
from app.models.store import StoreAccount
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User
from app.schemas.ticket import TicketResponse, TicketVerifyRequest, TicketVerifyResponse

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(
    ticket_id: uuid.UUID,
    current_user: User = Depends(get_current_user_or_guest),
    db: AsyncSession = Depends(get_db),
):
    """티켓 상세 — QR 코드 표시용 (User 본인 주문 티켓만)."""
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ticket_not_found")

    # 소유권 검증: ticket → order_item → order.user_id
    oi_result = await db.execute(select(OrderItem).where(OrderItem.id == ticket.order_item_id))
    order_item = oi_result.scalar_one_or_none()
    if not order_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ticket_not_found")

    order_result = await db.execute(select(Order).where(Order.id == order_item.order_id))
    order = order_result.scalar_one_or_none()
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_ticket")

    return ticket


@router.post("/verify", response_model=TicketVerifyResponse)
async def verify_ticket(
    body: TicketVerifyRequest,
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """QR 스캔 검증 (Store L-2) — 원자적 1회 사용 처리."""
    # 1. 토큰으로 티켓 조회 (FOR UPDATE로 행 잠금)
    result = await db.execute(
        select(Ticket).where(Ticket.qr_token == body.qr_token).with_for_update(skip_locked=True)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        return TicketVerifyResponse(success=False, message="invalid_token")

    # 2. 이미 사용됨 확인
    if ticket.status != TicketStatus.ISSUED:
        return TicketVerifyResponse(success=False, ticket_id=ticket.id, message="already_used")

    # 3. 소유권 검증: ticket → order_item → order → store
    oi_result = await db.execute(select(OrderItem).where(OrderItem.id == ticket.order_item_id))
    order_item = oi_result.scalar_one_or_none()
    if not order_item:
        return TicketVerifyResponse(success=False, message="invalid_token")

    order_result = await db.execute(select(Order).where(Order.id == order_item.order_id))
    order = order_result.scalar_one_or_none()
    if not order or order.store_id != current_store.store_id:
        return TicketVerifyResponse(success=False, message="store_mismatch")

    # 4. PERFORMANCE: 시간 창 검증 (±N시간)
    product_result = await db.execute(select(Product).where(Product.id == order_item.product_id))
    product = product_result.scalar_one_or_none()
    if product and product.type == ProductType.PERFORMANCE and order_item.schedule_id:
        sched_result = await db.execute(
            select(PerformanceSchedule).where(PerformanceSchedule.id == order_item.schedule_id)
        )
        schedule = sched_result.scalar_one_or_none()
        if schedule:
            event_time = schedule.datetime
            if event_time.tzinfo is None:
                event_time = event_time.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            window = timedelta(hours=settings.qr_time_window_hours)
            if abs(now - event_time) > window:
                return TicketVerifyResponse(
                    success=False,
                    ticket_id=ticket.id,
                    message="outside_time_window",
                )

    # 5. 원자적 상태 전환 (rowcount로 경쟁 조건 처리)
    now = datetime.now(timezone.utc)
    stmt = (
        update(Ticket)
        .where(Ticket.id == ticket.id, Ticket.status == TicketStatus.ISSUED)
        .values(status=TicketStatus.USED, used_at=now, scanned_by=current_store.id)
    )
    result2 = await db.execute(stmt)
    await db.commit()

    if result2.rowcount == 0:
        return TicketVerifyResponse(success=False, ticket_id=ticket.id, message="already_used")

    return TicketVerifyResponse(success=True, ticket_id=ticket.id, message="ok")
