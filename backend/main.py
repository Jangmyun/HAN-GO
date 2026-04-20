from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import admin, auth, orders, products, stores, tickets

app = FastAPI(
    title="HAN:GO API",
    version="0.1.0",
    description="한동대학교 주문·결제·예매 플랫폼 API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(stores.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(tickets.router)
app.include_router(admin.router)


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok"}
