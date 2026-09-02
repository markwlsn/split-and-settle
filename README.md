# Split & Settle Backend (Supabase + Google Gemini Vision)

Production-grade, hackathon-ready Express backend for **Split & Settle** — an intelligent receipt splitting and debt settlement platform with automated receipt OCR/itemization powered by **Google Gemini Vision**, authenticated multi-tenant group isolation enforced via **Supabase Postgres Row Level Security (RLS)**, and enterprise-grade privacy protection for real receipt photos.

---

## 🛡️ Enterprise Security & Privacy for Real Receipts

- **PII Redaction via Gemini Vision**: The AI vision prompt explicitly forbids and filters extraction of card numbers, payment tokens, cashier/cardholder names, and phone numbers.
- **Short-Lived Signed Image URLs**: Uploaded photos are kept strictly in a private bucket. The backend generates 15-minute expiring signed URLs (`GET /receipts/:id/image-url`) only after verifying group membership.
- **HTTP Security & Protection**: Express configured with `helmet` (HSTS, CSP, XSS filtering, clickjacking protection) and body size limits.
- **Zero Disk Writes**: In-memory streaming uploads directly to Supabase Storage.

---

## ✨ Features

- **Supabase Auth & RLS**: Scoped to caller's JWT; Row Level Security automatically restricts queries and modifications to verified group members.
- **Group Invite Codes (`POST /groups/join`)**: Generates 6-character alphanumeric codes (e.g. `TRIP26`) for frictionless member onboarding without UUID exchange.
- **Multimodal AI Vision Parsing**: Uses Google Gemini Vision (`gemini-2.5-flash`) to extract line items, merchant name, category, total, tax, and tip.
- **Smart Auto-Split & Proportional Tax/Tip Calculator**:
  - `EQUAL_ALL`: Splits all items equally among all group members with exact penny reconciliation.
  - `EQUAL_SELECTED`: Splits items equally among chosen members.
  - `PROPORTIONAL_TAX_TIP`: Proportions receipt tax & tip based on each member's individual subtotal.
- **Pure Settlement Engine**: Recomputes net balances across multi-payer receipts and minimizes transaction count using a greedy settlement simplification algorithm.
- **Group Activity Feed & Audit Trail**: Real-time event log of who uploaded receipts, split items, and settled debts (`GET /groups/:id/activity`).
- **Spending Analytics & Insights**: Total spend, category breakdown (for pie charts), top merchants, and per-member consumption metrics (`GET /groups/:id/analytics`).
- **Receipt Management**: Edit payer, merchant, category, notes (`PATCH /receipts/:id`) or delete receipts with automatic settlement recalculation (`DELETE /receipts/:id`).

---

## Project Structure

```
split-and-settle/
├── src/
│   ├── lib/
│   │   ├── supabaseClient.js      # Admin, anonymous, and user-scoped Supabase clients
│   │   ├── geminiClient.js        # Google Gemini AI client
│   │   └── activityLogger.js      # Group activity audit trail logger
│   ├── routes/
│   │   ├── auth.routes.js         # /auth (register, login)
│   │   ├── groups.routes.js       # /groups (create, join, list, members, activity, analytics)
│   │   ├── receipts.routes.js     # /groups/:id/receipts, /receipts/:id/* (upload, parse, signed-url, split, edit, delete)
│   │   └── settlements.routes.js  # /groups/:id/settlements, /groups/:id/settlements/payments
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── group.controller.js
│   │   ├── receipt.controller.js
│   │   └── settlement.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT extraction & Supabase user context binding
│   │   ├── validate.middleware.js # Zod validation middleware
│   │   └── error.middleware.js    # Global error handling
│   ├── utils/
│   │   ├── settlement.js          # Pure balance calculation & min-transaction algorithm
│   │   ├── splitCalculator.js     # Equal split, proportional tax/tip, invite codes
│   │   ├── receiptPrompt.js       # Structured JSON extraction prompt with PII redaction
│   │   └── schemas.js             # Zod validation schemas
│   ├── app.js                     # Express app configuration & middleware
│   └── server.js                  # Server bootstrap
├── sql/
│   ├── schema.sql                 # Full unified database schema & RLS policies
│   └── schema_v2.sql              # Migration script for invite codes, categories, activity logs
├── tests/
│   ├── settlement.test.js         # Unit tests for settlement logic & balance math
│   ├── features.test.js           # Unit tests for auto-splits, tax/tip, invite codes
│   └── api.test.js                # API integration & validation tests
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Setup & Quickstart

### 1. Environment Variables
In `.env`:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=development
```

### 2. Database Schema
Run [`sql/schema.sql`](file:///C:/Users/User.MIS/Documents/Projects/split-and-settle/sql/schema.sql) (or [`sql/schema_v2.sql`](file:///C:/Users/User.MIS/Documents/Projects/split-and-settle/sql/schema_v2.sql) if upgrading an existing DB) in your **Supabase SQL Editor**.

### 3. Run Test Suite
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```

---

## API Reference

### 1. Authentication
- `POST /auth/register`: `{ "email": "...", "password": "...", "name": "..." }`
- `POST /auth/login`: `{ "email": "...", "password": "..." }`

### 2. Groups
- `POST /groups`: `{ "name": "Tokyo Trip", "displayName": "Alice" }` -> Returns group with `invite_code`.
- `POST /groups/join`: `{ "inviteCode": "TRIP26", "displayName": "Bob" }` -> Join group by 6-char code.
- `GET /groups`: List all groups the user is a member of.
- `GET /groups/:id`: Get group details and stats.
- `GET /groups/:id/activity`: Activity audit trail.
- `GET /groups/:id/analytics`: Spending analytics (category breakdown, per-member metrics, top merchants).

### 3. Receipts & Gemini Vision
- `POST /groups/:id/receipts`: Upload receipt photo (`multipart/form-data`, field: `image`).
- `POST /receipts/:id/parse`: Run Gemini Vision OCR with PII redaction.
- `GET /receipts/:id`: Get receipt, items, and shares.
- `GET /receipts/:id/image-url`: Get 15-min expiring signed download URL.
- `POST /receipts/:id/auto-split`:
  ```json
  { "mode": "EQUAL_ALL" }
  ```
- `PATCH /receipts/:receiptId/items/:itemId`: Update item price/name/quantity.
- `POST /receipts/:receiptId/items/:itemId/shares`: Custom dollar splits.
- `PATCH /receipts/:id`: Update receipt metadata (`paidBy`, `category`, `notes`, `merchantName`).
- `DELETE /receipts/:id`: Delete receipt image and data, re-balances ledger.

### 4. Settlements & Payments
- `POST /receipts/:id/confirm`: Confirms receipt and triggers automatic settlement recomputation.
- `GET /groups/:id/settlements`: Returns minimum-transaction settlement list.
- `POST /groups/:id/settlements/payments`: `{ "toUser": "<uuid>", "amount": 25.00 }` -> Records payment and re-balances remaining debts.
