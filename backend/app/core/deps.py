"""FastAPI Depends() 의존성 — 인증 가드."""
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.models.store import AdminAccount, StoreAccount
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


def _get_token(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> str:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="not_authenticated")
    return credentials.credentials


async def get_current_user(
    token: str = Depends(_get_token),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Kakao 회원 전용."""
    payload = decode_token(token)
    if payload.get("role") != "user":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="user_only")
    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user_not_found")
    return user


async def get_current_user_or_guest(
    token: str = Depends(_get_token),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Kakao 회원 + 비회원 모두 허용."""
    payload = decode_token(token)
    role = payload.get("role")
    if role not in ("user", "guest"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="user_or_guest_only")
    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user_not_found")
    return user


async def get_current_store_account(
    token: str = Depends(_get_token),
    db: AsyncSession = Depends(get_db),
) -> StoreAccount:
    """스토어 계정 전용."""
    payload = decode_token(token)
    if payload.get("role") != "store":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="store_only")
    account_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(StoreAccount).where(StoreAccount.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="store_account_not_found")
    return account


async def get_current_admin(
    token: str = Depends(_get_token),
    db: AsyncSession = Depends(get_db),
) -> AdminAccount:
    """관리자 전용."""
    payload = decode_token(token)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="admin_only")
    admin_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(AdminAccount).where(AdminAccount.id == admin_id))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="admin_not_found")
    return admin
