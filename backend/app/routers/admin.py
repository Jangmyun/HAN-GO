import uuid

from fastapi import APIRouter

from app.schemas.store import StoreAccountCreate, StoreCreate, StoreResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/stores", response_model=StoreResponse, status_code=201)
async def admin_create_store(body: StoreCreate, account: StoreAccountCreate):
    """스토어 계정 발급 + 스토어 생성 (A-01)"""
    raise NotImplementedError


@router.patch("/stores/{store_id}/status")
async def admin_update_store_status(store_id: uuid.UUID, status: str):
    """스토어 활성/정지/삭제 (A-02)"""
    raise NotImplementedError


@router.get("/stores", response_model=list[StoreResponse])
async def admin_list_stores():
    """전체 스토어 목록 (A-03)"""
    raise NotImplementedError
