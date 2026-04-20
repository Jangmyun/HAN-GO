import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.types import JSONType, UUIDType


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAYMENT_SUBMITTED = "payment_submitted"
    PAID = "paid"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    PAYMENT_REJECTED = "payment_rejected"
    CANCELLED_BY_USER = "cancelled_by_user"
    CANCELLATION_REQUESTED = "cancellation_requested"
    CANCELLED_BY_STORE = "cancelled_by_store"


class PaymentMethod(str, enum.Enum):
    KAKAOPAY_URL = "KAKAOPAY_URL"
    BANK_TRANSFER = "BANK_TRANSFER"
    OTHER = "OTHER"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"


class CancellationStatus(str, enum.Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    order_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("users.id"), nullable=False)
    store_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("stores.id"), nullable=False)
    total_price: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), default=OrderStatus.PENDING)
    guest_phone: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("products.id"), nullable=False)
    schedule_id: Mapped[uuid.UUID | None] = mapped_column(
        UUIDType, ForeignKey("performance_schedules.id"), nullable=True
    )
    seat_keys: Mapped[list | None] = mapped_column(JSONType, nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    selected_options: Mapped[dict] = mapped_column(JSONType, default=dict)
    unit_price: Mapped[int] = mapped_column(Integer, nullable=False)
    subtotal: Mapped[int] = mapped_column(Integer, nullable=False)


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("orders.id"), nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(Enum(PaymentMethod), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    confirmed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUIDType, ForeignKey("store_accounts.id"), nullable=True
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CancellationRequest(Base):
    __tablename__ = "cancellation_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("orders.id"), nullable=False)
    requested_by: Mapped[uuid.UUID] = mapped_column(UUIDType, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[CancellationStatus] = mapped_column(Enum(CancellationStatus), default=CancellationStatus.REQUESTED)
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(UUIDType, nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
