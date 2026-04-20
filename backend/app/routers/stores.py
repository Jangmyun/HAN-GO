import uuid

from fastapi import APIRouter

from app.schemas.store import StoreCreate, StoreResponse, StoreUpdate

router = APIRouter(prefix="/stores", tags=["stores"])


@router.get("", response_model=list[StoreResponse])
async def list_stores():
    """공개 스토어 목록"""
    raise NotImplementedError


@router.get("/{store_id}", response_model=StoreResponse)
async def get_store(store_id: uuid.UUID):
    """스토어 상세"""
    raise NotImplementedError


@router.post("", response_model=StoreResponse, status_code=201)
async def create_store(body: StoreCreate):
    """스토어 생성 (Admin 전용)"""
    raise NotImplementedError


@router.patch("/{store_id}", response_model=StoreResponse)
async def update_store(store_id: uuid.UUID, body: StoreUpdate):
    """스토어 정보 수정 (StoreAccount 전용)"""
    raise NotImplementedError
