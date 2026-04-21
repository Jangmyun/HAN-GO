"""상품 라우터 — 공개 조회 + 스토어 오너 CRUD."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_store_account
from app.models.product import PerformanceSchedule, Product, ProductStatus, ProductType
from app.models.store import Store, StoreAccount
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/stores/{store_id}/products", tags=["products"])


async def _get_active_store(store_id: uuid.UUID, db: AsyncSession) -> Store:
    from app.models.store import StoreStatus
    result = await db.execute(
        select(Store).where(Store.id == store_id, Store.status != StoreStatus.DELETED)
    )
    store = result.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="store_not_found")
    return store


@router.get("", response_model=list[ProductResponse])
async def list_products(store_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """스토어 상품 목록 (삭제된 상품 제외)."""
    await _get_active_store(store_id, db)
    result = await db.execute(
        select(Product).where(
            Product.store_id == store_id,
            Product.status != ProductStatus.DELETED,
        ).order_by(Product.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(store_id: uuid.UUID, product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """상품 상세."""
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.store_id == store_id,
            Product.status != ProductStatus.DELETED,
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="product_not_found")
    return product


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    store_id: uuid.UUID,
    body: ProductCreate,
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """상품 등록 (StoreAccount 전용)."""
    if current_store.store_id != store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_store")
    await _get_active_store(store_id, db)

    product = Product(
        store_id=store_id,
        event_id=body.event_id,
        type=body.type,
        name=body.name,
        description=body.description,
        base_price=body.base_price,
        stock_mode=body.stock_mode,
        stock=body.stock,
        option_schema=[f.model_dump() for f in body.option_schema],
    )
    db.add(product)
    await db.flush()  # product.id 확보

    # PERFORMANCE: PerformanceSchedule 삽입
    if body.type == ProductType.PERFORMANCE:
        for sched in body.schedules:
            ps = PerformanceSchedule(
                product_id=product.id,
                datetime=sched.datetime,
                venue=sched.venue,
                seat_layout=sched.seat_layout.model_dump(),
            )
            db.add(ps)

    await db.commit()
    await db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    store_id: uuid.UUID,
    product_id: uuid.UUID,
    body: ProductUpdate,
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """상품 수정 (StoreAccount 전용)."""
    if current_store.store_id != store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_store")

    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.store_id == store_id,
            Product.status != ProductStatus.DELETED,
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="product_not_found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "option_schema" and value is not None:
            setattr(product, key, [f.model_dump() if hasattr(f, "model_dump") else f for f in value])
        else:
            setattr(product, key, value)

    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    store_id: uuid.UUID,
    product_id: uuid.UUID,
    current_store: StoreAccount = Depends(get_current_store_account),
    db: AsyncSession = Depends(get_db),
):
    """상품 소프트 삭제 (StoreAccount 전용)."""
    if current_store.store_id != store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="not_your_store")

    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.store_id == store_id,
            Product.status != ProductStatus.DELETED,
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="product_not_found")

    product.status = ProductStatus.DELETED
    await db.commit()
    return Response(status_code=204)
