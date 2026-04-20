from fastapi import APIRouter

from app.schemas.auth import (
    AdminLoginRequest,
    GuestLoginRequest,
    KakaoCallbackRequest,
    StoreLoginRequest,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/kakao/callback", response_model=TokenResponse)
async def kakao_callback(body: KakaoCallbackRequest):
    """카카오 OAuth 콜백 — 인가 코드로 사용자 토큰 발급"""
    raise NotImplementedError


@router.post("/guest", response_model=TokenResponse)
async def guest_login(body: GuestLoginRequest):
    """비회원 로그인 — 전화번호 입력 → Guest 세션 발급 (K-sub-1 MVP)"""
    raise NotImplementedError


@router.post("/store/login", response_model=TokenResponse)
async def store_login(body: StoreLoginRequest):
    """스토어 계정 로그인"""
    raise NotImplementedError


@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(body: AdminLoginRequest):
    """관리자 계정 로그인"""
    raise NotImplementedError
