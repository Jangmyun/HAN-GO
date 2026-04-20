import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuthType(str, enum.Enum):
    KAKAO = "KAKAO"
    GUEST = "GUEST"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auth_type: Mapped[AuthType] = mapped_column(Enum(AuthType), nullable=False)
    kakao_id: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    nickname: Mapped[str | None] = mapped_column(String(50), nullable=True)
    profile_image: Mapped[str | None] = mapped_column(String, nullable=True)
    phone_hash: Mapped[str | None] = mapped_column(String, nullable=True)  # bcrypt hashed
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
