"""initial_schema

Revision ID: 7b3903b58e54
Revises:
Create Date: 2026-04-21

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "7b3903b58e54"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("auth_type", sa.Enum("KAKAO", "GUEST", name="authtype"), nullable=False),
        sa.Column("kakao_id", sa.String, unique=True, nullable=True),
        sa.Column("nickname", sa.String(50), nullable=True),
        sa.Column("profile_image", sa.String, nullable=True),
        sa.Column("phone_hash", sa.String, nullable=True),
        sa.Column("email", sa.String, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- stores ---
    op.create_table(
        "stores",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("location", sa.String(200), nullable=True),
        sa.Column("opening_hours", sa.String(200), nullable=True),
        sa.Column("description", sa.String(1000), nullable=True),
        sa.Column("payment_methods", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column(
            "status",
            sa.Enum("active", "suspended", "deleted", name="storestatus"),
            nullable=False,
            server_default="active",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "store_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("stores.id"), nullable=False),
        sa.Column("email", sa.String, unique=True, nullable=False),
        sa.Column("password_hash", sa.String, nullable=False),
        sa.Column("role", sa.String(50), nullable=False, server_default="owner"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "admin_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String, unique=True, nullable=False),
        sa.Column("password_hash", sa.String, nullable=False),
        sa.Column("two_factor_enabled", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- events ---
    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cover_image", sa.String, nullable=True),
        sa.Column("description", sa.String(2000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- products ---
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("stores.id"), nullable=False),
        sa.Column("event_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("events.id"), nullable=True),
        sa.Column(
            "type",
            sa.Enum("FOOD", "PERFORMANCE", "MERCH", name="producttype"),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.String(2000), nullable=True),
        sa.Column("base_price", sa.Integer, nullable=False),
        sa.Column(
            "status",
            sa.Enum("active", "sold_out", "hidden", "deleted", name="productstatus"),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "stock_mode",
            sa.Enum("unlimited", "tracked", "manual_sold_out", name="stockmode"),
            nullable=False,
            server_default="unlimited",
        ),
        sa.Column("stock", sa.Integer, nullable=True),
        sa.Column("option_schema", postgresql.JSONB, nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "performance_schedules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("venue", sa.String(200), nullable=True),
        sa.Column("seat_layout", postgresql.JSONB, nullable=False, server_default="{}"),
    )

    # --- orders ---
    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_code", sa.String(20), unique=True, nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("store_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("stores.id"), nullable=False),
        sa.Column("total_price", sa.Integer, nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending",
                "payment_submitted",
                "paid",
                "preparing",
                "ready",
                "completed",
                "payment_rejected",
                "cancelled_by_user",
                "cancellation_requested",
                "cancelled_by_store",
                name="orderstatus",
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("guest_phone", sa.String, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "order_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column(
            "schedule_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("performance_schedules.id"),
            nullable=True,
        ),
        sa.Column("seat_keys", postgresql.JSONB, nullable=True),
        sa.Column("quantity", sa.Integer, nullable=False, server_default="1"),
        sa.Column("selected_options", postgresql.JSONB, nullable=False, server_default="{}"),
        sa.Column("unit_price", sa.Integer, nullable=False),
        sa.Column("subtotal", sa.Integer, nullable=False),
    )

    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column(
            "method",
            sa.Enum("KAKAOPAY_URL", "BANK_TRANSFER", "OTHER", name="paymentmethod"),
            nullable=False,
        ),
        sa.Column("amount", sa.Integer, nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "submitted", "confirmed", "rejected", name="paymentstatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "confirmed_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("store_accounts.id"),
            nullable=True,
        ),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "cancellation_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("requested_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reason", sa.String(500), nullable=True),
        sa.Column(
            "status",
            sa.Enum("requested", "approved", "rejected", name="cancellationstatus"),
            nullable=False,
            server_default="requested",
        ),
        sa.Column("resolved_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- tickets ---
    op.create_table(
        "tickets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "order_item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("order_items.id"),
            nullable=False,
        ),
        sa.Column("qr_token", sa.String(32), unique=True, nullable=False),
        sa.Column(
            "status",
            sa.Enum("issued", "used", "revoked", name="ticketstatus"),
            nullable=False,
            server_default="issued",
        ),
        sa.Column("issued_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "scanned_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("store_accounts.id"),
            nullable=True,
        ),
    )

    # --- audit_logs ---
    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("actor_type", sa.String(50), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=True),
        sa.Column("target_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("payload", postgresql.JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # --- indexes ---
    op.create_index("ix_orders_order_code", "orders", ["order_code"])
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.create_index("ix_orders_store_id", "orders", ["store_id"])
    op.create_index("ix_orders_guest_phone_code", "orders", ["guest_phone", "order_code"])
    op.create_index("ix_tickets_qr_token", "tickets", ["qr_token"])
    op.create_index("ix_products_store_id", "products", ["store_id"])
    op.create_index("ix_audit_logs_actor", "audit_logs", ["actor_type", "actor_id"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("tickets")
    op.drop_table("cancellation_requests")
    op.drop_table("payments")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("performance_schedules")
    op.drop_table("products")
    op.drop_table("events")
    op.drop_table("admin_accounts")
    op.drop_table("store_accounts")
    op.drop_table("stores")
    op.drop_table("users")

    for enum_name in [
        "authtype", "storestatus", "producttype", "productstatus",
        "stockmode", "orderstatus", "paymentmethod", "paymentstatus",
        "cancellationstatus", "ticketstatus",
    ]:
        sa.Enum(name=enum_name).drop(op.get_bind())
