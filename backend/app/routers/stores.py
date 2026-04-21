"""스토어 라우터 — 공개 조회 + 스토어 오너 수정."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_store_account
from app.models.store import Store, StoreAccount, StoreStatus
from app.schemas.store import StoreCreate, StoreResponse, StoreUpdate

router = APIRouter(prefix="/stores", tags=["stores"])


@router.get("", response_model=list[StoreResponse])
async def list_stores(
    event_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    """공개 스토어 목록 (active만)."""
    stmt = select(Store).where(Store.status == StoreStatus.ACTIVE).order_by(Store.created_at.desc())
    result = await db.execute(stmt)
    stores = result.scalars().all()
    return stores


@router.get("/by-slug/{slug}", response_model=StoreResponse)
async def get_store_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """slug로 스토어 조회 (프론트 URL 라우팅용)."""
    result = await db.execute(
        select(Store).where(Store.slug == slug, Store.status != StoreStatus.DELETED)
    )
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="store_not_found")
    return store


@router.get("/{store_id}", response_model=StoreResponse)
async def get_store(store_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """스토어 상세."""
    result = await db.execute(
        select(Store).where(Store.id == store_id, Store.status != StoreStatus.DELETED)
    )
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="store_not_found")
    return store


@router.post("", response_model=StoreResponse, status_code=201)
async def create_store(body: StoreCreate, db: AsyncSession = Depends(get_db)):
    """스토어 생성 (Admin 라우터에서도 호출; 직접 호출 시 Admin 토큰 검증은 admin.py에서)."""
    store = Store(
        name=body.name,
        slug=body.slug,
        location=body.location,
        opening_hours=body.opening_hours,
        description=body.description,
        payment_methods=[m.model_dump() for m in body.payment_methods],
    )
    db.add(store)
    await db.commit()
    await db.refresh(store)
    return store


@router.patch("/{store_id}", response_model=StoreResponse)
async def update_store(
    store_id: uuid.UUID,
    body: StoreUpdate,
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """스토어 정보 수정 (StoreAccount 전용)."""
    if current_store.store_id != store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_store")

    result = await db.execute(
        select(Store).where(Store.id == store_id, Store.status != StoreStatus.DELETED)
    )
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="store_not_found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "payment_methods" and value is not None:
            setattr(store, key, [m.model_dump() if hasattr(m, "model_dump") else m for m in value])
        else:
            setattr(store, key, value)

    await db.commit()
    await db.refresh(store)
    return store
