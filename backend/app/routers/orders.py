import uuid

from fastapi import APIRouter

from app.schemas.order import (
    CancellationRequestCreate,
    GuestOrderLookup,
    OrderCreate,
    OrderResponse,
    PaymentSubmitRequest,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(body: OrderCreate):
    """주문 생성 (§5.7: pending)"""
    raise NotImplementedError


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: uuid.UUID):
    """주문 상세 (Member)"""
    raise NotImplementedError


@router.post("/guest/lookup", response_model=OrderResponse)
async def guest_order_lookup(body: GuestOrderLookup):
    """비회원 주문 조회 — order_code + phone 매칭"""
    raise NotImplementedError


@router.post("/{order_id}/payment-submit", response_model=OrderResponse)
async def payment_submit(order_id: uuid.UUID, body: PaymentSubmitRequest):
    """결제 완료 신고 (§5.7: pending → payment_submitted)"""
    raise NotImplementedError


@router.post("/{order_id}/payment-confirm", response_model=OrderResponse)
async def payment_confirm(order_id: uuid.UUID):
    """결제 확인 (Store, §5.7: payment_submitted → paid)"""
    raise NotImplementedError


@router.post("/{order_id}/payment-reject", response_model=OrderResponse)
async def payment_reject(order_id: uuid.UUID):
    """결제 거부 (Store, §5.7: payment_submitted → payment_rejected)"""
    raise NotImplementedError


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(order_id: uuid.UUID, body: CancellationRequestCreate):
    """취소 요청 (User: paid → cancellation_requested / pending → cancelled_by_user)"""
    raise NotImplementedError


@router.post("/{order_id}/prepare", response_model=OrderResponse)
async def prepare_order(order_id: uuid.UUID):
    """조리 시작 (Store, §5.7: paid → preparing)"""
    raise NotImplementedError


@router.post("/{order_id}/ready", response_model=OrderResponse)
async def ready_order(order_id: uuid.UUID):
    """준비 완료 (Store, §5.7: preparing → ready)"""
    raise NotImplementedError


@router.post("/{order_id}/complete", response_model=OrderResponse)
async def complete_order(order_id: uuid.UUID):
    """수령 확인 (Store, §5.7: ready → completed)"""
    raise NotImplementedError
