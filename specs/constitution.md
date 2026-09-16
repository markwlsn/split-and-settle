# Split & Settle — Project Constitution

> **Version:** 1.0 · **Ratified:** 2026-09-16
> This document is the single source of truth for architectural non-negotiables.
> All future specs must conform to the constraints defined here.

---

## 1. Mission

Split & Settle is a **production-grade, web-based bill-splitting and settlement platform** for groups.
Users upload receipt photos; AI parses them; members split costs, settle debts, and track payments — all in one place.
This is not a hackathon demo — it is a real product intended for public launch.

---

## 2. Technology Stack

### Backend
| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20+ LTS | Non-blocking I/O for image uploads |
| Framework | Express.js v5.x | Mature, minimal |
| Language | CommonJS (.js) | Consistent with Node.js LTS defaults |
| Auth | Supabase Auth (JWT) | Managed auth, no custom JWT implementation |
| Database | Supabase (PostgreSQL 15) | Managed Postgres with RLS |
| Storage | Supabase Storage — `receipts` bucket (Private) | Managed object storage |
| AI | Google Gemini Vision — `gemini-3.6-flash` | Multilingual receipt parsing, currency detection |
| Validation | Zod v4.x | Runtime schema validation for all request bodies |
| Security | Helmet + express-rate-limit | HTTP hardening, brute-force protection |
| Testing | Jest v30.x + Supertest | Unit + integration testing |

### Frontend
| Layer | Choice | Rationale |
|---|---|---|
| Framework | React 18.x | Component model, large ecosystem |
| Build tool | Vite 5.x | Fast HMR, small bundles |
| Styling | Tailwind CSS 3.x | Utility-first, no CSS files to maintain |
| Language | JSX (.jsx) | Standard React |
| State | React Context (built-in) | Auth + Toast; no Redux needed |
| API client | Custom Fetch-based `services/api.js` | Thin wrapper, no Axios dependency |

### Infrastructure
| Layer | Details |
|---|---|
| Backend dev server | Port 5000 |
| Frontend dev server | Port 5173 (proxies /api → port 5000) |
| Supabase project | ohpqscdapwvqsmtaimet.supabase.co |
| Storage bucket | `receipts` (Private) |
| GitHub repo | https://github.com/markwlsn/split-and-settle |
| Primary branch | main |

---

## 3. Non-Negotiables

These constraints MUST NOT be violated without explicitly amending this constitution.

### 3.1 Security
- All database access is gated by Supabase RLS policies — no table may be queried without a corresponding policy.
- RLS policies on `group_members` MUST use SECURITY DEFINER helper functions (`is_group_member()`, `is_group_creator()`). Never use direct recursive subqueries.
- Auth endpoints are rate-limited: 30 requests per 15-minute window.
- Request body size is capped at 2MB — enforced at the express.json() parser level.
- Helmet security headers are always on — never disabled, even in test environments.
- `.env` is never committed to git — `.env.example` is committed instead.

### 3.2 Data Integrity
- All monetary values are stored as NUMERIC(10,2) — never FLOAT.
- Penny reconciliation is mandatory: when splitting equally, the largest-share recipient absorbs any rounding remainder (greedy first-creditor rule).
- Settlement amounts are rounded to 2 decimal places at every computation boundary.

### 3.3 AI Integration
- Gemini model MUST be `gemini-3.6-flash` — `gemini-2.5-flash` is deprecated for this API key.
- `responseMimeType: application/json` MUST NOT be set in Gemini calls — it causes silent failures.
- JSON from Gemini is extracted by stripping markdown fences from the response text.
- Currency is auto-detected by Gemini — the UI does NOT ask users to select currency on group creation.
- Manual currency override is available in Group Settings only.
- Receipt parsing is multilingual — the Gemini prompt must support any language/script without code changes.

### 3.4 Testing
- The Jest suite must pass at 100% before any commit that touches src/ or tests/.
- No console.log in production code paths.
- All new utility functions must have unit tests.

### 3.5 Frontend UX
- `Split All Equally` is disabled when fewer than 2 members exist, with a descriptive label.
- Currency formatting respects zero-decimal currencies: JPY, KRW, VND, IDR display as whole numbers.
- All modal dialogs must have role="dialog" and aria-modal="true" for screen reader accessibility.

### 3.6 Git / GitHub
- All commits use author `Mark Wilson Geronilla <markwilsongeronilla01@gmail.com>`.
- Commit messages follow Conventional Commits format: type(scope): description.

---

## 4. Testing Philosophy

- Test behavior, not implementation internals.
- Unit tests for pure functions: splitCalculator.js, settlement.js, schemas.js.
- Integration tests for routes: api.test.js, health.test.js, production.test.js via Supertest.
- No mocking of Supabase in unit tests — tests that require DB access use real Supabase or are skipped.
- Tests run in-band (--runInBand) to prevent port conflicts.

---

## 5. Definition of Done (Global)

A feature is DONE when all of the following are true:

- [ ] specs/NNN-feature-name/requirements.md exists and is fully satisfied
- [ ] specs/NNN-feature-name/tasks.md has all tasks marked [x]
- [ ] All new utility functions have unit tests
- [ ] npm test passes with 0 failures
- [ ] npm run build (frontend) exits with 0 errors
- [ ] Code is committed with correct git author
- [ ] specs/changelog.md is updated if any requirement changed during implementation
- [ ] README.md API table is updated if new endpoints were added
