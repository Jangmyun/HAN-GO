import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.types import UUIDType


class TicketStatus(str, enum.Enum):
    ISSUED = "issued"
    USED = "used"
    REVOKED = "revoked"


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    order_item_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("order_items.id"), nullable=False)
    qr_token: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(Enum(TicketStatus), default=TicketStatus.ISSUED)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scanned_by: Mapped[uuid.UUID | None] = mapped_column(
        UUIDType, ForeignKey("store_accounts.id"), nullable=True
    )
