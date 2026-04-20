import uuid

from fastapi import APIRouter

from app.schemas.ticket import TicketResponse, TicketVerifyRequest, TicketVerifyResponse

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: uuid.UUID):
    """티켓 상세 — QR 코드 표시용 (User)"""
    raise NotImplementedError


@router.post("/verify", response_model=TicketVerifyResponse)
async def verify_ticket(body: TicketVerifyRequest):
    """QR 스캔 검증 (Store L-2) — 원자적 1회 사용 처리"""
    raise NotImplementedError
