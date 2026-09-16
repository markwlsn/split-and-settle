# Tasks — 001 Core Platform

> **Feature:** Split & Settle Core Platform
> **Version:** 1.0 · **Status:** ALL DONE ✅
> All tasks below were completed during the initial conversational build session (2026-09-02 to 2026-09-16).

---

## Phase 0 — Project Setup

- [x] Initialize Node.js project with package.json
- [x] Set up Express v5 application structure (src/app.js, src/server.js)
- [x] Add Helmet security headers
- [x] Add CORS middleware
- [x] Add express-rate-limit for auth endpoints (30 req / 15min)
- [x] Add express.json() body parser with 2MB limit
- [x] Add X-Request-Id tracing middleware
- [x] Add global error handler middleware (src/middleware/error.middleware.js)
- [x] Add GET /health endpoint
- [x] Set up .env and .env.example
- [x] Add .gitignore (excludes .env, node_modules)
- [x] Initialize Vite + React 18 + Tailwind CSS frontend
- [x] Configure /api proxy in vite.config.js (port 5173 → 5000)

**Acceptance criteria:** `npm run dev` starts backend. `npm run dev` in frontend starts Vite. GET /health returns 200.

---

## Phase 1 — Database Schema

- [x] Design 7-table PostgreSQL schema (groups, group_members, receipts, receipt_items, item_shares, settlements, audit_log)
- [x] Write complete schema.sql with CREATE TABLE IF NOT EXISTS statements
- [x] Add UNIQUE constraints (group_members.group_id+user_id, item_shares.item_id+user_id)
- [x] Add all CASCADE DELETE foreign keys
- [x] Design RLS policies for all 7 tables
- [x] Identify and fix RLS infinite recursion on group_members
- [x] Write SECURITY DEFINER helper functions: is_group_member(), is_member_of_group(), is_group_creator()
- [x] Add performance indexes (group_id columns on all child tables)
- [x] Add currency column to groups table
- [x] Remove DO $$ ... $$ storage policy blocks (Supabase SQL Editor parse error workaround)
- [x] Document manual storage bucket policy setup in design.md

**Acceptance criteria:** schema.sql runs in Supabase SQL Editor with 0 errors. RLS prevents cross-group data access.

---

## Phase 2 — Authentication

- [x] Create Zod schemas: registerSchema, loginSchema (src/utils/schemas.js)
- [x] Create auth controller: register, login, getMe
- [x] Create auth routes: POST /auth/register, POST /auth/login, GET /auth/me
- [x] Apply authLimiter to all /auth routes
- [x] Create AuthView.jsx frontend (register/login form, tab switching)
- [x] Create AuthContext.jsx (JWT session persistence in localStorage)
- [x] Connect frontend to POST /auth/register and POST /auth/login

**Acceptance criteria:** FR-01, FR-02, FR-03 satisfied. New user can register, login, and see their session persist on page reload.

---

## Phase 3 — Group Management

- [x] Create Zod schemas: groupSchema, updateGroupSchema, joinGroupSchema (src/utils/schemas.js)
- [x] Implement generateInviteCode() in splitCalculator.js (6-char uppercase alphanumeric)
- [x] Create group controller: createGroup, getGroups, getGroup, updateGroup, leaveGroup, deleteGroup
- [x] Create group routes: CRUD + /join endpoint
- [x] Create DashboardView.jsx (group list, create/join group buttons)
- [x] Create CreateGroupModal.jsx (name field only — no currency dropdown)
- [x] Create JoinGroupModal.jsx (invite code + display name)
- [x] Create GroupSettingsModal.jsx (name, currency override, regenerate invite code, leave/delete group)
- [x] Remove currency dropdown from CreateGroupModal (pivot — see changelog)
- [x] Show invite code in ReceiptSplitView.jsx header as badge with copy-to-clipboard

**Acceptance criteria:** FR-04 through FR-10 satisfied. User can create a group, get an invite code, share it, and another user can join.

---

## Phase 4 — Receipt Scanning (AI)

- [x] Set up @google/genai SDK (src/lib/geminiClient.js)
- [x] Write multilingual receipt parsing prompt (src/utils/receiptPrompt.js)
  - [x] Add currency_code field to prompt output spec
  - [x] Support any language/script without code changes
- [x] Set up Supabase Storage bucket `receipts` (Private)
- [x] Configure manual storage bucket policies (Dashboard → authenticated INSERT + SELECT)
- [x] Create multer middleware for image upload (in-memory, max 2MB)
- [x] Implement parseReceipt() controller (strips markdown fences from Gemini response)
- [x] Implement auto-currency detection: when Gemini returns currency_code, UPDATE groups SET currency
- [x] Create receipt routes: POST /groups/:id/receipts/scan
- [x] Upgrade Gemini model: gemini-2.5-flash → gemini-3.6-flash (pivot — see changelog)
- [x] Remove responseMimeType: application/json from Gemini call (pivot — see changelog)
- [x] Create ReceiptUploadModal.jsx (file picker, preview, upload progress)
- [x] Create CreateGroupModal.jsx optional receipt upload on group creation

**Acceptance criteria:** FR-11 satisfied. Uploading a receipt image parses merchant name, date, total, tax, tip, currency, and line items. Group currency auto-updates on scan.

---

## Phase 5 — Receipt Management (CRUD)

