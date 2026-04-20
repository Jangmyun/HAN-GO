import uuid

from fastapi import APIRouter

from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/stores/{store_id}/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
async def list_products(store_id: uuid.UUID):
    """스토어 상품 목록"""
    raise NotImplementedError


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(store_id: uuid.UUID, product_id: uuid.UUID):
    """상품 상세"""
    raise NotImplementedError


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(store_id: uuid.UUID, body: ProductCreate):
    """상품 등록 (StoreAccount 전용)"""
    raise NotImplementedError


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(store_id: uuid.UUID, product_id: uuid.UUID, body: ProductUpdate):
    """상품 수정 (StoreAccount 전용)"""
    raise NotImplementedError


@router.delete("/{product_id}", status_code=204)
async def delete_product(store_id: uuid.UUID, product_id: uuid.UUID):
    """상품 삭제 (soft delete)"""
    raise NotImplementedError
