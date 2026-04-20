import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.ticket import TicketStatus


class TicketResponse(BaseModel):
    id: uuid.UUID
    order_item_id: uuid.UUID
    qr_token: str
    status: TicketStatus
    issued_at: datetime
    used_at: datetime | None

    model_config = {"from_attributes": True}


class TicketVerifyRequest(BaseModel):
    qr_token: str


class TicketVerifyResponse(BaseModel):
    success: bool
    ticket_id: uuid.UUID | None = None
    message: str
