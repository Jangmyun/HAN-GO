"""JWT 토큰 생성/검증 및 비밀번호/전화번호 해시 유틸리티."""
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ─── 비밀번호/전화번호 해시 ───────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def hash_phone(phone: str) -> str:
    """전화번호 bcrypt 해시 (DB에 원문 저장하지 않음)."""
    digits = "".join(c for c in phone if c.isdigit())
    return pwd_context.hash(digits)


def verify_phone(phone: str, phone_hash: str) -> bool:
    digits = "".join(c for c in phone if c.isdigit())
    return pwd_context.verify(digits, phone_hash)


# ─── JWT ─────────────────────────────────────────────────────────────────────

def create_access_token(
    sub: str,
    role: str,
    extra: dict | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """JWT 발급. sub=엔티티 UUID, role=user|guest|store|admin."""
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload: dict = {"sub": sub, "role": role, "exp": expire}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_token(token: str) -> dict:
    """토큰 디코딩. 만료/서명 오류 시 401 반환."""
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_or_expired_token",
            headers={"WWW-Authenticate": "Bearer"},
        )
