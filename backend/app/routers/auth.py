"""인증 라우터 — Kakao OAuth, 비회원 Guest, 스토어/Admin JWT 발급."""
import re
from datetime import timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    hash_password,
    hash_phone,
    verify_password,
)
from app.models.store import AdminAccount, StoreAccount
from app.models.user import AuthType, User
from app.schemas.auth import (
    AdminLoginRequest,
    GuestLoginRequest,
    KakaoCallbackRequest,
    StoreLoginRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_PHONE_RE = re.compile(r"^\d{9,11}$")


# ─── Kakao OAuth ─────────────────────────────────────────────────────────────

@router.post("/kakao/callback", response_model=TokenResponse)
async def kakao_callback(body: KakaoCallbackRequest, db: AsyncSession = Depends(get_db)):
    """카카오 OAuth 콜백 — 인가 코드로 사용자 JWT 발급."""
    # 1. 인가 코드 → 카카오 액세스 토큰 교환
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type": "authorization_code",
                "client_id": settings.kakao_client_id,
                "redirect_uri": settings.kakao_redirect_uri,
                "code": body.code,
            },
        )
    if token_res.status_code != 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="kakao_token_exchange_failed")
    kakao_token = token_res.json().get("access_token")

    # 2. 카카오 사용자 정보 조회
    async with httpx.AsyncClient() as client:
        me_res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {kakao_token}"},
        )
    if me_res.status_code != 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="kakao_user_info_failed")
    me = me_res.json()
    kakao_id = str(me["id"])
    profile = me.get("kakao_account", {}).get("profile", {})
    nickname = profile.get("nickname")
    profile_image = profile.get("profile_image_url")

    # 3. User upsert
    result = await db.execute(select(User).where(User.kakao_id == kakao_id))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            auth_type=AuthType.KAKAO,
            kakao_id=kakao_id,
            nickname=nickname,
            profile_image=profile_image,
        )
        db.add(user)
    else:
        user.nickname = nickname
        user.profile_image = profile_image
    from datetime import datetime, timezone
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    expires = timedelta(minutes=settings.access_token_expire_minutes)
    token = create_access_token(sub=str(user.id), role="user", expires_delta=expires)
    return TokenResponse(
        access_token=token,
        expires_in=int(expires.total_seconds()),
        role="user",
        user_id=str(user.id),
    )


# ─── 비회원 Guest ─────────────────────────────────────────────────────────────

@router.post("/guest", response_model=TokenResponse)
async def guest_login(body: GuestLoginRequest, db: AsyncSession = Depends(get_db)):
    """비회원 로그인 — 전화번호 입력 → 24h Guest 세션 발급 (K-sub-1 MVP)."""
    digits = "".join(c for c in body.phone if c.isdigit())
    if not _PHONE_RE.match(digits):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="invalid_phone")

    phone_hash = hash_phone(digits)

    # 동일 전화번호 Guest 유저 조회 — bcrypt 특성상 전체 스캔 필요 (MVP, 소규모)
    result = await db.execute(select(User).where(User.auth_type == AuthType.GUEST))
    all_guests = result.scalars().all()

    user: User | None = None
    from app.core.security import verify_phone
    for g in all_guests:
        if g.phone_hash and verify_phone(digits, g.phone_hash):
            user = g
            break

    from datetime import datetime, timezone
    if user is None:
        user = User(auth_type=AuthType.GUEST, phone_hash=phone_hash)
        db.add(user)
    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(user)

    expires = timedelta(hours=settings.guest_session_ttl_hours)
    token = create_access_token(sub=str(user.id), role="guest", expires_delta=expires)
    return TokenResponse(
        access_token=token,
        expires_in=int(expires.total_seconds()),
        role="guest",
        user_id=str(user.id),
    )


# ─── 스토어 로그인 ─────────────────────────────────────────────────────────────

@router.post("/store/login", response_model=TokenResponse)
async def store_login(body: StoreLoginRequest, db: AsyncSession = Depends(get_db)):
    """스토어 계정 로그인 — email/password → JWT (role=store)."""
    result = await db.execute(select(StoreAccount).where(StoreAccount.email == body.email))
    account = result.scalar_one_or_none()
    if not account or not verify_password(body.password, account.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_credentials")

    expires = timedelta(minutes=settings.access_token_expire_minutes)
    token = create_access_token(
        sub=str(account.id),
        role="store",
        extra={"store_id": str(account.store_id)},
        expires_delta=expires,
    )
    return TokenResponse(
        access_token=token,
        expires_in=int(expires.total_seconds()),
        role="store",
        store_id=str(account.store_id),
    )


# ─── Admin 로그인 ─────────────────────────────────────────────────────────────

@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(body: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    """관리자 계정 로그인 — email/password → JWT (role=admin)."""
    result = await db.execute(select(AdminAccount).where(AdminAccount.email == body.email))
    admin = result.scalar_one_or_none()
    if not admin or not verify_password(body.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid_credentials")

    expires = timedelta(minutes=settings.access_token_expire_minutes)
    token = create_access_token(sub=str(admin.id), role="admin", expires_delta=expires)
    return TokenResponse(
        access_token=token,
        expires_in=int(expires.total_seconds()),
        role="admin",
    )
