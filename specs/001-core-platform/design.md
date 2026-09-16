# Design — 001 Core Platform

> **Feature:** Split & Settle Core Platform
> **Version:** 1.0 · **Status:** IMPLEMENTED ✅
> **Author:** Mark Wilson Geronilla

---

## 1. Architecture Overview

```
┌───────────────────────────────────────────────────────┐
│                  CLIENT (Browser)                     │
│          React 18 + Vite + Tailwind CSS               │
│  Port 5173 │  /api/* → proxied to port 5000           │
└─────────────────────┬─────────────────────────────────┘
                      │ HTTP REST + JSON
┌─────────────────────▼─────────────────────────────────┐
│               BACKEND (Express v5)                    │
│  Port 5000                                            │
│  ┌──────────┐ ┌───────────┐ ┌───────────────────────┐ │
│  │  Routes  │ │Controllers│ │ Middleware             │ │
│  │ /auth    │ │ receipt   │ │ Helmet, CORS, RateLimit│ │
│  │ /groups  │ │ group     │ │ X-Request-Id, errorHdl │ │
│  │ /receipts│ │ settlement│ │ Zod Validation        │ │
│  │ /settle  │ └───────────┘ └───────────────────────┘ │
│  └──────────┘                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │               Utilities                          │ │
│  │  splitCalculator.js  settlement.js               │ │
│  │  receiptPrompt.js    schemas.js                  │ │
│  └──────────────────────────────────────────────────┘ │
└─────────────┬───────────────────────┬─────────────────┘
              │                       │
    ┌─────────▼──────────┐   ┌────────▼────────┐
    │  Supabase           │   │  Google Gemini   │
    │  PostgreSQL 15      │   │  Vision API      │
    │  + Auth (JWT)       │   │  gemini-3.6-flash│
    │  + Storage (bucket) │   └─────────────────┘
    └────────────────────┘
```

---

## 2. Request Flow

### Receipt Scan Flow
```
User uploads image
  → CreateGroupModal (optional) OR ReceiptUploadModal
  → POST /groups/:id/receipts/scan (multipart/form-data)
  → multer middleware (in-memory buffer, max 2MB)
  → receipt.controller.js: parseReceipt()
  → geminiClient.js: send image as base64 inline_data
  → receiptPrompt.js: multilingual prompt with currency_code field
  → Gemini returns markdown-fenced JSON
  → Strip markdown fences → JSON.parse()
  → Insert receipt + receipt_items into Supabase
  → If currency_code detected: UPDATE groups SET currency = detected_code
  → Return receipt object + items
```

### Settlement Computation Flow
```
GET /groups/:id/settlements
  → settlements.controller.js: getSettlements()
  → Query Supabase: confirmed receipts + items + shares for group
  → settlement.js: computeBalances(receipts, items, shares)
    → Build itemToReceipt map
    → For each share: debtor -= shareAmount, paidBy += shareAmount
    → Return {userId: netBalance} map
  → settlement.js: simplifySettlements(balances)
    → Separate creditors (balance > 0) and debtors (balance < 0)
    → Sort both descending by magnitude
    → Greedy match: min(debtor.amount, creditor.amount) → transaction
    → Return [{from, to, amount}] minimal transaction list
  → Return settlements array
```

---

## 3. Database Schema

### Tables

```
groups
  id           UUID PK
  name         TEXT NOT NULL
  invite_code  TEXT UNIQUE
  currency     TEXT NOT NULL DEFAULT 'USD'
  created_by   UUID → auth.users(id)
  created_at   TIMESTAMPTZ

group_members
  id           UUID PK
  group_id     UUID → groups(id) CASCADE
  user_id      UUID → auth.users(id) CASCADE
  display_name TEXT NOT NULL
  joined_at    TIMESTAMPTZ
  UNIQUE (group_id, user_id)

receipts
  id             UUID PK
  group_id       UUID → groups(id) CASCADE
  uploaded_by    UUID → auth.users(id)
  paid_by        UUID → auth.users(id)
  image_path     TEXT (nullable — manual expenses have no image)
  merchant_name  TEXT
  total_amount   NUMERIC(10,2)
  tax_amount     NUMERIC(10,2) DEFAULT 0
  tip_amount     NUMERIC(10,2) DEFAULT 0
  category       TEXT DEFAULT 'Other'
  notes          TEXT
  receipt_date   DATE
  status         TEXT CHECK (pending | parsed | confirmed)
  created_at     TIMESTAMPTZ

receipt_items
  id          UUID PK
  receipt_id  UUID → receipts(id) CASCADE
  name        TEXT NOT NULL
  price       NUMERIC(10,2) NOT NULL
  quantity    INTEGER DEFAULT 1

item_shares
  id            UUID PK
  item_id       UUID → receipt_items(id) CASCADE
  user_id       UUID → auth.users(id) CASCADE
  share_amount  NUMERIC(10,2) NOT NULL
  UNIQUE (item_id, user_id)

settlements
  id          UUID PK
  group_id    UUID → groups(id) CASCADE
  from_user   UUID → auth.users(id) CASCADE
  to_user     UUID → auth.users(id) CASCADE
  amount      NUMERIC(10,2) NOT NULL
  type        TEXT CHECK (computed | payment)
  settled     BOOLEAN DEFAULT false
  created_at  TIMESTAMPTZ

audit_log
  id          UUID PK
  group_id    UUID → groups(id) CASCADE
  user_id     UUID → auth.users(id)
  action      TEXT NOT NULL
  metadata    JSONB
  created_at  TIMESTAMPTZ
```

