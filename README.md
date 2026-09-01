# Split & Settle Backend (Supabase + Google Gemini Vision)

Production-ready Express backend for **Split & Settle** — an intelligent receipt splitting and debt settlement platform with automated receipt OCR/itemization powered by **Google Gemini Vision** and authenticated, multi-tenant group isolation enforced via **Supabase Postgres Row Level Security (RLS)**.

---

## Features

- **Supabase Auth & RLS**: Per-request Supabase client scoped to caller's JWT; Row Level Security automatically restricts queries and modifications to verified group members.
- **Multimodal AI Vision Parsing**: Uses Google Gemini Vision (`gemini-2.5-flash` via `@google/genai`) to extract structured line items, merchant name, total, and receipt date directly from receipt photos.
- **Zero Local Disk Writes**: Direct streaming upload via `multer` memory storage straight to private Supabase Storage `receipts` bucket.
- **Pure Settlement Engine**: Recomputes net balances across multi-payer receipts and minimizes transaction count using a greedy settlement simplification algorithm.
- **Payment Reconciliation**: Recording a peer payment automatically recomputes and clears outstanding balances.
- **Robust Validation & Security**: Zod schema validation, auth rate limiting, and centralized error handling.

---

## Project Structure

```
split-and-settle-backend/
├── src/
│   ├── lib/
│   │   ├── supabaseClient.js      # Admin, anonymous, and user-scoped Supabase clients
│   │   └── geminiClient.js        # Google Gemini AI client
│   ├── routes/
│   │   ├── auth.routes.js         # /auth (register, login)
│   │   ├── groups.routes.js       # /groups (create, list, add & list members)
│   │   ├── receipts.routes.js     # /groups/:id/receipts, /receipts/:id/*
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
│   │   ├── receiptPrompt.js       # Structured JSON extraction prompt
│   │   └── schemas.js             # Zod validation schemas
│   ├── app.js                     # Express app configuration & middleware
│   └── server.js                  # Server bootstrap
├── sql/
│   └── schema.sql                 # Complete Postgres tables, constraints, & RLS policies
├── tests/
│   ├── settlement.test.js         # Unit tests for settlement logic & balance math
│   └── api.test.js                # API integration & validation tests
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Setup & Quickstart

### 1. Prerequisites
- Node.js >= 18
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com/) API Key for Gemini

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=development
```

### 3. Setup Supabase Database & Storage
1. Go to your Supabase Project -> **SQL Editor**.
2. Run the SQL script located in `sql/schema.sql`. This creates:
   - `groups`, `group_members`, `receipts`, `receipt_items`, `item_shares`, `settlements` tables
   - All Row Level Security (RLS) policies for member isolation
3. Go to **Storage** in Supabase -> Create a new bucket named `receipts` (Set to **Private**).
4. Run the Storage RLS policies at the bottom of `sql/schema.sql` to allow authenticated users to upload and view receipts.

### 4. Install & Run
```bash
npm install
npm run dev
```

### 5. Run Test Suite
```bash
npm test
```

---

## API Reference

### 1. Authentication
- `POST /auth/register`
  ```json
  { "email": "alice@test.com", "password": "password123", "name": "Alice" }
  ```
- `POST /auth/login`
  ```json
  { "email": "alice@test.com", "password": "password123" }
  ```

### 2. Groups
- `POST /groups` (Header: `Authorization: Bearer <token>`)
  ```json
  { "name": "Tokyo Trip", "displayName": "Alice" }
  ```
- `GET /groups`
- `POST /groups/:id/members`
  ```json
  { "userId": "<bob-uuid>", "displayName": "Bob" }
  ```
- `GET /groups/:id/members`

### 3. Receipts & Gemini Vision
- `POST /groups/:id/receipts` (Multipart form-data: `image: <file>`)
  - Uploads image directly to Supabase Storage and creates a `pending` receipt.
- `POST /receipts/:id/parse`
  - Sends receipt image to Gemini Vision (`gemini-2.5-flash`), extracts items, and inserts `receipt_items`.
- `GET /receipts/:id`
  - Returns receipt with parsed items and current split shares.
- `PATCH /receipts/:receiptId/items/:itemId`
  ```json
  { "name": "Ramen Set", "price": 18.50, "quantity": 1 }
  ```
- `POST /receipts/:receiptId/items/:itemId/shares`
  ```json
  {
    "shares": [
      { "userId": "<alice-uuid>", "shareAmount": 9.25 },
      { "userId": "<bob-uuid>", "shareAmount": 9.25 }
    ]
  }
  ```

### 4. Settlements & Payments
- `POST /receipts/:id/confirm`
  - Confirms receipt and triggers automatic recalculation of the group's settlement ledger.
- `GET /groups/:id/settlements`
  - Returns simplified minimum-transaction settlement list and payment history.
- `POST /groups/:id/settlements/payments`
  ```json
  { "toUser": "<alice-uuid>", "amount": 9.25 }
  ```
  - Records a manual settlement payment and automatically re-balances the remaining debts.
