import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class PaymentMethodSchema(BaseModel):
    type: str  # "kakaopay_url" | "bank_account"
    value: str | None = None       # kakaopay_url value
    bank: str | None = None        # bank name
    number: str | None = None      # account number
    holder: str | None = None      # account holder


class StoreCreate(BaseModel):
    name: str
    slug: str
    location: str | None = None
    opening_hours: str | None = None
    description: str | None = None
    payment_methods: list[PaymentMethodSchema] = []


class StoreUpdate(BaseModel):
    name: str | None = None
    location: str | None = None
    opening_hours: str | None = None
    description: str | None = None
    payment_methods: list[PaymentMethodSchema] | None = None


class StoreResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    location: str | None
    opening_hours: str | None
    description: str | None
    payment_methods: list[PaymentMethodSchema]
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class StoreAccountCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "owner"
