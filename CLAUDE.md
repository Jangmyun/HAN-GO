# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Devlog

**모든 작업 후 `devlog.txt`를 반드시 업데이트한다.**

- 위치: 레포 루트 `/devlog.txt`
- 형식: 최신 항목이 파일 상단, 구분선(`---`)으로 각 작업 단위 구분
- 작업 단위: 논리적으로 연관된 변경 묶음 (파일 1개 수정도 가능, 대규모 기능은 세부 항목으로 분리)
- 항목 헤더: `[YYYY-MM-DD] 작업 제목` (한국어)
- 내용: 변경 파일/디렉토리, 변경 이유, 주요 결정사항을 bullet로 기록
- 커밋 전 devlog 업데이트를 먼저 수행하고, devlog 변경도 같은 커밋에 포함

## Project Overview

**HAN:GO** is a Korean university ordering, payment, and ticketing platform for Handong University — enabling student clubs and booths to conduct food sales, performance ticketing, and event reservations. It is a CRA (Computer Research Association) student project, non-officially affiliated with the school administration.

The full Product Requirements Document is at `HAN-GO_PRD_v0.3.md`. Read it before making significant architectural decisions.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui |
| Backend | FastAPI (Python) |
| Database | PostgreSQL (JSONB for flexible schemas, row locks for seat selection) |
| Realtime | WebSocket (FastAPI) |
| Auth (User) | Kakao OAuth 2.0 + custom Guest sessions (phone number) |
| Auth (Store/Admin) | JWT + email/password |
| QR Tickets | nanoid tokens (22-char) + server-side validation only |
| Storage | S3-compatible (Cloudflare R2 or Supabase) |
| Deploy | Vercel (FE) + Fly.io/Railway (BE) + Neon/Supabase (DB) |
| CI/CD | GitHub Actions |
| Monitoring | Sentry + health checks |

## Commands

> The project is in pre-development (P0 phase). Update this section as build infrastructure is added.

**Frontend (Next.js):**
```bash
npm install
npm run dev       # development server
npm run build     # production build
npm run lint      # ESLint
```

**Backend (FastAPI):**
```bash
pip install -r requirements.txt
uvicorn main:app --reload   # development server
pytest                       # run all tests
pytest tests/path/test_file.py::test_name  # single test
```

**E2E Tests (Playwright):**
```bash
npx playwright test
npx playwright test tests/specific.spec.ts
```

## Architecture

### Core Domain Model

```
User (KAKAO | GUEST auth)
  └→ Order → OrderItem → Product (FOOD | PERFORMANCE | MERCH)
                              └→ PerformanceSchedule + Ticket (if PERFORMANCE)
Store → StoreAccount (separate login)
     └→ Product, CancellationRequest
AdminAccount (separate auth, operations team)
Event (product collections by date/period)
AuditLog
```

### Product Types
- **FOOD**: Options (size, toppings), dual inventory mode (`tracked` count + `manual_sold_out`), waiting number pickup
- **PERFORMANCE**: Store-defined grid seat layout, scheduled times, server-verified QR check-in
- **MERCH**: Basic registration (full implementation in Phase 3+)

### Order State Machine
```
pending → payment_submitted → paid → preparing → ready → completed
                          ↘ payment_rejected
cancelled_by_user (before paid)
cancellation_requested → cancelled_by_store (after store approval)
```

### Payment Model (B-1)
HAN:GO is **not a payment processor**. Users pay directly to the store's bank account using the Order ID as the deposit reference. Store operators manually confirm receipt → triggers `paid` status. KakaoPay deep-link is provided as a convenience shortcut.

### QR Ticket Verification (L-2)
- `qr_token`: 22-character nanoid, stored in DB, never derived client-side
- Server validates token, store ownership, time window (±N hours from event), and atomically marks ticket as `used` exactly once
- No client-side validation — all verification is server-authoritative

### Guest Ordering
- Guest selects phone number as identity
- 24-hour session TTL
- Orders retrieved via `order_code + phone_number` lookup

### Realtime
- WebSocket push for order status changes
- Polling fallback
- PWA push notifications planned for Phase 2+

### Cart Scope
Cart is scoped per-store. Switching stores clears the current cart.

## Development Phases

| Phase | Focus |
|-------|-------|
| P0 | Design, data model, API spec, design system |
| P1a | Auth (Kakao + guest), store/product CRUD |
| P1b | Order system, B-1 payment flow, WebSocket |
| P1c | FOOD (options/inventory) + PERFORMANCE (seat editor + QR) |
| P1d | Invite-only pilot (1–2 clubs) |
| P2 | Festival scale (2026 fall), self-service signup |
| P3+ | MERCH, auto-settlement, analytics |

## Key Architectural Decisions (from PRD §11)

- Seat selection: assigned seats with DB row locks + 5-min hold TTL
- Cancellation: requires store approval after cooking begins; user-initiated before that
- Inventory: dual mode — automatic count tracking OR manual sold-out flag
- Fee policy: **undecided** (J-1 free vs J-2 per-transaction), defer until Phase 3
- Guest phone validation: MVP uses simple input (K-1); SMS OTP deferred to Phase 2+
- Operation scope: year-round (not festival-only)
