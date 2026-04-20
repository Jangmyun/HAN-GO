import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.product import ProductStatus, ProductType, StockMode


class OptionField(BaseModel):
    key: str
    label: str
    type: str                   # "select" | "boolean" | "text"
    values: list[str] | None = None
    required: bool = False
    price_delta: int = 0        # KRW


class SeatCell(BaseModel):
    row: int
    col: int
    label: str | None = None
    status: str = "AVAILABLE"   # AVAILABLE | UNAVAILABLE | VIP | SOLD
    tier: str = "GENERAL"


class SeatLayout(BaseModel):
    rows: int
    cols: int
    cells: list[SeatCell] = []
    tier_prices: dict[str, int] = {}  # {"GENERAL": 10000, "VIP": 15000}


class ScheduleCreate(BaseModel):
    datetime: datetime
    venue: str | None = None
    seat_layout: SeatLayout


class ProductCreate(BaseModel):
    type: ProductType
    name: str
    description: str | None = None
    base_price: int
    stock_mode: StockMode = StockMode.UNLIMITED
    stock: int | None = None
    option_schema: list[OptionField] = []
    event_id: uuid.UUID | None = None
    schedules: list[ScheduleCreate] = []   # PERFORMANCE only


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    base_price: int | None = None
    status: ProductStatus | None = None
    stock_mode: StockMode | None = None
    stock: int | None = None
    option_schema: list[OptionField] | None = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    store_id: uuid.UUID
    event_id: uuid.UUID | None
    type: ProductType
    name: str
    description: str | None
    base_price: int
    status: ProductStatus
    stock_mode: StockMode
    stock: int | None
    option_schema: list
    created_at: datetime

    model_config = {"from_attributes": True}