### RLS Design

**Problem Solved:** Policies on `group_members` that subquery `group_members` cause infinite recursion (Supabase error 54001).

**Solution:** Three SECURITY DEFINER helper functions bypass the calling user's RLS context:

```sql
is_group_member(group_uuid UUID) RETURNS BOOLEAN
is_member_of_group(gid UUID, uid UUID) RETURNS BOOLEAN
is_group_creator(group_uuid UUID) RETURNS BOOLEAN
```

All RLS policies on `group_members` and `groups` call these functions instead of direct subqueries.

### Storage

**Bucket:** `receipts` (Private)
**Policy (INSERT):** Authenticated users may insert into any path
**Policy (SELECT):** Authenticated users may select from any path

NOTE: Storage policies must be set manually in Supabase Dashboard → Storage → receipts → Policies.
The `schema.sql` file does NOT contain storage policy SQL (dollar-quoted blocks cause Supabase SQL Editor parse errors).

---

## 4. Settlement Algorithm

**Algorithm:** Greedy Minimum Cash Flow
**Complexity:** O(N log N) where N = number of group members

**Rationale:** The greedy approach is optimal for small N (typical group size: 2–20 members).
It minimizes the total number of transactions and is easy to audit.

```
Given balances = {A: +30, B: -10, C: -20}

Step 1: creditors = [{A: 30}], debtors = [{C: 20}, {B: 10}]
Step 2: Match C(20) with A(30) → transaction: C pays A $20, A balance: +10
Step 3: Match B(10) with A(10) → transaction: B pays A $10, A balance: 0

Result: 2 transactions (optimal for 3 people)
```

---

## 5. Gemini AI Integration

**Model:** gemini-3.6-flash (gemini-2.5-flash is deprecated for this API key)
**Client:** @google/genai SDK
**Input:** Base64-encoded JPEG/PNG receipt image (inline_data)
**Prompt location:** src/utils/receiptPrompt.js

**Response handling:**
1. Gemini returns text (may be wrapped in ```json ... ``` markdown fences)
2. Strip fences using regex: /```json\s*([\s\S]*?)```/
3. JSON.parse() the extracted text
4. If parse fails, throw 422 Unprocessable Entity

**Output fields:**
```json
{
  "merchant_name": "string",
  "receipt_date": "YYYY-MM-DD",
  "currency_code": "USD",
  "subtotal": 0.00,
  "tax_amount": 0.00,
  "tip_amount": 0.00,
  "total_amount": 0.00,
  "items": [
    { "name": "string", "price": 0.00, "quantity": 1 }
  ]
}
```

---

## 6. Penny Reconciliation

Equal splits produce rounding errors at the cent level.

**Algorithm (in splitCalculator.js: calculateEqualShares):**
1. base = floor(total * 100 / N) / 100
2. remainder = round(total * 100) - (base * 100 * N)
3. First `remainder` users receive (base + 0.01), the rest receive base

**Example:** $10.00 / 3 people
- base = $3.33, remainder = 1 cent
- User 1: $3.34, User 2: $3.33, User 3: $3.33 → Total: $10.00 ✅

---

## 7. Alternatives Considered

### Why not GraphQL?
REST is sufficient for this project size. GraphQL adds complexity (resolvers, schema stitching) with no benefit for a small API surface (<20 endpoints).

### Why not Prisma ORM?
Supabase JS SDK provides direct access to the managed Postgres instance with RLS enforcement. Prisma would require bypassing RLS, undermining the security model.

### Why not Redux for state management?
The app has two global concerns: Auth session and Toast notifications. React Context is sufficient. Redux adds boilerplate with no benefit at this scale.

### Why not server-side rendering (Next.js)?
The app is a client-heavy SPA with real-time-like interactions (receipt scanning, live split previews). CSR with Vite is faster to develop and simpler to deploy at this stage.
