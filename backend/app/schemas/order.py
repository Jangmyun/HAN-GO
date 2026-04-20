import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.order import OrderStatus, PaymentMethod


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    schedule_id: uuid.UUID | None = None
    seat_keys: list[str] | None = None
    quantity: int = 1
    selected_options: dict = {}


class OrderCreate(BaseModel):
    store_id: uuid.UUID
    items: list[OrderItemCreate]


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    schedule_id: uuid.UUID | None
    seat_keys: list[str] | None
    quantity: int
    selected_options: dict
    unit_price: int
    subtotal: int

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: uuid.UUID
    order_code: str
    store_id: uuid.UUID
    total_price: int
    status: OrderStatus
    items: list[OrderItemResponse] = []
    created_at: datetime
    paid_at: datetime | None

    model_config = {"from_attributes": True}


class PaymentSubmitRequest(BaseModel):
    method: PaymentMethod


class CancellationRequestCreate(BaseModel):
    reason: str | None = None


# Guest 조회
class GuestOrderLookup(BaseModel):
    order_code: str
    phone: str