- [x] Implement createManualExpense() controller (FR-15)
- [x] Implement addItem(), updateItem(), deleteItem() controllers (FR-12, FR-13, FR-14)
- [x] Implement updateReceipt() controller (FR-16)
- [x] Create Zod schemas: manualExpenseSchema, createItemSchema, updateItemSchema, updateReceiptSchema
- [x] Add routes: POST /groups/:id/expenses, POST/PATCH/DELETE /receipts/:id/items/:itemId
- [x] Create ManualExpenseModal.jsx (merchant name, items, category, notes, paidBy)
- [x] Build ReceiptSplitView.jsx receipt inspector with line item list
- [x] Rename "Add Missing Item" → "+ Add Item" (pivot — see changelog)
- [x] Add receipt status flow: pending → parsed → confirmed (FR-17)

**Acceptance criteria:** FR-12 through FR-17 satisfied. Members can add/edit/delete items, create manual expenses, and update receipt metadata.

---

## Phase 6 — Splitting Engine

- [x] Implement calculateEqualShares() in splitCalculator.js with penny reconciliation (FR-18)
- [x] Implement calculateProportionalTaxAndTip() in splitCalculator.js (FR-20)
- [x] Create Zod schemas: autoSplitSchema, sharesSchema
- [x] Implement autoSplit() controller for EQUAL_ALL, EQUAL_SELECTED, PROPORTIONAL_TAX_TIP modes
- [x] Implement setShares() controller for manual share assignment (FR-21)
- [x] Add routes: POST /receipts/:id/auto-split, POST /receipts/:id/shares
- [x] Disable "Split All Equally" button when group has < 2 members — show "(Needs 2+ Members)" label (FR-18)
- [x] Show solo member invite banner in ReceiptSplitView.jsx (FR-25)

**Acceptance criteria:** FR-18 through FR-21 satisfied. $10 / 3 people = [$3.34, $3.33, $3.33]. Sum = $10.00 ✅

---

## Phase 7 — Settlement Engine

- [x] Implement computeBalances() in settlement.js (FR-22)
- [x] Implement simplifySettlements() in settlement.js — greedy min cash flow algorithm (FR-23)
- [x] Add JSDoc documentation to settlement.js
- [x] Implement recordPayment() controller (FR-24)
- [x] Create settlement routes: GET /groups/:id/settlements, POST /groups/:id/payments
- [x] Create SettleUpModal.jsx (who pays whom, amount, confirm)
- [x] Build GroupDetailView.jsx Balance tab showing net amounts owed

**Acceptance criteria:** FR-22 through FR-24 satisfied. 3-person group with circular debts produces minimal transaction list.

---

## Phase 8 — Frontend Polish & Accessibility

- [x] Create GroupDetailView.jsx with 4 tabs: Receipts, Balances, Activity, Analytics
- [x] Create ActivityFeed.jsx (audit log display)
- [x] Create Navbar.jsx with user display name and logout
- [x] Create ToastContext.jsx global toast notification system
- [x] Expand currency.js to 25+ global currencies with getCurrencySymbol() Intl fallback
- [x] Add zero-decimal currency formatting: JPY, KRW, VND, IDR (NFR-07)
- [x] Create frontend/src/utils/constants.js: EXPENSE_CATEGORIES, CATEGORY_ICONS, AUTO_SPLIT_MODES
- [x] Add ARIA attributes to CreateGroupModal: role="dialog", aria-modal="true", aria-labelledby (NFR-08)
- [x] Add OpenGraph metadata to frontend/index.html (og:title, og:description, og:image)
- [x] Add theme-color meta tag for mobile browser chrome
- [x] Verify npm run build exits with 0 errors

**Acceptance criteria:** NFR-07, NFR-08 satisfied. Build output is clean.

---

## Phase 9 — Testing & Documentation

- [x] Write tests/api.test.js — route integration tests
- [x] Write tests/features.test.js — splitCalculator + schema unit tests (44 assertions)
- [x] Write tests/settlement.test.js — settlement algorithm unit tests
- [x] Write tests/health.test.js — /health endpoint + 404 handler tests
- [x] Write tests/production.test.js — production readiness checks
- [x] Verify npm test -- --runInBand: ALL 44 PASSING ✅
- [x] Write MIT LICENSE
- [x] Write CONTRIBUTING.md
- [x] Write README.md with full API reference table, architecture diagram, setup instructions
- [x] Add JSDoc to settlement.js and splitCalculator.js

**Acceptance criteria:** Phase 5 of playbook — tests written, all passing. README is complete.

---

## Phase 10 — Repository & Git Hygiene

- [x] Consolidate monorepo (delete standalone split-and-settle-frontend/ folder)
- [x] Fix git author on all commits: Mark Wilson Geronilla <markwilsongeronilla01@gmail.com>
- [x] Ensure all commits visible in GitHub contribution graph
- [x] Push to GitHub: https://github.com/markwlsn/split-and-settle
- [x] Sync main and master branches

**Acceptance criteria:** GitHub repository is clean, all commits attributed correctly, contribution graph shows activity.

---

## Phase 11 — Spec Backfill (This Phase)

- [x] Create specs/ directory structure
- [x] Write specs/constitution.md
- [x] Write specs/changelog.md
- [x] Write specs/001-core-platform/requirements.md (EARS format, FR-01 to FR-25 + NFR-01 to NFR-09)
- [x] Write specs/001-core-platform/design.md (architecture, DB schema, algorithms, alternatives)
- [x] Write specs/001-core-platform/tasks.md (this file — all tasks marked [x])
- [x] Commit specs to GitHub

**Acceptance criteria:** /specs/ exists in repo. All 7 playbook phases have documentation. Audit score: 100%.
