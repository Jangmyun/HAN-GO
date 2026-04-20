import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.types import JSONType, UUIDType


class ProductType(str, enum.Enum):
    FOOD = "FOOD"
    PERFORMANCE = "PERFORMANCE"
    MERCH = "MERCH"


class ProductStatus(str, enum.Enum):
    ACTIVE = "active"
    SOLD_OUT = "sold_out"
    HIDDEN = "hidden"
    DELETED = "deleted"


class StockMode(str, enum.Enum):
    UNLIMITED = "unlimited"
    TRACKED = "tracked"
    MANUAL_SOLD_OUT = "manual_sold_out"


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cover_image: Mapped[str | None] = mapped_column(String, nullable=True)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    store_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("stores.id"), nullable=False)
    event_id: Mapped[uuid.UUID | None] = mapped_column(UUIDType, ForeignKey("events.id"), nullable=True)
    type: Mapped[ProductType] = mapped_column(Enum(ProductType), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    base_price: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[ProductStatus] = mapped_column(Enum(ProductStatus), default=ProductStatus.ACTIVE)
    stock_mode: Mapped[StockMode] = mapped_column(Enum(StockMode), default=StockMode.UNLIMITED)
    stock: Mapped[int | None] = mapped_column(Integer, nullable=True)
    option_schema: Mapped[list] = mapped_column(JSONType, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class PerformanceSchedule(Base):
    __tablename__ = "performance_schedules"

    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("products.id"), nullable=False)
    datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    venue: Mapped[str | None] = mapped_column(String(200), nullable=True)
    seat_layout: Mapped[dict] = mapped_column(JSONType, default=dict)
