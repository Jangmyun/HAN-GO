"""관리자 라우터 — 스토어 발급·관리 (A-01, A-02, A-03)."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_admin
from app.core.security import hash_password
from app.models.store import AdminAccount, Store, StoreAccount, StoreStatus
from app.schemas.store import AdminStoreCreate, StoreResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/stores", response_model=StoreResponse, status_code=201)
async def admin_create_store(
    body: AdminStoreCreate,
    _admin: AdminAccount = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """스토어 + StoreAccount 동시 발급 (A-01)."""
    # slug 중복 체크
    existing = await db.execute(select(Store).where(Store.slug == body.store.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="slug_already_exists")

    store = Store(
        name=body.store.name,
        slug=body.store.slug,
        location=body.store.location,
        opening_hours=body.store.opening_hours,
        description=body.store.description,
        payment_methods=[m.model_dump() for m in body.store.payment_methods],
        status=StoreStatus.ACTIVE,
    )
    db.add(store)
    await db.flush()

    account = StoreAccount(
        store_id=store.id,
        email=body.account.email,
        password_hash=hash_password(body.account.password),
        role=body.account.role,
    )
    db.add(account)
    await db.commit()
    await db.refresh(store)
    return store


@router.patch("/stores/{store_id}/status")
async def admin_update_store_status(
    store_id: uuid.UUID,
    status: str,
    _admin: AdminAccount = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """스토어 활성/정지/삭제 (A-02)."""
    allowed = {s.value for s in StoreStatus}
    if status not in allowed:
        raise HTTPException(status_code=422, detail=f"invalid_status. allowed: {allowed}")

    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="store_not_found")

    store.status = StoreStatus(status)
    await db.commit()
    return {"id": str(store.id), "status": store.status}


@router.get("/stores", response_model=list[StoreResponse])
async def admin_list_stores(
    _admin: AdminAccount = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """전체 스토어 목록 (status 무관, A-03)."""
    result = await db.execute(select(Store).order_by(Store.created_at.desc()))
    return result.scalars().all()
