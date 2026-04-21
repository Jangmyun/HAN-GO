from pydantic import BaseModel


class KakaoCallbackRequest(BaseModel):
    code: str
    state: str | None = None


class GuestLoginRequest(BaseModel):
    phone: str  # K-sub-1: 단순 입력 (MVP)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    role: str | None = None
    user_id: str | None = None
    store_id: str | None = None


class StoreLoginRequest(BaseModel):
    email: str
    password: str


class AdminLoginRequest(BaseModel):
    email: str
    password: str
